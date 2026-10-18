'use client'
import * as React from 'react'
import { toast } from 'sonner'
import { useApp } from '@/lib/store'
import {
  enqueueEvent,
  getQueuedEvents,
  clearQueuedEvents,
  newEventId,
  isOnline as checkIsOnline,
} from '@/lib/offline'
import { api } from '@/lib/api'

type RecordInput = {
  missionId: string
  activityId: string
  eventType: 'completed' | 'quiz_attempt' | 'badge_earned'
  score?: number | null
  maxScore?: number | null
  payload?: any
}

type RecordFn = (input: RecordInput) => Promise<void>

export function useProgressRecorder(): RecordFn {
  const learner = useApp((s) => s.learner)
  const recordedRef = React.useRef<Set<string>>(new Set())
  const learnerIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (learner?.id !== learnerIdRef.current) {
      learnerIdRef.current = learner?.id ?? null
      recordedRef.current = new Set()
    }
  }, [learner?.id])

  // Auto-sync queued events periodically
  React.useEffect(() => {
    const sync = async () => {
      if (!checkIsOnline()) return
      const queued = getQueuedEvents()
      if (queued.length === 0) return
      try {
        const res = await api<{ accepted?: string[]; skipped?: string[]; state?: any }>(
          '/api/progress',
          { method: 'POST', json: { events: queued } }
        )
        if (res?.accepted) clearQueuedEvents(res.accepted)
        if (res?.skipped) clearQueuedEvents(res.skipped)
        useApp.getState().refreshQueueCount()
        if (res?.state) useApp.getState().setState(res.state)
      } catch {
        // Keep in queue, will retry
      }
    }
    // Sync on mount
    sync()
    // Sync every 30 seconds
    const interval = setInterval(sync, 30000)
    return () => clearInterval(interval)
  }, [])

  return React.useCallback<RecordFn>(
    async (input) => {
      const learnerId = learner?.id ?? 'unknown'
      const key = `${learnerId}:${input.missionId}:${input.activityId}:${input.eventType}`
      if (recordedRef.current.has(key)) return
      recordedRef.current.add(key)

      const event = {
        eventId: newEventId(),
        missionId: input.missionId,
        activityId: input.activityId,
        eventType: input.eventType,
        score: input.score ?? null,
        maxScore: input.maxScore ?? null,
        payload: input.payload ?? null,
        occurredAtClient: new Date().toISOString(),
        appVersion: '1.0.0',
      }

      // Always save locally first
      enqueueEvent(event)
      useApp.getState().refreshQueueCount()

      // Try to sync immediately
      if (checkIsOnline()) {
        try {
          const res = await api<{ accepted?: string[]; skipped?: string[]; state?: any }>(
            '/api/progress',
            { method: 'POST', json: { events: [event] } }
          )
          clearQueuedEvents([event.eventId])
          useApp.getState().refreshQueueCount()
          if (res?.state) useApp.getState().setState(res.state)
        } catch {
          // Keep in queue — will auto-retry every 30 seconds
          // Do NOT redirect to sign-in or show error
          // The user can keep playing
        }
      }
    },
    [learner]
  )
}
