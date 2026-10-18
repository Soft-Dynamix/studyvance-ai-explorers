'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Lock, Trophy, ArrowRight, RefreshCw, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mascot } from '@/components/ui/mascot'
import { SyncBadge } from '@/components/ui/sync-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useApp } from '@/lib/store'
import { MISSIONS, isMissionUnlocked, type MissionId } from '@/lib/curriculum'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const COLOR_MAP: Record<string, string> = {
  navy: 'bg-navy text-cream',
  turquoise: 'bg-turquoise text-navy',
  sunshine: 'bg-sunshine text-navy',
}

function ProgressDots({ missionId }: { missionId: MissionId }) {
  const state = useApp((s) => s.state)
  const m = state?.missions?.[missionId]
  const activities = ['lesson', 'game', 'quiz', 'portfolio', 'reward'] as const
  // For m1 we have a different flow but use the same dot count
  const completed = m?.completedActivities ?? []
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {activities.map((a) => {
        const done = completed.includes(a)
        return (
          <span
            key={a}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              done ? 'bg-sunshine' : 'bg-current/30'
            )}
            title={a}
          />
        )
      })}
    </div>
  )
}

export function MissionMapScreen() {
  const learner = useApp((s) => s.learner)
  const state = useApp((s) => s.state)
  const setScreen = useApp((s) => s.setScreen)
  const setCurrentMission = useApp((s) => s.setCurrentMission)
  const setLearner = useApp((s) => s.setLearner)
  const setState = useApp((s) => s.setState)
  const [switching, setSwitching] = React.useState(false)

  const badges = state?.badges ?? []
  const missionsCompleted = Object.values(state?.missions ?? {}).filter(
    (m: any) => m?.status === 'completed'
  ).length

  const enterMission = (id: MissionId) => {
    if (!isMissionUnlocked(id, state?.missions)) {
      toast.error('Finish the previous mission to unlock this one.')
      return
    }
    if (id === 'm1') {
      // Resume m1 from the next not-yet-completed step
      const completed = state?.missions?.m1?.completedActivities ?? []
      const flow: { id: string; screen: any }[] = [
        { id: 'lesson', screen: 'm1-lesson' },
        { id: 'sort-game', screen: 'm1-sort' },
        { id: 'privacy-game', screen: 'm1-privacy' },
        { id: 'quiz', screen: 'm1-quiz' },
        { id: 'portfolio', screen: 'm1-portfolio' },
        { id: 'reward', screen: 'm1-reward' },
      ]
      const next = flow.find((f) => !completed.includes(f.id)) ?? flow[0]
      setScreen(next.screen)
    } else {
      setCurrentMission(id)
      const completed = state?.missions?.[id]?.completedActivities ?? []
      const flow: { id: string; screen: any }[] = [
        { id: 'lesson', screen: 'lesson' },
        { id: 'game', screen: 'game' },
        { id: 'quiz', screen: 'quiz' },
        { id: 'portfolio', screen: 'portfolio' },
        { id: 'reward', screen: 'reward' },
      ]
      const next = flow.find((f) => !completed.includes(f.id)) ?? flow[0]
      // m6 has no portfolio; if it's already done, skip directly to reward
      if (id === 'm6' && completed.includes('quiz') && !completed.includes('reward')) {
        setScreen('reward')
        return
      }
      setScreen(next.screen)
    }
  }

  async function switchLearner() {
    setSwitching(true)
    try {
      await api('/api/auth/logout', { method: 'POST' })
      setLearner(null)
      setState(null)
      setScreen('signin')
    } catch {
      setLearner(null)
      setState(null)
      setScreen('signin')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-adventure-grid opacity-40" aria-hidden />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Mascot size={48} float={false} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Welcome back
              </p>
              <h1 className="font-display text-2xl sm:text-3xl">
                {learner?.nickname ?? 'Explorer'} ·{' '}
                <span className="text-turquoise">{learner?.grade ?? 'Grade 5'}</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Cohort: {learner?.cohort?.name ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SyncBadge lastSyncedAt={state?.lastSyncAt} />
            <Badge variant="sunshine" className="gap-1">
              <Trophy className="h-3.5 w-3.5" /> {badges.length} badge{badges.length === 1 ? '' : 's'}
            </Badge>
            <Badge variant="turquoise">
              {missionsCompleted}/{MISSIONS.length} missions
            </Badge>
            <Button size="sm" variant="outline" onClick={switchLearner} disabled={switching}>
              <RefreshCw className={cn('h-4 w-4', switching && 'animate-spin')} />
              Switch
            </Button>
          </div>
        </header>

        {/* Map */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MISSIONS.map((m, i) => {
            const unlocked = isMissionUnlocked(m.id, state?.missions)
            const missionState = state?.missions?.[m.id]
            const completed = missionState?.status === 'completed'
            const inProgress =
              missionState?.completedActivities && missionState.completedActivities.length > 0
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={unlocked ? { scale: 1.02 } : undefined}
                whileTap={unlocked ? { scale: 0.98 } : undefined}
                disabled={!unlocked}
                onClick={() => unlocked && enterMission(m.id)}
                className={cn(
                  'group relative flex flex-col gap-3 overflow-hidden rounded-3xl p-5 text-left shadow-lg transition-all',
                  COLOR_MAP[m.color],
                  !unlocked && 'cursor-not-allowed opacity-60'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="rounded-full bg-current/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                    Mission {m.order}
                  </span>
                </div>
                <h2 className="font-display text-2xl leading-tight">{m.title}</h2>
                <p className="text-sm opacity-90">{m.hook}</p>
                <p className="mt-1 text-xs opacity-80">{m.shortOutcome}</p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold opacity-80">
                    {m.estimatedMinutes} min
                  </span>
                  {completed ? (
                    <Badge className="gap-1 bg-sunshine text-navy">
                      <Trophy className="h-3 w-3" /> Done
                    </Badge>
                  ) : inProgress ? (
                    <Badge className="bg-current/20 text-current">In progress</Badge>
                  ) : unlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      Start <ArrowRight className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>

                <ProgressDots missionId={m.id} />

                {completed && (
                  <div className="absolute right-3 top-3 h-10 w-10 overflow-hidden rounded-full bg-sunshine/30 p-1">
                    <Image
                      src={m.badge}
                      alt={`Badge for ${m.title}`}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        <footer className="mt-10 flex items-center justify-center">
          <Button variant="ghost" size="sm" onClick={() => setScreen('tutor')}>
            <GraduationCap className="h-4 w-4" /> Tutor / Admin
          </Button>
        </footer>
      </div>

      {/* Welcome dialog when first arriving with no progress */}
      <Dialog
        open={
          !!learner &&
          !state?.missions?.m1?.completedActivities?.length &&
          !sessionStorage.getItem('sv_welcomed')
        }
        onOpenChange={(o) => {
          if (!o) sessionStorage.setItem('sv_welcomed', '1')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your adventure starts here, {learner?.nickname}!</DialogTitle>
            <DialogDescription>
              There are 6 missions ahead. Each one takes about 40–50 minutes. Vance will be with
              you every step of the way.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="sunshine" onClick={() => enterMission('m1')}>
              Start Mission 1 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
