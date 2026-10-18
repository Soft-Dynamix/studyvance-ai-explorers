'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, ShieldCheck, GraduationCap, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/ui/mascot'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useApp } from '@/lib/store'
import { WELCOME_AUDIO, WELCOME_TRANSCRIPT } from '@/lib/curriculum'

export function WelcomeScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const [privacyOpen, setPrivacyOpen] = React.useState(false)
  const [welcomeOpen, setWelcomeOpen] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const playWelcome = React.useCallback(() => {
    setWelcomeOpen(true)
    if (!soundOn) return
    try {
      const el = new Audio(WELCOME_AUDIO)
      audioRef.current = el
      el.play().catch(() => {})
    } catch {
      // ignore
    }
  }, [soundOn])

  React.useEffect(() => {
    return () => {
      try {
        audioRef.current?.pause()
      } catch {
        // ignore
      }
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy text-cream">
      {/* Star field */}
      <div className="pointer-events-none absolute inset-0 bg-stars opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-adventure-grid opacity-30" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2 inline-flex items-center gap-2 rounded-full bg-sunshine/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-sunshine"
        >
          <span className="h-2 w-2 rounded-full bg-sunshine" /> Level 1 · Pilot
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="font-display text-4xl font-extrabold leading-tight sm:text-6xl"
        >
          StudyVance <span className="text-turquoise">AI</span> Explorers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 max-w-xl text-base text-cream/80 sm:text-lg"
        >
          A friendly adventure for South African Grade 4–6 explorers. Learn what AI is, stay safe,
          and think like a real explorer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Mascot size={140} message={soundOn ? 'Tap play to hear my welcome!' : 'Welcome, explorer!'} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
          <Button size="lg" variant="sunshine" onClick={() => setScreen('signin')}>
            <Play className="h-5 w-5" /> Start exploring
          </Button>
          <Button size="lg" variant="outline" className="border-cream text-cream hover:bg-cream hover:text-navy" onClick={playWelcome}>
            <Volume2 className="h-5 w-5" /> Hear from Vance
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs"
        >
          <button
            onClick={() => setPrivacyOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-3 py-1.5 font-medium text-cream/80 transition hover:bg-cream/10"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Privacy &amp; safety
          </button>
          <button
            onClick={() => setScreen('tutor')}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-3 py-1.5 font-medium text-cream/80 transition hover:bg-cream/10"
          >
            <GraduationCap className="h-3.5 w-3.5" /> Tutor / Admin
          </button>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-3 py-1.5 font-medium text-cream/80 transition hover:bg-cream/10"
            aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
        </motion.div>
      </div>

      {/* Privacy dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-turquoise" /> Privacy &amp; safety
            </DialogTitle>
            <DialogDescription>
              How StudyVance keeps young explorers safe.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-navy">
            <li className="rounded-lg bg-turquoise/10 p-3">
              <strong>No real personal info.</strong> Use fictional names like Pip. Never share your
              real full name, address, phone number, password, or another child&apos;s photo.
            </li>
            <li className="rounded-lg bg-sunshine/10 p-3">
              <strong>Local first.</strong> Activities save to this device. They sync to your tutor
              when you are online.
            </li>
            <li className="rounded-lg bg-muted p-3">
              <strong>Help is one tap away.</strong> The yellow help button is on every learner
              screen.
            </li>
          </ul>
        </DialogContent>
      </Dialog>

      {/* Welcome transcript dialog */}
      <Dialog open={welcomeOpen} onOpenChange={(o) => { setWelcomeOpen(o); if (!o) { try { audioRef.current?.pause() } catch { /* */ } } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vance&apos;s welcome</DialogTitle>
            <DialogDescription>Read along as Vance says hello.</DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-muted p-4 text-base text-navy">{WELCOME_TRANSCRIPT}</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
