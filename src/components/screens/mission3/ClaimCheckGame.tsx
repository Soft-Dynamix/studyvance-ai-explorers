'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, X, Lightbulb, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION3_MOON_FACTS, MISSION3_CLAIMS, type ClaimCheck } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const OPTIONS: { id: ClaimCheck['answer']; label: string; emoji: string }[] = [
  { id: 'supported', label: 'Supported', emoji: '✅' },
  { id: 'contradicted', label: 'Contradicted', emoji: '❌' },
  { id: 'not-enough', label: 'Not enough info', emoji: '🤷' },
]

export function ClaimCheckGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [answers, setAnswers] = React.useState<Record<string, ClaimCheck['answer']>>({})
  const [submitted, setSubmitted] = React.useState(false)

  const allAnswered = Object.keys(answers).length === MISSION3_CLAIMS.length
  const correctCount = MISSION3_CLAIMS.filter((c) => answers[c.id] === c.answer).length

  const submit = () => {
    if (!allAnswered) {
      toast.error('Label every claim first.')
      return
    }
    setSubmitted(true)
    void record({
      missionId: 'm3',
      activityId: 'game',
      eventType: 'completed',
      score: correctCount,
      maxScore: MISSION3_CLAIMS.length,
      payload: { answers },
    })
    if (correctCount === MISSION3_CLAIMS.length) toast.success('Perfect — every claim checked!')
    else toast.success(`You checked ${correctCount}/${MISSION3_CLAIMS.length} correctly.`)
  }

  const next = () => setScreen(nextScreenFor('m3', 'game'))

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m3" step="Claim check game" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Moon fact sheet */}
        <div className="mb-4 rounded-2xl bg-navy p-4 text-cream shadow-sm">
          <h3 className="flex items-center gap-2 font-display text-base">
            <BookOpen className="h-4 w-4 text-sunshine" /> Moon fact sheet (your evidence)
          </h3>
          <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
            {MISSION3_MOON_FACTS.map((f) => (
              <li key={f.id} className="rounded-lg bg-cream/10 p-2">
                <span className="font-bold text-sunshine">{f.id}.</span> {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4 rounded-xl bg-sunshine/20 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Read each claim. Compare it to your evidence. Then label it.
        </div>

        {/* Claims */}
        <div className="space-y-3">
          {MISSION3_CLAIMS.map((c, i) => {
            const userAns = answers[c.id]
            const correct = submitted && userAns === c.answer
            const wrong = submitted && userAns !== undefined && userAns !== c.answer
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'rounded-2xl border-2 bg-card p-4 shadow-sm',
                  correct && 'border-turquoise',
                  wrong && 'border-destructive/40'
                )}
              >
                <p className="text-sm font-semibold text-navy">
                  <span className="text-muted-foreground">Claim {i + 1}:</span> {c.claim}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OPTIONS.map((o) => {
                    const sel = userAns === o.id
                    const showCorrect = submitted && o.id === c.answer
                    const showWrong = submitted && sel && o.id !== c.answer
                    return (
                      <button
                        key={o.id}
                        disabled={submitted}
                        onClick={() => setAnswers((a) => ({ ...a, [c.id]: o.id }))}
                        className={cn(
                          'rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all',
                          sel && !submitted && 'border-turquoise bg-turquoise/10',
                          !sel && !submitted && 'border-border hover:border-turquoise/40',
                          showCorrect && 'border-turquoise bg-turquoise text-navy',
                          showWrong && 'border-destructive bg-destructive/10'
                        )}
                      >
                        <span className="mr-1" aria-hidden>{o.emoji}</span> {o.label}
                        {showCorrect && <Check className="ml-1 inline h-3 w-3" />}
                        {showWrong && <X className="ml-1 inline h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
                {submitted && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <strong className="text-turquoise">Why:</strong> {c.explanation}
                    {c.evidence && <span> (Evidence: {c.evidence})</span>}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Badge variant={submitted ? (correctCount === MISSION3_CLAIMS.length ? 'sunshine' : 'secondary') : 'secondary'}>
            {submitted
              ? `${correctCount}/${MISSION3_CLAIMS.length} correct`
              : `${Object.keys(answers).length}/${MISSION3_CLAIMS.length} labelled`}
          </Badge>
          {!submitted ? (
            <Button variant="sunshine" onClick={submit} disabled={!allAnswered}>
              Submit answers
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
