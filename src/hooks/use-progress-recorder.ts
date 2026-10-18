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
 *
 * If the session has expired (401), the user is silently redirected to sign-in.
 * The event is saved locally so it can be synced after re-login.
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
        const res = await api<{ accepted?: string[]; skipped?: string[]; state?: any }>(
          '/api/progress',
          { method: 'POST', json: { events: queued } }
        )
        if (res?.accepted) clearQueuedEvents(res.accepted)
        if (res?.skipped) clearQueuedEvents(res.skipped)
        useApp.getState().refreshQueueCount()
        if (res?.state) useApp.getState().setState(res.state)
      } catch (err: any) {
        // If 401, don't clear — keep for after re-login
        if (err?.status === 401 || err?.message?.includes('Not signed in')) {
          // Keep events in queue, but redirect to sign-in
          useApp.getState().setScreen('signin')
          toast.info('Your session expired. Please sign in again.')
        }
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

      // Always enqueue the event (saved locally)
      enqueueEvent(event)
      useApp.getState().refreshQueueCount()

      if (checkIsOnline()) {
        try {
          const res = await api<{ accepted?: string[]; skipped?: string[]; state?: any }>(
            '/api/progress',
            { method: 'POST', json: { events: [event] } }
          )
          // Success — clear from queue
          clearQueuedEvents([event.eventId])
          useApp.getState().refreshQueueCount()
          if (res?.state) {
            useApp.getState().setState(res.state)
          }
        } catch (err: any) {
          if (err?.status === 401 || err?.message?.includes('Not signed in')) {
            // Session expired — KEEP the event in the queue for after re-login
            // Redirect to sign-in so user can re-login and continue
            useApp.getState().setScreen('signin')
            toast.info('Your session expired. Please sign in again — your progress will be saved.')
          }
          // For other errors, keep in queue for retry (no toast)
        }
      } else {
        toast.info('Saved offline. Will sync when you are connected.')
      }
    },
    [learner]
  )
}
