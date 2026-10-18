'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BookOpen, Star, Stamp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION3_MOON_FACTS, MISSION3_CLAIMS, type ClaimCheck } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const OPTIONS: { id: ClaimCheck['answer']; label: string; emoji: string; color: string }[] = [
  { id: 'supported', label: 'Supported', emoji: '✅', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { id: 'contradicted', label: 'Contradicted', emoji: '❌', color: 'bg-destructive hover:bg-destructive/90' },
  { id: 'not-enough', label: 'Not enough info', emoji: '❓', color: 'bg-sunshine hover:brightness-95 text-navy' },
]

/* Stamp overlay for correct answer */
function ApprovedStamp({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ scale: 3, rotate: -25, opacity: 0 }}
      animate={{ scale: 1, rotate: -12, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 12 }}
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
    >
      <div className="rotate-[-12deg] rounded-xl border-4 border-turquoise bg-turquoise/10 px-4 py-2 text-center shadow-lg">
        <Stamp className="mx-auto h-6 w-6 text-turquoise" />
        <p className="font-display text-lg tracking-wider text-turquoise">DETECTIVE APPROVED</p>
      </div>
    </motion.div>
  )
}

function StarsRow({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.14, type: 'spring', stiffness: 240 }}
        >
          <Star className={cn('h-7 w-7', i < count ? 'fill-sunshine text-sunshine' : 'text-muted-foreground/30')} />
        </motion.span>
      ))}
    </div>
  )
}

export function ClaimCheckGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, ClaimCheck['answer']>>({})
  const [wrongAttempt, setWrongAttempt] = React.useState<ClaimCheck['answer'] | null>(null)
  const [approved, setApproved] = React.useState(false)
  const [wrongCount, setWrongCount] = React.useState(0)
  const [highlightFact, setHighlightFact] = React.useState<string | null>(null)
  const [cursor, setCursor] = React.useState({ x: -100, y: -100 })
  const [cursorVisible, setCursorVisible] = React.useState(false)
  const recordedRef = React.useRef(false)

  const claim = MISSION3_CLAIMS[currentIdx]
  const total = MISSION3_CLAIMS.length
  const isLast = currentIdx === total - 1
  const finished = currentIdx >= total

  const correctCount = MISSION3_CLAIMS.filter((c) => answers[c.id] === c.answer).length
  const stars = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1

  // Magnifying glass cursor effect
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setCursor({ x: e.clientX, y: e.clientY })
      setCursorVisible(true)
    }
    const onLeave = () => setCursorVisible(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerout', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
    }
  }, [])

  const answer = (choice: ClaimCheck['answer']) => {
    if (approved || wrongAttempt) return
    if (choice === claim.answer) {
      setAnswers((a) => ({ ...a, [claim.id]: choice }))
      setApproved(true)
      toast.success('Case solved! 🕵️ ' + claim.explanation, { duration: 2600 })
      setTimeout(() => {
        setApproved(false)
        setHighlightFact(null)
        if (isLast) {
          if (!recordedRef.current) {
            recordedRef.current = true
            void record({
              missionId: 'm3',
              activityId: 'game',
              eventType: 'completed',
              score: correctCount + 1,
              maxScore: total,
              payload: { answers: { ...answers, [claim.id]: choice }, wrongCount },
            })
          }
          setCurrentIdx(total) // trigger finished state
        } else {
          setCurrentIdx((i) => i + 1)
        }
      }, 1700)
    } else {
      setWrongAttempt(choice)
      setWrongCount((n) => n + 1)
      if (claim.evidence) setHighlightFact(claim.evidence)
      toast.error('Look again at the evidence. ' + claim.explanation, { duration: 3000 })
      setTimeout(() => {
        setWrongAttempt(null)
        setHighlightFact(null)
      }, 900)
    }
  }

  const next = () => {
    setScreen(nextScreenFor('m3', 'game'))
  }

  return (
    <div className="relative min-h-screen bg-cream bg-adventure-grid">
      {/* Magnifying glass cursor */}
      {cursorVisible && (
        <motion.div
          className="pointer-events-none fixed z-50 text-2xl"
          animate={{ x: cursor.x + 12, y: cursor.y - 18 }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          aria-hidden
        >
          🔍
        </motion.div>
      )}

      <MissionHeader missionId="m3" step="Detective: check the claims" />
      <div className="relative mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Detective board: Moon facts as sticky notes */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-3xl bg-navy p-4 shadow-md"
        >
          <h3 className="flex items-center gap-2 font-display text-base text-cream">
            <BookOpen className="h-4 w-4 text-sunshine" /> Detective board · Moon fact sheet
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {MISSION3_MOON_FACTS.map((f, i) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, y: -8, rotate: -3 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotate: i % 2 === 0 ? -2 : 2,
                  scale: highlightFact === f.id ? 1.05 : 1,
                }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'rounded-lg bg-sunshine p-2 text-sm text-navy shadow-sm',
                  highlightFact === f.id && 'ring-4 ring-sunshine/60',
                )}
                style={{
                  boxShadow: '0 4px 0 rgba(0,0,0,0.18), 0 6px 14px rgba(0,0,0,0.18)',
                  transformOrigin: 'top center',
                }}
              >
                <span className="mr-1 font-display">{f.id}.</span>
                {f.text}
                <div className="mt-1 h-1 w-10 rounded-full bg-navy/30" />
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Stepper / "Case closed" counter */}
        <div className="mb-4 flex items-center justify-between">
          <Badge variant={finished ? 'sunshine' : 'secondary'}>
            {finished ? '🎉 Case closed!' : `Case ${currentIdx + 1} of ${total}`}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-navy">
              Solved: {Object.keys(answers).length}/{total}
            </span>
            <div className="flex gap-1">
              {MISSION3_CLAIMS.map((c, i) => (
                <div
                  key={c.id}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    answers[c.id] ? 'bg-turquoise' : i === currentIdx ? 'bg-sunshine' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Case file */}
        <AnimatePresence mode="wait">
          {!finished && (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, x: 60, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -60, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="relative"
            >
              <div
                className={cn(
                  'relative rounded-3xl border-2 border-navy/30 bg-card p-5 shadow-lg',
                  wrongAttempt && 'border-destructive/40',
                )}
                style={{
                  boxShadow: '0 8px 0 rgba(11,31,58,0.12), 0 12px 30px rgba(11,31,58,0.18)',
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-navy">
                    📁 Case File #{currentIdx + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Detective in progress…
                  </span>
                </div>
                <p className="text-base font-semibold text-navy">
                  <span className="text-muted-foreground">Claim:</span>{' '}
                  {claim.claim}
                </p>

                {/* Three big verdict buttons */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {OPTIONS.map((o) => {
                    const sel = wrongAttempt === o.id
                    return (
                      <motion.button
                        key={o.id}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => answer(o.id)}
                        disabled={approved || !!wrongAttempt}
                        animate={sel ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                        transition={sel ? { duration: 0.5 } : {}}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-2xl px-2 py-4 font-display text-white shadow-md disabled:opacity-50',
                          o.color,
                          sel && 'ring-4 ring-destructive/40',
                        )}
                      >
                        <span className="text-3xl" aria-hidden>{o.emoji}</span>
                        <span className="text-xs sm:text-sm">{o.label}</span>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Hint when wrong */}
                <AnimatePresence>
                  {wrongAttempt && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-3 rounded-xl bg-destructive/10 p-2 text-xs text-destructive"
                    >
                      ❌ Not quite. Look at Fact {claim.evidence ?? '—'} again.
                      <br />
                      <span className="text-muted-foreground">{claim.explanation}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ApprovedStamp show={approved} />
              </div>
            </motion.div>
          )}

          {/* Finished state */}
          {finished && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-turquoise bg-card p-6 text-center shadow-lg"
            >
              <p className="text-4xl">🏆</p>
              <p className="font-display text-xl text-navy">All cases solved!</p>
              <StarsRow count={stars} total={3} />
              <p className="text-sm text-muted-foreground">
                You got <strong className="text-turquoise">{correctCount}/{total}</strong> correct on the case files.
              </p>
              <div className="mt-2 w-full rounded-xl bg-muted p-3 text-left text-xs text-navy">
                <strong>Quick recap:</strong>
                <ul className="mt-1 space-y-0.5">
                  {MISSION3_CLAIMS.map((c, i) => (
                    <li key={c.id}>
                      {i + 1}. <em>{c.claim}</em> →{' '}
                      <strong className="text-turquoise">{c.answer.replace('-', ' ')}</strong>
                      {c.evidence && <span> (Fact {c.evidence})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={finished ? 'sunshine' : 'secondary'}>
            {finished ? 'Game complete!' : 'Read · Compare · Decide · Correct'}
          </Badge>
          <Button variant="navy" onClick={next} disabled={!finished}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
