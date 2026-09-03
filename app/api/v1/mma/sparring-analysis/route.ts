import { NextRequest, NextResponse } from 'next/server';
import { analyzeSparringWithGemini } from '@/lib/ai/gemini-service';
import { persistSparringSession } from '@/lib/supabase';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';
import { generateEmbedding } from '@/lib/vector/embeddings';
import { SparringUploadMetadata, SparringAnalysisResponse } from '@/types/sparring-analysis';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('───────────────────────────────────────────────────────');
  console.log('[API: /api/v1/mma/sparring-analysis] Ingestion request received at', new Date().toISOString());

  try {
    const body = await request.json();
    const metadata: SparringUploadMetadata = body.metadata || body;
    const duration = typeof body.duration === 'number' ? body.duration : 30;
    const frames: string[] | undefined = Array.isArray(body.frames) ? body.frames : undefined;

    console.log('[API: /api/v1/mma/sparring-analysis] Request parameters:', {
      fighterId: metadata?.fighterId,
      roundNumber: metadata?.roundNumber,
      intensity: metadata?.intensity,
      sparringPartnerStyle: metadata?.sparringPartnerStyle,
      durationSeconds: duration,
      framesProvided: frames ? frames.length : 0,
      videoFileName: metadata?.videoFileName,
    });

    if (!metadata || !metadata.fighterId) {
      console.warn('[API: /api/v1/mma/sparring-analysis] 400 Bad Request: Missing fighterId');
      return NextResponse.json(
        { error: 'Invalid sparring request. "fighterId" is required.' },
        { status: 400 }
      );
    }

    // Step 1: Execute multimodal combat vision analysis via Google Gemini
    console.log('[API: Pipeline Step 1/4] Invoking Gemini Multimodal Analysis...');
    const feedback: SparringAnalysisResponse = await analyzeSparringWithGemini(
      metadata, 
      duration, 
      frames
    );
    console.log('[API: Pipeline Step 1/4 Completed] Analysis Result:', {
      sessionId: feedback.sessionId,
      overallScore: feedback.overallScore,
      grade: feedback.grade,
      source: feedback.source,
      tacticalSequencesCount: feedback.tacticalSequences?.length || 0,
      biomechanicalMetricsCount: feedback.biomechanicalMetrics?.length || 0,
      insightsCount: feedback.insights?.length || 0,
      actionItemsCount: feedback.actionItems?.length || 0,
    });

    // Step 2: Persist relational session records and timestamp logs via Supabase
    console.log('[API: Pipeline Step 2/4] Persisting session to database layer (Supabase / Local-First)...');
    const persistResult = await persistSparringSession(feedback);
    feedback.persistedToSupabase = persistResult.persistedToSupabase;
    console.log('[API: Pipeline Step 2/4 Completed] Persistence Result:', {
      success: persistResult.success,
      persistedToSupabase: persistResult.persistedToSupabase,
      sessionId: persistResult.sessionId,
    });

    // Step 3: Generate embeddings and upsert insight vectors into Qdrant collection 'sparring_insights'
    console.log('[API: Pipeline Step 3/4] Vectorizing insights & upserting into Qdrant collection "sparring_insights"...');
    if (feedback.insights && feedback.insights.length > 0) {
      let upsertedCount = 0;
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
          upsertedCount++;
        }
        feedback.qdrantIndexed = true;
        console.log(`[API: Pipeline Step 3/4 Completed] Indexed ${upsertedCount} insights into Qdrant 'sparring_insights'`);
      } catch (vectorErr: any) {
        console.warn('[API: Pipeline Step 3/4 Warning] Qdrant insight vector indexing warning:', vectorErr.message);
        feedback.qdrantIndexed = false;
      }
    } else {
      console.log('[API: Pipeline Step 3/4] No insights to vectorize in this session');
    }

    // Step 4: Return strongly-typed complete SparringAnalysisResponse
    const totalLatency = Date.now() - startTime;
    console.log(`[API: Pipeline Step 4/4 Complete] Total execution time: ${totalLatency}ms. Returning 200 OK.`);
    console.log('───────────────────────────────────────────────────────');
    return NextResponse.json(feedback, { status: 200 });
  } catch (error: any) {
    const totalLatency = Date.now() - startTime;
    console.error(`[API: /api/v1/mma/sparring-analysis] Pipeline error after ${totalLatency}ms:`, error);
    console.log('───────────────────────────────────────────────────────');
    return NextResponse.json(
      { 
        error: 'Failed to process sparring video analysis pipeline.', 
        details: error?.message || 'Unknown internal error' 
      },
      { status: 500 }
    );
  }
}
