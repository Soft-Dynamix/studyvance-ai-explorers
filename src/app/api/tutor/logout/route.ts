import { NextRequest, NextResponse } from 'next/server'
import { endTutorSession, parseCookies, TUTOR_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const cookies = parseCookies(req.headers.get('cookie'))
  endTutorSession(cookies[TUTOR_COOKIE])
  const res = NextResponse.json({ ok: true })
  res.cookies.set(TUTOR_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
