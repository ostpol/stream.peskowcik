import { getDb, LanguageRule } from './db';

export async function getAllLanguageRules(): Promise<LanguageRule[]> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM language_rules 
    WHERE is_active = 1
    ORDER BY priority ASC, id ASC
  `).all() as LanguageRule[];
  return rows;
}

export async function getAllLanguageRulesIncludingInactive(): Promise<LanguageRule[]> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM language_rules 
    ORDER BY priority ASC, id ASC
  `).all() as LanguageRule[];
  return rows;
}

export async function getLanguageRuleById(id: number): Promise<LanguageRule | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM language_rules WHERE id = ?').get(id) as LanguageRule | undefined;
  return row || null;
}

export async function createLanguageRule(
  pattern: string,
  language: string,
  priority: number = 0,
  isActive: boolean = true
): Promise<LanguageRule> {
  const db = getDb();
  
  if (language !== 'Obersorbisch' && language !== 'Niedersorbisch') {
    throw new Error('Language must be either "Obersorbisch" or "Niedersorbisch"');
  }
  
  const stmt = db.prepare(`
    INSERT INTO language_rules (pattern, language, priority, is_active) 
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(pattern, language, priority, isActive ? 1 : 0);
  
  return db.prepare('SELECT * FROM language_rules WHERE id = last_insert_rowid()').get() as LanguageRule;
}

export async function updateLanguageRule(
  id: number,
  updates: {
    pattern?: string;
    language?: string;
    priority?: number;
    is_active?: boolean;
  }
): Promise<LanguageRule | null> {
  const db = getDb();
  
  if (updates.language && updates.language !== 'Obersorbisch' && updates.language !== 'Niedersorbisch') {
    throw new Error('Language must be either "Obersorbisch" or "Niedersorbisch"');
  }
  
  const existing = db.prepare('SELECT * FROM language_rules WHERE id = ?').get(id) as LanguageRule | undefined;
  if (!existing) {
    return null;
  }
  
  const pattern = updates.pattern ?? existing.pattern;
  const language = updates.language ?? existing.language;
  const priority = updates.priority ?? existing.priority;
  const isActive = updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : existing.is_active;
  
  const stmt = db.prepare(`
    UPDATE language_rules 
    SET pattern = ?, language = ?, priority = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(pattern, language, priority, isActive, id);
  
  return db.prepare('SELECT * FROM language_rules WHERE id = ?').get(id) as LanguageRule;
}

export async function deleteLanguageRule(id: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('DELETE FROM language_rules WHERE id = ?').run(id);
  return result.changes > 0;
}

