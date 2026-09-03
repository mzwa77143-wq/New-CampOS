import { NextRequest, NextResponse } from 'next/server';
import { analyzeSparringWithGemini } from '@/lib/ai/gemini-service';
import { SparringUploadMetadata } from '@/types/sparring-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metadata: SparringUploadMetadata = body.metadata || body;
    const duration = typeof body.duration === 'number' ? body.duration : 30;
    const frames: string[] | undefined = Array.isArray(body.frames) ? body.frames : undefined;

    if (!metadata || !metadata.fighterId) {
      return NextResponse.json(
        { error: 'Missing required fighterId in metadata' },
        { status: 400 }
      );
    }

    const feedback = await analyzeSparringWithGemini(metadata, duration, frames);

    return NextResponse.json(feedback, { status: 200 });
  } catch (error: any) {
    console.error('Error generating AI sparring feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process sparring video analysis', details: error?.message },
      { status: 500 }
    );
  }
}
