import { getDb, BlacklistEntry } from './db';

export async function getAllBlacklistEntries(): Promise<BlacklistEntry[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM blacklist ORDER BY type ASC, pattern ASC').all() as BlacklistEntry[];
  return rows;
}

export async function getBlacklistEntryById(id: number): Promise<BlacklistEntry | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM blacklist WHERE id = ?').get(id) as BlacklistEntry | undefined;
  return row || null;
}

export async function createBlacklistEntry(
  pattern: string,
  type: 'title' | 'url'
): Promise<BlacklistEntry> {
  const db = getDb();
  
  // Check if entry already exists
  const existing = db.prepare('SELECT * FROM blacklist WHERE pattern = ? AND type = ?').get(pattern, type) as BlacklistEntry | undefined;
  if (existing) {
    throw new Error('Blacklist entry already exists');
  }
  
  const stmt = db.prepare('INSERT INTO blacklist (pattern, type) VALUES (?, ?)');
  stmt.run(pattern, type);
  
  return db.prepare('SELECT * FROM blacklist WHERE id = last_insert_rowid()').get() as BlacklistEntry;
}

export async function updateBlacklistEntry(
  id: number,
  pattern: string,
  type: 'title' | 'url'
): Promise<BlacklistEntry | null> {
  const db = getDb();
  
  // Check if entry already exists (excluding current)
  const existing = db.prepare('SELECT * FROM blacklist WHERE pattern = ? AND type = ? AND id != ?').get(pattern, type, id) as BlacklistEntry | undefined;
  if (existing) {
    throw new Error('Blacklist entry already exists');
  }
  
  const stmt = db.prepare('UPDATE blacklist SET pattern = ?, type = ?, updated_at = datetime(\'now\') WHERE id = ?');
  stmt.run(pattern, type, id);
  
  return db.prepare('SELECT * FROM blacklist WHERE id = ?').get(id) as BlacklistEntry | undefined || null;
}

export async function deleteBlacklistEntry(id: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('DELETE FROM blacklist WHERE id = ?').run(id);
  return result.changes > 0;
}

export function isBlacklisted(title: string, url: string): boolean {
  const db = getDb();
  const entries = db.prepare('SELECT * FROM blacklist').all() as BlacklistEntry[];
  
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();
  
  for (const entry of entries) {
    const patternLower = entry.pattern.toLowerCase();
    
    if (entry.type === 'title' && titleLower.includes(patternLower)) {
      return true;
    }
    
    if (entry.type === 'url' && urlLower.includes(patternLower)) {
      return true;
    }
  }
  
  return false;
}

