import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../../../_guard'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const { id } = await ctx.params
    const learner = await db.learner.findUnique({
      where: { id },
      select: { id: true, learnerCode: true, nickname: true, active: true },
    })
    if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    return NextResponse.json({ learner })
  } catch (e) {
    console.error('[reprint] error', e)
    return NextResponse.json({ error: 'Could not reprint code' }, { status: 500 })
  }
}
