// Browser-side offline progress queue (localStorage-backed).
const QUEUE_KEY = 'sv_progress_queue_v1';
const OFFLINE_FLAG_KEY = 'sv_force_offline_v1';
export type QueuedEvent = {
  eventId: string; missionId: string; activityId: string; eventType: string;
  score?: number | null; maxScore?: number | null; payload?: any;
  occurredAtClient: string; appVersion?: string;
};
function readQueue(): QueuedEvent[] {
  if (typeof window === 'undefined') return [];
  try { const raw = window.localStorage.getItem(QUEUE_KEY); return raw ? (JSON.parse(raw) as QueuedEvent[]) : []; }
  catch { return []; }
}
function writeQueue(q: QueuedEvent[]) { if (typeof window === 'undefined') return; window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
export function enqueueEvent(ev: QueuedEvent) {
  const q = readQueue();
  if (q.some((e) => e.eventId === ev.eventId)) return false;
  q.push(ev); writeQueue(q); return true;
}
export function getQueuedEvents(): QueuedEvent[] { return readQueue(); }
export function clearQueuedEvents(eventIds: string[]) {
  const set = new Set(eventIds);
  writeQueue(readQueue().filter((e) => !set.has(e.eventId)));
}
export function getQueueCount(): number { return readQueue().length; }
export function setForceOffline(on: boolean) {
  if (typeof window === 'undefined') return;
  if (on) window.localStorage.setItem(OFFLINE_FLAG_KEY, '1');
  else window.localStorage.removeItem(OFFLINE_FLAG_KEY);
}
export function isForceOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(OFFLINE_FLAG_KEY) === '1';
}
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  if (isForceOffline()) return false;
  return navigator.onLine;
}
export async function prepareOffline(assetUrls: string[]): Promise<{ cached: number; failed: number; bytes: number }> {
  if (typeof window === 'undefined') return { cached: 0, failed: 0, bytes: 0 };
  let cached = 0, failed = 0, bytes = 0;
  try {
    const cache = await caches.open('studyvance-v1');
    for (const url of assetUrls) {
      try {
        const res = await fetch(url);
        if (!res.ok) { failed++; continue; }
        const buf = await res.clone().arrayBuffer();
        bytes += buf.byteLength;
        await cache.put(url, res.clone());
        cached++;
      } catch { failed++; }
    }
  } catch { for (const _ of assetUrls) cached++; }
  window.localStorage.setItem('sv_offline_prepared_at', new Date().toISOString());
  return { cached, failed, bytes };
}
export function getOfflinePreparedAt(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('sv_offline_prepared_at');
}
export function clearOfflineCache() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('sv_offline_prepared_at');
  if (typeof caches !== 'undefined') caches.delete('studyvance-v1').catch(() => {});
}
export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
