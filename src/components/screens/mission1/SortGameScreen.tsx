'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Star, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { SORT_CARDS, type SortCard } from '@/lib/curriculum'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Bucket = 'ai' | 'ordinary' | null

/* ---------------- Confetti burst ---------------- */
function Confetti({ show }: { show: boolean }) {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.35,
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
          initial={{ y: -40, x: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{ y: '120%', opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.3, delay: p.delay, ease: 'easeIn' }}
          className="absolute rounded-[2px]"
          style={{ backgroundColor: p.color, left: `${p.x}%`, width: p.size, height: p.size }}
        />
      ))}
    </div>
  )
}

/* ---------------- Celebration particles on correct drop ---------------- */
function Pop({ trigger }: { trigger: number }) {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        angle: (i / 10) * Math.PI * 2,
        dist: 40 + Math.random() * 30,
        color: ['#18c5d4', '#ffd23f', '#6fe3ee'][i % 3],
      })),
    [],
  )
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0 z-20"
        >
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.dist,
                y: Math.sin(p.angle) * p.dist,
                opacity: 0,
                scale: 0.4,
              }}
              transition={{ duration: 0.6 }}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Star row ---------------- */
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
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              i < count ? 'fill-sunshine text-sunshine' : 'text-muted-foreground/30',
            )}
          />
        </motion.span>
      ))}
    </div>
  )
}

/* ---------------- Card component ---------------- */
function CardTile({
  card,
  index,
  placed,
  wrong,
  onDragEndCheck,
  onReveal,
}: {
  card: SortCard
  index: number
  placed: Bucket
  wrong: boolean
  onDragEndCheck: (cardId: string, point: { x: number; y: number }) => void
  onReveal: (cardId: string) => void
}) {
  const dragRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <motion.div
      ref={dragRef}
      layout
      drag={!placed}
      dragSnapToOrigin
      dragElastic={0.55}
      onDragEnd={(_e, info) => onDragEndCheck(card.id, { x: info.point.x, y: info.point.y })}
      initial={{ y: -300, opacity: 0, rotate: -10 }}
      animate={
        wrong
          ? { x: [0, -8, 8, -6, 6, 0], y: 0, opacity: 1, rotate: 0 }
          : placed
            ? { y: 0, opacity: 0.55, rotate: 0, scale: 0.95 }
            : { y: 0, opacity: 1, rotate: 0 }
      }
      transition={
        wrong
          ? { duration: 0.5 }
          : placed
            ? { type: 'spring', stiffness: 220, damping: 18 }
            : { type: 'spring', stiffness: 140, damping: 14, delay: index * 0.12 }
      }
      whileHover={!placed ? { scale: 1.04, y: -2 } : undefined}
      whileTap={!placed ? { scale: 0.97 } : undefined}
      onClick={() => onReveal(card.id)}
      className={cn(
        'relative cursor-grab touch-none select-none rounded-2xl border-2 bg-card p-4 shadow-md active:cursor-grabbing',
        placed && !wrong && 'border-turquoise',
        wrong && 'border-destructive ring-2 ring-destructive/30',
        !placed && !wrong && 'border-border hover:border-turquoise/60',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunshine font-display text-navy">
          {index + 1}
        </div>
        <p className="flex-1 text-sm font-semibold text-navy">{card.label}</p>
      </div>
      <AnimatePresence>
        {placed && !wrong && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-turquoise text-cream shadow"
          >
            <Check className="h-4 w-4" />
          </motion.span>
        )}
        {wrong && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white shadow"
          >
            ✗
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ---------------- Bucket component ---------------- */
function BucketZone({
  bucket,
  count,
  hover,
  onReveal,
}: {
  bucket: 'ai' | 'ordinary'
  count: number
  hover: boolean
  onReveal: () => void
}) {
  return (
    <div
      data-bucket={bucket}
      onClick={onReveal}
      className={cn(
        'relative flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed p-5 text-center transition-all',
        bucket === 'ai'
          ? 'border-turquoise bg-turquoise/10'
          : 'border-navy/50 bg-navy/5',
        hover && (bucket === 'ai' ? 'bg-turquoise/25 scale-[1.02]' : 'bg-navy/15 scale-[1.02]'),
      )}
    >
      <span className="text-4xl" aria-hidden>
        {bucket === 'ai' ? '🤖' : '⚙️'}
      </span>
      <span className="font-display text-lg text-navy">
        {bucket === 'ai' ? 'AI Example' : 'Ordinary Program'}
      </span>
      <span className="text-xs text-muted-foreground">
        {bucket === 'ai' ? 'Learned from examples' : 'Follows fixed steps'}
      </span>
      <div className="mt-2 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-card px-2 text-sm font-bold text-navy shadow-sm">
        {count}
      </div>
    </div>
  )
}

/* ---------------- Main screen ---------------- */
export function SortGameScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()

  const [placements, setPlacements] = React.useState<Record<string, Bucket>>({})
  const [wrongFlash, setWrongFlash] = React.useState<string | null>(null)
  const [hoverBucket, setHoverBucket] = React.useState<'ai' | 'ordinary' | null>(null)
  const [revealCard, setRevealCard] = React.useState<string | null>(null)
  const [attempts, setAttempts] = React.useState(0)
  const [firstTryCorrect, setFirstTryCorrect] = React.useState(0)
  const [wrongCardIds, setWrongCardIds] = React.useState<Set<string>>(new Set())
  const recordedRef = React.useRef(false)

  const placedCount = Object.values(placements).filter(Boolean).length
  const allCorrect = SORT_CARDS.every((c) => placements[c.id] === c.category)

  // Stars: 3 if all first try, 2 if at most 1 mistake, 1 otherwise
  const mistakes = attempts - firstTryCorrect
  const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1

  // Compute next-screen path once recorded
  const next = () => {
    if (!allCorrect || recordedRef.current) return
    recordedRef.current = true
    void record({
      missionId: 'm1',
      activityId: 'sort-game',
      eventType: 'completed',
      score: firstTryCorrect,
      maxScore: SORT_CARDS.length,
      payload: { placements, attempts, mistakes },
    })
    setScreen(nextScreenFor('m1', 'm1-sort'))
  }

  const placeCard = (cardId: string, bucket: 'ai' | 'ordinary') => {
    const card = SORT_CARDS.find((c) => c.id === cardId)
    if (!card) return
    setAttempts((a) => a + 1)
    if (card.category === bucket) {
      setPlacements((p) => ({ ...p, [cardId]: bucket }))
      // First-try correct: card was never wrong before
      if (!wrongCardIds.has(cardId)) {
        setFirstTryCorrect((n) => n + 1)
      }
      toast.success('Correct! ' + card.why, { duration: 2400 })
    } else {
      setWrongCardIds((prev) => new Set(prev).add(cardId))
      setWrongFlash(cardId)
      setPlacements((p) => ({ ...p, [cardId]: bucket }))
      toast.error('Not quite — that one is ' + (card.category === 'ai' ? 'AI' : 'ordinary') + '. ' + card.why, {
        duration: 3000,
      })
      setTimeout(() => {
        setWrongFlash(null)
        setPlacements((p) => ({ ...p, [cardId]: null }))
      }, 700)
    }
  }

  // Determine which bucket the dragged pointer is over
  const handleDragEndCheck = (cardId: string, point: { x: number; y: number }) => {
    const buckets = document.querySelectorAll<HTMLElement>('[data-bucket]')
    let found: 'ai' | 'ordinary' | null = null
    buckets.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom) {
        found = el.getAttribute('data-bucket') as 'ai' | 'ordinary'
      }
    })
    setHoverBucket(null)
    if (found) placeCard(cardId, found)
  }

  // Track which bucket is being hovered during drag (for highlight)
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const buckets = document.querySelectorAll<HTMLElement>('[data-bucket]')
      let found: 'ai' | 'ordinary' | null = null
      buckets.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          found = el.getAttribute('data-bucket') as 'ai' | 'ordinary'
        }
      })
      setHoverBucket(found)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const aiCount = SORT_CARDS.filter((c) => placements[c.id] === 'ai').length
  const ordCount = SORT_CARDS.filter((c) => placements[c.id] === 'ordinary').length

  const progressPct = Math.round((placedCount / SORT_CARDS.length) * 100)

  return (
    <div className="min-h-screen bg-cream bg-adventure-grid">
      <MissionHeader missionId="m1" step="Sort: AI or ordinary?" />
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Confetti show={allCorrect} />

        {/* Intro / progress */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col gap-3 rounded-2xl bg-turquoise/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-display text-navy">Drag each card to the right bin! 🤖 vs ⚙️</p>
            <p className="text-xs text-muted-foreground">Tap a placed card to peek at the “why”.</p>
          </div>
          <Badge variant={allCorrect ? 'sunshine' : 'secondary'} className="self-start text-sm">
            {allCorrect ? 'All sorted!' : `${placedCount}/${SORT_CARDS.length} sorted!`}
          </Badge>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-navy">
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-turquoise to-sunshine"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            />
          </div>
        </div>

        {/* Cards grid */}
        <div className="relative grid gap-3 sm:grid-cols-2">
          {SORT_CARDS.map((c, i) => (
            <div key={c.id} className="relative">
              <Pop trigger={placements[c.id] === c.category ? i + 1 : 0} />
              <CardTile
                card={c}
                index={i}
                placed={placements[c.id] ?? null}
                wrong={wrongFlash === c.id}
                onDragEndCheck={handleDragEndCheck}
                onReveal={(id) => setRevealCard((p) => (p === id ? null : id))}
              />
            </div>
          ))}
        </div>

        {/* Buckets */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <BucketZone
            bucket="ai"
            count={aiCount}
            hover={hoverBucket === 'ai'}
            onReveal={() => {}}
          />
          <BucketZone
            bucket="ordinary"
            count={ordCount}
            hover={hoverBucket === 'ordinary'}
            onReveal={() => {}}
          />
        </div>

        {/* Reveal panel */}
        <AnimatePresence>
          {revealCard && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-4 rounded-2xl bg-sunshine/20 p-4 text-sm text-navy"
            >
              <Sparkles className="mr-1 inline h-4 w-4" />
              {(() => {
                const c = SORT_CARDS.find((x) => x.id === revealCard)
                return c ? <><strong>Why:</strong> {c.why}</> : null
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stars preview + reset + next */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {allCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 shadow-lg"
            >
              <p className="font-display text-xl text-navy">🎉 All sorted!</p>
              <StarsRow count={stars} total={3} />
              <p className="text-xs text-muted-foreground">
                {stars === 3 ? 'Flawless — no mistakes!' : stars === 2 ? 'Almost perfect!' : 'Nice work — try again for 3 stars!'}
              </p>
            </motion.div>
          )}

          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPlacements({})
                setAttempts(0)
                setFirstTryCorrect(0)
                setWrongCardIds(new Set())
                setWrongFlash(null)
                toast.info('Reset!')
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="navy" onClick={next} disabled={!allCorrect}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
