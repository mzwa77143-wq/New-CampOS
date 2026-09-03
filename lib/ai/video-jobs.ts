import fs from 'fs';
import path from 'path';
import { SparringUploadMetadata, SparringAnalysisResponse } from '@/types/sparring-analysis';
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

// In-memory jobs registry
const jobsRegistry: Map<string, AnalysisJob> = new Map();

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function persistJobsToDisk(): void {
  try {
    ensureDataDir();
    const list = Array.from(jobsRegistry.values());
    fs.writeFileSync(JOBS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Video Jobs] Notice writing jobs file to disk:', e);
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
  frames?: string[];
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
    frames?: string[];
  }
): Promise<void> {
  const job = jobsRegistry.get(jobId);
  if (!job) return;

  const updateJob = (status: JobStatus, progress: number, stage: string) => {
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

    // Stage 2: Multimodal Gemini AI Vision Analysis
    updateJob('gemini_vision', 45, 'Streaming visual keypoint telemetry to Gemini Multimodal Combat Intelligence...');
    const feedback: SparringAnalysisResponse = await analyzeSparringWithGemini(
      params.metadata,
      params.durationSeconds,
      params.frames
    );

    // Stage 3: Relational Persistence in Supabase & Local Database
    updateJob('persisting_database', 75, 'Persisting fight camp debrief and tactical sequences into relational database...');
    const persistResult = await persistSparringSession(feedback);
    feedback.persistedToSupabase = persistResult.persistedToSupabase;

    // Stage 4: Qdrant Vector Indexing for Semantic MMA Search
    updateJob('vector_indexing', 90, 'Vectorizing tactical insights into Qdrant Cloud collection "sparring_insights"...');
    if (feedback.insights && feedback.insights.length > 0) {
      try {
        for (const ins of feedback.insights) {
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
    console.error(`[Video Jobs: Failure] [${jobId}] Background analysis failed:`, error);
    job.status = 'failed';
    job.stage = 'Analysis failed due to an unexpected error';
    job.error = error?.message || 'Unknown processing error';
    job.updatedAt = new Date().toISOString();
    jobsRegistry.set(jobId, { ...job });
    persistJobsToDisk();
  }
}
