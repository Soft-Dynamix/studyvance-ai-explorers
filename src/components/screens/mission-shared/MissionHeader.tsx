'use client'

import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SyncBadge } from '@/components/ui/sync-badge'
import { useApp, nextScreenFor } from '@/lib/store'
import type { MissionId } from '@/lib/curriculum'
import { MISSIONS } from '@/lib/curriculum'

const COLOR_MAP: Record<string, string> = {
  navy: 'bg-navy text-cream',
  turquoise: 'bg-turquoise text-navy',
  sunshine: 'bg-sunshine text-navy',
}

export function missionLabel(missionId: MissionId, step?: string): string {
  const m = MISSIONS.find((x) => x.id === missionId)
  if (!m) return 'Mission'
  if (!step) return `Mission ${m.order} · ${m.title}`
  return `Mission ${m.order} · ${step}`
}

type Props = {
  missionId: MissionId
  step: string
  onBack?: () => void
  rightSlot?: React.ReactNode
}

export function MissionHeader({ missionId, step, onBack, rightSlot }: Props) {
  const setScreen = useApp((s) => s.setScreen)
  const state = useApp((s) => s.state)
  const m = MISSIONS.find((x) => x.id === missionId)
  const color = m?.color ?? 'navy'

  const back = () => {
    if (onBack) onBack()
    else setScreen('mission-map')
  }

  return (
    <header className={`sticky top-0 z-20 px-4 py-3 ${COLOR_MAP[color]} shadow-sm sm:px-6`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={back}
            className={
              color === 'navy'
                ? 'text-cream hover:bg-cream/10'
                : 'text-navy hover:bg-navy/10'
            }
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>{m?.icon ?? '🚀'}</span>
              <h1 className="font-display text-lg leading-tight sm:text-xl">
                {missionLabel(missionId, step)}
              </h1>
            </div>
            <p className="text-xs opacity-80">{m?.hook ?? ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          <SyncBadge lastSyncedAt={state?.lastSyncAt} />
        </div>
      </div>
    </header>
  )
}

// Re-export for convenience
export { nextScreenFor, Badge }
