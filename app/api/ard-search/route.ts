import { NextRequest, NextResponse } from 'next/server';
import { fetchArdSearchRawResults } from '@/lib/api-client';
import { getSearchTermsAsArray } from '@/lib/search-terms';

const DEFAULT_TERMS = ['Pěskowčik', 'Naš pěskowy'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedQuery = searchParams.get('query');
    const pageSize = Number(searchParams.get('pageSize') || 50);
    const pageNumber = Number(searchParams.get('pageNumber') || 0);
    const terms = requestedQuery
      ? [requestedQuery]
      : (await getSearchTermsAsArray()).filter(term => term.trim().length > 0);
    const queries = terms.length > 0 ? terms : DEFAULT_TERMS;

    const results = await Promise.all(
      queries.map(async query => ({
        query,
        results: await fetchArdSearchRawResults(query, pageSize, pageNumber),
      }))
    );

    return NextResponse.json({ queries, results });
  } catch (error) {
    console.error('Error fetching ARD raw search results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ARD raw search results' },
      { status: 500 }
    );
  }
}
