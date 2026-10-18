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
import { MISSION1_QUIZ, QUIZ_PASS_THRESHOLD } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function QuizScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [submitted, setSubmitted] = React.useState(false)

  const total = MISSION1_QUIZ.length
  const answered = Object.keys(answers).length
  const allAnswered = answered === total

  const score = MISSION1_QUIZ.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  )
  const passed = score >= QUIZ_PASS_THRESHOLD

  const submit = async () => {
    if (!allAnswered) {
      toast.error('Please answer all questions first.')
      return
    }
    setSubmitted(true)
    void record({
      missionId: 'm1',
      activityId: 'quiz',
      eventType: 'quiz_attempt',
      score,
      maxScore: total,
      payload: { answers },
    })
    if (passed) {
      toast.success(`You passed with ${score}/${total}!`)
    } else {
      toast.error(`You got ${score}/${total}. You need ${QUIZ_PASS_THRESHOLD} to pass — try again!`)
    }
  }

  const retry = () => {
    setAnswers({})
    setSubmitted(false)
    setCurrentIdx(0)
  }

  const next = () => setScreen(nextScreenFor('m1', 'm1-quiz'))

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream">
        <MissionHeader missionId="m1" step="Quiz results" />
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
              You scored <strong className="text-navy">{score}/{total}</strong>.{' '}
              {passed
                ? 'You can move on to your portfolio.'
                : `You need ${QUIZ_PASS_THRESHOLD} to pass. Review and try again.`}
            </p>

            <div className="mt-6 space-y-2 text-left">
              {MISSION1_QUIZ.map((q, i) => {
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
                    <p className="font-semibold">
                      {i + 1}. {q.question}
                    </p>
                    <p className="mt-1 text-xs">
                      Your answer: <span className={correct ? 'text-turquoise' : 'text-destructive'}>
                        {userAns !== undefined ? q.options[userAns] : '—'}
                      </span>
                    </p>
                    {!correct && (
                      <p className="text-xs text-turquoise">Correct: {q.options[q.correctIndex]}</p>
                    )}
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
                <Button variant="navy" onClick={next}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const q = MISSION1_QUIZ[currentIdx]

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m1" step="Quick quiz" />
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
          <Button
            variant="ghost"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
          >
            ← Back
          </Button>
          {currentIdx < total - 1 ? (
            <Button
              variant="navy"
              onClick={() => setCurrentIdx(currentIdx + 1)}
              disabled={answers[q.id] === undefined}
            >
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
