import { NextRequest, NextResponse } from 'next/server'
import { endSession, parseCookies, LEARNER_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const token = cookies[LEARNER_COOKIE]
    endSession(token)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(LEARNER_COOKIE, '', { path: '/', maxAge: 0 })
    return res
  } catch {
    return NextResponse.json({ ok: true })
  }
}
