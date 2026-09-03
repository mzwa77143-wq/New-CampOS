import { NextRequest, NextResponse } from 'next/server';
import { getUploadedVideos, deleteUploadedVideo, getUploadedVideoById } from '@/lib/db/video-db';

export async function GET(request: NextRequest) {
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
    console.error('[API: /api/v1/mma/videos] Error listing uploaded videos:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve uploaded videos from database.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    console.error('[API: /api/v1/mma/videos] Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video from database.', details: error?.message },
      { status: 500 }
    );
  }
}
