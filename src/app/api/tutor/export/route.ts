import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../_guard'

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

    const url = new URL(req.url)
    const cohortId = url.searchParams.get('cohortId') || undefined

    const learners = await db.learner.findMany({
      where: { ...(cohortId ? { cohortId } : {}) },
      include: { cohort: true, learnerState: true },
      orderBy: { createdAt: 'asc' },
    })

    const header = [
      'learnerCode',
      'nickname',
      'grade',
      'cohort',
      'active',
      'missionsCompleted',
      'badges',
      'lastSyncAt',
      'createdAt',
    ]
    const rows: string[] = [header.join(',')]

    for (const l of learners) {
      const missions = l.learnerState
        ? (JSON.parse(l.learnerState.missionsJson || '{}') as Record<string, any>)
        : {}
      const badges = l.learnerState
        ? (JSON.parse(l.learnerState.badgesJson || '[]') as string[])
        : []
      const missionsCompleted = Object.values(missions).filter(
        (m: any) => m?.status === 'completed'
      ).length
      rows.push(
        [
          l.learnerCode,
          l.nickname,
          l.grade,
          l.cohort?.name ?? '',
          l.active ? 'yes' : 'no',
          missionsCompleted,
          badges.join('|'),
          l.learnerState?.lastSyncAt?.toISOString() ?? '',
          l.createdAt.toISOString(),
        ]
          .map(csvEscape)
          .join(',')
      )
    }

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="studyvance-learners.csv"',
      },
    })
  } catch (e) {
    console.error('[export] error', e)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
