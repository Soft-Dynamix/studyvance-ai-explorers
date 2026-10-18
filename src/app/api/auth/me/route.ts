import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookies, LEARNER_COOKIE } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = getSession(cookies[LEARNER_COOKIE])
    if (!session) return NextResponse.json({ learner: null })

    const learner = await db.learner.findUnique({
      where: { id: session.learnerId },
      include: { cohort: true, learnerState: true },
    })
    if (!learner || !learner.active) {
      return NextResponse.json({ learner: null })
    }

    const state = learner.learnerState
      ? {
          missions: JSON.parse(learner.learnerState.missionsJson || '{}'),
          badges: JSON.parse(learner.learnerState.badgesJson || '[]'),
          lastSyncAt: learner.learnerState.lastSyncAt?.toISOString() ?? null,
          contentVersion: learner.learnerState.contentVersion,
        }
      : { missions: {}, badges: [], lastSyncAt: null, contentVersion: '1.0.0' }

    return NextResponse.json({
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
      state,
    })
  } catch (e) {
    console.error('[me] error', e)
    return NextResponse.json({ learner: null })
  }
}
