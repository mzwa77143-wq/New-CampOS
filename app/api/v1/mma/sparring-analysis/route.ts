import { NextRequest, NextResponse } from 'next/server';
import { createAnalysisJob, runBackgroundAnalysis } from '@/lib/ai/video-jobs';
import { requireAuth, checkRateLimit, getClientIp, handleApiError } from '@/lib/auth/api-guard';
import { validateSparringAnalysisRequest } from '@/lib/validation/api-schemas';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.response!;

  const ip = getClientIp(request);
  if (!checkRateLimit(`sparring_${ip}`, 15, 0.2)) {
    return NextResponse.json(
      { error: 'AI analysis quota rate limit reached. Please wait a moment before launching new sessions.' },
      { status: 429 }
    );
  }

  const startTime = Date.now();
  console.log('───────────────────────────────────────────────────────');
  console.log('[API: /api/v1/mma/sparring-analysis] Async analysis request received at', new Date().toISOString());

  try {
    const rawBody = await request.json();
    const validation = validateSparringAnalysisRequest(rawBody);

    if (!validation.isValid || !validation.data) {
      console.warn('[API: /api/v1/mma/sparring-analysis] 400 Bad Request:', validation.error);
      return NextResponse.json(
        { error: validation.error || 'Invalid sparring analysis request.' },
        { status: 400 }
      );
    }

    const { metadata, duration, frames } = validation.data;

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
    return handleApiError('/api/v1/mma/sparring-analysis', error, 'Failed to enqueue sparring video analysis.');
  }
}
