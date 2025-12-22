import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'episodes.db');

export interface Episode {
  id?: number;
  base64_id: string | null;
  url_website: string;
  url_video: string | null;
  custom_title: string | null;
  custom_description: string | null;
  custom_language: string | null;
  original_title: string | null;
  original_description: string | null;
  timestamp: number;
  duration: number | null;
  channel: string | null;
  is_manual: number; // SQLite uses 0/1 for boolean
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id?: number;
  keyword: string;
  created_at: string;
  updated_at: string;
}

export interface LanguageRule {
  id?: number;
  pattern: string;
  language: string; // 'Obersorbisch' or 'Niedersorbisch'
  priority: number; // Lower numbers checked first
  is_active: number; // SQLite uses 0/1 for boolean
  created_at: string;
  updated_at: string;
}

export interface BlacklistEntry {
  id?: number;
  pattern: string; // Title pattern or URL pattern
  type: string; // 'title' or 'url'
  created_at: string;
  updated_at: string;
}

export interface ManualSeed {
  id?: number;
  kind: string; // 'base64' or 'url'
  value: string;
  custom_title: string | null;
  custom_description: string | null;
  custom_date: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Create episodes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base64_id TEXT,
      url_website TEXT NOT NULL UNIQUE,
      url_video TEXT,
      custom_title TEXT,
      custom_description TEXT,
      custom_language TEXT,
      original_title TEXT,
      original_description TEXT,
      timestamp INTEGER NOT NULL DEFAULT 0,
      duration INTEGER,
      channel TEXT,
      is_manual INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_episodes_timestamp ON episodes(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_episodes_base64_id ON episodes(base64_id);
    CREATE INDEX IF NOT EXISTS idx_episodes_is_manual ON episodes(is_manual);
    
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
    
    CREATE TABLE IF NOT EXISTS language_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL,
      language TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_language_rules_priority ON language_rules(priority ASC);
    CREATE INDEX IF NOT EXISTS idx_language_rules_active ON language_rules(is_active);
    
    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('title', 'url')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);

    CREATE TABLE IF NOT EXISTS manual_seeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK(kind IN ('base64', 'url')),
      value TEXT NOT NULL UNIQUE,
      custom_title TEXT,
      custom_description TEXT,
      custom_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_manual_seeds_kind ON manual_seeds(kind);
  `);
  
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
