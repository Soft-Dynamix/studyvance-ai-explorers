'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, X, Lightbulb, Eraser, PenLine,
  ScrollText, Stamp, Star, Smile, Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import {
  MISSION4_DRAFT_BRIEF,
  MISSION4_PRACTICE_DRAFT,
  MISSION4_DRAFT_ISSUES,
  MISSION4_STORY_FIELDS,
} from '@/lib/curriculum'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type AssistanceOption = 'own_first_draft' | 'practice_draft' | 'tutor_ai'

const FIELD_THEME: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  character: { color: 'text-turquoise', bg: 'bg-turquoise/10', border: 'border-turquoise', emoji: '🐰' },
  setting: { color: 'text-navy', bg: 'bg-navy/10', border: 'border-navy/50', emoji: '🏠' },
  problem: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/50', emoji: '❗' },
  solution: { color: 'text-sunshine', bg: 'bg-sunshine/15', border: 'border-sunshine', emoji: '💡' },
}

const EMOJI_STICKERS = ['🌟', '🐰', '🐾', '🤖', '📚', '🌈', '❤️', '🌙', '🪄', '✨']

/* Plan flip-block */
function PlanBlock({
  fieldId,
  label,
  placeholder,
  example,
  value,
  onChange,
  index,
}: {
  fieldId: string
  label: string
  placeholder: string
  example: string
  value: string
  onChange: (v: string) => void
  index: number
}) {
  const [flipped, setFlipped] = React.useState(false)
  const theme = FIELD_THEME[fieldId]
  const filled = value.trim().length > 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative h-44 [perspective:1000px]"
    >
      <motion.div
        className="relative h-full w-full cursor-pointer"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        {/* Front */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl border-2 bg-card p-4 text-center shadow-md',
            theme.border,
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-5xl" aria-hidden>{theme.emoji}</span>
          <p className={cn('font-display text-lg', theme.color)}>{label}</p>
          {filled ? (
            <Badge variant="sunshine" className="mt-1"><Check className="mr-1 h-3 w-3" /> Done</Badge>
          ) : (
            <p className="text-xs text-muted-foreground">Tap to write ✍️</p>
          )}
        </div>
        {/* Back */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col gap-2 rounded-3xl border-2 bg-card p-4 shadow-md',
            theme.border,
            theme.bg,
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Label className={cn('font-display', theme.color)}>{label}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-card"
          />
          <p className="text-[10px] text-muted-foreground">e.g. {example}</p>
          <Button
            size="sm"
            variant={filled ? 'turquoise' : 'ghost'}
            className="mt-auto self-end"
            onClick={(e) => {
              e.stopPropagation()
              setFlipped(false)
            }}
          >
            {filled ? <><Check className="h-3 w-3" /> Save</> : 'Close'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* Scroll-like display of the practice draft with glowing issues */
function DraftScroll({
  fixedIssues,
  onFixIssue,
  justFixed,
}: {
  fixedIssues: Set<string>
  onFixIssue: (id: string) => void
  justFixed: string | null
}) {
  // Render the draft as text with issues highlighted inline
  return (
    <div
      className="relative rounded-2xl border-2 border-navy/20 bg-cream p-4 shadow-md"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(11,31,58,0.05) 22px, rgba(11,31,58,0.05) 23px)',
      }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-navy">
        <ScrollText className="h-4 w-4" /> Practice draft
      </div>
      <p className="text-sm text-navy">
        {MISSION4_PRACTICE_DRAFT.split(/(?<=\.)\s+/).map((sentence, i) => {
          // Find if this sentence contains a known issue snippet
          const issue = MISSION4_DRAFT_ISSUES.find((it) =>
            sentence.toLowerCase().includes(it.snippet.toLowerCase().slice(0, 10)),
          )
          if (!issue) {
            return <span key={i}>{sentence} </span>
          }
          const isFixed = fixedIssues.has(issue.id)
          return (
            <span key={i} className="relative inline">
              <motion.span
                animate={
                  isFixed
                    ? {}
                    : { color: ['#e5484d', '#0b1f3a', '#e5484d'] }
                }
                transition={{ duration: 1.8, repeat: Infinity }}
                className={cn(
                  'cursor-pointer rounded px-0.5',
                  isFixed
                    ? 'bg-turquoise/15 line-through'
                    : 'bg-destructive/10 underline decoration-destructive decoration-wavy underline-offset-2',
                )}
                onClick={() => !isFixed && onFixIssue(issue.id)}
                title={issue.problem}
              >
                {sentence}
              </motion.span>{' '}
              <AnimatePresence>
                {isFixed && justFixed === issue.id && (
                  <motion.span
                    initial={{ scale: 3, rotate: -25, opacity: 0 }}
                    animate={{ scale: 1, rotate: -8, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 12 }}
                    className="absolute -right-3 -top-3 z-10 rounded border-2 border-turquoise bg-turquoise/15 px-1 py-0.5 text-[9px] font-bold text-turquoise"
                  >
                    <Stamp className="inline h-3 w-3" /> FIXED
                  </motion.span>
                )}
              </AnimatePresence>
              {isFixed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-turquoise text-cream"
                >
                  <Check className="h-3 w-3" />
                </motion.span>
              )}
            </span>
          )
        })}
      </p>
    </div>
  )
}

/* Sentence counter */
function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(?:\s|$)/g)
  return matches ? matches.length : 0
}

export function StoryEditorGame() {
  const setScreen = useApp((s) => s.setScreen)
  const learner = useApp((s) => s.learner)
  const record = useProgressRecorder()

  // Step management
  const [step, setStep] = React.useState<1 | 2 | 3>(1)

  // Step 1: Plan
  const [plan, setPlan] = React.useState<Record<string, string>>({})
  const planComplete = MISSION4_STORY_FIELDS.every((f) => plan[f.id]?.trim())

  // Step 2: Review
  const [fixedIssues, setFixedIssues] = React.useState<Set<string>>(new Set())
  const [justFixed, setJustFixed] = React.useState<string | null>(null)
  const allIssuesFixed = fixedIssues.size === MISSION4_DRAFT_ISSUES.length

  // Step 3: Write
  const [story, setStory] = React.useState('')
  const [assistance, setAssistance] = React.useState<AssistanceOption>('own_first_draft')
  const [drawingData, setDrawingData] = React.useState<string | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const drawingRef = React.useRef(false)
  const [saving, setSaving] = React.useState(false)
  const recordedRef = React.useRef(false)

  const sentenceCount = countSentences(story)
  const sentenceGoal = 6
  const sentenceMax = 8
  const sentencesOK = sentenceCount >= sentenceGoal && sentenceCount <= sentenceMax

  // Drawing handlers
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawingRef.current = true
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#0b1f3a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  const endDraw = () => {
    drawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    setDrawingData(canvas.toDataURL('image/png'))
  }
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setDrawingData(null)
  }

  const toggleIssue = (id: string) => {
    if (fixedIssues.has(id)) return
    setFixedIssues((prev) => new Set(prev).add(id))
    setJustFixed(id)
    const it = MISSION4_DRAFT_ISSUES.find((x) => x.id === id)
    if (it) toast.success('Fixed! ' + it.problem, { duration: 2200 })
    setTimeout(() => setJustFixed(null), 1500)
  }

  const addSticker = (emoji: string) => {
    setStory((s) => (s.length === 0 ? emoji + ' ' : s.endsWith(' ') ? s + emoji + ' ' : s + ' ' + emoji + ' '))
  }

  const submit = async () => {
    if (!sentencesOK) {
      toast.error(`Aim for ${sentenceGoal}-${sentenceMax} sentences.`)
      return
    }
    setSaving(true)
    try {
      await api('/api/portfolio', {
        method: 'POST',
        json: {
          missionId: 'm4',
          storyText: story.trim(),
          drawingData,
          assistanceNote: assistance,
        },
      })
      if (!recordedRef.current) {
        recordedRef.current = true
        await record({
          missionId: 'm4',
          activityId: 'game',
          eventType: 'completed',
          payload: { plan, fixedIssues: Array.from(fixedIssues), assistance, sentenceCount },
        })
      }
      toast.success('Storybook saved! 📖')
      setScreen(nextScreenFor('m4', 'game'))
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save story')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream bg-adventure-grid">
      <MissionHeader missionId="m4" step="Story workshop" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Step indicator */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-navy">
            <StepPill n={1} active={step === 1} done={planComplete} label="Plan" icon={<PenLine className="h-3.5 w-3.5" />} />
            <span className="h-px w-6 bg-navy/20" />
            <StepPill n={2} active={step === 2} done={allIssuesFixed} label="Review" icon={<ScrollText className="h-3.5 w-3.5" />} />
            <span className="h-px w-6 bg-navy/20" />
            <StepPill n={3} active={step === 3} done={sentencesOK} label="Write" icon={<Pencil className="h-3.5 w-3.5" />} />
          </div>
          <Badge variant="sunshine">Step {step} of 3</Badge>
        </div>

        <div className="mb-4 rounded-2xl bg-turquoise/10 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Brief: {MISSION4_DRAFT_BRIEF}
        </div>

        <AnimatePresence mode="wait">
          {/* ---------- STEP 1: PLAN ---------- */}
          {step === 1 && (
            <motion.section
              key="s1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl bg-card p-4 shadow-sm"
            >
              <h2 className="font-display text-lg text-navy">1. Plan your story 🗺️</h2>
              <p className="text-xs text-muted-foreground">Tap each block to flip it open and write your idea.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MISSION4_STORY_FIELDS.map((f, i) => (
                  <PlanBlock
                    key={f.id}
                    fieldId={f.id}
                    label={f.label}
                    placeholder={f.placeholder}
                    example={f.example}
                    value={plan[f.id] ?? ''}
                    onChange={(v) => setPlan((p) => ({ ...p, [f.id]: v }))}
                    index={i}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={planComplete ? 'sunshine' : 'secondary'}>
                  {planComplete ? 'Plan complete!' : 'Fill in all 4 blocks'}
                </Badge>
                <Button variant="navy" disabled={!planComplete} onClick={() => setStep(2)}>
                  Next: Review draft <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}

          {/* ---------- STEP 2: REVIEW ---------- */}
          {step === 2 && (
            <motion.section
              key="s2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-3xl bg-card p-4 shadow-sm"
            >
              <h2 className="font-display text-lg text-navy">2. Review the practice draft 📜</h2>
              <p className="text-xs text-muted-foreground">
                Three problem spots glow red. Tap each one to fix it!
              </p>
              <div className="mt-3">
                <DraftScroll
                  fixedIssues={fixedIssues}
                  onFixIssue={toggleIssue}
                  justFixed={justFixed}
                />
              </div>
              <ul className="mt-3 space-y-1.5">
                {MISSION4_DRAFT_ISSUES.map((it) => {
                  const fixed = fixedIssues.has(it.id)
                  return (
                    <motion.li
                      key={it.id}
                      initial={fixed ? { scale: 0.9 } : {}}
                      animate={{ scale: 1 }}
                      className={cn(
                        'flex items-start gap-2 rounded-xl border-2 p-3 text-sm',
                        fixed ? 'border-turquoise bg-turquoise/10' : 'border-destructive/40 bg-destructive/5',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                          fixed ? 'bg-turquoise text-cream' : 'bg-destructive text-white',
                        )}
                      >
                        {fixed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </span>
                      <div>
                        <p className="font-semibold">{it.snippet}</p>
                        <p className="text-xs text-muted-foreground">{it.problem}</p>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Badge variant={allIssuesFixed ? 'sunshine' : 'secondary'}>
                  {fixedIssues.size}/{MISSION4_DRAFT_ISSUES.length} fixed
                </Badge>
                <Button variant="navy" disabled={!allIssuesFixed} onClick={() => setStep(3)}>
                  Next: Write story <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}

          {/* ---------- STEP 3: WRITE ---------- */}
          {step === 3 && (
            <motion.section
              key="s3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-3xl bg-card p-4 shadow-sm"
            >
              <h2 className="font-display text-lg text-navy">3. Write your own storybook 📖</h2>
              <p className="text-xs text-muted-foreground">
                Aim for {sentenceGoal}-{sentenceMax} sentences. No real names. No magic. Kind solution.
              </p>

              {/* Storybook textarea */}
              <div className="relative mt-3">
                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={7}
                  placeholder="Once upon a time, a friendly robot rabbit named Pip…"
                  className="bg-cream"
                />
                <motion.span
                  className="pointer-events-none absolute right-3 top-3 text-xl"
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  ✍️
                </motion.span>
              </div>

              {/* Sentence counter */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted p-2 text-xs">
                <span className="font-semibold text-navy">
                  Sentences: <span className={cn(sentencesOK ? 'text-turquoise' : sentenceCount >= sentenceGoal ? 'text-sunshine' : 'text-muted-foreground')}>{sentenceCount}</span>
                  /{sentenceMax}
                </span>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-card">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        sentenceCount < sentenceGoal
                          ? 'bg-sunshine'
                          : sentenceCount <= sentenceMax
                            ? 'bg-turquoise'
                            : 'bg-destructive',
                      )}
                      animate={{ width: `${Math.min(100, (sentenceCount / sentenceMax) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-muted-foreground">
                  {sentenceCount >= sentenceGoal && sentenceCount <= sentenceMax
                    ? '✅ Perfect!'
                    : sentenceCount < sentenceGoal
                      ? `${sentenceGoal - sentenceCount} more`
                      : 'Too many!'}
                </span>
              </div>

              {/* Emoji stickers */}
              <div className="mt-3">
                <p className="text-xs font-semibold text-navy">
                  <Smile className="mr-1 inline h-3.5 w-3.5" /> Emoji stickers — tap to add:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EMOJI_STICKERS.map((e) => (
                    <motion.button
                      key={e}
                      whileHover={{ scale: 1.2, rotate: 8 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addSticker(e)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg shadow-sm hover:bg-sunshine/30"
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Drawing canvas */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <Label>Drawing canvas (optional, not graded)</Label>
                  <Button variant="ghost" size="sm" onClick={clearCanvas}>
                    <Eraser className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={240}
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                  className="mt-2 w-full touch-none rounded-xl border-2 border-border bg-cream"
                  style={{ aspectRatio: '5/2' }}
                />
              </div>

              {/* Assistance note */}
              <div className="mt-4">
                <Label>Truthful assistance note</Label>
                <RadioGroup
                  value={assistance}
                  onValueChange={(v) => setAssistance(v as AssistanceOption)}
                  className="mt-2 space-y-1.5"
                >
                  {([
                    ['own_first_draft', 'I wrote my own first draft without AI.'],
                    ['practice_draft', 'I started from the prepared practice draft.'],
                    ['tutor_ai', 'A tutor ran a live AI tool with me.'],
                  ] as const).map(([val, label]) => (
                    <label
                      key={val}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm',
                        assistance === val ? 'border-turquoise bg-turquoise/10' : 'border-border',
                      )}
                    >
                      <RadioGroupItem value={val} className="sr-only" />
                      <span>{label}</span>
                      {assistance === val && <Check className="ml-auto h-4 w-4 text-turquoise" />}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  variant="navy"
                  onClick={submit}
                  disabled={!sentencesOK || saving}
                >
                  <Star className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & continue'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {learner && (
          <p className="mt-4 text-xs text-muted-foreground">
            Your drawing quality is never graded — only that you tried. Be truthful in your
            assistance note.
          </p>
        )}
      </div>
    </div>
  )
}

function StepPill({
  n, active, done, label, icon,
}: {
  n: number; active: boolean; done: boolean; label: string; icon: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        active ? 'bg-sunshine text-navy' : done ? 'bg-turquoise/20 text-turquoise' : 'bg-muted text-muted-foreground',
      )}
    >
      <span className={cn(
        'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
        active ? 'bg-navy text-cream' : done ? 'bg-turquoise text-cream' : 'bg-muted-foreground/30 text-cream',
      )}>
        {done ? <Check className="h-3 w-3" /> : n}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="hidden sm:inline opacity-70">{icon}</span>
    </div>
  )
}
