import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookies, LEARNER_COOKIE } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = await getSession(cookies[LEARNER_COOKIE])
    if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const url = new URL(req.url)
    const missionId = url.searchParams.get('missionId')

    const project = await db.learnerProject.findFirst({
      where: {
        learnerId: session.learnerId,
        ...(missionId ? { missionId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ project })
  } catch (e) {
    console.error('[portfolio GET] error', e)
    return NextResponse.json({ error: 'Could not load portfolio' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = await getSession(cookies[LEARNER_COOKIE])
    if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const body = (await req.json().catch(() => null)) as {
      missionId?: string
      storyText?: string
      drawingData?: string | null
      assistanceNote?: string | null
    } | null
    if (!body || !body.missionId || typeof body.storyText !== 'string') {
      return NextResponse.json({ error: 'Mission and story are required' }, { status: 400 })
    }
    const learnerId = session.learnerId
    const missionId = body.missionId
    const storyText = body.storyText.trim()
    if (storyText.length === 0) {
      return NextResponse.json({ error: 'Write your story first' }, { status: 400 })
    }

    const existing = await db.learnerProject.findFirst({
      where: { learnerId, missionId },
      orderBy: { updatedAt: 'desc' },
    })

    let project
    if (existing) {
      project = await db.learnerProject.update({
        where: { id: existing.id },
        data: {
          storyText,
          drawingData: body.drawingData ?? null,
          assistanceNote: body.assistanceNote ?? 'own_first_draft',
          version: { increment: 1 },
        },
      })
    } else {
      project = await db.learnerProject.create({
        data: {
          learnerId,
          missionId,
          storyText,
          drawingData: body.drawingData ?? null,
          assistanceNote: body.assistanceNote ?? 'own_first_draft',
        },
      })
    }
    return NextResponse.json({ ok: true, project })
  } catch (e) {
    console.error('[portfolio POST] error', e)
    return NextResponse.json({ error: 'Could not save portfolio' }, { status: 500 })
  }
}
