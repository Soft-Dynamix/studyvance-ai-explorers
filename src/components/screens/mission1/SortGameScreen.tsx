'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Undo2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { SORT_CARDS } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Bucket = 'ai' | 'ordinary' | null

export function SortGameScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [placements, setPlacements] = React.useState<Record<string, Bucket>>({})
  const [selected, setSelected] = React.useState<string | null>(null)
  const [wrongFlash, setWrongFlash] = React.useState<string | null>(null)

  const allCorrect = SORT_CARDS.every((c) => placements[c.id] === c.category)

  const place = (cardId: string, bucket: Exclude<Bucket, null>) => {
    const card = SORT_CARDS.find((c) => c.id === cardId)
    if (!card) return
    if (card.category === bucket) {
      setPlacements((p) => ({ ...p, [cardId]: bucket }))
      setSelected(null)
      toast.success('Nice! ' + card.why, { duration: 2500 })
    } else {
      // Wrong — show why, undo after 2.6s
      setWrongFlash(cardId)
      setPlacements((p) => ({ ...p, [cardId]: bucket }))
      toast.error('Not quite — that one is ' + (card.category === 'ai' ? 'AI' : 'ordinary') + '. ' + card.why, {
        duration: 3000,
      })
      setTimeout(() => {
        setWrongFlash(null)
        setPlacements((p) => ({ ...p, [cardId]: null }))
      }, 2600)
    }
  }

  const onCardTap = (id: string) => {
    if (placements[id]) return
    setSelected((s) => (s === id ? null : id))
  }

  const onBucketTap = (bucket: 'ai' | 'ordinary') => {
    if (!selected) return
    place(selected, bucket)
  }

  // Keyboard shortcuts: 1-4 select card, A=AI, O=Ordinary
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1
        const card = SORT_CARDS[idx]
        if (card) onCardTap(card.id)
      } else if (e.key.toLowerCase() === 'a') onBucketTap('ai')
      else if (e.key.toLowerCase() === 'o') onBucketTap('ordinary')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, placements])

  const next = () => {
    if (!allCorrect) return
    void record({
      missionId: 'm1',
      activityId: 'sort-game',
      eventType: 'completed',
      payload: { placements },
    })
    setScreen(nextScreenFor('m1', 'm1-sort'))
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m1" step="Sort: AI or ordinary?" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-turquoise/10 p-4 text-sm text-navy">
          <p className="font-semibold">Tap a card, then tap a bucket.</p>
          <p className="text-xs text-muted-foreground">
            Keyboard: 1–4 selects a card, A = AI, O = Ordinary.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {SORT_CARDS.map((c, i) => {
            const placed = placements[c.id]
            const isWrong = wrongFlash === c.id
            const isSel = selected === c.id
            return (
              <motion.button
                key={c.id}
                whileHover={!placed ? { scale: 1.02 } : undefined}
                whileTap={!placed ? { scale: 0.98 } : undefined}
                onClick={() => onCardTap(c.id)}
                disabled={!!placed && !isWrong}
                className={cn(
                  'relative flex items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left shadow-sm transition-all',
                  placed && !isWrong && 'border-turquoise opacity-70',
                  isWrong && 'border-destructive ring-2 ring-destructive/30',
                  isSel && !placed && 'border-turquoise ring-2 ring-turquoise',
                  !placed && !isSel && 'border-border hover:border-turquoise/50'
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-turquoise/15 font-bold text-turquoise">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.label}</p>
                  {placed && (
                    <p className="mt-1 text-xs font-medium text-turquoise">
                      Placed in: {placed === 'ai' ? 'AI' : 'Ordinary'}
                    </p>
                  )}
                  {isWrong && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      Undoing… try the other bucket.
                    </p>
                  )}
                </div>
                {placed && !isWrong && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-turquoise text-cream">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                {isWrong && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-cream">
                    <Undo2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Buckets */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(['ai', 'ordinary'] as const).map((bucket) => (
            <button
              key={bucket}
              onClick={() => onBucketTap(bucket)}
              disabled={!selected}
              className={cn(
                'flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition-all disabled:opacity-50',
                bucket === 'ai' ? 'border-turquoise bg-turquoise/5' : 'border-navy/40 bg-navy/5'
              )}
            >
              <span className="text-3xl" aria-hidden>{bucket === 'ai' ? '🤖' : '⚙️'}</span>
              <span className="font-display text-lg">
                {bucket === 'ai' ? 'AI' : 'Ordinary program'}
              </span>
              <span className="text-xs text-muted-foreground">
                {bucket === 'ai' ? 'Learned from examples' : 'Follows fixed steps'}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Press {bucket === 'ai' ? 'A' : 'O'}
              </span>
            </button>
          ))}
        </div>

        {/* Selected hint */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 rounded-xl bg-sunshine/20 p-3 text-sm text-navy"
            >
              <Sparkles className="mr-1 inline h-4 w-4" /> Card selected — now tap a bucket.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next */}
        <div className="mt-6 flex items-center justify-between">
          <Badge variant={allCorrect ? 'sunshine' : 'secondary'}>
            {allCorrect ? 'All sorted!' : `${Object.values(placements).filter(Boolean).length}/${SORT_CARDS.length} placed`}
          </Badge>
          <Button variant="navy" onClick={next} disabled={!allCorrect}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
