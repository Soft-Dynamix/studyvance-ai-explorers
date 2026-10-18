'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Save, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION_CONTENT } from '@/lib/curriculum'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function GenericPortfolioScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const missionId = useApp((s) => s.currentMission)
  const record = useProgressRecorder()
  const content = MISSION_CONTENT[missionId]
  const prompts = content?.portfolioPrompts ?? []

  // If m6 has no prompts, skip directly to reward.
  React.useEffect(() => {
    if (prompts.length === 0) {
      setScreen(nextScreenFor(missionId, 'portfolio'))
    }
  }, [prompts.length, missionId, setScreen])

  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  if (prompts.length === 0) return null

  const filledCount = Object.values(values).filter((v) => v.trim().length > 0).length
  const allFilled = filledCount === prompts.length

  const submit = async () => {
    if (!allFilled) {
      toast.error('Please fill in all the prompts.')
      return
    }
    setSaving(true)
    try {
      const storyText = prompts.map((p) => `${p.label}\n${values[p.id]?.trim()}`).join('\n\n')
      // Try to save to server, but don't block on it
      try {
        await api('/api/portfolio', {
          method: 'POST',
          json: { missionId, storyText, assistanceNote: 'own_first_draft' },
        })
        toast.success('Portfolio saved!')
      } catch {
        toast.success('Portfolio saved locally!')
      }
      await record({
        missionId,
        activityId: 'portfolio',
        eventType: 'completed',
        payload: { values },
      })
      setScreen(nextScreenFor(missionId, 'portfolio'))
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save portfolio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId={missionId} step="My portfolio" />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-turquoise/10 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Write in your own words. Examples are just
          for inspiration.
        </div>

        <div className="space-y-5">
          {prompts.map((p, idx) => {
            const isLong = p.placeholder.length > 60
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl bg-card p-4 shadow-sm"
              >
                <Label htmlFor={p.id} className="font-display text-base">
                  {p.label}
                </Label>
                {isLong ? (
                  <Textarea
                    id={p.id}
                    value={values[p.id] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                    placeholder={p.placeholder}
                    rows={3}
                    className="mt-2"
                  />
                ) : (
                  <Input
                    id={p.id}
                    value={values[p.id] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                    placeholder={p.placeholder}
                    className="mt-2"
                  />
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Example: <em>{p.example}</em>
                </p>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Badge variant={allFilled ? 'sunshine' : 'secondary'}>
            {filledCount}/{prompts.length} filled
          </Badge>
          <Button variant="navy" onClick={submit} disabled={!allFilled || saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & continue'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
