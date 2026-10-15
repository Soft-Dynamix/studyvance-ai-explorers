import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../../../_guard'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const { id } = await ctx.params
    const projects = await db.learnerProject.findMany({
      where: { learnerId: id },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        missionId: p.missionId,
        version: p.version,
        storyText: p.storyText,
        drawingData: p.drawingData,
        assistanceNote: p.assistanceNote,
        updatedAt: p.updatedAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('[projects GET] error', e)
    return NextResponse.json({ error: 'Could not load projects' }, { status: 500 })
  }
}
