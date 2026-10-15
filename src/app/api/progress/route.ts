import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, parseCookies, LEARNER_COOKIE } from '@/lib/auth'

type IncomingEvent = {
  eventId: string
  missionId: string
  activityId: string
  eventType: string
  score?: number | null
  maxScore?: number | null
  payload?: any
  occurredAtClient: string
  appVersion?: string
}

type MissionState = {
  status: 'in_progress' | 'completed'
  completedActivities?: string[]
  bestQuiz?: { score: number; max: number } | null
  latestQuiz?: { score: number; max: number; ratio: number } | null
  updatedAt?: string
}

type MissionsMap = Record<string, MissionState>

function recompute(events: IncomingEvent[]): {
  missions: MissionsMap
  badges: string[]
} {
  // Sort by client time so replay is deterministic
  const sorted = [...events].sort((a, b) => {
    const ta = Date.parse(a.occurredAtClient || '')
    const tb = Date.parse(b.occurredAtClient || '')
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return ta - tb
  })

  const missions: MissionsMap = {}
  const badges = new Set<string>()

  for (const ev of sorted) {
    const m = missions[ev.missionId] ?? {
      status: 'in_progress' as const,
      completedActivities: [] as string[],
      bestQuiz: null,
      latestQuiz: null,
    }
    m.completedActivities = m.completedActivities ?? []

    if (ev.eventType === 'completed') {
      if (!m.completedActivities.includes(ev.activityId)) {
        m.completedActivities.push(ev.activityId)
      }
    } else if (ev.eventType === 'quiz_attempt') {
      const score = ev.score ?? 0
      const max = ev.maxScore ?? 0
      const ratio = max > 0 ? score / max : 0
      m.latestQuiz = { score, max, ratio }
      if (!m.bestQuiz || score > m.bestQuiz.score) {
        m.bestQuiz = { score, max }
      }
      if (ratio >= 0.8 && !m.completedActivities.includes('quiz')) {
        m.completedActivities.push('quiz')
      }
    } else if (ev.eventType === 'badge_earned') {
      if (!badges.has(ev.missionId)) badges.add(ev.missionId)
      m.status = 'completed'
      if (!m.completedActivities.includes(ev.activityId)) {
        m.completedActivities.push(ev.activityId)
      }
    }
    m.updatedAt = new Date().toISOString()
    missions[ev.missionId] = m
  }

  return { missions, badges: Array.from(badges) }
}

export async function POST(req: NextRequest) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'))
    const session = getSession(cookies[LEARNER_COOKIE])
    if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const body = (await req.json().catch(() => null)) as { events?: IncomingEvent[] } | null
    const events = body?.events
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    const learnerId = session.learnerId
    const accepted: string[] = []
    const skipped: string[] = []

    // Insert one-by-one; eventId UNIQUE will throw on duplicates
    for (const ev of events) {
      if (
        !ev ||
        typeof ev.eventId !== 'string' ||
        typeof ev.missionId !== 'string' ||
        typeof ev.activityId !== 'string' ||
        typeof ev.eventType !== 'string'
      ) {
        skipped.push(ev?.eventId ?? 'unknown')
        continue
      }
      try {
        await db.progressEvent.create({
          data: {
            eventId: ev.eventId,
            learnerId,
            missionId: ev.missionId,
            activityId: ev.activityId,
            eventType: ev.eventType,
            score: ev.score ?? null,
            maxScore: ev.maxScore ?? null,
            payloadJson: JSON.stringify(ev.payload ?? {}),
            occurredAtClient: new Date(ev.occurredAtClient || Date.now()),
            appVersion: ev.appVersion || '1.0.0',
          },
        })
        accepted.push(ev.eventId)
      } catch (e: any) {
        if (e?.code === 'P2002') {
          // Unique constraint — already processed
          skipped.push(ev.eventId)
        } else {
          throw e
        }
      }
    }

    // Recompute state from all events for this learner
    const allEvents = await db.progressEvent.findMany({
      where: { learnerId },
      orderBy: { occurredAtClient: 'asc' },
    })
    const mapped: IncomingEvent[] = allEvents.map((e) => ({
      eventId: e.eventId,
      missionId: e.missionId,
      activityId: e.activityId,
      eventType: e.eventType,
      score: e.score,
      maxScore: e.maxScore,
      payload: JSON.parse(e.payloadJson || '{}'),
      occurredAtClient: e.occurredAtClient.toISOString(),
      appVersion: e.appVersion,
    }))
    const { missions, badges } = recompute(mapped)

    const now = new Date()
    await db.learnerState.upsert({
      where: { learnerId },
      create: {
        learnerId,
        missionsJson: JSON.stringify(missions),
        badgesJson: JSON.stringify(badges),
        lastSyncAt: now,
        contentVersion: '1.0.0',
      },
      update: {
        missionsJson: JSON.stringify(missions),
        badgesJson: JSON.stringify(badges),
        lastSyncAt: now,
      },
    })

    return NextResponse.json({
      ok: true,
      accepted: accepted.length,
      skipped: skipped.length,
      syncedAt: now.toISOString(),
      state: { missions, badges, lastSyncAt: now.toISOString(), contentVersion: '1.0.0' },
    })
  } catch (e) {
    console.error('[progress] error', e)
    return NextResponse.json({ error: 'Could not save progress' }, { status: 500 })
  }
}
