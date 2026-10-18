'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck, Hand, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { PRIVACY_PROMPTS, type PrivacyItem } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ---------------- Confetti ---------------- */
function SparkleBurst({ show }: { show: boolean }) {
  const sparks = React.useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: 50 + (Math.random() * 40 - 20),
        y: 50 + (Math.random() * 40 - 20),
        size: 8 + Math.random() * 8,
        delay: Math.random() * 0.4,
      })),
    [],
  )
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: `${s.x}%`, y: `${s.y}%` }}
          transition={{ duration: 1, delay: s.delay }}
          className="absolute left-1/2 top-1/2 text-sunshine"
          style={{ fontSize: s.size }}
        >
          ✨
        </motion.span>
      ))}
    </div>
  )
}

/* ---------------- Chat bubble item ---------------- */
function PrivacyChip({
  item,
  index,
  onPick,
  picked,
  shake,
}: {
  item: PrivacyItem
  index: number
  onPick: (id: string) => void
  picked: boolean
  shake: boolean
}) {
  const isPersonal = item.isPersonal
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -16, scale: 0.85 }}
      animate={
        shake
          ? { x: [0, -6, 6, -4, 4, 0], opacity: 1, y: 0, scale: 1 }
          : picked && isPersonal
            ? { opacity: 0.45, y: 0, scale: 0.95 }
            : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 16 }}
      whileHover={!picked ? { scale: 1.04 } : undefined}
      whileTap={!picked ? { scale: 0.96 } : undefined}
      onClick={() => onPick(item.id)}
      className={cn(
        'relative rounded-2xl border-2 px-3 py-2 text-left text-sm font-medium transition-all',
        !picked && isPersonal && 'border-destructive/50 bg-destructive/5',
        !picked && !isPersonal && 'border-border bg-card',
        picked && isPersonal && 'border-destructive bg-destructive/10 line-through',
        picked && !isPersonal && 'border-turquoise bg-turquoise/10',
      )}
    >
      {/* pulsing red glow on personal items not yet picked */}
      {!picked && isPersonal && (
        <motion.span
          className="absolute inset-0 -z-10 rounded-2xl"
          style={{ boxShadow: '0 0 0px 0px rgba(229,72,77,0.6)' }}
          animate={{ boxShadow: ['0 0 0px 0px rgba(229,72,77,0.6)', '0 0 12px 3px rgba(229,72,77,0.0)'] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}

      <span className="mr-1.5" aria-hidden>
        {isPersonal ? '🔓' : '✅'}
      </span>
      {item.text}

      {/* Picked personal → big red X stamp */}
      <AnimatePresence>
        {picked && isPersonal && (
          <motion.span
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: -12 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 14 }}
            className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-white shadow-lg"
          >
            <X className="h-5 w-5" strokeWidth={3} />
          </motion.span>
        )}
        {picked && !isPersonal && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-turquoise text-cream shadow"
          >
            <Check className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ---------------- Danger meter ---------------- */
function DangerMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-navy">
        <span>🚨 Danger Meter</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sunshine via-orange-400 to-destructive"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        />
        {pct >= 100 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white"
          >
            ALL CLEAR ✨
          </motion.span>
        )}
      </div>
    </div>
  )
}

/* ---------------- Main screen ---------------- */
export function PrivacyGameScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const prompt = PRIVACY_PROMPTS[0]

  const [picked, setPicked] = React.useState<Set<string>>(new Set())
  const [shake, setShake] = React.useState<string | null>(null)
  const [showSafe, setShowSafe] = React.useState(false)
  const recordedRef = React.useRef(false)

  const personalItems = prompt.items.filter((i) => i.isPersonal)
  const totalPersonal = personalItems.length
  const pickedPersonal = Array.from(picked).filter((id) =>
    personalItems.some((p) => p.id === id),
  ).length

  const meterValue = (pickedPersonal / totalPersonal) * 100
  const allFound = pickedPersonal === totalPersonal

  const pick = (id: string) => {
    const item = prompt.items.find((i) => i.id === id)
    if (!item) return
    if (item.isPersonal) {
      if (picked.has(id)) return
      setPicked((p) => new Set(p).add(id))
      toast.success('Safe! ' + item.reason, { duration: 2400 })
      if (!allFound && pickedPersonal + 1 === totalPersonal) {
        setTimeout(() => setShowSafe(true), 600)
      }
    } else {
      // Safe item — shake it, let them know it's OK to keep
      setShake(id)
      toast('This one is safe to keep! ✅', { duration: 2000 })
      setTimeout(() => setShake(null), 600)
    }
  }

  const next = () => {
    if (recordedRef.current) return
    recordedRef.current = true
    void record({
      missionId: 'm1',
      activityId: 'privacy-game',
      eventType: 'completed',
      payload: { picked: Array.from(picked) },
    })
    setScreen(nextScreenFor('m1', 'm1-privacy'))
  }

  return (
    <div className="min-h-screen bg-cream bg-adventure-grid">
      <MissionHeader missionId="m1" step="Privacy: spot the danger" />
      <div className="relative mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <SparkleBurst show={showSafe} />

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl bg-sunshine/20 p-4 text-sm text-navy"
        >
          <p className="font-display">Spot the danger! 🔍</p>
          <p className="mt-1 text-xs">
            Tap each piece of <strong>private information</strong> to remove it. Items glowing red are dangerous.
            Fictional names are <strong>safe</strong> — keep them!
          </p>
        </motion.div>

        {/* Chat bubble unsafe prompt */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative rounded-3xl border-2 border-destructive/30 bg-card p-4 shadow-md"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/15 text-lg">
              ⚠️
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-destructive">
              Unsafe prompt
            </p>
          </div>
          <p className="text-base font-medium text-navy">{prompt.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{prompt.unsafePrompt}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {prompt.items.map((it, i) => (
              <PrivacyChip
                key={it.id}
                item={it}
                index={i}
                onPick={pick}
                picked={picked.has(it.id)}
                shake={shake === it.id}
              />
            ))}
          </div>

          {/* Removed reasons list */}
          <AnimatePresence>
            {picked.size > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-1.5"
              >
                {Array.from(picked).map((id) => {
                  const it = prompt.items.find((i) => i.id === id)
                  if (!it) return null
                  return (
                    <motion.li
                      key={id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'rounded-xl px-3 py-1.5 text-xs',
                        it.isPersonal ? 'bg-turquoise/10 text-navy' : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {it.isPersonal ? (
                        <Check className="mr-1 inline h-3 w-3" />
                      ) : (
                        <Hand className="mr-1 inline h-3 w-3" />
                      )}
                      <strong>{it.text}</strong> — {it.reason}
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Danger meter */}
        <div className="mt-5">
          <DangerMeter value={meterValue} />
        </div>

        {/* Safe version */}
        <AnimatePresence>
          {showSafe && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className="relative mt-5 overflow-hidden rounded-3xl border-2 border-turquoise bg-turquoise/5 p-4"
            >
              <motion.span
                className="absolute right-3 top-3 text-xl"
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-turquoise">
                <ShieldCheck className="h-4 w-4" /> Safe version unlocked!
              </p>
              <p className="text-sm text-navy">{prompt.safeVersion}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={allFound ? 'sunshine' : 'secondary'}>
            {allFound ? '✨ All found!' : `${pickedPersonal}/${totalPersonal} removed`}
          </Badge>
          {!showSafe ? (
            <Button variant="sunshine" onClick={() => setShowSafe(true)} disabled={!allFound}>
              <Sparkles className="h-4 w-4" /> Reveal safe version
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
