import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookies, LEARNER_COOKIE } from '@/lib/auth'
import { AVATARS } from '@/lib/curriculum'

export async function POST(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = getSession(cookies[LEARNER_COOKIE])
    if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const body = (await req.json().catch(() => null)) as { avatarId?: string } | null
    const avatarId = body?.avatarId
    if (!avatarId || !AVATARS.some((a) => a.id === avatarId)) {
      return NextResponse.json({ error: 'Pick one of the six avatars' }, { status: 400 })
    }

    const learner = await db.learner.update({
      where: { id: session.learnerId },
      data: { avatarId },
      select: { id: true, avatarId: true },
    })
    return NextResponse.json({ ok: true, avatarId: learner.avatarId })
  } catch (e) {
    console.error('[avatar] error', e)
    return NextResponse.json({ error: 'Could not save avatar' }, { status: 500 })
  }
}
