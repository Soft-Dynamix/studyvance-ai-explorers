// PIN + session helpers for StudyVance AI Explorers.
import crypto from 'crypto';
export const PIN_LENGTH = 4;
export function generateLearnerCode(prefix = 'EX'): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chars = Array.from({ length: 4 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join('');
  return `${prefix}-${chars}`;
}
export function generateRandomPin(length: number = PIN_LENGTH): string {
  const digits: string[] = [];
  for (let i = 0; i < length; i++) digits.push(String(crypto.randomInt(0, 10)));
  const pin = digits.join('');
  if (new Set(pin).size === 1) return generateRandomPin(length);
  return pin;
}
function randomSalt(): string { return crypto.randomBytes(16).toString('hex'); }
export function hashPin(pin: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? randomSalt();
  const hash = crypto.pbkdf2Sync(pin, s, 100_000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}
export function verifyPin(pin: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPin(pin, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
export function createSessionToken(): string { return crypto.randomBytes(32).toString('hex'); }
type Session = { learnerId: string; createdAt: number; expiresAt: number; };
const SESSION_TTL_MS = 1000 * 60 * 60 * 4;

// In-memory cache (fast path) + database backup (survives server restarts)
const sessionCache = new Map<string, Session>();

export async function startSession(learnerId: string): Promise<string> {
  const token = createSessionToken();
  const now = Date.now();
  const sessionData = { learnerId, createdAt: now, expiresAt: now + SESSION_TTL_MS };
  sessionCache.set(token, sessionData);
  // Also persist to database so it survives server restarts
  try {
    const { db } = await import('./db');
    await db.session.upsert({
      where: { token },
      create: { token, learnerId, expiresAt: new Date(now + SESSION_TTL_MS) },
      update: { learnerId, expiresAt: new Date(now + SESSION_TTL_MS) },
    });
  } catch {}
  return token;
}

export async function getSession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  // Fast path: check in-memory cache
  const cached = sessionCache.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) { sessionCache.delete(token); return null; }
    return cached;
  }
  // Slow path: check database (survives server restarts)
  try {
    const { db } = await import('./db');
    const row = await db.session.findUnique({ where: { token } });
    if (!row) return null;
    if (Date.now() > row.expiresAt.getTime()) {
      await db.session.delete({ where: { token } }).catch(() => {});
      return null;
    }
    const sessionData = {
      learnerId: row.learnerId!,
      createdAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
    };
    sessionCache.set(token, sessionData);
    return sessionData;
  } catch {
    return null;
  }
}

export async function endSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  sessionCache.delete(token);
  try {
    const { db } = await import('./db');
    await db.session.delete({ where: { token } }).catch(() => {});
  } catch {}
}

type TutorSession = { tutorId: string; username: string; role: 'tutor' | 'admin'; createdAt: number; expiresAt: number; };
const TUTOR_SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const tutorSessionCache = new Map<string, TutorSession>();

export async function startTutorSession(t: Omit<TutorSession, 'createdAt' | 'expiresAt'>): Promise<string> {
  const token = createSessionToken();
  const now = Date.now();
  tutorSessionCache.set(token, { ...t, createdAt: now, expiresAt: now + TUTOR_SESSION_TTL_MS });
  try {
    const { db } = await import('./db');
    await db.session.upsert({
      where: { token },
      create: { token, tutorId: t.tutorId, expiresAt: new Date(now + TUTOR_SESSION_TTL_MS) },
      update: { tutorId: t.tutorId, expiresAt: new Date(now + TUTOR_SESSION_TTL_MS) },
    });
  } catch {}
  return token;
}

export async function getTutorSession(token: string | undefined | null): Promise<TutorSession | null> {
  if (!token) return null;
  const cached = tutorSessionCache.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) { tutorSessionCache.delete(token); return null; }
    return cached;
  }
  try {
    const { db } = await import('./db');
    const row = await db.session.findUnique({ where: { token } });
    if (!row || !row.tutorId) return null;
    if (Date.now() > row.expiresAt.getTime()) {
      await db.session.delete({ where: { token } }).catch(() => {});
      return null;
    }
    // Need to fetch tutor details
    const tutor = await db.tutor.findUnique({ where: { id: row.tutorId } });
    if (!tutor) return null;
    const sessionData: TutorSession = {
      tutorId: tutor.id,
      username: tutor.username,
      role: tutor.role as 'tutor' | 'admin',
      createdAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
    };
    tutorSessionCache.set(token, sessionData);
    return sessionData;
  } catch {
    return null;
  }
}

export async function endTutorSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  tutorSessionCache.delete(token);
  try {
    const { db } = await import('./db');
    await db.session.delete({ where: { token } }).catch(() => {});
  } catch {}
}
type AttemptRecord = { fails: number; lockedUntil: number; };
const MAX_ATTEMPTS = 5;
const LOCK_MS = 1000 * 60 * 2;
const g3 = globalThis as unknown as { __sv_attempts?: Map<string, AttemptRecord> };
const attempts: Map<string, AttemptRecord> = g3.__sv_attempts ?? new Map();
if (process.env.NODE_ENV !== 'production') g3.__sv_attempts = attempts;
export function checkRateLimit(key: string): { locked: boolean; remaining: number; waitMs: number } {
  const rec = attempts.get(key);
  const now = Date.now();
  if (rec && rec.lockedUntil > now) return { locked: true, remaining: 0, waitMs: rec.lockedUntil - now };
  const fails = rec?.fails ?? 0;
  return { locked: false, remaining: Math.max(0, MAX_ATTEMPTS - fails), waitMs: 0 };
}
export function recordFailedAttempt(key: string): { locked: boolean; waitMs: number } {
  const rec = attempts.get(key) ?? { fails: 0, lockedUntil: 0 };
  rec.fails += 1;
  if (rec.fails >= MAX_ATTEMPTS) { rec.lockedUntil = Date.now() + LOCK_MS; rec.fails = 0; attempts.set(key, rec); return { locked: true, waitMs: LOCK_MS }; }
  attempts.set(key, rec);
  return { locked: false, waitMs: 0 };
}
export function clearAttempts(key: string): void { attempts.delete(key); }
export const LEARNER_COOKIE = 'sv_learner_session';
export const TUTOR_COOKIE = 'sv_tutor_session';
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}
