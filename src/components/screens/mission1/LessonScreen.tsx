'use client'

import { LessonPlayer } from '@/components/screens/mission-shared/LessonPlayer'
import { MissionHeader } from '@/components/screens/mission-shared/MissionHeader'
import { useApp, nextScreenFor } from '@/lib/store'
import { MISSION1_LESSON } from '@/lib/curriculum'

export function LessonScreen() {
  const setScreen = useApp((s) => s.setScreen)
  return (
    <div className="min-h-screen bg-navy text-cream">
      <MissionHeader missionId="m1" step="Lesson" />
      <LessonPlayer
        scenes={MISSION1_LESSON}
        missionId="m1"
        nextScreen={() => setScreen(nextScreenFor('m1', 'm1-lesson'))}
      />
    </div>
  )
}
