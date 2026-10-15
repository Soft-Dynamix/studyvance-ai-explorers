import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../_guard'

export async function GET(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const cohorts = await db.cohort.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { learners: true } } },
    })
    return NextResponse.json({
      cohorts: cohorts.map((c) => ({
        id: c.id,
        name: c.name,
        gradeBand: c.gradeBand,
        active: c.active,
        learnerCount: c._count.learners,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('[cohorts GET] error', e)
    return NextResponse.json({ error: 'Could not load cohorts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const body = (await req.json().catch(() => null)) as {
      name?: string
      gradeBand?: string
    } | null
    if (!body || !body.name || !body.gradeBand) {
      return NextResponse.json({ error: 'Name and gradeBand required' }, { status: 400 })
    }
    const cohort = await db.cohort.create({
      data: { name: body.name.trim(), gradeBand: body.gradeBand.trim() },
    })
    return NextResponse.json({ cohort })
  } catch (e) {
    console.error('[cohorts POST] error', e)
    return NextResponse.json({ error: 'Could not create cohort' }, { status: 500 })
  }
}
