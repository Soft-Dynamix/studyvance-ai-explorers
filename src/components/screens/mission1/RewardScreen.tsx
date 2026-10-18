'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Trophy, ArrowRight, Sparkles, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/ui/mascot'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSIONS } from '@/lib/curriculum'

// Lightweight confetti — colored dots falling from top.
function Confetti() {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.5,
        color: ['bg-turquoise', 'bg-sunshine', 'bg-navy', 'bg-destructive'][i % 4],
        size: 6 + Math.random() * 6,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, 360], opacity: [1, 1, 0.6, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

export function RewardScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const recordedRef = React.useRef(false)
  const mission = MISSIONS.find((m) => m.id === 'm1')!

  React.useEffect(() => {
    if (recordedRef.current) return
    recordedRef.current = true
    void record({
      missionId: 'm1',
      activityId: 'reward',
      eventType: 'badge_earned',
      payload: { badge: mission.badge },
    })
  }, [record, mission.badge])

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy text-cream">
      <div className="pointer-events-none absolute inset-0 bg-stars opacity-60" aria-hidden />
      <Confetti />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-sunshine shadow-2xl"
        >
          <Trophy className="h-14 w-14 text-navy" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-4xl"
        >
          Mission 1 complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 max-w-md text-cream/80"
        >
          You earned the <strong className="text-sunshine">{mission.title}</strong> badge.
          {mission.shortOutcome}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 flex items-center gap-3"
        >
          <Mascot size={80} float={false} message="You did it!" />
          <div className="h-16 w-16 overflow-hidden rounded-full bg-turquoise/20 p-1 ring-2 ring-turquoise">
            <Image
              src={mission.badge}
              alt={`${mission.title} badge`}
              width={56}
              height={56}
              className="rounded-full"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex flex-col gap-2 sm:flex-row"
        >
          <Button variant="sunshine" size="lg" onClick={() => setScreen(nextScreenFor('m1', 'm1-reward'))}>
            <Home className="h-4 w-4" /> Back to mission map
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        <p className="mt-6 text-xs text-cream/60">
          <Sparkles className="mr-1 inline h-3 w-3" /> 5 missions left to become a true AI Explorer!
        </p>
      </div>
    </div>
  )
}
