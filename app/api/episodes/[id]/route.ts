import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeById, updateEpisodeMetadata, deleteEpisode } from '@/lib/episodes';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid episode ID' },
        { status: 400 }
      );
    }
    
    const episode = await getEpisodeById(id);
    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(episode);
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episode' },
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
        { error: 'Invalid episode ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const updates: {
      custom_title?: string | null;
      custom_description?: string | null;
      custom_language?: string | null;
    } = {};
    
    if ('custom_title' in body) updates.custom_title = body.custom_title;
    if ('custom_description' in body) updates.custom_description = body.custom_description;
    if ('custom_language' in body) updates.custom_language = body.custom_language;
    
    const episode = await updateEpisodeMetadata(id, updates);
    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(episode);
  } catch (error) {
    console.error('Error updating episode:', error);
    return NextResponse.json(
      { error: 'Failed to update episode' },
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
        { error: 'Invalid episode ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteEpisode(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting episode:', error);
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 }
    );
  }
}

