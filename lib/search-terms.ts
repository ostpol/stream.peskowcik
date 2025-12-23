import { getDb, SearchTerm } from './db';

export async function getAllSearchTerms(): Promise<SearchTerm[]> {
  const db = getDb();
  return db.prepare('SELECT * FROM search_terms ORDER BY term ASC').all() as SearchTerm[];
}

export async function getSearchTermById(id: number): Promise<SearchTerm | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM search_terms WHERE id = ?').get(id) as SearchTerm | undefined;
  return row || null;
}

export async function getSearchTermsAsArray(): Promise<string[]> {
  const terms = await getAllSearchTerms();
  return terms.map(term => term.term);
}

export async function createSearchTerm(term: string): Promise<SearchTerm> {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM search_terms WHERE LOWER(term) = LOWER(?)').get(term) as SearchTerm | undefined;
  if (existing) {
    throw new Error('Search term already exists');
  }
  const stmt = db.prepare('INSERT INTO search_terms (term) VALUES (?)');
  stmt.run(term);
  return db.prepare('SELECT * FROM search_terms WHERE term = ?').get(term) as SearchTerm;
}

export async function updateSearchTerm(id: number, term: string): Promise<SearchTerm | null> {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM search_terms WHERE LOWER(term) = LOWER(?) AND id != ?').get(term, id) as SearchTerm | undefined;
  if (existing) {
    throw new Error('Search term already exists');
  }
  const stmt = db.prepare('UPDATE search_terms SET term = ?, updated_at = datetime(\'now\') WHERE id = ?');
  stmt.run(term, id);
  return db.prepare('SELECT * FROM search_terms WHERE id = ?').get(id) as SearchTerm | undefined || null;
}

export async function deleteSearchTerm(id: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('DELETE FROM search_terms WHERE id = ?').run(id);
  return result.changes > 0;
}
