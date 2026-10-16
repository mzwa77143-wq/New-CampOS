import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisJob, getAllAnalysisJobs, cancelAnalysisJob } from '@/lib/ai/video-jobs';
import { requireAuth, checkRateLimit, getClientIp, handleApiError } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.response!;

  const ip = getClientIp(request);
  if (!checkRateLimit(`jobs_get_${ip}`, 120, 2)) {
    return NextResponse.json({ error: 'Too many job status requests. Please slow down.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      const job = getAnalysisJob(jobId);
      if (!job) {
        return NextResponse.json(
          { error: `Job with ID "${jobId}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }

    const jobs = getAllAnalysisJobs();
    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error: any) {
    return handleApiError('/api/v1/mma/jobs', error, 'Failed to retrieve background analysis jobs.');
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['coach', 'admin']);
  if (!auth.authorized) return auth.response!;

  const ip = getClientIp(request);
  if (!checkRateLimit(`jobs_del_${ip}`, 30, 0.5)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required "jobId" parameter.' },
        { status: 400 }
      );
    }

    const cancelled = cancelAnalysisJob(jobId);
    return NextResponse.json({
      success: cancelled,
      cancelledId: jobId,
    });
  } catch (error: any) {
    return handleApiError('/api/v1/mma/jobs', error, 'Failed to cancel job.');
  }
}
