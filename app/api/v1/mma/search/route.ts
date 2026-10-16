import { NextRequest, NextResponse } from 'next/server';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';
import { generateEmbedding } from '@/lib/vector/embeddings';
import { requireAuth, checkRateLimit, getClientIp, handleApiError } from '@/lib/auth/api-guard';
import { validateSearchRequest } from '@/lib/validation/api-schemas';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.authorized) return auth.response!;

  const ip = getClientIp(request);
  if (!checkRateLimit(`search_${ip}`, 60, 1.0)) {
    return NextResponse.json(
      { error: 'Search rate limit exceeded. Please wait a moment.' },
      { status: 429 }
    );
  }

  const startTime = Date.now();
  console.log('───────────────────────────────────────────────────────');
  console.log('[API: /api/v1/mma/search] Vector query request received at', new Date().toISOString());

  try {
    const rawBody = await request.json();
    const validation = validateSearchRequest(rawBody);

    if (!validation.isValid || !validation.data) {
      console.warn('[API: /api/v1/mma/search] 400 Bad Request:', validation.error);
      return NextResponse.json(
        { error: validation.error || 'Invalid search parameters.' },
        { status: 400 }
      );
    }

    const body = validation.data;
    const queryText = body.query_text;

    console.log('[API: /api/v1/mma/search] Parsed parameters:', {
      query: queryText,
      target: body.target || 'all',
      discipline: body.discipline || 'All',
      minConfidence: body.min_confidence,
      maxPostureAngle: body.max_posture_angle,
      limit: body.limit || 10,
    });

    // 1. Vectorize query into 384-dimensional dense embedding
    const queryVector = generateEmbedding(queryText);

    // 2. Query vector layer with payload filters and similarity search
    const searchLimit = body.limit || 10;
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
    return handleApiError('/api/v1/mma/search', error, 'Vector search query failed.');
  }
}
