import axios from 'axios';

export interface MediathekQuery {
  queries: Array<{
    fields: string[];
    query: string;
  }>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  future: boolean;
  offset: number;
  size: number;
}

export interface MediathekResult {
  title: string;
  description: string;
  timestamp: number;
  duration?: number;
  size?: number;
  url_website: string;
  url_video?: string;
  channel?: string;
  topic?: string;
}

export interface MediathekResponse {
  result: {
    results: MediathekResult[];
    totalResults: number;
  };
  err?: string;
}

const MEDIATHEK_API_BASE = 'https://mediathekviewweb.de/api/query';
const ARD_API_BASE = 'https://api.ardmediathek.de/page-gateway/pages/ard/item';

export async function fetchMediathekResults(
  topic: string | null = 'Unser Sandmännchen',
  titleFilter: string | null = null,
  size: number = 50,
  offset: number = 0
): Promise<MediathekResult[]> {
  const queries: MediathekQuery['queries'] = [];
  
  if (topic) {
    queries.push({ fields: ['topic'], query: topic });
  }
  
  if (titleFilter) {
    queries.push({ fields: ['title'], query: titleFilter });
  }
  
  const query: MediathekQuery = {
    queries,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    future: false,
    offset,
    size,
  };
  
  try {
    // Use POST method with JSON body as per API documentation example
    const response = await axios.post<MediathekResponse>(
      MEDIATHEK_API_BASE,
      query,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 6000,
      }
    );
    
    return response.data.result?.results || [];
  } catch (error) {
    console.error('Error fetching MediathekView results:', error);
    return [];
  }
}

export async function fetchArdEpisode(base64Id: string): Promise<MediathekResult | null> {
  try {
    const response = await axios.get(`${ARD_API_BASE}/${base64Id}`, {
      timeout: 6000,
    });
    
    const data = response.data;
    const widgets = data.widgets || [];
    
    for (const widget of widgets) {
      if (!widget.mediaCollection) continue;
      
      const title = widget.longTitle || widget.mediumTitle || widget.title || '';
      const description = widget.longSynopsis || widget.synopsis || '';
      
      let timestamp = 0;
      if (widget.broadcastedOn) {
        try {
          const dt = new Date(widget.broadcastedOn.replace('Z', '+00:00'));
          timestamp = Math.floor(dt.getTime() / 1000);
        } catch (e) {
          // ignore
        }
      }
      
      let urlVideo: string | undefined;
      try {
        const mediaArray = widget.mediaCollection.embedded?._mediaArray;
        if (mediaArray && mediaArray.length > 0) {
          const streamArray = mediaArray[0]._mediaStreamArray || [];
          // Prefer 720p, fallback to first
          let chosen = streamArray.find((s: any) => 
            s._height === 720 || s._quality === 'avc720' || s._quality === 3
          );
          if (!chosen && streamArray.length > 0) {
            chosen = streamArray[0];
          }
          if (chosen) {
            urlVideo = chosen._stream;
          }
        }
      } catch (e) {
        // ignore
      }
      
      return {
        title,
        description,
        timestamp,
        duration: widget.duration || undefined,
        url_website: `https://www.ardmediathek.de/video/${base64Id}`,
        url_video: urlVideo,
        channel: widget.publisher?.name || 'RBB',
        topic: 'Unser Sandmännchen',
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ARD episode ${base64Id}:`, error);
    return null;
  }
}

export function extractBase64Id(url: string): string | null {
  if (!url) return null;
  
  // Remove trailing slashes
  const cleanUrl = url.replace(/\/+$/, '');
  const parts = cleanUrl.split('/');
  let candidate = parts[parts.length - 1];
  
  if (candidate.includes('?')) {
    candidate = candidate.split('?')[0];
  }
  if (candidate.includes('#')) {
    candidate = candidate.split('#')[0];
  }
  
  // ARD base64 IDs start with "Y3Jp" (base64 of "crid")
  if (candidate.startsWith('Y3Jp')) {
    return candidate;
  }
  
  return null;
}

// Helper to check if string is Sorbian episode
// This function can be called with optional keywords array for database-backed keywords
export async function isSorbianEpisode(
  entry: MediathekResult,
  keywords?: string[]
): Promise<boolean> {
  const title = (entry.title || '').toLowerCase();
  const description = (entry.description || '').toLowerCase();
  
  // Use provided keywords or fallback to default hardcoded list
  const keywordList = keywords || [
    'sorbisch',
    'obersorbisch',
    'niedersorbisch',
    'peskowcik',
    'pěskowčik',
    'gestörte angelfreuden',
    'gestoerte angelfreuden',
    'suwa',
    'spewaca',
    'mróčele',
    'mrocele',
    'jablucina',
    'jabłucina',
    'liska',
    'sroka',
  ];
  
  return keywordList.some(kw => title.includes(kw.toLowerCase()) || description.includes(kw.toLowerCase()));
}

// Helper function to detect language using database rules or fallback to defaults
export async function detectLanguage(
  entry: MediathekResult,
  rules?: Array<{ pattern: string; language: string }>
): Promise<string | null> {
  if (!entry) return null;
  
  const title = (entry.title || '').toLowerCase();
  const desc = (entry.description || '').toLowerCase();
  const url = (entry.url_website || '').toLowerCase();
  
  const text = `${title} ${desc} ${url}`;
  
  // Use provided rules first, then fallback to default hardcoded rules
  if (rules && rules.length > 0) {
    // Sort by priority if rules have priority (they should be pre-sorted from DB)
    for (const rule of rules) {
      const patternLower = rule.pattern.toLowerCase();
      if (text.includes(patternLower)) {
        return rule.language;
      }
    }
    // If no database rule matched, continue to fallback rules below
  }
  
  // Fallback to default hardcoded rules (always check these as backup)
  if (text.includes('niedersorbisch')) {
    return 'Niedersorbisch';
  }
  if (text.includes('obersorbisch')) {
    return 'Obersorbisch';
  }
  if (text.includes('sorbisch')) {
    return 'Obersorbisch'; // Default to Obersorbisch for generic "sorbisch"
  }
  
  // Check for Pěskowčik patterns - these should match Obersorbisch
  // Handle both with and without diacritics, and with/without colon
  if (text.includes('pěskowčik') || text.includes('peskowcik')) {
    return 'Obersorbisch';
  }
  if (text.includes('nas peskowy') || text.includes('naš pěskowy')) {
    return 'Niedersorbisch';
  }
  
  return null;
}


