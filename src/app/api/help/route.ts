import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookies, LEARNER_COOKIE } from '@/lib/auth'

const VALID_CATEGORIES = new Set(['stuck', 'tech', 'scared', 'other'])

export async function POST(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = getSession(cookies[LEARNER_COOKIE])
    if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const body = (await req.json().catch(() => null)) as {
      missionId?: string
      category?: string
      note?: string
    } | null
    if (!body || !body.missionId || !body.category) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.has(body.category)) {
      return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
    }
    const note = (body.note ?? '').trim().slice(0, 500)

    const flag = await db.tutorHelpFlag.create({
      data: {
        learnerId: session.learnerId,
        missionId: body.missionId,
        category: body.category,
        note: note || null,
      },
    })
    return NextResponse.json({ ok: true, id: flag.id })
  } catch (e) {
    console.error('[help] error', e)
    return NextResponse.json({ error: 'Could not send help flag' }, { status: 500 })
  }
}
