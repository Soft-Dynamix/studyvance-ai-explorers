import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../_guard'
import { generateLearnerCode, generateRandomPin, hashPin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

    const url = new URL(req.url)
    const cohortId = url.searchParams.get('cohortId') || undefined

    const learners = await db.learner.findMany({
      where: { ...(cohortId ? { cohortId } : {}) },
      include: {
        cohort: true,
        learnerState: true,
        _count: { select: { helpFlags: true, projects: true, progressEvents: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      learners: learners.map((l) => ({
        id: l.id,
        learnerCode: l.learnerCode,
        nickname: l.nickname,
        grade: l.grade,
        avatarId: l.avatarId,
        active: l.active,
        cohort: l.cohort
          ? { id: l.cohort.id, name: l.cohort.name, gradeBand: l.cohort.gradeBand }
          : null,
        state: l.learnerState
          ? {
              missions: JSON.parse(l.learnerState.missionsJson || '{}'),
              badges: JSON.parse(l.learnerState.badgesJson || '[]'),
              lastSyncAt: l.learnerState.lastSyncAt?.toISOString() ?? null,
              contentVersion: l.learnerState.contentVersion,
            }
          : null,
        helpFlagCount: l._count.helpFlags,
        projectCount: l._count.projects,
        eventCount: l._count.progressEvents,
        createdAt: l.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('[learners GET] error', e)
    return NextResponse.json({ error: 'Could not load learners' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const body = (await req.json().catch(() => null)) as {
      nickname?: string
      grade?: string
      cohortId?: string
      avatarId?: string
    } | null
    if (!body || !body.nickname || !body.cohortId) {
      return NextResponse.json({ error: 'nickname and cohortId required' }, { status: 400 })
    }
    const cohort = await db.cohort.findUnique({ where: { id: body.cohortId } })
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })

    const pin = generateRandomPin()
    const { hash, salt } = hashPin(pin)
    const learnerCode = generateLearnerCode()
    const learner = await db.learner.create({
      data: {
        cohortId: body.cohortId,
        learnerCode,
        nickname: body.nickname.trim(),
        grade: body.grade || cohort.gradeBand,
        avatarId: body.avatarId || 'avatar-1',
        pinHash: hash,
        pinSalt: salt,
      },
    })
    return NextResponse.json({
      learner: {
        id: learner.id,
        learnerCode: learner.learnerCode,
        nickname: learner.nickname,
        grade: learner.grade,
        avatarId: learner.avatarId,
      },
      pin, // returned once
    })
  } catch (e) {
    console.error('[learners POST] error', e)
    return NextResponse.json({ error: 'Could not create learner' }, { status: 500 })
  }
}
