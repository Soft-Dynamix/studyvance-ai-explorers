import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../../../_guard'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const { id } = await ctx.params
    const updated = await db.tutorHelpFlag.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedBy: tutor.username },
    })
    return NextResponse.json({ ok: true, resolvedAt: updated.resolvedAt?.toISOString() })
  } catch (e) {
    console.error('[help-flag resolve] error', e)
    return NextResponse.json({ error: 'Could not resolve flag' }, { status: 500 })
  }
}
