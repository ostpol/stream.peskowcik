import { NextRequest, NextResponse } from 'next/server';
import { getAllEpisodes } from '@/lib/episodes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true';

    const episodes = await getAllEpisodes({ includeUnavailable });
    return NextResponse.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}
