import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateLearnerCode,
  generateRandomPin,
  hashPin,
} from '@/lib/auth'

export async function POST() {
  try {
    // Idempotent — if a default tutor already exists, we are configured
    const existingTutor = await db.tutor.findUnique({ where: { username: 'tutor' } })
    if (existingTutor) {
      return NextResponse.json({ alreadyConfigured: true })
    }

    // Default cohort
    let cohort = await db.cohort.findFirst({ where: { name: 'Grade 5 — Pilot Class' } })
    if (!cohort) {
      cohort = await db.cohort.create({
        data: { name: 'Grade 5 — Pilot Class', gradeBand: 'Grade 5' },
      })
    }

    // Default tutor with random PIN
    const tutorPin = generateRandomPin()
    const { hash: tutorHash, salt: tutorSalt } = hashPin(tutorPin)
    const tutor = await db.tutor.create({
      data: { username: 'tutor', pinHash: tutorHash, pinSalt: tutorSalt, role: 'admin' },
    })

    // Two sample learners
    const samples = [
      { nickname: 'Pip', grade: 'Grade 5' },
      { nickname: 'Luna', grade: 'Grade 5' },
    ]
    const learners = []
    for (const s of samples) {
      const pin = generateRandomPin()
      const { hash, salt } = hashPin(pin)
      const code = generateLearnerCode()
      const _learner = await db.learner.create({
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
      learners.push({ nickname: s.nickname, learnerCode: code, pin })
    }

    return NextResponse.json({
      ok: true,
      tutor: { username: tutor.username, pin: tutorPin },
      cohort: { id: cohort.id, name: cohort.name, gradeBand: cohort.gradeBand },
      learners,
    })
  } catch (e) {
    console.error('[setup] error', e)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}
