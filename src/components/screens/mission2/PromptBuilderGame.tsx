'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import {
  MISSION2_PROMPT_CATEGORIES,
  MISSION2_BEST_PROMPT,
  MISSION2_COMPARISONS,
  type PromptCategory,
} from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PromptBuilderGame() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [selections, setSelections] = React.useState<Record<string, string>>({
    task: '',
    details: '',
    format: '',
  })
  const [checked, setChecked] = React.useState(false)
  const [comparisonChoice, setComparisonChoice] = React.useState<'A' | 'B' | null>(null)
  const [comparisonDone, setComparisonDone] = React.useState(false)

  const best = MISSION2_BEST_PROMPT
  const isBest =
    selections.task === best[0] &&
    selections.details === best[1] &&
    selections.format === best[2]
  const allSelected = Object.values(selections).every(Boolean)

  const checkPrompt = () => {
    if (!allSelected) {
      toast.error('Pick one option from each category.')
      return
    }
    setChecked(true)
    if (isBest) toast.success('That is the clearest prompt!')
    else toast.error('That prompt works, but try the clearer option.')
  }

  const submitComparison = (choice: 'A' | 'B') => {
    setComparisonChoice(choice)
    setComparisonDone(true)
    const correct = MISSION2_COMPARISONS[0].correct === choice
    if (correct) {
      void record({
        missionId: 'm2',
        activityId: 'game',
        eventType: 'completed',
        payload: { selections, comparisonChoice: choice },
      })
      toast.success('Right — Reply B follows the brief better!')
    } else {
      toast.error('Look again — Reply B is the clearer match.')
    }
  }

  const next = () => setScreen(nextScreenFor('m2', 'game'))

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m2" step="Prompt builder game" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Step 1: Build prompt */}
        <div className="mb-4 rounded-xl bg-sunshine/20 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Build a prompt with{' '}
          <strong>TASK + DETAILS + FORMAT</strong>. Pick one option from each category.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {MISSION2_PROMPT_CATEGORIES.map((cat: PromptCategory) => (
            <div key={cat.id} className="rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="font-display text-base text-turquoise">{cat.label}</h3>
              <p className="text-xs text-muted-foreground">{cat.hint}</p>
              <div className="mt-3 space-y-2">
                {cat.options.map((opt) => {
                  const sel = selections[cat.id] === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelections((s) => ({ ...s, [cat.id]: opt.id }))
                      }
                      className={cn(
                        'w-full rounded-xl border-2 px-3 py-2 text-left text-xs font-medium transition-all',
                        sel
                          ? 'border-turquoise bg-turquoise/10'
                          : 'border-border hover:border-turquoise/40'
                      )}
                    >
                      {opt.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Built prompt preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-2xl border-2 border-turquoise bg-turquoise/5 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-turquoise">
            Your prompt
          </p>
          <p className="mt-1 text-sm text-navy">
            {MISSION2_PROMPT_CATEGORIES.map((cat) => {
              const optId = selections[cat.id]
              const opt = cat.options.find((o) => o.id === optId)
              return opt ? opt.text : ''
            })
              .filter(Boolean)
              .join(' — ') || <span className="text-muted-foreground">Pick options above…</span>}
          </p>
        </motion.div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant={checked ? (isBest ? 'sunshine' : 'secondary') : 'secondary'}>
            {checked ? (isBest ? 'Best prompt!' : 'Works, but try the clearer option') : 'Not checked yet'}
          </Badge>
          {!checked ? (
            <Button variant="sunshine" onClick={checkPrompt} disabled={!allSelected}>
              Check my prompt
            </Button>
          ) : (
            <Button variant="navy" onClick={() => setChecked(false)}>
              Try again
            </Button>
          )}
        </div>

        {/* Step 2: Compare replies */}
        {checked && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl bg-card p-4 shadow-sm"
          >
            <h3 className="font-display text-lg">Compare the replies</h3>
            <p className="text-xs text-muted-foreground">
              Which reply follows the brief best?
            </p>
            <p className="mt-2 rounded-lg bg-muted p-2 text-xs text-navy">
              <strong>Brief:</strong> {MISSION2_COMPARISONS[0].brief}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(['A', 'B'] as const).map((letter) => (
                <button
                  key={letter}
                  onClick={() => !comparisonDone && submitComparison(letter)}
                  disabled={comparisonDone}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left text-sm transition-all',
                    comparisonChoice === letter
                      ? MISSION2_COMPARISONS[0].correct === letter
                        ? 'border-turquoise bg-turquoise/10'
                        : 'border-destructive/40 bg-destructive/5'
                      : 'border-border hover:border-turquoise/40'
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Reply {letter}
                  </p>
                  <p className="mt-1 text-sm text-navy">
                    {letter === 'A'
                      ? MISSION2_COMPARISONS[0].replyA
                      : MISSION2_COMPARISONS[0].replyB}
                  </p>
                  {comparisonDone && MISSION2_COMPARISONS[0].correct === letter && (
                    <p className="mt-2 text-xs text-turquoise">
                      <Check className="mr-1 inline h-3 w-3" /> Best match
                    </p>
                  )}
                  {comparisonDone &&
                    comparisonChoice === letter &&
                    MISSION2_COMPARISONS[0].correct !== letter && (
                      <p className="mt-2 text-xs text-destructive">
                        <X className="mr-1 inline h-3 w-3" /> Not quite
                      </p>
                    )}
                </button>
              ))}
            </div>
            {comparisonDone && (
              <p className="mt-3 rounded-lg bg-turquoise/10 p-2 text-xs text-navy">
                {MISSION2_COMPARISONS[0].why}
              </p>
            )}
          </motion.div>
        )}

        {/* Next */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={comparisonDone ? 'sunshine' : 'secondary'}>
            {comparisonDone ? 'Game complete!' : 'Step 2: Compare replies'}
          </Badge>
          <Button
            variant="navy"
            onClick={next}
            disabled={!comparisonDone || !isBest}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
