'use client'

import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { useApp, initPrefsFromStorage } from '@/lib/store'
import { api } from '@/lib/api'
import { getQueuedEvents, clearQueuedEvents } from '@/lib/offline'
import { Mascot } from '@/components/ui/mascot'
import { HelpButton } from '@/components/ui/help-button'
import { WelcomeScreen } from '@/components/screens/WelcomeScreen'
import { SignInScreen } from '@/components/screens/SignInScreen'
import { AvatarSelectScreen } from '@/components/screens/AvatarSelectScreen'
import { MissionMapScreen } from '@/components/screens/MissionMapScreen'
import { LessonScreen as M1LessonScreen } from '@/components/screens/mission1/LessonScreen'
import { SortGameScreen } from '@/components/screens/mission1/SortGameScreen'
import { PrivacyGameScreen } from '@/components/screens/mission1/PrivacyGameScreen'
import { QuizScreen as M1QuizScreen } from '@/components/screens/mission1/QuizScreen'
import { PortfolioScreen as M1PortfolioScreen } from '@/components/screens/mission1/PortfolioScreen'
import { RewardScreen as M1RewardScreen } from '@/components/screens/mission1/RewardScreen'
import { GenericLessonScreen } from '@/components/screens/mission-shared/GenericLessonScreen'
import { GenericQuizScreen } from '@/components/screens/mission-shared/GenericQuizScreen'
import { GenericPortfolioScreen } from '@/components/screens/mission-shared/GenericPortfolioScreen'
import { GenericRewardScreen } from '@/components/screens/mission-shared/GenericRewardScreen'
import { GameScreen } from '@/components/screens/mission-shared/GameScreen'
import { TutorDashboard } from '@/components/screens/tutor/TutorDashboard'
import type { Screen } from '@/lib/store'

const LEARNER_SCREENS: Screen[] = [
  'avatar-select',
  'mission-map',
  'm1-lesson',
  'm1-sort',
  'm1-privacy',
  'm1-quiz',
  'm1-portfolio',
  'm1-reward',
  'lesson',
  'game',
  'quiz',
  'portfolio',
  'reward',
]

function CurrentScreen() {
  const screen = useApp((s) => s.screen)
  switch (screen) {
    case 'welcome':
      return <WelcomeScreen />
    case 'signin':
      return <SignInScreen />
    case 'avatar-select':
      return <AvatarSelectScreen />
    case 'mission-map':
      return <MissionMapScreen />
    case 'm1-lesson':
      return <M1LessonScreen />
    case 'm1-sort':
      return <SortGameScreen />
    case 'm1-privacy':
      return <PrivacyGameScreen />
    case 'm1-quiz':
      return <M1QuizScreen />
    case 'm1-portfolio':
      return <M1PortfolioScreen />
    case 'm1-reward':
      return <M1RewardScreen />
    case 'lesson':
      return <GenericLessonScreen />
    case 'game':
      return <GameScreen />
    case 'quiz':
      return <GenericQuizScreen />
    case 'portfolio':
      return <GenericPortfolioScreen />
    case 'reward':
      return <GenericRewardScreen />
    case 'tutor':
      return <TutorDashboard />
    default:
      return <WelcomeScreen />
  }
}

function HydratingShell() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
      <Mascot size={120} message="Loading your adventure…" />
      <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-turquoise" />
      </div>
      <p className="text-sm text-muted-foreground">Warming up Vance&apos;s circuits…</p>
    </div>
  )
}

export default function Page() {
  const [hydrated, setHydrated] = React.useState(false)
  const screen = useApp((s) => s.screen)
  const setScreen = useApp((s) => s.setScreen)
  const setLearner = useApp((s) => s.setLearner)
  const setState = useApp((s) => s.setState)

  React.useEffect(() => {
    let cancelled = false
    initPrefsFromStorage()
    // Refresh queue count on load
    useApp.getState().refreshQueueCount()
    ;(async () => {
      try {
        const res = await api<{ learner: any; state: any }>('/api/auth/me')
        if (cancelled) return
        if (res?.learner) {
          setLearner(res.learner)
          if (res.state) setState(res.state)
          // Try to sync any queued events now that we're logged in
          try {
            const queued = getQueuedEvents()
            if (queued.length > 0) {
              const syncRes = await api('/api/progress', { method: 'POST', json: { events: queued } })
              if (syncRes?.accepted) clearQueuedEvents(syncRes.accepted)
              if (syncRes?.skipped) clearQueuedEvents(syncRes.skipped)
              if (syncRes?.state) setState(syncRes.state)
              useApp.getState().refreshQueueCount()
            }
          } catch {}
          setScreen('mission-map')
        } else {
          // Not logged in — clear any stuck queue items (they can't be synced)
          const queued = getQueuedEvents()
          if (queued.length > 0) {
            clearQueuedEvents(queued.map((e) => e.eventId))
            useApp.getState().refreshQueueCount()
          }
          setScreen('welcome')
        }
      } catch {
        setScreen('welcome')
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setLearner, setState, setScreen])

  const showHelp = hydrated && LEARNER_SCREENS.includes(screen)

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <main className="min-h-screen bg-cream text-navy">
        {hydrated ? <CurrentScreen /> : <HydratingShell />}
      </main>
      {showHelp && <HelpButton />}
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  )
}
