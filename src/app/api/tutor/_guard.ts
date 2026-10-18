import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getTutorSession, parseCookies, TUTOR_COOKIE } from '@/lib/auth'

export async function requireTutor(req: NextRequest) {
  const cookies = parseCookies(req.headers.get('cookie'))
  const session = getTutorSession(cookies[TUTOR_COOKIE])
  if (!session) return null
  const tutor = await db.tutor.findUnique({ where: { id: session.tutorId } })
  if (!tutor || !tutor.active) return null
  return tutor
}
