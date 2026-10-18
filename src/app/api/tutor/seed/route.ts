import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../_guard'
import { generateLearnerCode, generateRandomPin, hashPin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

    // Idempotent: ensure default cohort exists
    let cohort = await db.cohort.findFirst({ where: { name: 'Grade 5 — Pilot Class' } })
    if (!cohort) {
      cohort = await db.cohort.create({
        data: { name: 'Grade 5 — Pilot Class', gradeBand: 'Grade 5' },
      })
    }

    // Ensure sample learners (Pip, Luna) — match by nickname in cohort
    const existing = await db.learner.findMany({
      where: { cohortId: cohort.id, nickname: { in: ['Pip', 'Luna'] } },
    })
    const havePip = existing.some((l) => l.nickname === 'Pip')
    const haveLuna = existing.some((l) => l.nickname === 'Luna')

    const created: { nickname: string; learnerCode: string; pin: string }[] = []
    const toCreate = [
      { nickname: 'Pip', grade: 'Grade 5', have: havePip },
      { nickname: 'Luna', grade: 'Grade 5', have: haveLuna },
    ]
    for (const s of toCreate) {
      if (s.have) continue
      const pin = generateRandomPin()
      const { hash, salt } = hashPin(pin)
      const code = generateLearnerCode()
      await db.learner.create({
        data: {
          cohortId: cohort.id,
          learnerCode: code,
          nickname: s.nickname,
          grade: s.grade,
          avatarId: 'avatar-1',
          pinHash: hash,
          pinSalt: salt,
        },
      })
      created.push({ nickname: s.nickname, learnerCode: code, pin })
    }

    return NextResponse.json({
      ok: true,
      cohort: { id: cohort.id, name: cohort.name, gradeBand: cohort.gradeBand },
      created,
    })
  } catch (e) {
    console.error('[seed] error', e)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
