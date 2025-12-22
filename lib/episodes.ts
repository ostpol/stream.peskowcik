import { getDb, Episode } from './db';
import { 
  fetchMediathekResults, 
  fetchArdEpisode, 
  extractBase64Id,
  isSorbianEpisode,
  detectLanguage,
  MediathekResult 
} from './api-client';
import { getKeywordsAsArray } from './keywords';
import { getAllLanguageRules } from './language-rules';
import { isBlacklisted } from './blacklist';

export interface EpisodeWithLanguage extends Episode {
  language?: string | null;
  displayTitle: string;
  displayDescription: string;
  displayLanguage: string;
}

export async function getAllEpisodes(): Promise<EpisodeWithLanguage[]> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM episodes 
    ORDER BY timestamp DESC
  `).all() as Episode[];
  
  // Enrich all episodes in parallel
  return Promise.all(rows.map(ep => enrichEpisode(ep)));
}

export async function getEpisodeById(id: number): Promise<EpisodeWithLanguage | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM episodes WHERE id = ?').get(id) as Episode | undefined;
  
  if (!row) return null;
  return await enrichEpisode(row);
}

export async function getEpisodeByUrl(url: string): Promise<EpisodeWithLanguage | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM episodes WHERE url_website = ?').get(url) as Episode | undefined;
  
  if (!row) return null;
  return await enrichEpisode(row);
}

export async function enrichEpisode(ep: Episode): Promise<EpisodeWithLanguage> {
  // Use custom values if available, otherwise fall back to original
  const displayTitle = ep.custom_title || ep.original_title || 'Untitled';
  const displayDescription = ep.custom_description || ep.original_description || '';
  
  // Detect language if not set
  let language = ep.custom_language;
  if (!language && ep.original_title) {
    const tempEntry: MediathekResult = {
      title: ep.original_title,
      description: ep.original_description || '',
      timestamp: ep.timestamp,
      url_website: ep.url_website,
      url_video: ep.url_video || undefined,
      channel: ep.channel || undefined,
    };
    
    // Get language rules from database
    const rules = await getAllLanguageRules();
    const rulesForDetection = rules.map(r => ({ pattern: r.pattern, language: r.language }));
    language = await detectLanguage(tempEntry, rulesForDetection);
  }
  
  return {
    ...ep,
    language,
    displayTitle,
    displayDescription,
    displayLanguage: language || '—',
  };
}

export async function createOrUpdateEpisode(
  url: string,
  data: Partial<Episode>
): Promise<Episode> {
  const db = getDb();
  
  const existing = db.prepare('SELECT * FROM episodes WHERE url_website = ?').get(url) as Episode | undefined;
  
  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE episodes 
      SET base64_id = COALESCE(?, base64_id),
          url_video = COALESCE(?, url_video),
          custom_title = COALESCE(?, custom_title),
          custom_description = COALESCE(?, custom_description),
          custom_language = COALESCE(?, custom_language),
          original_title = COALESCE(?, original_title),
          original_description = COALESCE(?, original_description),
          timestamp = COALESCE(?, timestamp),
          duration = COALESCE(?, duration),
          channel = COALESCE(?, channel),
          is_manual = COALESCE(?, is_manual),
          updated_at = datetime('now')
      WHERE url_website = ?
    `);
    
    stmt.run(
      data.base64_id ?? null,
      data.url_video ?? null,
      data.custom_title ?? null,
      data.custom_description ?? null,
      data.custom_language ?? null,
      data.original_title ?? null,
      data.original_description ?? null,
      data.timestamp ?? null,
      data.duration ?? null,
      data.channel ?? null,
      data.is_manual ?? null,
      url
    );
    
    return db.prepare('SELECT * FROM episodes WHERE url_website = ?').get(url) as Episode;
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO episodes (
        base64_id, url_website, url_video,
        custom_title, custom_description, custom_language,
        original_title, original_description,
        timestamp, duration, channel, is_manual
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.base64_id ?? null,
      url,
      data.url_video ?? null,
      data.custom_title ?? null,
      data.custom_description ?? null,
      data.custom_language ?? null,
      data.original_title ?? null,
      data.original_description ?? null,
      data.timestamp ?? 0,
      data.duration ?? null,
      data.channel ?? null,
      data.is_manual ?? 0
    );
    
    return db.prepare('SELECT * FROM episodes WHERE url_website = ?').get(url) as Episode;
  }
}

export async function updateEpisodeMetadata(
  id: number,
  updates: {
    custom_title?: string | null;
    custom_description?: string | null;
    custom_language?: string | null;
  }
): Promise<Episode | null> {
  const db = getDb();
  
  const stmt = db.prepare(`
    UPDATE episodes 
    SET custom_title = ?,
        custom_description = ?,
        custom_language = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);
  
  stmt.run(
    updates.custom_title ?? null,
    updates.custom_description ?? null,
    updates.custom_language ?? null,
    id
  );
  
  return db.prepare('SELECT * FROM episodes WHERE id = ?').get(id) as Episode | undefined || null;
}

export async function deleteEpisode(id: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('DELETE FROM episodes WHERE id = ?').run(id);
  return result.changes > 0;
}

export async function clearAllEpisodes(): Promise<number> {
  const db = getDb();
  const result = db.prepare('DELETE FROM episodes').run();
  return result.changes;
}

export async function syncEpisodesFromAPI(): Promise<number> {
  const db = getDb();
  let synced = 0;
  
  // Get keywords from database
  const keywords = await getKeywordsAsArray();
  
  // Fetch episodes from API
  const pageSize = 120;
  const maxResults = 15;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 120); // Last 120 days
  
  let offset = 0;
  const seenUrls = new Set<string>();
  
  while (synced < maxResults) {
    const results = await fetchMediathekResults('Unser Sandmännchen', null, pageSize, offset);
    
    if (results.length === 0) break;
    
    for (const entry of results) {
      if (synced >= maxResults) break;
      
      const entryDate = new Date(entry.timestamp * 1000);
      if (entryDate < cutoffDate) {
        // Reached cutoff, stop fetching more pages
        return synced;
      }
      
      if (!(await isSorbianEpisode(entry, keywords))) continue;
      
      // Check if blacklisted
      if (isBlacklisted(entry.title, entry.url_website)) {
        continue;
      }
      
      // Skip duplicates
      if (seenUrls.has(entry.url_website)) continue;
      seenUrls.add(entry.url_website);
      
      // Check if already exists
      const existing = db.prepare('SELECT id FROM episodes WHERE url_website = ?').get(entry.url_website);
      if (existing) continue;
      
      // Extract base64 ID if available
      const base64Id = extractBase64Id(entry.url_website);
      
      // Create episode
      await createOrUpdateEpisode(entry.url_website, {
        base64_id: base64Id,
        url_video: entry.url_video || null,
        original_title: entry.title,
        original_description: entry.description,
        timestamp: entry.timestamp,
        duration: entry.duration || null,
        channel: entry.channel || null,
        is_manual: 0,
      });
      
      synced++;
    }
    
    if (results.length < pageSize) break;
    offset += pageSize;
  }
  
  return synced;
}

