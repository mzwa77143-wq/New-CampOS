import { NextRequest, NextResponse } from 'next/server';
import { analyzeSparringWithGemini } from '@/lib/ai/gemini-service';
import { persistSparringSession } from '@/lib/supabase';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';
import { generateEmbedding } from '@/lib/vector/embeddings';
import { SparringUploadMetadata, SparringAnalysisResponse } from '@/types/sparring-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metadata: SparringUploadMetadata = body.metadata || body;
    const duration = typeof body.duration === 'number' ? body.duration : 30;
    const frames: string[] | undefined = Array.isArray(body.frames) ? body.frames : undefined;

    if (!metadata || !metadata.fighterId) {
      return NextResponse.json(
        { error: 'Invalid sparring request. "fighterId" is required.' },
        { status: 400 }
      );
    }

    // Step 1: Execute multimodal combat vision analysis via Google Gemini
    const feedback: SparringAnalysisResponse = await analyzeSparringWithGemini(
      metadata, 
      duration, 
      frames
    );

    // Step 2: Persist relational session records and timestamp logs via Supabase
    const persistResult = await persistSparringSession(feedback);
    feedback.persistedToSupabase = persistResult.persistedToSupabase;

    // Step 3: Generate embeddings and upsert insight vectors into Qdrant collection 'sparring_insights'
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
            videoUrl: metadata.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
          });
        }
        feedback.qdrantIndexed = true;
      } catch (vectorErr: any) {
        console.warn('Qdrant insight vector indexing notice:', vectorErr.message);
        feedback.qdrantIndexed = false;
      }
    }

    // Step 4: Return strongly-typed complete SparringAnalysisResponse
    return NextResponse.json(feedback, { status: 200 });
  } catch (error: any) {
    console.error('Error in MMA sparring analysis orchestration pipeline:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process sparring video analysis pipeline.', 
        details: error?.message || 'Unknown internal error' 
      },
      { status: 500 }
    );
  }
}
