import { NextRequest, NextResponse } from 'next/server';
import { deleteSearchTerm, getSearchTermById, updateSearchTerm } from '@/lib/search-terms';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid search term ID' },
        { status: 400 }
      );
    }

    const term = await getSearchTermById(id);
    if (!term) {
      return NextResponse.json(
        { error: 'Search term not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(term);
  } catch (error) {
    console.error('Error fetching search term:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search term' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid search term ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { term } = body;

    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return NextResponse.json(
        { error: 'term is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const updated = await updateSearchTerm(id, term.trim());
    if (!updated) {
      return NextResponse.json(
        { error: 'Search term not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating search term:', error);
    if (error instanceof Error && error.message === 'Search term already exists') {
      return NextResponse.json(
        { error: 'Search term already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update search term' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid search term ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteSearchTerm(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Search term not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting search term:', error);
    return NextResponse.json(
      { error: 'Failed to delete search term' },
      { status: 500 }
    );
  }
}
