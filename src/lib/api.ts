export async function api<T = any>(path: string, init?: RequestInit & { json?: any }): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as any) };
  let body = init?.body;
  if (init?.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(init.json); }
  const res = await fetch(path, { ...init, headers, body, credentials: 'same-origin' });
  const ct = res.headers.get('content-type') ?? '';
  let data: any = null;
  if (ct.includes('application/json')) data = await res.json().catch(() => null);
  else if (ct.includes('text/')) data = await res.text().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg) as any;
    err.status = res.status; err.data = data;
    throw err;
  }
  return data as T;
}
