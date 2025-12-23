import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'episodes.db');

export interface SearchTerm {
  id?: number;
  term: string;
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

export interface EpisodeOverride {
  id?: number;
  base64_id: string | null;
  url_website: string;
  custom_title: string | null;
  custom_description: string | null;
  custom_language: string | null;
  available_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id?: number;
  username: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id?: number;
  token: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface ApiCacheEntry {
  id?: number;
  cache_key: string;
  payload: string;
  fetched_at: string;
  expires_at: string;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Core tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS episode_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base64_id TEXT,
      url_website TEXT NOT NULL UNIQUE,
      custom_title TEXT,
      custom_description TEXT,
      custom_language TEXT,
      available_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_episode_overrides_base64_id ON episode_overrides(base64_id);
    
    CREATE TABLE IF NOT EXISTS search_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_search_terms_term ON search_terms(term);
    
    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('title', 'url')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS api_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT NOT NULL UNIQUE,
      payload TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
  `);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
