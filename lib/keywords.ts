import { getDb, Keyword } from './db';

export async function getAllKeywords(): Promise<Keyword[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM keywords ORDER BY keyword ASC').all() as Keyword[];
  return rows;
}

export async function getKeywordById(id: number): Promise<Keyword | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM keywords WHERE id = ?').get(id) as Keyword | undefined;
  return row || null;
}

export async function getKeywordsAsArray(): Promise<string[]> {
  const keywords = await getAllKeywords();
  return keywords.map(k => k.keyword);
}

export async function createKeyword(keyword: string): Promise<Keyword> {
  const db = getDb();
  
  // Check if keyword already exists (case-insensitive)
  const existing = db.prepare('SELECT * FROM keywords WHERE LOWER(keyword) = LOWER(?)').get(keyword) as Keyword | undefined;
  if (existing) {
    throw new Error('Keyword already exists');
  }
  
  const stmt = db.prepare('INSERT INTO keywords (keyword) VALUES (?)');
  stmt.run(keyword);
  
  return db.prepare('SELECT * FROM keywords WHERE keyword = ?').get(keyword) as Keyword;
}

export async function updateKeyword(id: number, keyword: string): Promise<Keyword | null> {
  const db = getDb();
  
  // Check if keyword already exists (case-insensitive, excluding current)
  const existing = db.prepare('SELECT * FROM keywords WHERE LOWER(keyword) = LOWER(?) AND id != ?').get(keyword, id) as Keyword | undefined;
  if (existing) {
    throw new Error('Keyword already exists');
  }
  
  const stmt = db.prepare('UPDATE keywords SET keyword = ?, updated_at = datetime(\'now\') WHERE id = ?');
  stmt.run(keyword, id);
  
  return db.prepare('SELECT * FROM keywords WHERE id = ?').get(id) as Keyword | undefined || null;
}

export async function deleteKeyword(id: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('DELETE FROM keywords WHERE id = ?').run(id);
  return result.changes > 0;
}

