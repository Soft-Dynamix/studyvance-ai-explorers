import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireTutor } from '../_guard'
import { generateRandomPin, hashPin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const tutor = await requireTutor(req)
    if (!tutor) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
    const body = (await req.json().catch(() => null)) as { learnerId?: string } | null
    if (!body || !body.learnerId) {
      return NextResponse.json({ error: 'learnerId required' }, { status: 400 })
    }
    const learner = await db.learner.findUnique({ where: { id: body.learnerId } })
    if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 })

    const pin = generateRandomPin()
    const { hash, salt } = hashPin(pin)
    await db.learner.update({
      where: { id: learner.id },
      data: { pinHash: hash, pinSalt: salt },
    })
    return NextResponse.json({
      ok: true,
      pin, // returned once
      learnerCode: learner.learnerCode,
    })
  } catch (e) {
    console.error('[pin-reset] error', e)
    return NextResponse.json({ error: 'Could not reset PIN' }, { status: 500 })
  }
}
