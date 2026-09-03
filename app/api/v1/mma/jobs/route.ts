import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisJob, getAllAnalysisJobs, cancelAnalysisJob } from '@/lib/ai/video-jobs';

export async function GET(request: NextRequest) {
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
    console.error('[API: /api/v1/mma/jobs] Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve background analysis jobs.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    console.error('[API: /api/v1/mma/jobs] Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job.', details: error?.message },
      { status: 500 }
    );
  }
}
