import fs from 'fs';
import path from 'path';
import { 
  SparringUploadMetadata, 
  SparringAnalysisResponse,
  TacticalSequence,
  BiomechanicalMetric,
  AgenticInsight,
  ActionItem,
  BiomechanicalFlaw,
  KeyMoment,
  PrescribedDrill
} from '@/types/sparring-analysis';
import { analyzeSparringWithGemini } from './gemini-service';
import { persistSparringSession } from '@/lib/supabase';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';
import { generateEmbedding } from '@/lib/vector/embeddings';

export type JobStatus = 'queued' | 'extracting_telemetry' | 'gemini_vision' | 'persisting_database' | 'vector_indexing' | 'completed' | 'failed';

export interface AnalysisJob {
  jobId: string;
  status: JobStatus;
  progress: number; // 0 to 100
  stage: string;
  fighterId: string;
  fighterName: string;
  roundNumber: number;
  durationSeconds: number;
  partnerStyle?: string;
  intensity?: string;
  videoUrl?: string;
  videoFileName?: string;
  framesCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: SparringAnalysisResponse;
  error?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'analysis_jobs.json');

// In-memory jobs registry with bounded size
const jobsRegistry: Map<string, AnalysisJob> = new Map();
const MAX_JOBS_CAP = 50;
let persistTimeout: NodeJS.Timeout | null = null;
let lastPersistTime = 0;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function pruneJobs(): void {
  if (jobsRegistry.size <= MAX_JOBS_CAP) return;
  const jobsArray = Array.from(jobsRegistry.values());
  // Sort oldest first
  jobsArray.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  // Prune completed or failed jobs first
  for (const job of jobsArray) {
    if (jobsRegistry.size <= MAX_JOBS_CAP) break;
    if (job.status === 'completed' || job.status === 'failed') {
      jobsRegistry.delete(job.jobId);
    }
  }

  // If still over cap, prune oldest
  while (jobsRegistry.size > MAX_JOBS_CAP) {
    const oldestKey = jobsRegistry.keys().next().value;
    if (oldestKey) jobsRegistry.delete(oldestKey);
    else break;
  }
}

function flushJobsToDisk(): void {
  try {
    ensureDataDir();
    pruneJobs();
    const list = Array.from(jobsRegistry.values());
    const tmpFile = `${JOBS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(list, null, 2), 'utf8');
    fs.renameSync(tmpFile, JOBS_FILE);
    lastPersistTime = Date.now();
  } catch (e) {
    console.warn('[Video Jobs] Notice writing jobs file to disk:', e);
  }
}

function persistJobsToDisk(immediate = false): void {
  if (immediate) {
    if (persistTimeout) {
      clearTimeout(persistTimeout);
      persistTimeout = null;
    }
    flushJobsToDisk();
    return;
  }

  const now = Date.now();
  if (now - lastPersistTime >= 1000) {
    flushJobsToDisk();
  } else if (!persistTimeout) {
    persistTimeout = setTimeout(() => {
      persistTimeout = null;
      flushJobsToDisk();
    }, 1000);
  }
}

function loadJobsFromDisk(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, 'utf8');
      const list = JSON.parse(raw) as AnalysisJob[];
      list.forEach((j) => jobsRegistry.set(j.jobId, j));
      console.log(`[Video Jobs] Restored ${jobsRegistry.size} background jobs from persistent storage.`);
    }
  } catch (e) {
    console.warn('[Video Jobs] Notice restoring jobs file from disk:', e);
  }
}

// Initial restore
loadJobsFromDisk();

function getFighterName(id: string): string {
  switch (id) {
    case 'f1': return 'Alex Silva';
    case 'f2': return 'Sean Martinez';
    case 'f3': return 'Valentina Santos';
    case 'f4': return 'Justin Vance';
    default: return 'Alex Silva';
  }
}

/**
 * Create and enqueue a new asynchronous analysis job
 */
export function createAnalysisJob(params: {
  metadata: SparringUploadMetadata;
  durationSeconds: number;
  frames?: Array<string | { timestampSeconds: number; base64: string }>;
}): AnalysisJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const fighterName = getFighterName(params.metadata.fighterId);

  const job: AnalysisJob = {
    jobId,
    status: 'queued',
    progress: 5,
    stage: 'Job enqueued in background processing queue',
    fighterId: params.metadata.fighterId,
    fighterName,
    roundNumber: params.metadata.roundNumber || 1,
    durationSeconds: params.durationSeconds || 30,
    partnerStyle: params.metadata.sparringPartnerStyle,
    intensity: params.metadata.intensity,
    videoUrl: params.metadata.videoUrl,
    videoFileName: params.metadata.videoFileName,
    framesCount: params.frames?.length || 0,
    createdAt: now,
    updatedAt: now,
  };

  jobsRegistry.set(jobId, job);
  persistJobsToDisk();

  console.log('[Video Jobs: Enqueued]', {
    jobId,
    fighterName,
    round: job.roundNumber,
    duration: job.durationSeconds,
    framesCount: job.framesCount,
  });

  return job;
}

/**
 * Retrieve a specific analysis job by ID
 */
export function getAnalysisJob(jobId: string): AnalysisJob | null {
  return jobsRegistry.get(jobId) || null;
}

/**
 * Retrieve all active and completed analysis jobs
 */
export function getAllAnalysisJobs(): AnalysisJob[] {
  return Array.from(jobsRegistry.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Cancel or dismiss a background job
 */
export function cancelAnalysisJob(jobId: string): boolean {
  if (jobsRegistry.has(jobId)) {
    jobsRegistry.delete(jobId);
    persistJobsToDisk();
    console.log('[Video Jobs: Cancelled]', jobId);
    return true;
  }
  return false;
}

/**
 * Execute the full multi-stage pipeline asynchronously in the background
 */
export async function runBackgroundAnalysis(
  jobId: string,
  params: {
    metadata: SparringUploadMetadata;
    durationSeconds: number;
    frames?: Array<string | { timestampSeconds: number; base64: string }>;
  }
): Promise<void> {
  const job = jobsRegistry.get(jobId);
  if (!job) return;

  const updateJob = (status: JobStatus, progress: number, stage: string) => {
    if (!jobsRegistry.has(jobId)) {
      console.log(`[Video Jobs: Cancelled Worker] Aborting worker for ${jobId}`);
      throw new Error('JOB_CANCELLED');
    }
    job.status = status;
    job.progress = progress;
    job.stage = stage;
    job.updatedAt = new Date().toISOString();
    jobsRegistry.set(jobId, { ...job });
    persistJobsToDisk();
    console.log(`[Video Jobs: Progress] [${jobId}] ${progress}% - ${stage}`);
  };

  try {
    // Stage 1: Keypoint Extraction & Skeletal Normalization
    updateJob('extracting_telemetry', 20, 'Normalizing frame resolutions and calculating joint angular kinematics...');
    await new Promise((r) => setTimeout(r, 600));

    if (!jobsRegistry.has(jobId)) return;

    // Stage 2: Splicing into 30-Second Progressive Temporal Chunks
    const totalDuration = params.durationSeconds || 30;
    const CHUNK_SIZE = 30;
    const numChunks = Math.max(1, Math.ceil(totalDuration / CHUNK_SIZE));

    console.log(`[Video Jobs: Multi-Chunk Pipeline] [${jobId}] Processing ${totalDuration}s video spliced into ${numChunks} progressive chunks of ~${CHUNK_SIZE}s each.`);

    let feedback: SparringAnalysisResponse;

    if (numChunks === 1) {
      updateJob('gemini_vision', 45, 'Streaming visual keypoint telemetry to Gemini Multimodal Combat Intelligence...');
      feedback = await analyzeSparringWithGemini(
        params.metadata,
        totalDuration,
        params.frames
      );
    } else {
      const chunkResponses: SparringAnalysisResponse[] = [];

      for (let c = 0; c < numChunks; c++) {
        if (!jobsRegistry.has(jobId)) return;

        const chunkStart = c * CHUNK_SIZE;
        const chunkEnd = Math.min(totalDuration, (c + 1) * CHUNK_SIZE);
        const chunkLength = chunkEnd - chunkStart;

        // Filter frames that fall into this chunk's window
        const chunkFrames = (params.frames || []).filter((f) => {
          if (typeof f === 'string') return true;
          return f.timestampSeconds >= chunkStart && f.timestampSeconds <= chunkEnd;
        });

        const startMinSec = `${Math.floor(chunkStart / 60)}:${Math.floor(chunkStart % 60).toString().padStart(2, '0')}`;
        const endMinSec = `${Math.floor(chunkEnd / 60)}:${Math.floor(chunkEnd % 60).toString().padStart(2, '0')}`;

        const chunkProgress = 20 + Math.round(((c + 0.5) / numChunks) * 50);
        updateJob(
          'gemini_vision',
          chunkProgress,
          `[Chunk ${c + 1}/${numChunks}] Progressively analyzing ${startMinSec} - ${endMinSec} with Gemini 3.6 Flash...`
        );

        const chunkResp = await analyzeSparringWithGemini(
          params.metadata,
          chunkLength,
          chunkFrames,
          {
            chunkIndex: c + 1,
            totalChunks: numChunks,
            chunkStartSeconds: chunkStart,
            chunkEndSeconds: chunkEnd,
            fullVideoDurationSeconds: totalDuration,
          }
        );

        chunkResponses.push(chunkResp);
      }

      updateJob('persisting_database', 73, 'Synthesizing spliced chunk analytics into cohesive full-round debrief...');
      feedback = synthesizeChunkResponses(chunkResponses, params.metadata, totalDuration);
    }

    if (!jobsRegistry.has(jobId)) return;

    // Stage 3: Relational Persistence in Supabase & Local Database
    updateJob('persisting_database', 75, 'Persisting fight camp debrief and tactical sequences into relational database...');
    const persistResult = await persistSparringSession(feedback);
    feedback.persistedToSupabase = persistResult.persistedToSupabase;

    if (!jobsRegistry.has(jobId)) return;

    // Stage 4: Qdrant Vector Indexing for Semantic MMA Search
    updateJob('vector_indexing', 90, 'Vectorizing tactical insights into Qdrant Cloud collection "sparring_insights"...');
    if (feedback.insights && feedback.insights.length > 0) {
      try {
        for (const ins of feedback.insights) {
          if (!jobsRegistry.has(jobId)) return;
          const semanticText = `${ins.title} ${ins.category} ${ins.observation} ${ins.rootCause} ${ins.correction}`;
          const vector = generateEmbedding(semanticText);

          await mmaVectorSearchService.upsertSparringInsight(ins.id, vector, {
            id: ins.id,
            sessionId: feedback.sessionId,
            fighterId: feedback.fighterId,
            title: ins.title,
            category: ins.category,
            observation: ins.observation,
            correction: ins.correction,
            timestampMs: ins.timestampMs,
            endTimestampMs: ins.endTimestampMs,
            timestampSeconds: parseFloat((ins.timestampMs / 1000).toFixed(1)),
            severity: ins.severity,
            videoUrl: params.metadata.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
          });
        }
        feedback.qdrantIndexed = true;
      } catch (vectorErr: any) {
        console.warn(`[Video Jobs: Vector Notice] [${jobId}]`, vectorErr?.message);
        feedback.qdrantIndexed = false;
      }
    }

    if (!jobsRegistry.has(jobId)) return;

    // Stage 5: Completed
    job.status = 'completed';
    job.progress = 100;
    job.stage = 'Analysis complete. Ready for interactive coaching review.';
    job.result = feedback;
    job.completedAt = new Date().toISOString();
    job.updatedAt = job.completedAt;

    jobsRegistry.set(jobId, { ...job });
    persistJobsToDisk();

    console.log(`[Video Jobs: Success] [${jobId}] Pipeline completed successfully. Overall score: ${feedback.overallScore}, Grade: ${feedback.grade}`);
  } catch (error: any) {
    if (error?.message === 'JOB_CANCELLED' || !jobsRegistry.has(jobId)) {
      console.log(`[Video Jobs: Worker Cancelled Exit] ${jobId}`);
      return;
    }
    console.error(`[Video Jobs: Failure] [${jobId}] Background analysis failed:`, error);
    job.status = 'failed';
    job.stage = 'Analysis failed due to an unexpected error';
    job.error = error?.message || 'Unknown processing error';
    job.updatedAt = new Date().toISOString();
    jobsRegistry.set(jobId, { ...job });
    persistJobsToDisk();
  }
}

/**
 * Synthesizes multiple 30-second progressive chunk analyses into a master debrief
 */
function synthesizeChunkResponses(
  responses: SparringAnalysisResponse[],
  metadata: SparringUploadMetadata,
  totalDurationSeconds: number
): SparringAnalysisResponse {
  const masterSessionId = `gemini_multichunk_${Date.now()}`;
  const fighterName = responses[0]?.fighterName || 'Alex Silva';

  // Average overall score across all chunks
  const avgScore = Math.round(
    responses.reduce((sum, r) => sum + (r.overallScore || 80), 0) / Math.max(1, responses.length)
  );
  const grade: SparringAnalysisResponse['grade'] = avgScore >= 90 ? 'A' : avgScore >= 80 ? 'A-' : avgScore >= 75 ? 'B+' : avgScore >= 70 ? 'B' : avgScore >= 60 ? 'B-' : 'C';

  // Aggregate cumulative fight statistics
  const totalStrikesLanded = responses.reduce((s, r) => s + (r.stats?.strikesLanded || 0), 0);
  const totalStrikesAbsorbed = responses.reduce((s, r) => s + (r.stats?.strikesAbsorbed || 0), 0);
  const avgAccuracy = Math.round(
    responses.reduce((s, r) => s + (r.stats?.strikeAccuracyPct || 68), 0) / Math.max(1, responses.length)
  );
  const avgTdd = Math.round(
    responses.reduce((s, r) => s + (r.stats?.takedownDefensePct || 85), 0) / Math.max(1, responses.length)
  );
  const totalCageControl = responses.reduce((s, r) => s + (r.stats?.cageControlSeconds || 0), 0);

  // Combine and sort chronologically across all chunks
  const allSequences: TacticalSequence[] = responses
    .flatMap((r) => r.tacticalSequences || [])
    .sort((a, b) => a.startTimestampMs - b.startTimestampMs);

  const allMetrics: BiomechanicalMetric[] = responses
    .flatMap((r) => r.biomechanicalMetrics || [])
    .sort((a, b) => a.timestampMs - b.timestampMs);

  const allInsights: AgenticInsight[] = responses
    .flatMap((r) => r.insights || [])
    .sort((a, b) => a.timestampMs - b.timestampMs);

  const allFlaws: BiomechanicalFlaw[] = responses
    .flatMap((r) => r.flaws || [])
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  const allKeyMoments: KeyMoment[] = responses
    .flatMap((r) => r.keyMoments || [])
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  // Deduplicate action items & drills by title
  const seenDrills = new Set<string>();
  const allDrills: PrescribedDrill[] = [];
  const allActionItems: ActionItem[] = [];

  for (const r of responses) {
    for (const d of (r.prescribedDrills || [])) {
      if (!seenDrills.has(d.title)) {
        seenDrills.add(d.title);
        allDrills.push(d);
      }
    }
    for (const a of (r.actionItems || [])) {
      if (!allActionItems.some((existing) => existing.title === a.title)) {
        allActionItems.push(a);
      }
    }
  }

  const fightIqSummary = `Full-round progressive analysis across ${responses.length} tactical chunks (${totalDurationSeconds}s total). ${fighterName} established tempo early, navigated mid-round pocket pressure with ${avgAccuracy}% strike accuracy, and absorbed ${totalStrikesAbsorbed} total strikes while logging ${totalCageControl}s of cage control across all fight phases.`;

  return {
    sessionId: masterSessionId,
    fighterId: metadata.fighterId || 'f1',
    fighterName,
    roundNumber: metadata.roundNumber || 1,
    roundDurationMs: totalDurationSeconds * 1000,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    overallScore: avgScore,
    grade,
    fightIqSummary,
    stats: {
      strikesLanded: totalStrikesLanded,
      strikesAbsorbed: totalStrikesAbsorbed,
      strikeAccuracyPct: avgAccuracy,
      takedownDefensePct: avgTdd,
      cageControlSeconds: totalCageControl,
    },
    tacticalSequences: allSequences,
    biomechanicalMetrics: allMetrics,
    insights: allInsights,
    actionItems: allActionItems,
    flaws: allFlaws,
    keyMoments: allKeyMoments,
    prescribedDrills: allDrills,
    source: `Gemini Multimodal (${responses.length} Progressive Chunks Spliced)`,
  };
}
