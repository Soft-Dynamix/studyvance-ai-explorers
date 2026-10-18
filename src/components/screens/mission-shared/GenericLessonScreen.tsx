'use client'

import { LessonPlayer } from '@/components/screens/mission-shared/LessonPlayer'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { MISSION_CONTENT } from '@/lib/curriculum'

export function GenericLessonScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const missionId = useApp((s) => s.currentMission)
  const content = MISSION_CONTENT[missionId]
  if (!content) return null

  return (
    <div className="min-h-screen bg-navy text-cream">
      <MissionHeader missionId={missionId} step="Lesson" />
      <LessonPlayer
        scenes={content.lesson}
        missionId={missionId}
        nextScreen={() => setScreen(nextScreenFor(missionId, 'lesson'))}
      />
    </div>
  )
}
