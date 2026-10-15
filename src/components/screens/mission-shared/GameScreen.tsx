'use client'

import { useApp } from '@/lib/store'
import { PromptBuilderGame } from '@/components/screens/mission2/PromptBuilderGame'
import { ClaimCheckGame } from '@/components/screens/mission3/ClaimCheckGame'
import { StoryEditorGame } from '@/components/screens/mission4/StoryEditorGame'
import { HintGame } from '@/components/screens/mission5/HintGame'
import { SkillsCheckGame } from '@/components/screens/mission6/SkillsCheckGame'

export function GameScreen() {
  const missionId = useApp((s) => s.currentMission)
  switch (missionId) {
    case 'm2':
      return <PromptBuilderGame />
    case 'm3':
      return <ClaimCheckGame />
    case 'm4':
      return <StoryEditorGame />
    case 'm5':
      return <HintGame />
    case 'm6':
      return <SkillsCheckGame />
    default:
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream text-navy">
          <p className="text-sm text-muted-foreground">No game for this mission yet.</p>
        </div>
      )
  }
}
