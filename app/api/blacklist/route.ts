import { NextRequest, NextResponse } from 'next/server';
import { getAllBlacklistEntries, createBlacklistEntry } from '@/lib/blacklist';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = await getAllBlacklistEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching blacklist entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklist entries' },
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
    const { pattern, type } = body;
    
    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
      return NextResponse.json(
        { error: 'pattern is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    if (!type || (type !== 'title' && type !== 'url')) {
      return NextResponse.json(
        { error: 'type must be either "title" or "url"' },
        { status: 400 }
      );
    }
    
    const created = await createBlacklistEntry(pattern.trim(), type);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating blacklist entry:', error);
    if (error instanceof Error && error.message === 'Blacklist entry already exists') {
      return NextResponse.json(
        { error: 'Blacklist entry already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create blacklist entry' },
      { status: 500 }
    );
  }
}
