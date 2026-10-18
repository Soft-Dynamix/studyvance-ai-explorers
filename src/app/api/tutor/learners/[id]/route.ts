import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../../_guard'

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const { id } = await ctx.params
    const url = new URL(req.url)
    const mode = url.searchParams.get('mode') // 'deactivate' => soft delete
    if (mode === 'deactivate') {
      await db.learner.update({ where: { id }, data: { active: false } })
      return NextResponse.json({ ok: true, mode: 'deactivated' })
    }
    // Hard delete — cascades to events/state/projects/flags
    await db.learner.delete({ where: { id } })
    return NextResponse.json({ ok: true, mode: 'deleted' })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }
    console.error('[learner DELETE] error', e)
    return NextResponse.json({ error: 'Could not delete learner' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const { id } = await ctx.params
    const learner = await db.learner.findUnique({
      where: { id },
      include: {
        cohort: true,
        learnerState: true,
        _count: { select: { helpFlags: true, projects: true, progressEvents: true } },
      },
    })
    if (!learner) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      learner: {
        id: learner.id,
        learnerCode: learner.learnerCode,
        nickname: learner.nickname,
        grade: learner.grade,
        avatarId: learner.avatarId,
        active: learner.active,
        cohort: learner.cohort
          ? {
              id: learner.cohort.id,
              name: learner.cohort.name,
              gradeBand: learner.cohort.gradeBand,
            }
          : null,
        state: learner.learnerState
          ? {
              missions: JSON.parse(learner.learnerState.missionsJson || '{}'),
              badges: JSON.parse(learner.learnerState.badgesJson || '[]'),
              lastSyncAt: learner.learnerState.lastSyncAt?.toISOString() ?? null,
              contentVersion: learner.learnerState.contentVersion,
            }
          : null,
        helpFlagCount: learner._count.helpFlags,
        projectCount: learner._count.projects,
        eventCount: learner._count.progressEvents,
        createdAt: learner.createdAt.toISOString(),
      },
    })
  } catch (e) {
    console.error('[learner GET] error', e)
    return NextResponse.json({ error: 'Could not load learner' }, { status: 500 })
  }
}
