import { NextRequest, NextResponse } from 'next/server';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';
import { generateEmbedding } from '@/lib/vector/embeddings';
import { SearchRequest } from '@/types/video-search';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('───────────────────────────────────────────────────────');
  console.log('[API: /api/v1/mma/search] Semantic query request received at', new Date().toISOString());

  try {
    const body: SearchRequest = await request.json();

    if (!body || typeof body.query_text !== 'string') {
      console.warn('[API: /api/v1/mma/search] 400 Bad Request: Missing or invalid query_text');
      return NextResponse.json(
        { error: 'Invalid search request. "query_text" string is required.' },
        { status: 400 }
      );
    }

    const queryText = body.query_text.trim();
    if (!queryText) {
      console.warn('[API: /api/v1/mma/search] 400 Bad Request: Empty query_text');
      return NextResponse.json(
        { error: '"query_text" must not be empty.' },
        { status: 400 }
      );
    }

    console.log('[API: /api/v1/mma/search] Parsed parameters:', {
      query: queryText,
      target: body.target || 'all',
      discipline: body.discipline || 'All',
      minConfidence: body.min_confidence,
      maxPostureAngle: body.max_posture_angle,
      limit: body.limit || 10,
    });

    // 1. Vectorize natural language query into 384-dimensional dense embedding
    const queryVector = generateEmbedding(queryText);
    console.log(`[API: /api/v1/mma/search] Vectorized query text into ${queryVector.length}-dimensional dense embedding.`);

    // 2. Query Qdrant vector layer with payload filters and similarity search
    const searchLimit = body.limit && body.limit > 0 && body.limit <= 50 ? body.limit : 10;
    const response = await mmaVectorSearchService.search_techniques(queryVector, body, searchLimit);

    const elapsed = Date.now() - startTime;
    console.log('[API: /api/v1/mma/search] Vector search query completed:', {
      totalMatches: response.total_matches,
      techniqueMatches: response.results?.length || 0,
      sparringInsightMatches: response.insightMatches?.length || 0,
      fallbackApplied: response.fallback_applied,
      latencyMs: elapsed,
    });
    console.log('───────────────────────────────────────────────────────');

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error(`[API: /api/v1/mma/search] Vector search failed after ${elapsed}ms:`, error);
    console.log('───────────────────────────────────────────────────────');
    return NextResponse.json(
      { 
        error: 'Vector search query failed.', 
        details: error?.message || 'Unknown internal error' 
      },
      { status: 500 }
    );
  }
}
