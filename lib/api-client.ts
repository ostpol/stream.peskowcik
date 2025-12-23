import axios from 'axios';

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

const ARD_API_BASE = 'https://api.ardmediathek.de/page-gateway/pages/ard/item';
const ARD_SEARCH_API_BASE = 'https://api.ardmediathek.de/search-system/search/vods/ard';

function toTimestamp(value: string | number | null | undefined): number {
  if (!value) return 0;
  if (typeof value === 'number') return Math.floor(value / (value > 10_000_000_000 ? 1000 : 1));
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.floor(parsed / 1000);
}

function firstString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return fallback;
}

function getArdVideoUrl(base64Id: string | null): string | null {
  if (!base64Id) return null;
  return `https://www.ardmediathek.de/video/${base64Id}`;
}

function resolveArdId(item: Record<string, any>): string | null {
  const candidates = [
    item.id,
    item.ardId,
    item.mediaIdentifier,
    item?.target?.id,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('Y3Jp')) {
      return candidate;
    }
  }
  return null;
}

function resolveArdUrl(item: Record<string, any>, base64Id: string | null): string {
  const linkCandidates = [
    item.url,
    item.url_website,
    item.href,
    item?.links?.self?.href,
    item?.links?.canonical?.href,
    item?.links?.main?.href,
    item?.links?.web?.href,
  ];
  for (const link of linkCandidates) {
    if (typeof link === 'string' && link.length > 0) {
      if (link.includes('page-gateway/pages/ard/item/') && base64Id) {
        return getArdVideoUrl(base64Id) || link;
      }
      if (link.includes('ardmediathek.de/video/') || link.includes('ardmediathek.de')) {
        return link;
      }
    }
  }
  return getArdVideoUrl(base64Id) || '';
}

function findFullHdMp4Url(data: unknown): string | undefined {
  const visited = new Set<unknown>();
  let fallback: string | undefined;

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const entry of node) {
        const result = visit(entry);
        if (result) return result;
      }
      return;
    }

    const record = node as Record<string, any>;
    const candidate = typeof record.url === 'string' ? record.url : typeof record._stream === 'string' ? record._stream : undefined;
    const forcedLabel = typeof record.forcedLabel === 'string' ? record.forcedLabel : undefined;
    const height = typeof record._height === 'number' ? record._height : undefined;
    const quality = typeof record._quality === 'string' ? record._quality : undefined;

    if (candidate && candidate.endsWith('.mp4')) {
      if (forcedLabel === 'Full HD' || height === 1080 || quality === 'avc1080') {
        return candidate;
      }
      if (!fallback) fallback = candidate;
    }

    for (const value of Object.values(record)) {
      const result = visit(value);
      if (result) return result;
    }
  };

  const result = visit(data);
  return (result as string | undefined) || fallback;
}

export async function fetchArdSearchResults(
  query: string,
  pageSize: number = 50,
  pageNumber: number = 0
): Promise<MediathekResult[]> {
  try {
    const response = await axios.get(ARD_SEARCH_API_BASE, {
      params: {
        query,
        platform: 'MEDIA_THEK',
        sortingCriteria: 'SCORE_DESC',
        pageNumber,
        pageSize,
      },
      timeout: 6000,
      headers: {
        accept: '*/*',
        origin: 'https://www.ardmediathek.de',
      },
    });

    const data = response.data;
    const rawResults = data?.results || data?.searchResults || data?.result?.results || [];
    if (!Array.isArray(rawResults)) return [];

    return rawResults.map((item: Record<string, any>) => {
      const base64Id = resolveArdId(item);
      const title = firstString(
        item.longTitle || item.mediumTitle || item.title || item.teaserTitle || item.name
      );
      const description = firstString(
        item.longSynopsis || item.synopsis || item.shortSynopsis || item.teaserText || item.description
      );
      const timestamp = toTimestamp(
        item.broadcastedOn || item.publicationStartDate || item.publicationDate || item.availableFrom
      );
      const url_website = resolveArdUrl(item, base64Id);
      return {
        title,
        description,
        timestamp,
        duration: typeof item.duration === 'number' ? item.duration : undefined,
        url_website,
        channel: item.publisher?.name || item.channel?.name || item.station?.name || undefined,
        topic: item.topic || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching ARD search results:', error);
    return [];
  }
}

export async function fetchArdEpisode(base64Id: string): Promise<MediathekResult | null> {
  try {
    const response = await axios.get(`${ARD_API_BASE}/${base64Id}`, {
      timeout: 6000,
      params: {
        embedded: false,
        mcV6: true,
      },
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
      
      const urlVideo = findFullHdMp4Url(widget.mediaCollection) || findFullHdMp4Url(widget);
      
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
// Optional keywords array can override the default keyword list
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
