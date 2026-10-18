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

/**
 * Records a learner progress activity exactly once per (activityId, eventType)
 * for the lifetime of this hook instance. If offline, the event is queued in
 * localStorage; the queue is flushed automatically when connectivity returns.
 */
export function useProgressRecorder(): RecordFn {
  const learner = useApp((s) => s.learner)
  const recordedRef = React.useRef<Set<string>>(new Set())
  const learnerIdRef = React.useRef<string | null>(null)

  // Reset the recorded guard if the learner changes
  React.useEffect(() => {
    if (learner?.id !== learnerIdRef.current) {
      learnerIdRef.current = learner?.id ?? null
      recordedRef.current = new Set()
    }
  }, [learner?.id])

  // Flush the queue whenever we come back online
  React.useEffect(() => {
    const flush = async () => {
      if (!checkIsOnline()) return
      const queued = getQueuedEvents()
      if (queued.length === 0) return
      try {
        const res = await api<{ accepted?: number }>('/api/progress', {
          method: 'POST',
          json: { events: queued },
        })
        if (res.accepted !== undefined) {
          clearQueuedEvents(queued.map((e) => e.eventId))
          useApp.getState().refreshQueueCount()
        }
      } catch {
        // Keep the queue; will retry later
      }
    }
    flush()
    const onOnline = () => flush()
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline)
      return () => window.removeEventListener('online', onOnline)
    }
  }, [])

  return React.useCallback<RecordFn>(
    async (input) => {
      // Don't block on learner — still queue the event even if learner is null
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

      enqueueEvent(event)
      useApp.getState().refreshQueueCount()

      if (checkIsOnline()) {
        try {
          const res = await api<{ accepted?: number; skipped?: number; state?: any }>(
            '/api/progress',
            { method: 'POST', json: { events: [event] } }
          )
          clearQueuedEvents([event.eventId])
          useApp.getState().refreshQueueCount()
          if (res.state) {
            useApp.getState().setState(res.state)
          }
        } catch (err: any) {
          // If 401 (not signed in), clear this event — it can't be synced
          if (err?.status === 401 || err?.message?.includes('Not signed in')) {
            clearQueuedEvents([event.eventId])
            useApp.getState().refreshQueueCount()
            toast.error('Please sign in again to save your progress.')
          }
          // Otherwise keep in queue for retry
        }
      } else {
        toast.info('Saved offline. Will sync when you are connected.')
      }
    },
    [learner]
  )
}
