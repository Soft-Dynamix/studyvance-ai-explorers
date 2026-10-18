'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck, Hand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { PRIVACY_PROMPTS } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PrivacyGameScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const prompt = PRIVACY_PROMPTS[0]
  const [removed, setRemoved] = React.useState<Set<string>>(new Set())
  const [showSafe, setShowSafe] = React.useState(false)

  const personalItems = prompt.items.filter((i) => i.isPersonal)
  const totalPersonal = personalItems.length
  const removedPersonalCount = Array.from(removed).filter((id) =>
    personalItems.some((p) => p.id === id)
  ).length
  const removedSafeWrongly = Array.from(removed).filter((id) =>
    prompt.items.some((p) => p.id === id && !p.isPersonal)
  )

  const allRemoved = removedPersonalCount === totalPersonal && removedSafeWrongly.length === 0

  const toggleItem = (id: string) => {
    setRemoved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const finish = () => {
    setShowSafe(true)
    toast.success('Nice work — your prompt is now safe!')
  }

  const next = () => {
    void record({
      missionId: 'm1',
      activityId: 'privacy-game',
      eventType: 'completed',
      payload: { removed: Array.from(removed) },
    })
    setScreen(nextScreenFor('m1', 'm1-privacy'))
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m1" step="Privacy game" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-sunshine/20 p-4">
          <p className="text-sm font-semibold text-navy">Tap each piece of <strong>private information</strong> to remove it from the prompt.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fictional names and made-up places are <strong>safe</strong> — keep them!
          </p>
        </div>

        {/* The unsafe prompt */}
        <div className="rounded-2xl border-2 border-destructive/30 bg-card p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-destructive">
            ⚠ Unsafe prompt
          </p>
          <p className="text-base font-medium text-navy">{prompt.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{prompt.unsafePrompt}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {prompt.items.map((it) => {
              const isRemoved = removed.has(it.id)
              return (
                <motion.button
                  key={it.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleItem(it.id)}
                  className={cn(
                    'rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all',
                    isRemoved
                      ? 'border-destructive bg-destructive text-white line-through opacity-60'
                      : 'border-border bg-card hover:border-turquoise'
                  )}
                  aria-pressed={isRemoved}
                >
                  {it.text}
                </motion.button>
              )
            })}
          </div>

          {/* Reasons for removed items */}
          <AnimatePresence>
            {removed.size > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-1.5"
              >
                {Array.from(removed).map((id) => {
                  const it = prompt.items.find((i) => i.id === id)
                  if (!it) return null
                  return (
                    <li
                      key={id}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs',
                        it.isPersonal ? 'bg-turquoise/10 text-navy' : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {it.isPersonal ? <Check className="mr-1 inline h-3 w-3" /> : <Hand className="mr-1 inline h-3 w-3" />}
                      <strong>{it.text}</strong> — {it.reason}
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Safe version preview */}
        {showSafe && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl border-2 border-turquoise bg-turquoise/5 p-4"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-turquoise">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Safe version
            </p>
            <p className="text-sm text-navy">{prompt.safeVersion}</p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={allRemoved ? 'sunshine' : 'secondary'}>
            {removedPersonalCount}/{totalPersonal} removed
          </Badge>
          {!showSafe ? (
            <Button variant="sunshine" onClick={finish} disabled={!allRemoved}>
              Reveal safe version
            </Button>
          ) : (
            <Button variant="navy" onClick={next}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
