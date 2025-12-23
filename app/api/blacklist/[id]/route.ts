import { NextRequest, NextResponse } from 'next/server';
import { getBlacklistEntryById, updateBlacklistEntry, deleteBlacklistEntry } from '@/lib/blacklist';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid blacklist entry ID' },
        { status: 400 }
      );
    }
    
    const entry = await getBlacklistEntryById(id);
    if (!entry) {
      return NextResponse.json(
        { error: 'Blacklist entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching blacklist entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blacklist entry' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid blacklist entry ID' },
        { status: 400 }
      );
    }
    
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
    
    const updated = await updateBlacklistEntry(id, pattern.trim(), type);
    if (!updated) {
      return NextResponse.json(
        { error: 'Blacklist entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating blacklist entry:', error);
    if (error instanceof Error && error.message === 'Blacklist entry already exists') {
      return NextResponse.json(
        { error: 'Blacklist entry already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update blacklist entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid blacklist entry ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteBlacklistEntry(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Blacklist entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blacklist entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete blacklist entry' },
      { status: 500 }
    );
  }
}
