'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION6_SKILLS_CHECK, MISSION6_RUBRIC } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function SkillsCheckGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [answers, setAnswers] = React.useState<Record<string, number>>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [rubric, setRubric] = React.useState<Record<string, boolean>>({})

  const allAnswered = Object.keys(answers).length === MISSION6_SKILLS_CHECK.length
  const score = MISSION6_SKILLS_CHECK.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  )
  const rubricChecked = Object.values(rubric).filter(Boolean).length

  const submit = () => {
    if (!allAnswered) {
      toast.error('Answer every skill check first.')
      return
    }
    setSubmitted(true)
    void record({
      missionId: 'm6',
      activityId: 'game',
      eventType: 'completed',
      score,
      maxScore: MISSION6_SKILLS_CHECK.length,
      payload: { answers, rubric },
    })
    toast.success(`You scored ${score}/${MISSION6_SKILLS_CHECK.length} on your own!`)
  }

  const finish = () => {
    setScreen(nextScreenFor('m6', 'game'))
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m6" step="Skills check" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-sunshine/20 p-4 text-sm text-navy">
          <Star className="mr-1 inline h-4 w-4" /> Show what you can do on your own. No hints this time!
        </div>

        {/* Skills check */}
        <div className="space-y-4">
          {MISSION6_SKILLS_CHECK.map((q, i) => {
            const userAns = answers[q.id]
            const correct = submitted && userAns === q.correctIndex
            const wrong = submitted && userAns !== undefined && userAns !== q.correctIndex
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'rounded-2xl border-2 bg-card p-4 shadow-sm',
                  correct && 'border-turquoise',
                  wrong && 'border-destructive/40'
                )}
              >
                <p className="font-semibold text-navy">{q.prompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((opt, j) => {
                    const sel = userAns === j
                    const showCorrect = submitted && j === q.correctIndex
                    const showWrong = submitted && sel && j !== q.correctIndex
                    return (
                      <button
                        key={j}
                        disabled={submitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: j }))}
                        className={cn(
                          'rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all',
                          sel && !submitted && 'border-turquoise bg-turquoise/10',
                          !sel && !submitted && 'border-border hover:border-turquoise/40',
                          showCorrect && 'border-turquoise bg-turquoise text-navy',
                          showWrong && 'border-destructive bg-destructive/10'
                        )}
                      >
                        {opt}
                        {showCorrect && <Check className="ml-1 inline h-3 w-3" />}
                        {showWrong && <X className="ml-1 inline h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Rubric self-assessment */}
        {submitted && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl bg-card p-4 shadow-sm"
          >
            <h2 className="font-display text-lg">Self-assessment rubric</h2>
            <p className="text-xs text-muted-foreground">
              Be honest. Your tutor will review this with you.
            </p>
            <div className="mt-3 space-y-2">
              {MISSION6_RUBRIC.map((r) => {
                const checked = rubric[r.id]
                return (
                  <button
                    key={r.id}
                    onClick={() => setRubric((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                      checked ? 'border-turquoise bg-turquoise/10' : 'border-border hover:border-turquoise/40'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        checked ? 'bg-turquoise text-cream' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <Badge variant={rubricChecked === MISSION6_RUBRIC.length ? 'sunshine' : 'secondary'}>
                {rubricChecked}/{MISSION6_RUBRIC.length} checked
              </Badge>
            </p>
          </motion.section>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={submitted ? (score === MISSION6_SKILLS_CHECK.length ? 'sunshine' : 'secondary') : 'secondary'}>
            {submitted ? `${score}/${MISSION6_SKILLS_CHECK.length} correct` : `${Object.keys(answers).length}/${MISSION6_SKILLS_CHECK.length} answered`}
          </Badge>
          {!submitted ? (
            <Button variant="sunshine" onClick={submit} disabled={!allAnswered}>
              Submit skills check
            </Button>
          ) : (
            <Button variant="navy" onClick={finish}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
