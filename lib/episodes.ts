import { EpisodeOverride, getDb } from './db';
import {
  fetchArdEpisode,
  fetchArdSearchResults,
  extractBase64Id,
  isSorbianEpisode,
  detectLanguage,
  MediathekResult,
} from './api-client';
import { getSearchTermsAsArray } from './search-terms';
import { isBlacklisted } from './blacklist';
import { getCachedValue, setCachedValue } from './cache';

export interface EpisodeWithLanguage {
  base64_id: string | null;
  url_website: string;
  url_video?: string | null;
  preview_image_url?: string | null;
  original_title: string;
  original_description: string;
  timestamp: number;
  duration?: number | null;
  channel?: string | null;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_language?: string | null;
  custom_preview_image_url?: string | null;
  available_until?: string | null;
  override_id?: number | null;
  language?: string | null;
  displayTitle: string;
  displayDescription: string;
  displayLanguage: string;
}

const CACHE_TTL_SECONDS = 60 * 60 * 24;
const MAX_RESULTS = 40;
const PAGE_SIZE = 50;
const DEFAULT_TERMS = ['Pěskowčik', 'Naš pěskowy'];

async function fetchCachedSearchResults(
  query: string,
  pageSize: number,
  pageNumber: number
): Promise<MediathekResult[]> {
  const cacheKey = `search:${query}:${pageSize}:${pageNumber}`;
  const cached = await getCachedValue<MediathekResult[]>(cacheKey);
  if (cached?.isFresh) return cached.data;

  const results = await fetchArdSearchResults(query, pageSize, pageNumber);
  if (results.length > 0) {
    await setCachedValue(cacheKey, results, CACHE_TTL_SECONDS);
    return results;
  }

  if (cached) {
    return cached.data;
  }

  return [];
}

async function fetchCachedEpisode(base64Id: string) {
  const cacheKey = `item:${base64Id}`;
  const cached = await getCachedValue<MediathekResult | null>(cacheKey);
  if (cached?.isFresh) return cached.data;

  const data = await fetchArdEpisode(base64Id);
  if (data) {
    await setCachedValue(cacheKey, data, CACHE_TTL_SECONDS);
    return data;
  }

  if (cached) return cached.data;
  return null;
}

function mergeEpisodeWithOverride(entry: MediathekResult & { base64_id: string | null }, override?: EpisodeOverride) {
  const displayTitle = override?.custom_title || entry.title || 'Untitled';
  const displayDescription = override?.custom_description || entry.description || '';
  const customLanguage = override?.custom_language || null;
  const customPreviewImageUrl = override?.custom_preview_image_url || null;
  return {
    base64_id: entry.base64_id,
    url_website: entry.url_website,
    url_video: entry.url_video || null,
    preview_image_url: customPreviewImageUrl || entry.preview_image_url || null,
    original_title: entry.title,
    original_description: entry.description,
    timestamp: entry.timestamp || 0,
    duration: entry.duration || null,
    channel: entry.channel || null,
    custom_title: override?.custom_title || null,
    custom_description: override?.custom_description || null,
    custom_language: customLanguage,
    custom_preview_image_url: customPreviewImageUrl,
    available_until: override?.available_until || null,
    override_id: override?.id || null,
    displayTitle,
    displayDescription,
  };
}

export async function getAllEpisodes(options?: { includeUnavailable?: boolean }): Promise<EpisodeWithLanguage[]> {
  const includeUnavailable = options?.includeUnavailable ?? false;
  const searchTerms = await getSearchTermsAsArray();
  const terms = searchTerms.length > 0 ? searchTerms : DEFAULT_TERMS;

  const seenUrls = new Set<string>();
  const entries: Array<MediathekResult & { base64_id: string | null }> = [];

  for (const term of terms) {
    let pageNumber = 0;
    while (entries.length < MAX_RESULTS) {
      const results = await fetchCachedSearchResults(term, PAGE_SIZE, pageNumber);
      if (results.length === 0) break;

      for (const entry of results) {
        if (entries.length >= MAX_RESULTS) break;

        if (!(await isSorbianEpisode(entry))) continue;
        if (isBlacklisted(entry.title, entry.url_website)) continue;

        const url = entry.url_website || '';
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        const base64Id = extractBase64Id(url);
        let detailed = entry;
        if (base64Id) {
          const detailResult = await fetchCachedEpisode(base64Id);
          if (detailResult) {
            detailed = {
              ...entry,
              ...detailResult,
              url_website: entry.url_website,
              url_video: detailResult.url_video || entry.url_video,
              preview_image_url: detailResult.preview_image_url || entry.preview_image_url,
            };
          }
        }

        entries.push({ ...detailed, base64_id: base64Id });
      }

      if (results.length < PAGE_SIZE) break;
      pageNumber += 1;
    }
  }

  const overrides = getAllEpisodeOverrides();
  const overridesByUrl = new Map(overrides.map(override => [override.url_website, override]));
  const overridesByBase64 = new Map(
    overrides.filter(override => override.base64_id).map(override => [override.base64_id as string, override])
  );

  const enriched: EpisodeWithLanguage[] = [];

  for (const entry of entries) {
    const override = overridesByUrl.get(entry.url_website) || (entry.base64_id ? overridesByBase64.get(entry.base64_id) : undefined);
    const merged = mergeEpisodeWithOverride(entry, override);
    const language = merged.custom_language
      ? merged.custom_language
      : await detectLanguage({
          title: merged.original_title,
          description: merged.original_description,
          timestamp: merged.timestamp,
          url_website: merged.url_website,
          url_video: merged.url_video || undefined,
          channel: merged.channel || undefined,
        });

    const displayLanguage = language || '—';

    if (!includeUnavailable && merged.available_until) {
      const untilDate = new Date(merged.available_until);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (untilDate < today) continue;
    }

    enriched.push({
      ...merged,
      language,
      displayLanguage,
    });
  }

  return enriched.sort((a, b) => b.timestamp - a.timestamp);
}

export function getAllEpisodeOverrides(): EpisodeOverride[] {
  const db = getDb();
  return db.prepare('SELECT * FROM episode_overrides ORDER BY created_at DESC').all() as EpisodeOverride[];
}

export function getEpisodeOverrideById(id: number): EpisodeOverride | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM episode_overrides WHERE id = ?').get(id) as EpisodeOverride | undefined;
  return row || null;
}

export function upsertEpisodeOverride(
  url: string,
  data: Partial<EpisodeOverride> & { base64_id?: string | null }
): EpisodeOverride {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM episode_overrides WHERE url_website = ?').get(url) as EpisodeOverride | undefined;

  if (existing) {
    db.prepare(
      `
      UPDATE episode_overrides
      SET base64_id = COALESCE(?, base64_id),
          custom_title = ?,
          custom_description = ?,
          custom_language = ?,
          custom_preview_image_url = ?,
          available_until = ?,
          updated_at = datetime('now')
      WHERE url_website = ?
      `
    ).run(
      data.base64_id ?? null,
      data.custom_title ?? null,
      data.custom_description ?? null,
      data.custom_language ?? null,
      data.custom_preview_image_url ?? null,
      data.available_until ?? null,
      url
    );
  } else {
    db.prepare(
      `
      INSERT INTO episode_overrides (
        base64_id, url_website, custom_title, custom_description, custom_language, custom_preview_image_url, available_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      data.base64_id ?? null,
      url,
      data.custom_title ?? null,
      data.custom_description ?? null,
      data.custom_language ?? null,
      data.custom_preview_image_url ?? null,
      data.available_until ?? null
    );
  }

  return db.prepare('SELECT * FROM episode_overrides WHERE url_website = ?').get(url) as EpisodeOverride;
}

export function deleteEpisodeOverride(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM episode_overrides WHERE id = ?').run(id);
  return result.changes > 0;
}
