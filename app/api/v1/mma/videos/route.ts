import { NextRequest, NextResponse } from 'next/server';
import { getUploadedVideos, deleteUploadedVideo } from '@/lib/db/video-db';
import { requireAuth, checkRateLimit, getClientIp, handleApiError } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.response!;

  const ip = getClientIp(request);
  if (!checkRateLimit(`videos_get_${ip}`, 60, 1)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fighterId = searchParams.get('fighterId') || undefined;

    console.log('[API: /api/v1/mma/videos] Listing uploaded videos from database:', { fighterId: fighterId || 'All' });
    const videos = await getUploadedVideos(fighterId);

    return NextResponse.json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (error: any) {
    return handleApiError('/api/v1/mma/videos', error, 'Failed to retrieve uploaded videos from database.');
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, ['coach', 'admin']);
  if (!auth.authorized) return auth.response!;

  const ip = getClientIp(request);
  if (!checkRateLimit(`videos_del_${ip}`, 20, 0.5)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required "id" query parameter.' },
        { status: 400 }
      );
    }

    console.log('[API: /api/v1/mma/videos] Deleting video record from database:', id);
    const success = await deleteUploadedVideo(id);

    return NextResponse.json({
      success,
      deletedId: id,
    });
  } catch (error: any) {
    return handleApiError('/api/v1/mma/videos', error, 'Failed to delete video from database.');
  }
}
