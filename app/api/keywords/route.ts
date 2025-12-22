import { NextRequest, NextResponse } from 'next/server';
import { getAllKeywords, createKeyword } from '@/lib/keywords';

export async function GET() {
  try {
    const keywords = await getAllKeywords();
    return NextResponse.json(keywords);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'keyword is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    const created = await createKeyword(keyword.trim());
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating keyword:', error);
    if (error instanceof Error && error.message === 'Keyword already exists') {
      return NextResponse.json(
        { error: 'Keyword already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}

