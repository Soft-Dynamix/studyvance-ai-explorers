'use client'

import * as React from 'react'
import { ArrowRight, Check, X, Lightbulb, Eraser } from 'lucide-react'
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

export function StoryEditorGame() {
  const setScreen = useApp((s) => s.setScreen)
  const learner = useApp((s) => s.learner)
  const record = useProgressRecorder()

  // Step 1: Plan
  const [plan, setPlan] = React.useState<Record<string, string>>({})
  const planComplete = MISSION4_STORY_FIELDS.every((f) => plan[f.id]?.trim())

  // Step 2: Review draft issues
  const [foundIssues, setFoundIssues] = React.useState<Set<string>>(new Set())
  const allIssuesFound = foundIssues.size === MISSION4_DRAFT_ISSUES.length

  // Step 3: Write story + drawing + assistance note
  const [story, setStory] = React.useState('')
  const [assistance, setAssistance] = React.useState<AssistanceOption>('own_first_draft')
  const [drawingData, setDrawingData] = React.useState<string | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const drawingRef = React.useRef(false)
  const [saving, setSaving] = React.useState(false)

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

  const submit = async () => {
    if (story.trim().length < 20) {
      toast.error('Write a bit more — at least one sentence per part.')
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
      await record({
        missionId: 'm4',
        activityId: 'game',
        eventType: 'completed',
        payload: { plan, foundIssues: Array.from(foundIssues), assistance },
      })
      toast.success('Story saved!')
      setScreen(nextScreenFor('m4', 'game'))
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save story')
    } finally {
      setSaving(false)
    }
  }

  const toggleIssue = (id: string) => {
    setFoundIssues((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m4" step="Story editor game" />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-turquoise/10 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Brief: {MISSION4_DRAFT_BRIEF}
        </div>

        {/* Step 1: Plan */}
        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg">1. Plan your story</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MISSION4_STORY_FIELDS.map((f) => (
              <div key={f.id}>
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input
                  id={f.id}
                  value={plan[f.id] ?? ''}
                  onChange={(e) => setPlan((p) => ({ ...p, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <Badge variant={planComplete ? 'sunshine' : 'secondary'}>
              {planComplete ? 'Plan complete!' : 'Fill in all 4 fields'}
            </Badge>
          </p>
        </section>

        {/* Step 2: Review the draft */}
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg">2. Review the practice draft</h2>
          <p className="mt-1 rounded-lg bg-muted p-3 text-sm italic text-navy">
            “{MISSION4_PRACTICE_DRAFT}”
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Tap each part that breaks the brief (not kind, or magic, or not realistic).
          </p>
          <div className="mt-3 space-y-2">
            {MISSION4_DRAFT_ISSUES.map((it) => {
              const found = foundIssues.has(it.id)
              return (
                <button
                  key={it.id}
                  onClick={() => toggleIssue(it.id)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-xl border-2 p-3 text-left text-sm transition-all',
                    found ? 'border-turquoise bg-turquoise/10' : 'border-border hover:border-turquoise/40'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      found ? 'bg-turquoise text-cream' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {found ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span>
                    <span className="font-semibold">{it.snippet}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{it.problem}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <Badge variant={allIssuesFound ? 'sunshine' : 'secondary'}>
              {foundIssues.size}/{MISSION4_DRAFT_ISSUES.length} found
            </Badge>
          </p>
        </section>

        {/* Step 3: Write */}
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg">3. Write your own story</h2>
          <p className="text-xs text-muted-foreground">
            Aim for 4–6 sentences. No real names. No magic. Kind solution.
          </p>
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={6}
            placeholder="Once upon a time, a friendly robot rabbit named Pip…"
            className="mt-3"
          />

          {/* Drawing canvas */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <Label>Drawing (optional, not graded)</Label>
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
              <label className={cn('flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm', assistance === 'own_first_draft' ? 'border-turquoise bg-turquoise/10' : 'border-border')}>
                <RadioGroupItem value="own_first_draft" className="sr-only" />
                <span>I wrote my own first draft without AI.</span>
                {assistance === 'own_first_draft' && <Check className="ml-auto h-4 w-4 text-turquoise" />}
              </label>
              <label className={cn('flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm', assistance === 'practice_draft' ? 'border-turquoise bg-turquoise/10' : 'border-border')}>
                <RadioGroupItem value="practice_draft" className="sr-only" />
                <span>I started from the prepared practice draft.</span>
                {assistance === 'practice_draft' && <Check className="ml-auto h-4 w-4 text-turquoise" />}
              </label>
              <label className={cn('flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm', assistance === 'tutor_ai' ? 'border-turquoise bg-turquoise/10' : 'border-border')}>
                <RadioGroupItem value="tutor_ai" className="sr-only" />
                <span>A tutor ran a live AI tool with me.</span>
                {assistance === 'tutor_ai' && <Check className="ml-auto h-4 w-4 text-turquoise" />}
              </label>
            </RadioGroup>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between">
          <Badge variant={planComplete && allIssuesFound && story.length > 20 ? 'sunshine' : 'secondary'}>
            {planComplete && allIssuesFound && story.length > 20 ? 'Ready to save!' : 'Finish all 3 steps'}
          </Badge>
          <Button
            variant="navy"
            onClick={submit}
            disabled={!planComplete || !allIssuesFound || story.trim().length < 20 || saving}
          >
            <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {learner && (
          <p className="mt-4 text-xs text-muted-foreground">
            Your drawing quality is never graded — only that you tried. Be truthful in your
            assistance note.
          </p>
        )}
        {/* Suppress unused import warning for X */}
        <span className="hidden"><X /></span>
      </div>
    </div>
  )
}
