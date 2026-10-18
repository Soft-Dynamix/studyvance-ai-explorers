import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPin,
  startSession,
  recordFailedAttempt,
  clearAttempts,
  checkRateLimit,
  LEARNER_COOKIE,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as
      | { learnerCode?: string; pin?: string }
      | null
    if (!body || typeof body.learnerCode !== 'string' || typeof body.pin !== 'string') {
      return NextResponse.json({ error: 'Missing learnerCode or pin' }, { status: 400 })
    }
    const learnerCode = body.learnerCode.trim().toUpperCase()
    const pin = body.pin.trim()
    if (!learnerCode || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Enter your 4-digit PIN' }, { status: 400 })
    }

    const rl = checkRateLimit(`login:${learnerCode}`)
    if (rl.locked) {
      const waitSec = Math.ceil(rl.waitMs / 1000)
      return NextResponse.json(
        { error: `Too many tries. Please wait ${waitSec}s and try again.`, locked: true },
        { status: 429 }
      )
    }

    const learner = await db.learner.findUnique({
      where: { learnerCode },
      include: { cohort: true },
    })
    if (!learner || !learner.active) {
      recordFailedAttempt(`login:${learnerCode}`)
      return NextResponse.json(
        { error: 'We could not find that code. Check and try again.' },
        { status: 404 }
      )
    }
    if (!verifyPin(pin, learner.pinHash, learner.pinSalt)) {
      const r = recordFailedAttempt(`login:${learnerCode}`)
      if (r.locked) {
        return NextResponse.json(
          { error: 'Too many tries. Please wait 2 minutes and try again.', locked: true },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: 'That PIN is not right. Try again.' }, { status: 401 })
    }

    clearAttempts(`login:${learnerCode}`)
    const token = await startSession(learner.id)

    const res = NextResponse.json({
      learner: {
        id: learner.id,
        learnerCode: learner.learnerCode,
        nickname: learner.nickname,
        grade: learner.grade,
        avatarId: learner.avatarId,
        cohort: learner.cohort
          ? {
              id: learner.cohort.id,
              name: learner.cohort.name,
              gradeBand: learner.cohort.gradeBand,
            }
          : null,
      },
    })
    res.cookies.set(LEARNER_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4,
    })
    return res
  } catch (e) {
    console.error('[login] error', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
