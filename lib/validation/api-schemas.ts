import { SearchRequest, Discipline } from '@/types/video-search';
import { SparringUploadMetadata } from '@/types/sparring-analysis';

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  error?: string;
}

const VALID_DISCIPLINES: (Discipline | 'All')[] = [
  'All',
  'Striking',
  'Grappling',
  'Clinch & Cage',
  'Transitions',
  'Defensive Tactics',
];

const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/ogg',
];

const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const MAX_FRAMES_COUNT = 30;
const MAX_FRAME_BASE64_LENGTH = 5 * 1024 * 1024; // 5 MB per frame

/**
 * Validate incoming search request payload
 */
export function validateSearchRequest(body: any): ValidationResult<SearchRequest> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object.' };
  }

  if (typeof body.query_text !== 'string' || !body.query_text.trim()) {
    return { isValid: false, error: '"query_text" must be a non-empty string.' };
  }

  if (body.query_text.length > 500) {
    return { isValid: false, error: '"query_text" exceeds maximum allowed length of 500 characters.' };
  }

  const query_text = body.query_text.trim();
  const target = ['all', 'techniques', 'insights'].includes(body.target) ? body.target : 'all';

  let discipline: Discipline | 'All' = 'All';
  if (body.discipline && VALID_DISCIPLINES.includes(body.discipline)) {
    discipline = body.discipline;
  }

  let min_confidence: number | undefined;
  if (body.min_confidence !== undefined) {
    const val = Number(body.min_confidence);
    if (isNaN(val) || val < 0 || val > 1) {
      return { isValid: false, error: '"min_confidence" must be a number between 0.0 and 1.0.' };
    }
    min_confidence = val;
  }

  let max_posture_angle: number | undefined;
  if (body.max_posture_angle !== undefined) {
    const val = Number(body.max_posture_angle);
    if (isNaN(val) || val < 0 || val > 180) {
      return { isValid: false, error: '"max_posture_angle" must be a number between 0 and 180 degrees.' };
    }
    max_posture_angle = val;
  }

  let limit = 10;
  if (body.limit !== undefined) {
    const parsedLimit = parseInt(body.limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(50, parsedLimit);
    }
  }

  return {
    isValid: true,
    data: {
      query_text,
      target,
      discipline,
      min_confidence,
      max_posture_angle,
      limit,
      movement_type: typeof body.movement_type === 'string' ? body.movement_type.slice(0, 100) : undefined,
    },
  };
}

/**
 * Validate incoming sparring analysis request payload
 */
export function validateSparringAnalysisRequest(body: any): ValidationResult<{
  metadata: SparringUploadMetadata;
  duration: number;
  frames?: Array<string | { timestampSeconds: number; base64: string }>;
}> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object.' };
  }

  const rawMeta = body.metadata || body;
  if (!rawMeta || typeof rawMeta !== 'object' || typeof rawMeta.fighterId !== 'string' || !rawMeta.fighterId.trim()) {
    return { isValid: false, error: 'Missing or invalid "fighterId" in sparring analysis request.' };
  }

  let duration = 30;
  if (body.duration !== undefined) {
    const parsedDur = Number(body.duration);
    if (isNaN(parsedDur) || parsedDur < 1 || parsedDur > 3600) {
      return { isValid: false, error: '"duration" must be a valid number of seconds (1 - 3600).' };
    }
    duration = parsedDur;
  }

  let frames: Array<string | { timestampSeconds: number; base64: string }> | undefined;
  if (body.frames !== undefined) {
    if (!Array.isArray(body.frames)) {
      return { isValid: false, error: '"frames" must be an array.' };
    }
    if (body.frames.length > MAX_FRAMES_COUNT) {
      return { isValid: false, error: `"frames" count exceeds maximum limit of ${MAX_FRAMES_COUNT} frames.` };
    }

    for (let i = 0; i < body.frames.length; i++) {
      const f = body.frames[i];
      if (typeof f === 'string') {
        if (f.length > MAX_FRAME_BASE64_LENGTH) {
          return { isValid: false, error: `Frame #${i + 1} payload exceeds 5MB size limit.` };
        }
      } else if (typeof f === 'object' && f !== null) {
        if (typeof f.base64 !== 'string' || f.base64.length > MAX_FRAME_BASE64_LENGTH) {
          return { isValid: false, error: `Frame #${i + 1} base64 payload is invalid or exceeds 5MB size limit.` };
        }
      } else {
        return { isValid: false, error: `Frame #${i + 1} has an invalid format.` };
      }
    }
    frames = body.frames;
  }

  const metadata: SparringUploadMetadata = {
    fighterId: String(rawMeta.fighterId).trim(),
    roundNumber: typeof rawMeta.roundNumber === 'number' ? Math.max(1, Math.min(15, rawMeta.roundNumber)) : 1,
    roundDurationSeconds: duration,
    sparringPartnerStyle: typeof rawMeta.sparringPartnerStyle === 'string' ? rawMeta.sparringPartnerStyle.slice(0, 100) : 'Mixed Martial Artist',
    intensity: ['Light Technical', 'Championship Hard', 'Situational / Wall'].includes(rawMeta.intensity)
      ? rawMeta.intensity
      : 'Championship Hard',
    userNotes: typeof rawMeta.userNotes === 'string' ? rawMeta.userNotes.slice(0, 1000) : undefined,
    videoFileName: typeof rawMeta.videoFileName === 'string' ? rawMeta.videoFileName.slice(0, 255) : undefined,
    videoUrl: typeof rawMeta.videoUrl === 'string' ? rawMeta.videoUrl.slice(0, 2048) : undefined,
  };

  return {
    isValid: true,
    data: {
      metadata,
      duration,
      frames,
    },
  };
}

/**
 * Validate video file upload parameters (B6)
 */
export function validateVideoUpload(file: File | null): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No video file provided.' };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed upload cap of 200 MB.`,
    };
  }

  if (file.type && !ALLOWED_VIDEO_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: `Disallowed media format "${file.type}". Allowed video formats: MP4, WebM, QuickTime, MKV.`,
    };
  }

  return { isValid: true };
}
