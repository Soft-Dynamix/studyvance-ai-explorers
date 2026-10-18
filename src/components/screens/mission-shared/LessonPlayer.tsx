'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useApp } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { cn } from '@/lib/utils'
import type { LessonScene, MissionId } from '@/lib/curriculum'

type Props = {
  scenes: LessonScene[]
  missionId: MissionId
  nextScreen: () => void
}

// ─── Visual cues: what appears on screen at each point in the narration ───
// Each cue has a delay (when it appears) and visual content
type VisualCue = {
  delay: number  // seconds after narration starts
  type: 'text' | 'emoji' | 'diagram' | 'highlight' | 'checklist'
  content: string
  subContent?: string
  emoji?: string
}

// Define visual cues for each scene — these match what the narrator says
const SCENE_CUES: Record<string, VisualCue[]> = {
  // Mission 1, Scene 1 — "Can a computer learn to recognise a cat?"
  'scene-1': [
    { delay: 0, type: 'emoji', content: 'Can a computer learn to recognise a cat?', emoji: '🤔', delay2: 0 },
    { delay: 3, type: 'emoji', content: 'How do YOU know it is a cat?', emoji: '🐱' },
    { delay: 6, type: 'text', content: 'Pointy ears', subContent: 'whiskers', emoji: '👂' },
    { delay: 9, type: 'text', content: 'Whiskers', subContent: 'long and thin', emoji: '〰️' },
    { delay: 12, type: 'text', content: 'Small nose', subContent: 'pink and soft', emoji: '👃' },
    { delay: 16, type: 'diagram', content: 'Show computer 1000s of cat photos', subContent: 'Label each one: "This is a cat"', emoji: '📸' },
    { delay: 22, type: 'highlight', content: 'Computer notices PATTERNS', subContent: 'ears + whiskers + nose = cat', emoji: '🧠' },
    { delay: 28, type: 'diagram', content: 'Show a NEW photo', subContent: 'Computer guesses: "I think this is a cat!"', emoji: '✅' },
    { delay: 34, type: 'text', content: 'Not magic!', subContent: 'It learned from examples we gave it', emoji: '✨' },
  ],
  // Mission 1, Scene 2 — AI vs ordinary programs
  'scene-2': [
    { delay: 0, type: 'text', content: 'Ordinary Programs', subContent: 'Follow fixed steps', emoji: '⚙️' },
    { delay: 4, type: 'emoji', content: 'Calculator: 1+1 = 2', emoji: '🧮' },
    { delay: 8, type: 'emoji', content: 'Kitchen Timer: count down', emoji: '⏰' },
    { delay: 12, type: 'text', content: 'Always the same', subContent: 'Never learns anything new', emoji: '🔁' },
    { delay: 16, type: 'highlight', content: 'AI is DIFFERENT', subContent: 'It LEARNS from examples', emoji: '🧠' },
    { delay: 22, type: 'diagram', content: 'Train on animal photos', subContent: 'Guesses: "This is a cat"', emoji: '🐱' },
    { delay: 28, type: 'diagram', content: 'Reads many stories', subContent: 'Writes a new story', emoji: '📖' },
    { delay: 34, type: 'checklist', content: 'Did it learn from examples?', subContent: 'Or just follow fixed steps?', emoji: '❓' },
  ],
  // Mission 1, Scene 3 — Privacy rule
  'scene-3': [
    { delay: 0, type: 'highlight', content: 'AI can make MISTAKES', subContent: 'A confident answer is NOT proof', emoji: '⚠️' },
    { delay: 5, type: 'checklist', content: 'Never share your:', emoji: '🔒' },
    { delay: 8, type: 'emoji', content: 'Real full name', emoji: '👤' },
    { delay: 11, type: 'emoji', content: 'Home address', emoji: '🏠' },
    { delay: 14, type: 'emoji', content: 'Phone number', emoji: '📱' },
    { delay: 17, type: 'emoji', content: 'Password', emoji: '🔑' },
    { delay: 20, type: 'emoji', content: "Other child's photo", emoji: '📷' },
    { delay: 24, type: 'highlight', content: 'Use MADE-UP names', subContent: 'Like Pip the robot rabbit', emoji: '🐰' },
    { delay: 30, type: 'checklist', content: 'Be kind. Be safe. Be truthful.', emoji: '✅' },
  ],
}

// Get cues for a scene (fallback: show caption as text)
function getSceneCues(sceneId: string, caption: string): VisualCue[] {
  if (SCENE_CUES[sceneId]) return SCENE_CUES[sceneId]
  // Fallback: just show the caption as a single text cue
  return [{ delay: 0, type: 'text', content: caption, emoji: '💡' }]
}

// ─── Visual cue renderer ───
function CueCard({ cue, active }: { cue: VisualCue; active: boolean }) {
  if (!active) return null

  const baseClass = 'rounded-2xl backdrop-blur-md shadow-2xl ring-1 '

  if (cue.type === 'emoji') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={cn(baseClass, 'bg-navy/85 p-6 text-center ring-turquoise/40')}
      >
        <div className="text-5xl mb-2">{cue.emoji}</div>
        <div className="text-lg font-bold text-cream">{cue.content}</div>
      </motion.div>
    )
  }

  if (cue.type === 'text') {
    return (
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(baseClass, 'bg-turquoise/90 p-5 ring-turquoise/50')}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cue.emoji}</span>
          <div>
            <div className="text-xl font-bold text-navy">{cue.content}</div>
            {cue.subContent && <div className="text-sm text-navy/80">{cue.subContent}</div>}
          </div>
        </div>
      </motion.div>
    )
  }

  if (cue.type === 'highlight') {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 150 }}
        className={cn(baseClass, 'bg-sunshine p-6 ring-sunshine/50')}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">{cue.emoji}</span>
          <div>
            <div className="text-xl font-extrabold text-navy">{cue.content}</div>
            {cue.subContent && <div className="text-sm text-navy/70">{cue.subContent}</div>}
          </div>
        </div>
      </motion.div>
    )
  }

  if (cue.type === 'diagram') {
    return (
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(baseClass, 'bg-navy/90 p-5 ring-turquoise/40')}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cue.emoji}</span>
          <div>
            <div className="text-base font-bold text-turquoise">{cue.content}</div>
            {cue.subContent && <div className="text-sm text-cream/80">{cue.subContent}</div>}
          </div>
        </div>
      </motion.div>
    )
  }

  if (cue.type === 'checklist') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={cn(baseClass, 'bg-navy/85 p-5 ring-sunshine/40')}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cue.emoji}</span>
          <div className="text-base font-bold text-sunshine">{cue.content}</div>
        </div>
      </motion.div>
    )
  }

  return null
}

// ─── Main Lesson Player ───
export function LessonPlayer({ scenes, missionId, nextScreen }: Props) {
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const record = useProgressRecorder()

  const [idx, setIdx] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [transcriptOpen, setTranscriptOpen] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0) // seconds
  const recordedRef = React.useRef(false)
  const utterRef = React.useRef<SpeechSynthesisUtterance | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = React.useRef<number>(0)

  const scene = scenes[idx]
  const total = scenes.length
  const cues = getSceneCues(scene.id, scene.caption)

  // Get best English voice from browser
  const getVoice = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const voices = window.speechSynthesis.getVoices()
    const preferred = [
      'Google US English', 'Google UK English Male', 'Google UK English Female',
      'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Aria', 'Microsoft Davis',
      'Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa',
    ]
    for (const name of preferred) {
      const v = voices.find(v => v.name === name)
      if (v) return v
    }
    return voices.find(v => v.lang.startsWith('en')) || null
  }, [])

  // Load voices
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) return
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel() }
  }, [])

  // Start narration for a scene
  const playScene = React.useCallback((i: number) => {
    const sc = scenes[i]
    if (!sc) return

    // Stop existing
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (timerRef.current) clearInterval(timerRef.current)

    setProgress(0)
    setElapsed(0)
    startTimeRef.current = Date.now()

    // Start elapsed timer for visual cues
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setElapsed(elapsed)
      // Estimate progress (assume ~15 chars per second)
      const estDuration = Math.max(10, sc.transcript.length / 15)
      setProgress(Math.min(95, (elapsed / estDuration) * 100))
    }, 200)

    if (soundOn) {
      // Use browser SpeechSynthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(sc.transcript)
        const voice = getVoice()
        if (voice) {
          utter.voice = voice
          utter.lang = voice.lang
        } else {
          utter.lang = 'en-US'
        }
        utter.rate = 0.85
        utter.pitch = 1.0

        utter.onend = () => {
          setProgress(100)
          if (timerRef.current) clearInterval(timerRef.current)
          // Auto-advance
          if (i < scenes.length - 1) {
            setTimeout(() => setIdx(i + 1), 500)
          } else {
            setPlaying(false)
          }
        }

        utter.onerror = () => {
          if (timerRef.current) clearInterval(timerRef.current)
          // Fallback: auto-advance after estimated time
          const estMs = Math.max(10000, sc.transcript.length * 55)
          setTimeout(() => {
            if (i < scenes.length - 1) setIdx(i + 1)
            else setPlaying(false)
          }, estMs)
        }

        utterRef.current = utter
        window.speechSynthesis.speak(utter)
      }
    } else {
      // No sound: auto-advance after estimated time
      const estMs = Math.max(10000, sc.transcript.length * 55)
      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        setProgress(100)
        if (i < scenes.length - 1) setIdx(i + 1)
        else setPlaying(false)
      }, estMs)
    }
  }, [scenes, soundOn, getVoice])

  // When scene changes and playing, start narration
  React.useEffect(() => {
    if (playing) {
      playScene(idx)
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [idx, playing, playScene])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      setPlaying(true)
      playScene(idx)
    }
  }

  const replay = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIdx(0)
    setProgress(0)
    setElapsed(0)
    setPlaying(true)
    recordedRef.current = false
    playScene(0)
  }

  const goToScene = (i: number) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIdx(i)
    setProgress(0)
    setElapsed(0)
    setPlaying(false)
  }

  const next = () => {
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({ missionId, activityId: 'lesson', eventType: 'completed' })
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    nextScreen()
  }

  // Determine which cues are active based on elapsed time
  const activeCues = cues.filter(cue => elapsed >= cue.delay)
  const currentCue = activeCues[activeCues.length - 1] // most recent cue

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Video stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-30" aria-hidden />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-4 py-6">
          {/* Animated educational scene */}
          <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-gradient-to-br from-navy-soft to-navy shadow-2xl ring-1 ring-turquoise/30">

            {/* Background illustration (faded) */}
            <div className="absolute inset-0 opacity-30">
              <Image
                src={scene.illustration}
                alt={scene.title}
                fill
                priority
                className="object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            </div>

            {/* Scene badge */}
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-turquoise px-4 py-1.5 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-navy">
                Scene {idx + 1} / {total}
              </span>
            </div>

            {/* Scene title */}
            <div className="absolute right-4 top-4 z-20 rounded-lg bg-navy/80 px-4 py-2 backdrop-blur ring-1 ring-turquoise/30">
              <span className="text-sm font-bold text-sunshine">{scene.title}</span>
            </div>

            {/* Visual cues — the animated educational content that shows what's spoken */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <AnimatePresence mode="popLayout">
                {currentCue && (
                  <CueCard key={`${scene.id}-${currentCue.delay}`} cue={currentCue} active={true} />
                )}
              </AnimatePresence>
            </div>

            {/* Previous cues (smaller, fading at edges) */}
            <div className="absolute left-4 bottom-20 z-10 flex flex-col gap-1">
              {activeCues.slice(-3, -1).map((cue, i) => (
                <motion.div
                  key={`prev-${cue.delay}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 - i * 0.1 }}
                  className="flex items-center gap-1.5 text-xs text-cream"
                >
                  <span>{cue.emoji}</span>
                  <span className="truncate max-w-[120px]">{cue.content}</span>
                </motion.div>
              ))}
            </div>

            {/* Playing indicator */}
            {playing && (
              <div className="absolute right-4 bottom-20 z-20 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-0.5 backdrop-blur">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-white"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Play</span>
              </div>
            )}

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-navy via-navy/80 to-transparent p-4 pt-12">
              <p className="text-center text-sm font-semibold text-cream/90 sm:text-base">
                {scene.caption}
              </p>
            </div>

            {/* Big play button when paused */}
            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 transition hover:bg-black/50"
                aria-label="Play"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-turquoise shadow-2xl"
                >
                  <Play className="h-10 w-10 text-navy" fill="currentColor" />
                </motion.div>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full max-w-3xl">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-cream/20">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-turquoise"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
          </div>

          {/* Scene dots */}
          <div className="mt-3 flex items-center gap-2">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToScene(i)}
                aria-label={`Scene ${i + 1}`}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  i === idx ? 'w-8 bg-sunshine' : i < idx ? 'w-2.5 bg-turquoise/60' : 'w-2.5 bg-cream/30 hover:bg-cream/50'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="z-20 border-t border-cream/10 bg-navy-soft/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="sunshine" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="h-12 w-12">
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={replay} aria-label="Replay" className="text-cream hover:bg-cream/10">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const next = !soundOn
                setSoundOn(next)
                if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel()
                }
              }}
              aria-label={soundOn ? 'Mute' : 'Unmute'}
              className="text-cream hover:bg-cream/10"
            >
              {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>

          <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen} className="flex-1 min-w-0">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-cream hover:bg-cream/10">
                {transcriptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {transcriptOpen ? 'Hide' : 'Read'} transcript
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-navy/40 p-3 text-sm leading-relaxed text-cream/90 scroll-area-kid">
                {scene.transcript}
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Button variant="sunshine" onClick={next}>
            {idx < total - 1 ? 'Skip' : 'Continue'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
