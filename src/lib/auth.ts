// PIN + auth helpers for StudyVance AI Explorers.
// Uses SIGNED COOKIES instead of sessions — survives server restarts AND DB wipes.
import crypto from 'crypto';
import { db } from './db';

export const PIN_LENGTH = 4;
export const LEARNER_COOKIE = 'sv_learner';
export const TUTOR_COOKIE = 'sv_tutor';

// Secret for signing cookies (in production, use env var)
const SECRET = process.env.SESSION_SECRET || 'studyvance-ai-explorers-secret-2024';

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

// ─── Signed cookie tokens ───
// Format: base64(payload).hmac
// Payload contains: type, id, expires

function sign(data: string): string {
  const hmac = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return `${data}.${hmac}`;
}

function verifyAndDecode(token: string | undefined | null): any | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const data = parts.slice(0, -1).join('.');
  const sig = parts[parts.length - 1];
  const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64').toString());
    if (payload.expires && Date.now() > payload.expires) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Learner auth ───

export function startSession(learnerId: string): string {
  const payload = {
    type: 'learner',
    id: learnerId,
    expires: Date.now() + (1000 * 60 * 60 * 24 * 7), // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  return sign(data);
}

export async function getSession(token: string | undefined | null): Promise<{ learnerId: string } | null> {
  const payload = verifyAndDecode(token);
  if (!payload || payload.type !== 'learner') return null;
  // Verify the learner still exists in the DB
  try {
    const learner = await db.learner.findUnique({ where: { id: payload.id } });
    if (!learner || !learner.active) return null;
    return { learnerId: payload.id };
  } catch {
    // DB might be unavailable — still trust the cookie (better UX)
    return { learnerId: payload.id };
  }
}

export function endSession(_token: string | undefined | null): void {
  // Stateless — nothing to delete (cookie just expires)
}

// ─── Tutor auth ───

export async function startTutorSession(t: { tutorId: string; username: string; role: 'tutor' | 'admin' }): Promise<string> {
  const payload = {
    type: 'tutor',
    id: t.tutorId,
    username: t.username,
    role: t.role,
    expires: Date.now() + (1000 * 60 * 60 * 24 * 7), // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  return sign(data);
}

export async function getTutorSession(token: string | undefined | null): Promise<{ tutorId: string; username: string; role: 'tutor' | 'admin' } | null> {
  const payload = verifyAndDecode(token);
  if (!payload || payload.type !== 'tutor') return null;
  // Verify tutor still exists
  try {
    const tutor = await db.tutor.findUnique({ where: { id: payload.id } });
    if (!tutor || !tutor.active) return null;
  } catch {
    // DB might be unavailable — trust the cookie
  }
  return { tutorId: payload.id, username: payload.username, role: payload.role };
}

export function endTutorSession(_token: string | undefined | null): void {
  // Stateless — nothing to delete
}

// ─── Rate limiting (still in-memory, acceptable for this use case) ───

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

// ─── Cookie helpers ───

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
