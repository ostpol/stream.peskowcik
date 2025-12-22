import { NextRequest, NextResponse } from 'next/server';
import { getAllEpisodes, syncEpisodesFromAPI, createOrUpdateEpisode } from '@/lib/episodes';
import { fetchArdEpisode, extractBase64Id } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sync = searchParams.get('sync') === 'true';
    const autoSync = searchParams.get('autoSync') === 'true';
    
    if (sync) {
      // Sync episodes from API
      const count = await syncEpisodesFromAPI();
      return NextResponse.json({ synced: count });
    }
    
    const episodes = await getAllEpisodes();
    
    // Auto-sync if enabled and database is empty
    if (autoSync && episodes.length === 0) {
      console.log('Database is empty, triggering automatic sync...');
      const count = await syncEpisodesFromAPI();
      console.log(`Auto-synced ${count} episodes`);
      // Return the newly synced episodes
      return NextResponse.json(await getAllEpisodes());
    }
    
    return NextResponse.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, base64_id, ...data } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }
    
    // If base64_id is provided, try to fetch from ARD API
    let episodeData = { ...data };
    if (base64_id) {
      const ardData = await fetchArdEpisode(base64_id);
      if (ardData) {
        episodeData = {
          ...episodeData,
          base64_id,
          original_title: ardData.title,
          original_description: ardData.description,
          timestamp: ardData.timestamp,
          duration: ardData.duration || null,
          channel: ardData.channel || null,
          url_video: ardData.url_video || null,
        };
      }
    } else {
      // Try to extract base64_id from URL
      const extractedId = extractBase64Id(url);
      if (extractedId) {
        const ardData = await fetchArdEpisode(extractedId);
        if (ardData) {
          episodeData = {
            ...episodeData,
            base64_id: extractedId,
            original_title: ardData.title,
            original_description: ardData.description,
            timestamp: ardData.timestamp,
            duration: ardData.duration || null,
            channel: ardData.channel || null,
            url_video: ardData.url_video || null,
          };
        }
      }
    }
    
    episodeData.is_manual = 1; // Mark as manual
    
    const episode = await createOrUpdateEpisode(url, episodeData);
    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error('Error creating episode:', error);
    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    );
  }
}

