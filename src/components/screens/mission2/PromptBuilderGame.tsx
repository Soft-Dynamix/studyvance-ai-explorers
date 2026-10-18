'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Lightbulb, Sparkles, Puzzle, Star } from 'lucide-react'
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

const CAT_THEME: Record<string, { bg: string; border: string; text: string; emoji: string; side: 'left' | 'right' }> = {
  task: { bg: 'bg-sunshine/15', border: 'border-sunshine', text: 'text-navy', emoji: '🎯', side: 'left' },
  details: { bg: 'bg-turquoise/15', border: 'border-turquoise', text: 'text-navy', emoji: '🧩', side: 'right' },
  format: { bg: 'bg-navy/10', border: 'border-navy/50', text: 'text-navy', emoji: '📦', side: 'left' },
}

/* Confetti */
function Confetti({ show }: { show: boolean }) {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        color: ['#18c5d4', '#ffd23f', '#0b1f3a', '#6fe3ee', '#ffe48a'][i % 5],
        rotate: Math.random() * 540 - 180,
        size: 6 + Math.random() * 8,
      })),
    [],
  )
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 1 }}
          animate={{ y: '120%', opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.4, delay: p.delay, ease: 'easeIn' }}
          className="absolute rounded-[2px]"
          style={{ backgroundColor: p.color, left: `${p.x}%`, width: p.size, height: p.size }}
        />
      ))}
    </div>
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
          <Star className={cn('h-6 w-6', i < count ? 'fill-sunshine text-sunshine' : 'text-muted-foreground/30')} />
        </motion.span>
      ))}
    </div>
  )
}

/* Flip card for reply comparison */
function ReplyFlipCard({
  letter,
  text,
  isCorrect,
  picked,
  revealed,
  onPick,
}: {
  letter: 'A' | 'B'
  text: string
  isCorrect: boolean
  picked: boolean
  revealed: boolean
  onPick: () => void
}) {
  const [flipped, setFlipped] = React.useState(false)
  return (
    <motion.button
      onClick={() => {
        if (!revealed) {
          onPick()
          setFlipped(true)
        } else if (!flipped) {
          setFlipped(true)
        } else {
          setFlipped(false)
        }
      }}
      className="relative h-56 w-full [perspective:1000px]"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="relative h-full w-full rounded-2xl"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card p-4 text-center',
            picked
              ? isCorrect
                ? 'border-turquoise bg-turquoise/10'
                : 'border-destructive/40 bg-destructive/5'
              : 'border-border',
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-3xl" aria-hidden>{letter === 'A' ? '📜' : '📖'}</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Reply {letter}
          </p>
          <p className="text-xs text-muted-foreground">{revealed ? 'Tap to flip' : 'Tap to pick & flip'}</p>
        </div>
        {/* Back */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-start justify-center gap-2 rounded-2xl border-2 p-4 text-left text-sm',
            isCorrect ? 'border-turquoise bg-turquoise/10 text-navy' : 'border-destructive/40 bg-destructive/5 text-navy',
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="font-display text-base">{letter === 'A' ? 'Reply A' : 'Reply B'}</p>
          <p className="text-xs">{text}</p>
          <p className={cn('mt-1 text-xs font-semibold', isCorrect ? 'text-turquoise' : 'text-destructive')}>
            {isCorrect ? '✅ Best match' : '❌ Not quite'}
          </p>
        </div>
      </motion.div>
    </motion.button>
  )
}

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
  const recordedRef = React.useRef(false)

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
    if (isBest) toast.success('Perfect prompt! 🎉')
    else toast.error('That prompt works, but try the clearer option.')
  }

  const submitComparison = (choice: 'A' | 'B') => {
    if (comparisonDone) return
    setComparisonChoice(choice)
    setComparisonDone(true)
    const correct = MISSION2_COMPARISONS[0].correct === choice
    if (correct) {
      if (!recordedRef.current) {
        recordedRef.current = true
        void record({
          missionId: 'm2',
          activityId: 'game',
          eventType: 'completed',
          payload: { selections, comparisonChoice: choice },
        })
      }
      toast.success('Right — Reply B follows the brief better!')
    } else {
      toast.error('Look again — Reply B is the clearer match.')
    }
  }

  const next = () => {
    if (!comparisonDone) return
    // Make sure progress is recorded even if learner picked wrong comparison
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({
        missionId: 'm2',
        activityId: 'game',
        eventType: 'completed',
        payload: { selections, comparisonChoice },
      })
    }
    setScreen(nextScreenFor('m2', 'game'))
  }

  return (
    <div className="min-h-screen bg-cream bg-adventure-grid">
      <MissionHeader missionId="m2" step="Prompt puzzle" />
      <div className="relative mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Confetti show={checked && isBest} />

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl bg-sunshine/20 p-4 text-sm text-navy"
        >
          <p className="font-display flex items-center gap-1">
            <Lightbulb className="h-4 w-4" /> Build a prompt from 3 puzzle pieces!
          </p>
          <p className="mt-1 text-xs">
            Pick one <strong>TASK</strong>, one <strong>DETAILS</strong>, one <strong>FORMAT</strong>.
            Your prompt assembles like building blocks at the top.
          </p>
        </motion.div>

        {/* Builder area */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 overflow-hidden rounded-3xl border-2 border-turquoise bg-gradient-to-br from-turquoise/10 to-sunshine/10 p-4 shadow-md"
        >
          <div className="mb-3 flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-turquoise" />
            <p className="text-xs font-semibold uppercase tracking-widest text-turquoise">
              Your prompt (building blocks)
            </p>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[60px] items-start">
            <AnimatePresence>
              {MISSION2_PROMPT_CATEGORIES.map((cat) => {
                const optId = selections[cat.id]
                if (!optId) return null
                const opt = cat.options.find((o) => o.id === optId)
                if (!opt) return null
                const theme = CAT_THEME[cat.id]
                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className={cn(
                      'rounded-2xl border-2 px-3 py-2 text-xs font-semibold shadow-sm',
                      theme.bg,
                      theme.border,
                      theme.text,
                    )}
                  >
                    <span className="mr-1">{theme.emoji}</span>
                    <span className="mr-1 uppercase tracking-wide opacity-70">{cat.label}:</span>
                    {opt.text}
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {!allSelected && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                className="self-center text-xs italic text-muted-foreground"
              >
                Pick pieces below to assemble your prompt…
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Category puzzle pieces */}
        <div className="grid gap-4 sm:grid-cols-3">
          {MISSION2_PROMPT_CATEGORIES.map((cat: PromptCategory, ci) => {
            const theme = CAT_THEME[cat.id]
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: theme.side === 'left' ? -60 : 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ci * 0.15, type: 'spring', stiffness: 200, damping: 18 }}
                className={cn(
                  'rounded-3xl border-2 bg-card p-4 shadow-sm',
                  theme.border,
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl" aria-hidden>{theme.emoji}</span>
                  <h3 className={cn('font-display text-base', theme.text)}>{cat.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{cat.hint}</p>
                <div className="mt-3 space-y-2">
                  {cat.options.map((opt, oi) => {
                    const sel = selections[cat.id] === opt.id
                    return (
                      <motion.button
                        key={opt.id}
                        initial={{ opacity: 0, x: theme.side === 'left' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ci * 0.15 + oi * 0.05 + 0.1 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelections((s) => ({ ...s, [cat.id]: opt.id }))
                          if (checked) setChecked(false)
                        }}
                        disabled={checked}
                        className={cn(
                          'w-full rounded-2xl border-2 px-3 py-2 text-left text-xs font-medium transition-all',
                          sel
                            ? cn(theme.bg, theme.border, 'shadow')
                            : 'border-border hover:border-turquoise/40',
                        )}
                      >
                        {opt.text}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Check / stars */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={checked ? (isBest ? 'sunshine' : 'secondary') : 'secondary'}>
              {checked ? (isBest ? 'Best prompt!' : 'Works, but try the clearer option') : 'Not checked yet'}
            </Badge>
            {checked && isBest && <StarsRow count={3} total={3} />}
          </div>
          {!checked ? (
            <motion.div
              animate={allSelected ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={allSelected ? { repeat: Infinity, duration: 1.4 } : {}}
            >
              <Button variant="sunshine" onClick={checkPrompt} disabled={!allSelected}>
                <Sparkles className="h-4 w-4" /> Check my prompt
              </Button>
            </motion.div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setChecked(false)}>
              Try again
            </Button>
          )}
        </div>

        {/* Step 2: Compare replies with flip cards */}
        <AnimatePresence>
          {checked && isBest && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-3xl bg-card p-4 shadow-sm"
            >
              <h3 className="font-display text-lg text-navy">Compare the replies 🪄</h3>
              <p className="text-xs text-muted-foreground">
                Tap a card to flip and read. Then pick which reply follows the brief best.
              </p>
              <p className="mt-2 rounded-xl bg-muted p-2 text-xs text-navy">
                <strong>Brief:</strong> {MISSION2_COMPARISONS[0].brief}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(['A', 'B'] as const).map((letter) => (
                  <ReplyFlipCard
                    key={letter}
                    letter={letter}
                    text={letter === 'A' ? MISSION2_COMPARISONS[0].replyA : MISSION2_COMPARISONS[0].replyB}
                    isCorrect={MISSION2_COMPARISONS[0].correct === letter}
                    picked={comparisonChoice === letter}
                    revealed={comparisonDone}
                    onPick={() => submitComparison(letter)}
                  />
                ))}
              </div>
              <AnimatePresence>
                {comparisonDone && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-xl bg-turquoise/10 p-2 text-xs text-navy"
                  >
                    {MISSION2_COMPARISONS[0].why}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={comparisonDone ? 'sunshine' : 'secondary'}>
            {comparisonDone ? 'Game complete!' : checked ? 'Compare replies next' : 'Step 1: Build your prompt'}
          </Badge>
          <Button variant="navy" onClick={next} disabled={!comparisonDone}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
