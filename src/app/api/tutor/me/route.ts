import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTutorSession, parseCookies, TUTOR_COOKIE } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = await getTutorSession(cookies[TUTOR_COOKIE])
    if (!session) return NextResponse.json({ tutor: null })
    const tutor = await db.tutor.findUnique({ where: { id: session.tutorId } })
    if (!tutor || !tutor.active) return NextResponse.json({ tutor: null })
    return NextResponse.json({
      tutor: {
        id: tutor.id,
        username: tutor.username,
        role: tutor.role,
      },
    })
  } catch {
    return NextResponse.json({ tutor: null })
  }
}
