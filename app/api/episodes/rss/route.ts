import { NextResponse } from 'next/server';
import { getAllEpisodes } from '@/lib/episodes';
import { format } from 'date-fns';

export async function GET() {
  try {
    const episodes = await getAllEpisodes();
    
    const channelTitle = 'Pěskowčik – Stream Now!';
    const channelLink = 'https://www.sandmann.de';
    const channelDescription = 'RSS‑Feed mit sorbischsprachigen Folgen aus der ARD Mediathek API';
    
    const items = episodes.map(ep => {
      const title = escapeXml(ep.displayTitle);
      const description = escapeXml(ep.displayDescription);
      const link = escapeXml(ep.url_website);
      const pubDate = format(new Date(ep.timestamp * 1000), 'EEE, dd MMM yyyy HH:mm:ss xx');
      
      let enclosure = '';
      if (ep.url_video) {
        const enclosureUrl = escapeXml(ep.url_video);
        const enclosureType = ep.url_video.toLowerCase().endsWith('.m3u8')
          ? 'application/x-mpegURL'
          : 'video/mp4';
        enclosure = `<enclosure url="${enclosureUrl}" length="0" type="${enclosureType}" />`;
      }
      
      return `
        <item>
          <title>${title}</title>
          <description>${description}</description>
          <link>${link}</link>
          <guid>${link}</guid>
          <pubDate>${pubDate}</pubDate>
          ${enclosure}
        </item>
      `;
    }).join('\n');
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    ${items}
  </channel>
</rss>`;
    
    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating RSS:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
