'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/ui/mascot'
import { useApp } from '@/lib/store'
import { AVATARS } from '@/lib/curriculum'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AvatarSelectScreen() {
  const learner = useApp((s) => s.learner)
  const setLearner = useApp((s) => s.setLearner)
  const setScreen = useApp((s) => s.setScreen)
  const [selected, setSelected] = React.useState(learner?.avatarId ?? 'avatar-1')
  const [saving, setSaving] = React.useState(false)

  async function continueNext() {
    if (!learner) return
    setSaving(true)
    try {
      await api('/api/learners/avatar', {
        method: 'POST',
        json: { avatarId: selected },
      })
      setLearner({ ...learner, avatarId: selected })
      setScreen('mission-map')
    } catch {
      toast.error('Could not save avatar. Continuing anyway.')
      setLearner({ ...learner, avatarId: selected })
      setScreen('mission-map')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-adventure-grid opacity-40" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Mascot size={64} message="Pick the explorer that looks like you!" />
        </div>
        <h1 className="font-display text-3xl">Choose your avatar</h1>
        <p className="text-sm text-muted-foreground">
          You can change this later. There are no wrong answers.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {AVATARS.map((a, i) => {
            const isSel = selected === a.id
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(a.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-card p-4 transition-all',
                  isSel ? 'border-turquoise ring-2 ring-turquoise' : 'border-border hover:border-turquoise/40'
                )}
                aria-pressed={isSel}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-turquoise/15">
                  <Image
                    src={a.src}
                    alt={a.label}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🌟</div>
                </div>
                <span className="font-semibold">{a.label}</span>
                {isSel && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-turquoise text-cream">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <Button size="lg" variant="navy" onClick={continueNext} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
