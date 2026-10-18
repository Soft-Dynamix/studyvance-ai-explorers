import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPin,
  startTutorSession,
  recordFailedAttempt,
  clearAttempts,
  checkRateLimit,
  TUTOR_COOKIE,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: string
      pin?: string
    } | null
    if (!body || !body.username || !body.pin) {
      return NextResponse.json({ error: 'Missing username or pin' }, { status: 400 })
    }
    const username = body.username.trim().toLowerCase()
    const pin = body.pin.trim()
    const rl = checkRateLimit(`tutor:${username}`)
    if (rl.locked) {
      const waitSec = Math.ceil(rl.waitMs / 1000)
      return NextResponse.json(
        { error: `Too many tries. Please wait ${waitSec}s.`, locked: true },
        { status: 429 }
      )
    }
    const tutor = await db.tutor.findUnique({ where: { username } })
    if (!tutor || !tutor.active) {
      recordFailedAttempt(`tutor:${username}`)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 404 })
    }
    if (!verifyPin(pin, tutor.pinHash, tutor.pinSalt)) {
      const r = recordFailedAttempt(`tutor:${username}`)
      if (r.locked) {
        return NextResponse.json(
          { error: 'Too many tries. Please wait 2 minutes.', locked: true },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    clearAttempts(`tutor:${username}`)
    const token = await startTutorSession({
      tutorId: tutor.id,
      username: tutor.username,
      role: tutor.role as 'tutor' | 'admin',
    })
    const res = NextResponse.json({
      tutor: { id: tutor.id, username: tutor.username, role: tutor.role },
    })
    res.cookies.set(TUTOR_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  } catch (e) {
    console.error('[tutor login] error', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
