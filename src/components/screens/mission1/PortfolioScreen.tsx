'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Save, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { MISSION1_PORTFOLIO_PROMPTS } from '@/lib/curriculum'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function PortfolioScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const record = useProgressRecorder()
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  const filledCount = Object.values(values).filter((v) => v.trim().length > 0).length
  const allFilled = filledCount === MISSION1_PORTFOLIO_PROMPTS.length

  const submit = async () => {
    if (!allFilled) {
      toast.error('Please fill in all three prompts.')
      return
    }
    setSaving(true)
    try {
      const storyText = MISSION1_PORTFOLIO_PROMPTS.map(
        (p) => `${p.label} ${values[p.id]?.trim()}`
      ).join('\n')
      // Try to save to server, but don't block on it
      try {
        await api('/api/portfolio', {
          method: 'POST',
          json: { missionId: 'm1', storyText, assistanceNote: 'own_first_draft' },
        })
        toast.success('Portfolio saved!')
      } catch {
        // Server save failed (maybe session expired) — continue anyway
        toast.success('Portfolio saved locally!')
      }
      // Record progress (saved locally + queued for sync)
      await record({
        missionId: 'm1',
        activityId: 'portfolio',
        eventType: 'completed',
        payload: { values },
      })
      setScreen(nextScreenFor('m1', 'm1-portfolio'))
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save portfolio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <MissionHeader missionId="m1" step="My AI portfolio" />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-4 rounded-xl bg-turquoise/10 p-4 text-sm text-navy">
          <Lightbulb className="mr-1 inline h-4 w-4" /> Fill in your own words. There are no wrong
          answers — show what you learned!
        </div>

        <div className="space-y-5">
          {MISSION1_PORTFOLIO_PROMPTS.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-4 shadow-sm"
            >
              <Label htmlFor={p.id} className="font-display text-base">
                {p.label}
              </Label>
              <Input
                id={p.id}
                value={values[p.id] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                placeholder={p.placeholder}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Example: <em>{p.example}</em>
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Badge variant={allFilled ? 'sunshine' : 'secondary'}>
            {filledCount}/{MISSION1_PORTFOLIO_PROMPTS.length} filled
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
