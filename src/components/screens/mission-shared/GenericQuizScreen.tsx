'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION_CONTENT } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PASS_THRESHOLD = 0.8

export function GenericQuizScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const missionId = useApp((s) => s.currentMission)
  const record = useProgressRecorder()
  const content = MISSION_CONTENT[missionId]
  const questions = content?.quiz ?? []

  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [submitted, setSubmitted] = React.useState(false)

  const shouldSkip = questions.length === 0
  React.useEffect(() => {
    if (shouldSkip) {
      setScreen(nextScreenFor(missionId, 'quiz'))
    }
  }, [shouldSkip, missionId, setScreen])

  if (shouldSkip) return null

  const total = questions.length
  const answered = Object.keys(answers).length
  const allAnswered = answered === total

  const score = questions.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  )
  const ratio = total > 0 ? score / total : 0
  const passed = ratio >= PASS_THRESHOLD

  const submit = () => {
    if (!allAnswered) {
      toast.error('Please answer all questions first.')
      return
    }
    setSubmitted(true)
    void record({
      missionId,
      activityId: 'quiz',
      eventType: 'quiz_attempt',
      score,
      maxScore: total,
      payload: { answers },
    })
    if (passed) toast.success(`You passed with ${score}/${total}!`)
    else toast.error(`You got ${score}/${total}. Try again to pass.`)
  }

  const retry = () => {
    setAnswers({})
    setSubmitted(false)
    setCurrentIdx(0)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream">
        <MissionHeader missionId={missionId} step="Quiz results" />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-card p-8 text-center shadow-lg"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sunshine/20">
              {passed ? <Trophy className="h-10 w-10 text-sunshine" /> : <RotateCcw className="h-10 w-10 text-muted-foreground" />}
            </div>
            <h2 className="font-display text-3xl">
              {passed ? 'Great job, explorer!' : 'Almost there!'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              You scored <strong className="text-navy">{score}/{total}</strong>.
            </p>
            <div className="mt-6 space-y-2 text-left">
              {questions.map((q, i) => {
                const userAns = answers[q.id]
                const correct = userAns === q.correctIndex
                return (
                  <div
                    key={q.id}
                    className={cn(
                      'rounded-xl border p-3 text-sm',
                      correct ? 'border-turquoise bg-turquoise/5' : 'border-destructive/30 bg-destructive/5'
                    )}
                  >
                    <p className="font-semibold">{i + 1}. {q.question}</p>
                    <p className="mt-1 text-xs">
                      Your answer: <span className={correct ? 'text-turquoise' : 'text-destructive'}>
                        {userAns !== undefined ? q.options[userAns] : '—'}
                      </span>
                    </p>
                    {!correct && <p className="text-xs text-turquoise">Correct: {q.options[q.correctIndex]}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {!passed && (
                <Button variant="outline" onClick={retry}>
                  <RotateCcw className="h-4 w-4" /> Try again
                </Button>
              )}
              {passed && (
                <Button variant="navy" onClick={() => setScreen(nextScreenFor(missionId, 'quiz'))}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const q = questions[currentIdx]
  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId={missionId} step="Quick quiz" />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Badge variant="secondary">Question {currentIdx + 1} of {total}</Badge>
          <span className="text-xs text-muted-foreground">{answered}/{total} answered</span>
        </div>
        <Progress value={(answered / total) * 100} className="mb-6" />

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-3xl bg-card p-6 shadow-sm"
          >
            <h2 className="font-display text-xl">{q.question}</h2>
            <div className="mt-4 space-y-2">
              {q.options.map((opt, i) => {
                const sel = answers[q.id] === i
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all',
                      sel ? 'border-turquoise bg-turquoise/10' : 'border-border hover:border-turquoise/40'
                    )}
                  >
                    <span>{opt}</span>
                    {sel && <Check className="h-4 w-4 text-turquoise" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
            ← Back
          </Button>
          {currentIdx < total - 1 ? (
            <Button variant="navy" onClick={() => setCurrentIdx(currentIdx + 1)} disabled={answers[q.id] === undefined}>
              Next →
            </Button>
          ) : (
            <Button variant="sunshine" onClick={submit} disabled={!allAnswered}>
              Submit quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
