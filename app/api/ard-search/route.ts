import { NextRequest, NextResponse } from 'next/server';
import { fetchArdSearchRawResults } from '@/lib/api-client';

const DEFAULT_QUERY = 'Pěskowčik';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || DEFAULT_QUERY;
    const pageSize = Number(searchParams.get('pageSize') || 50);
    const pageNumber = Number(searchParams.get('pageNumber') || 0);

    const results = await fetchArdSearchRawResults(query, pageSize, pageNumber);
    return NextResponse.json({ query, results });
  } catch (error) {
    console.error('Error fetching ARD raw search results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ARD raw search results' },
      { status: 500 }
    );
  }
}
