import { NextRequest, NextResponse } from 'next/server';
import { createSearchTerm, getAllSearchTerms } from '@/lib/search-terms';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const terms = await getAllSearchTerms();
    return NextResponse.json(terms);
  } catch (error) {
    console.error('Error fetching search terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search terms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { term } = body;

    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return NextResponse.json(
        { error: 'term is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const created = await createSearchTerm(term.trim());
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating search term:', error);
    if (error instanceof Error && error.message === 'Search term already exists') {
      return NextResponse.json(
        { error: 'Search term already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create search term' },
      { status: 500 }
    );
  }
}
