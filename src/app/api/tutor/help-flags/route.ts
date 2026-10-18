import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../_guard'

export async function GET(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

    const url = new URL(req.url)
    const resolved = url.searchParams.get('resolved') === '1'

    const flags = await db.tutorHelpFlag.findMany({
      where: resolved ? {} : { resolvedAt: null },
      include: { learner: { include: { cohort: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      flags: flags.map((f) => ({
        id: f.id,
        learnerId: f.learnerId,
        missionId: f.missionId,
        category: f.category,
        note: f.note,
        createdAt: f.createdAt.toISOString(),
        resolvedAt: f.resolvedAt?.toISOString() ?? null,
        resolvedBy: f.resolvedBy ?? null,
        learner: f.learner
          ? {
              id: f.learner.id,
              nickname: f.learner.nickname,
              learnerCode: f.learner.learnerCode,
              cohort: f.learner.cohort?.name ?? '',
            }
          : null,
      })),
    })
  } catch (e) {
    console.error('[help-flags GET] error', e)
    return NextResponse.json({ error: 'Could not load help flags' }, { status: 500 })
  }
}
