import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisJob, runBackgroundAnalysis } from '@/lib/ai/video-jobs';
import { SparringUploadMetadata } from '@/types/sparring-analysis';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('───────────────────────────────────────────────────────');
  console.log('[API: /api/v1/mma/sparring-analysis] Async analysis request received at', new Date().toISOString());

  try {
    const body = await request.json();
    const metadata: SparringUploadMetadata = body.metadata || body;
    const duration = typeof body.duration === 'number' ? body.duration : 30;
    const frames: string[] | undefined = Array.isArray(body.frames) ? body.frames : undefined;

    if (!metadata || !metadata.fighterId) {
      console.warn('[API: /api/v1/mma/sparring-analysis] 400 Bad Request: Missing fighterId');
      return NextResponse.json(
        { error: 'Invalid sparring request. "fighterId" is required.' },
        { status: 400 }
      );
    }

    // 1. Enqueue job into asynchronous background processing engine
    const job = createAnalysisJob({
      metadata,
      durationSeconds: duration,
      frames,
    });

    // 2. Launch background analysis worker without blocking HTTP response
    runBackgroundAnalysis(job.jobId, {
      metadata,
      durationSeconds: duration,
      frames,
    }).catch((err) => {
      console.error(`[Background Worker Error] Job ${job.jobId} threw unhandled exception:`, err);
    });

    const elapsed = Date.now() - startTime;
    console.log(`[API: /api/v1/mma/sparring-analysis] Job ${job.jobId} dispatched in ${elapsed}ms. Returning 202 Accepted.`);
    console.log('───────────────────────────────────────────────────────');

    // 3. Return 202 Accepted immediately so user can continue using the application
    return NextResponse.json(
      {
        success: true,
        message: 'Analysis job dispatched and running in background.',
        jobId: job.jobId,
        job,
      },
      { status: 202 }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[API: /api/v1/mma/sparring-analysis] Ingestion error after ${elapsed}ms:`, error);
    console.log('───────────────────────────────────────────────────────');
    return NextResponse.json(
      { 
        error: 'Failed to enqueue sparring video analysis.', 
        details: error?.message || 'Unknown internal error' 
      },
      { status: 500 }
    );
  }
}
