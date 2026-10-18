'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, X, Star, Flame, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION6_SKILLS_CHECK, MISSION6_RUBRIC } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Phase = 'answering' | 'answered' | 'results'

/* Timer ring (visual only) */
function TimerRing({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#e6f7f9" strokeWidth="4" />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={done ? '#18c5d4' : '#ffd23f'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="125.6"
          initial={false}
          animate={active ? { strokeDashoffset: [0, 0] } : { strokeDashoffset: 0 }}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm">⏱️</span>
    </div>
  )
}

/* Correct stamp */
function CorrectStamp({ show, correct }: { show: boolean; correct: boolean }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ scale: 3, rotate: -25, opacity: 0 }}
      animate={{ scale: 1, rotate: -12, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 12 }}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div
        className={cn(
          'rotate-[-12deg] rounded-xl border-4 px-4 py-2 text-center shadow-lg',
          correct ? 'border-turquoise bg-turquoise/15 text-turquoise' : 'border-destructive bg-destructive/10 text-destructive',
        )}
      >
        <p className="font-display text-lg tracking-wider">
          {correct ? 'CORRECT!' : 'OOPS!'}
        </p>
        <Star className="mx-auto h-5 w-5" />
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
          <Star className={cn('h-8 w-8', i < count ? 'fill-sunshine text-sunshine' : 'text-muted-foreground/30')} />
        </motion.span>
      ))}
    </div>
  )
}

export function SkillsCheckGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()

  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [phase, setPhase] = React.useState<Phase>('answering')
  const [streak, setStreak] = React.useState(0)
  const [maxStreak, setMaxStreak] = React.useState(0)
  const [rubric, setRubric] = React.useState<Record<string, number>>({})
  const recordedRef = React.useRef(false)

  const total = MISSION6_SKILLS_CHECK.length
  const q = MISSION6_SKILLS_CHECK[currentIdx]
  const isLast = currentIdx === total - 1
  const finished = phase === 'results'

  const score = MISSION6_SKILLS_CHECK.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0,
  )

  const pickAnswer = (idx: number) => {
    if (phase !== 'answering') return
    setAnswers((a) => ({ ...a, [q.id]: idx }))
    const correct = idx === q.correctIndex
    if (correct) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setMaxStreak((m) => Math.max(m, newStreak))
      toast.success(`CORRECT! ${q.explanation}`, { duration: 2200 })
    } else {
      setStreak(0)
      toast.error(`Not quite. ${q.explanation}`, { duration: 2800 })
    }
    setPhase('answered')
  }

  const goNext = () => {
    if (isLast) {
      setPhase('results')
      if (!recordedRef.current) {
        recordedRef.current = true
        void record({
          missionId: 'm6',
          activityId: 'game',
          eventType: 'completed',
          score,
          maxScore: total,
          payload: { answers, maxStreak },
        })
      }
      toast.success(`You scored ${score}/${total} on your own!`)
    } else {
      setCurrentIdx((i) => i + 1)
      setPhase('answering')
    }
  }

  const restart = () => {
    setCurrentIdx(0)
    setAnswers({})
    setPhase('answering')
    setStreak(0)
    setMaxStreak(0)
    setRubric({})
    toast.info('Restarted!')
  }

  const next = () => setScreen(nextScreenFor('m6', 'game'))

  // Determine stars from score (3 if 5/5, 2 if 4/5, 1 otherwise)
  const stars = score === 5 ? 3 : score === 4 ? 2 : 1

  return (
    <div className="min-h-screen bg-cream bg-adventure-grid">
      <MissionHeader missionId="m6" step="Skills game show" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Top: streak + progress */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Badge variant="secondary">
            Question {Math.min(currentIdx + 1, total)} / {total}
          </Badge>
          <AnimatePresence mode="wait">
            {streak > 0 ? (
              <motion.div
                key={streak}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="flex items-center gap-1.5 rounded-full bg-sunshine px-3 py-1 text-sm font-bold text-navy shadow"
              >
                <Flame className="h-4 w-4" />
                {streak} in a row!
              </motion.div>
            ) : (
              <motion.div
                key="cold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground"
              >
                Build a streak 🔥
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {/* Question card */}
          {!finished && (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, rotateY: 30, y: 16 }}
              animate={{
                opacity: 1,
                rotateY: 0,
                y: 0,
                backgroundColor: phase === 'answered'
                  ? (answers[q.id] === q.correctIndex ? '#ecfdfb' : '#fdecec')
                  : '#ffffff',
              }}
              exit={{ opacity: 0, rotateY: -30, y: -16 }}
              transition={{ duration: 0.4 }}
              className={cn(
                'relative rounded-3xl border-2 bg-card p-5 shadow-lg',
                phase === 'answered'
                  ? answers[q.id] === q.correctIndex
                    ? 'border-turquoise'
                    : 'border-destructive/40'
                  : 'border-navy/20',
              )}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Top row: timer ring + prompt */}
              <div className="mb-4 flex items-start gap-3">
                <div className="shrink-0">
                  <TimerRing active={phase === 'answering'} done={phase === 'answered'} />
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg text-navy">{q.prompt}</p>
                </div>
              </div>

              {/* Four answer cards */}
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, j) => {
                  const sel = answers[q.id] === j
                  const isCorrect = j === q.correctIndex
                  const showCorrect = phase === 'answered' && isCorrect
                  const showWrong = phase === 'answered' && sel && !isCorrect
                  return (
                    <motion.button
                      key={j}
                      whileHover={phase === 'answering' ? { scale: 1.03 } : undefined}
                      whileTap={phase === 'answering' ? { scale: 0.97 } : undefined}
                      onClick={() => pickAnswer(j)}
                      disabled={phase !== 'answering'}
                      animate={showWrong ? { x: [0, -6, 6, 0] } : {}}
                      className={cn(
                        'relative rounded-2xl border-2 px-3 py-3 text-left text-sm transition-all',
                        phase === 'answering' && 'border-border hover:border-turquoise/60 bg-card',
                        phase === 'answering' && sel && 'border-turquoise bg-turquoise/10',
                        showCorrect && 'border-turquoise bg-turquoise text-navy',
                        showWrong && 'border-destructive bg-destructive/10 text-navy',
                        phase === 'answered' && !showCorrect && !showWrong && 'border-border opacity-50',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            showCorrect ? 'bg-navy text-cream' : showWrong ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {String.fromCharCode(65 + j)}
                        </span>
                        <span className="flex-1 font-medium">{opt}</span>
                        {showCorrect && <Check className="h-4 w-4 shrink-0" />}
                        {showWrong && <X className="h-4 w-4 shrink-0" />}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Explanation flip */}
              <AnimatePresence>
                {phase === 'answered' && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'mt-3 rounded-xl p-2 text-xs',
                      answers[q.id] === q.correctIndex
                        ? 'bg-turquoise/10 text-turquoise'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {q.explanation}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Stamp overlay */}
              <CorrectStamp show={phase === 'answered'} correct={answers[q.id] === q.correctIndex} />

              {/* Next button */}
              {phase === 'answered' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex justify-end"
                >
                  <Button variant="navy" onClick={goNext}>
                    {isLast ? 'See results' : 'Next question'} <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Results */}
          {finished && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-turquoise bg-card p-6 text-center shadow-lg"
            >
              <motion.span
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                className="inline-block text-6xl"
              >
                🏆
              </motion.span>
              <h2 className="mt-2 font-display text-2xl text-navy">Game show results!</h2>
              <p className="text-sm text-muted-foreground">
                You scored <strong className="text-turquoise">{score}/{total}</strong> on your own.
              </p>
              <div className="mt-3 flex justify-center">
                <StarsRow count={stars} total={3} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Best streak: <strong className="text-sunshine">🔥 {maxStreak}</strong>
              </p>

              {/* Rubric self-check with sliders */}
              <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-left">
                <p className="font-display text-base text-navy">Self-assessment rubric</p>
                <p className="text-xs text-muted-foreground">
                  Slide each one: 0 = not yet, 1 = getting there, 2 = got it. Be honest!
                </p>
                <div className="mt-3 space-y-3">
                  {MISSION6_RUBRIC.map((r) => {
                    const val = rubric[r.id] ?? 0
                    return (
                      <div key={r.id} className="rounded-xl bg-card p-3 shadow-sm">
                        <div className="mb-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-navy">{r.label}</p>
                            <p className="text-[10px] text-muted-foreground">{r.description}</p>
                          </div>
                          <Badge
                            variant={
                              val === 2 ? 'turquoise' : val === 1 ? 'sunshine' : 'secondary'
                            }
                          >
                            {val}/2
                          </Badge>
                        </div>
                        <div className="mt-2 flex gap-2">
                          {[0, 1, 2].map((stepVal) => {
                            const active = val === stepVal
                            return (
                              <motion.button
                                key={stepVal}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setRubric((p) => ({ ...p, [r.id]: stepVal }))}
                                className={cn(
                                  'flex-1 rounded-xl border-2 px-2 py-2 text-sm font-bold transition-all',
                                  active
                                    ? stepVal === 2
                                      ? 'border-turquoise bg-turquoise text-navy'
                                      : stepVal === 1
                                        ? 'border-sunshine bg-sunshine text-navy'
                                        : 'border-muted bg-muted text-muted-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-turquoise/40',
                                )}
                              >
                                {stepVal}
                                {active && stepVal === 2 && <Check className="ml-1 inline h-3 w-3" />}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Total rubric:{' '}
                  <strong className="text-navy">
                    {Object.values(rubric).reduce((a, b) => a + b, 0)}/{MISSION6_RUBRIC.length * 2}
                  </strong>
                </p>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <Button variant="ghost" onClick={restart}>
                  <RotateCcw className="h-4 w-4" /> Play again
                </Button>
                <Button variant="navy" onClick={next}>
                  <Trophy className="h-4 w-4" /> Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={finished ? 'sunshine' : 'secondary'}>
            {finished
              ? 'Game complete!'
              : `${Object.keys(answers).length}/${total} answered`}
          </Badge>
          {!finished && (
            <span className="text-xs text-muted-foreground">Pick the best answer ✨</span>
          )}
        </div>
      </div>
    </div>
  )
}
