'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, X, Lightbulb, Calculator, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import {
  MISSION5_MATH_PROBLEM,
  MISSION5_PASSAGE,
  MISSION5_PASSAGE_QUESTIONS,
} from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Choice = 'hint' | 'answer'

export function HintGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()

  // Step 1: Choose hint or answer
  const [choice, setChoice] = React.useState<Choice | null>(null)
  const [showHint, setShowHint] = React.useState(false)
  const [showAnswer, setShowAnswer] = React.useState(false)

  // Step 2: Check the method
  const [independentAnswer, setIndependentAnswer] = React.useState('')
  const [independentChecked, setIndependentChecked] = React.useState(false)

  // Step 3: Reading comprehension
  const [passageAnswers, setPassageAnswers] = React.useState<Record<string, number>>({})
  const [passageSubmitted, setPassageSubmitted] = React.useState(false)

  const passageScore = MISSION5_PASSAGE_QUESTIONS.reduce(
    (acc, q) => (passageAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  )

  const choose = (c: Choice) => {
    setChoice(c)
    if (c === 'hint') {
      setShowHint(true)
      toast.success('Good choice — a hint helps you learn!')
    } else {
      setShowAnswer(true)
      toast.error('Copying the answer does not help you learn. Try the hint instead.')
    }
  }

  const checkIndependent = () => {
    const val = parseInt(independentAnswer.trim(), 10)
    if (Number.isNaN(val)) {
      toast.error('Type a number first.')
      return
    }
    setIndependentChecked(true)
    if (val === MISSION5_MATH_PROBLEM.independentAnswer) {
      toast.success(`Correct! ${MISSION5_MATH_PROBLEM.independentCheck}`)
    } else {
      toast.error(`Not quite. ${MISSION5_MATH_PROBLEM.independentCheck}`)
    }
  }

  const submitPassage = () => {
    if (Object.keys(passageAnswers).length < MISSION5_PASSAGE_QUESTIONS.length) {
      toast.error('Answer every question first.')
      return
    }
    setPassageSubmitted(true)
  }

  const finish = () => {
    void record({
      missionId: 'm5',
      activityId: 'game',
      eventType: 'completed',
      score: passageScore,
      maxScore: MISSION5_PASSAGE_QUESTIONS.length,
      payload: { choice, independentAnswer, passageAnswers },
    })
    setScreen(nextScreenFor('m5', 'game'))
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m5" step="Hint game" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-sunshine/20 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Should AI give you the answer, or help you find it?
        </div>

        {/* Step 1: Choose */}
        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg">1. Hint or answer?</h2>
          <p className="text-sm text-navy">
            Math problem: <strong>{MISSION5_MATH_PROBLEM.question}</strong>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => choose('hint')}
              disabled={!!choice}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                choice === 'hint'
                  ? 'border-turquoise bg-turquoise/10'
                  : 'border-border hover:border-turquoise/40',
                choice && choice !== 'hint' && 'opacity-50'
              )}
            >
              <Lightbulb className="mb-1 h-5 w-5 text-sunshine" />
              <p className="font-semibold">Give me a hint</p>
              <p className="text-xs text-muted-foreground">A stepping stone. I&apos;ll try.</p>
            </button>
            <button
              onClick={() => choose('answer')}
              disabled={!!choice}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-all',
                choice === 'answer'
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-border hover:border-destructive/30',
                choice && choice !== 'answer' && 'opacity-50'
              )}
            >
              <X className="mb-1 h-5 w-5 text-destructive" />
              <p className="font-semibold">Give me the answer</p>
              <p className="text-xs text-muted-foreground">Just copy it.</p>
            </button>
          </div>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg bg-turquoise/10 p-3 text-sm text-navy"
            >
              <Check className="mr-1 inline h-3.5 w-3.5" />
              <strong>Hint:</strong> Check your answer by multiplying back.{' '}
              {MISSION5_MATH_PROBLEM.check}.
            </motion.div>
          )}
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-navy"
            >
              <X className="mr-1 inline h-3.5 w-3.5 text-destructive" />
              <strong>Answer:</strong> {MISSION5_MATH_PROBLEM.correctAnswer}. But wait —{' '}
              {MISSION5_MATH_PROBLEM.wrongExplanation}. That is wrong because{' '}
              {MISSION5_MATH_PROBLEM.wrongCheck}. Always check the working!
            </motion.div>
          )}
        </section>

        {/* Step 2: Independent problem */}
        {choice === 'hint' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl bg-card p-4 shadow-sm"
          >
            <h2 className="flex items-center gap-2 font-display text-lg">
              <Calculator className="h-4 w-4 text-turquoise" /> 2. Solve this on your own
            </h2>
            <p className="text-sm text-navy">
              {MISSION5_MATH_PROBLEM.independentProblem}
            </p>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="ind">Your answer</Label>
                <Input
                  id="ind"
                  type="number"
                  inputMode="numeric"
                  value={independentAnswer}
                  onChange={(e) => setIndependentAnswer(e.target.value)}
                  disabled={independentChecked}
                  className="mt-1"
                />
              </div>
              {!independentChecked ? (
                <Button variant="sunshine" onClick={checkIndependent}>
                  Check
                </Button>
              ) : (
                <Badge variant={parseInt(independentAnswer, 10) === MISSION5_MATH_PROBLEM.independentAnswer ? 'sunshine' : 'destructive'}>
                  {parseInt(independentAnswer, 10) === MISSION5_MATH_PROBLEM.independentAnswer ? 'Correct!' : 'Try the hint'}
                </Badge>
              )}
            </div>
          </motion.section>
        )}

        {/* Step 3: Reading comprehension */}
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <BookOpen className="h-4 w-4 text-turquoise" /> 3. Read with evidence
          </h2>
          <p className="mt-2 rounded-lg bg-muted p-3 text-sm italic text-navy">
            “{MISSION5_PASSAGE}”
          </p>
          <div className="mt-3 space-y-3">
            {MISSION5_PASSAGE_QUESTIONS.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm font-semibold">
                  {i + 1}. {q.question}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {q.options.map((opt, j) => {
                    const sel = passageAnswers[q.id] === j
                    const correct = passageSubmitted && j === q.correctIndex
                    const wrong = passageSubmitted && sel && j !== q.correctIndex
                    return (
                      <button
                        key={j}
                        disabled={passageSubmitted}
                        onClick={() => setPassageAnswers((a) => ({ ...a, [q.id]: j }))}
                        className={cn(
                          'rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all',
                          sel && !passageSubmitted && 'border-turquoise bg-turquoise/10',
                          !sel && !passageSubmitted && 'border-border hover:border-turquoise/40',
                          correct && 'border-turquoise bg-turquoise text-navy',
                          wrong && 'border-destructive bg-destructive/10'
                        )}
                      >
                        {opt}
                        {correct && <Check className="ml-1 inline h-3 w-3" />}
                        {wrong && <X className="ml-1 inline h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
                {passageSubmitted && (
                  <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={passageSubmitted ? 'sunshine' : 'secondary'}>
            {passageSubmitted
              ? `${passageScore}/${MISSION5_PASSAGE_QUESTIONS.length} correct`
              : `${Object.keys(passageAnswers).length}/${MISSION5_PASSAGE_QUESTIONS.length} answered`}
          </Badge>
          {!passageSubmitted ? (
            <Button variant="sunshine" onClick={submitPassage}>
              Submit answers
            </Button>
          ) : (
            <Button variant="navy" onClick={finish} disabled={choice !== 'hint'}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
