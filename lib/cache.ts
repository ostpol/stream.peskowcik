import { getDb } from './db';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24;

export interface CacheResult<T> {
  data: T;
  isFresh: boolean;
}

export async function getCachedValue<T>(cacheKey: string): Promise<CacheResult<T> | null> {
  const db = getDb();
  const row = db
    .prepare('SELECT payload, expires_at FROM api_cache WHERE cache_key = ?')
    .get(cacheKey) as { payload: string; expires_at: string } | undefined;

  if (!row) return null;
  const expiresAt = new Date(row.expires_at).getTime();
  const isFresh = Date.now() < expiresAt;
  return {
    data: JSON.parse(row.payload) as T,
    isFresh,
  };
}

export async function setCachedValue<T>(
  cacheKey: string,
  payload: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
) {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const payloadString = JSON.stringify(payload);

  db.prepare(
    `
    INSERT INTO api_cache (cache_key, payload, fetched_at, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(cache_key)
    DO UPDATE SET payload = excluded.payload,
                 fetched_at = excluded.fetched_at,
                 expires_at = excluded.expires_at
    `
  ).run(cacheKey, payloadString, now.toISOString(), expiresAt.toISOString());
}

export async function clearExpiredCache() {
  const db = getDb();
  db.prepare('DELETE FROM api_cache WHERE expires_at <= datetime(\'now\')').run();
}
