import { NextRequest, NextResponse } from 'next/server';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';
import { generateEmbedding } from '@/lib/vector/embeddings';
import { SearchRequest } from '@/types/video-search';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();

    if (!body || typeof body.query_text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid search request. "query_text" string is required.' },
        { status: 400 }
      );
    }

    const queryText = body.query_text.trim();
    if (!queryText) {
      return NextResponse.json(
        { error: '"query_text" must not be empty.' },
        { status: 400 }
      );
    }

    // 1. Vectorize natural language query into 384-dimensional dense embedding
    const queryVector = generateEmbedding(queryText);

    // 2. Query Qdrant vector layer with payload filters and similarity search
    const searchLimit = body.limit && body.limit > 0 && body.limit <= 50 ? body.limit : 10;
    const response = await mmaVectorSearchService.search_techniques(queryVector, body, searchLimit);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error executing MMA semantic vector search:', error);
    return NextResponse.json(
      { 
        error: 'Vector search query failed.', 
        details: error?.message || 'Unknown internal error' 
      },
      { status: 500 }
    );
  }
}
