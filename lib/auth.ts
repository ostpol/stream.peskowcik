import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getDb, AdminUser } from './db';

const SESSION_COOKIE = 'psk_admin_session';
const SESSION_TTL_DAYS = 7;
const HASH_ITERATIONS = 120000;

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 64, 'sha512').toString('hex');
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const hashed = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hashed, 'hex'), Buffer.from(hash, 'hex'));
}

export function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const db = getDb();
  const existing = db.prepare('SELECT id FROM admin_users LIMIT 1').get() as { id: number } | undefined;
  if (existing) return;

  const { hash, salt } = createPasswordHash(password);
  db.prepare(
    `INSERT INTO admin_users (username, password_hash, password_salt)
     VALUES (?, ?, ?)`
  ).run(username, hash, salt);
}

export function getAdminByUsername(username: string): AdminUser | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?)')
    .get(username) as AdminUser | undefined;
  return row || null;
}

export function authenticateAdmin(username: string, password: string): AdminUser | null {
  ensureDefaultAdmin();
  const user = getAdminByUsername(username);
  if (!user) return null;
  if (!verifyPassword(password, user.password_salt, user.password_hash)) return null;
  return user;
}

export function createAdminSession(userId: number) {
  const db = getDb();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(
    `INSERT INTO admin_sessions (token, user_id, expires_at)
     VALUES (?, ?, ?)`
  ).run(token, userId, expiresAt.toISOString());
  return { token, expiresAt };
}

export function getAdminSession(token: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT admin_sessions.token, admin_sessions.expires_at, admin_users.id, admin_users.username
       FROM admin_sessions
       JOIN admin_users ON admin_users.id = admin_sessions.user_id
       WHERE admin_sessions.token = ?`
    )
    .get(token) as { token: string; expires_at: string; id: number; username: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    return null;
  }
  return { token: row.token, user: { id: row.id, username: row.username } };
}

export function clearAdminSession(token: string) {
  const db = getDb();
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

export function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getAdminSession(token);
}
