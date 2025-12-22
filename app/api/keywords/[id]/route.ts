import { NextRequest, NextResponse } from 'next/server';
import { getKeywordById, updateKeyword, deleteKeyword } from '@/lib/keywords';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID' },
        { status: 400 }
      );
    }
    
    const keyword = await getKeywordById(id);
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(keyword);
  } catch (error) {
    console.error('Error fetching keyword:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { keyword } = body;
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'keyword is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    const updated = await updateKeyword(id, keyword.trim());
    if (!updated) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating keyword:', error);
    if (error instanceof Error && error.message === 'Keyword already exists') {
      return NextResponse.json(
        { error: 'Keyword already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteKeyword(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}

