import { NextResponse } from 'next/server';
import { mmaVectorSearchService } from '@/lib/vector/qdrant-service';

export async function GET() {
  try {
    const filters = mmaVectorSearchService.getAvailableFilters();
    return NextResponse.json(filters, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching MMA taxonomy filters:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve filters taxonomy.' },
      { status: 500 }
    );
  }
}
