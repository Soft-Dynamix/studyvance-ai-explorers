'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Subtitles,
  ChevronDown, ChevronUp, ArrowRight, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useApp } from '@/lib/store'
import { useProgressRecorder } from '@/hooks/use-progress-recorder'
import { cn } from '@/lib/utils'
import type { LessonScene } from '@/lib/curriculum'

type Props = {
  scenes: LessonScene[]
  missionId: string
  nextScreen: () => void
}

// ─── Animated educational scene ───
// Instead of a static image, this renders multiple animated layers:
// 1. Background illustration (slowly drifting)
// 2. Floating concept bubbles that appear/fade
// 3. Animated text keywords that pop in
// 4. Sparkle effects
// 5. Vance mascot that floats
function AnimatedScene({ scene, playing, idx }: { scene: LessonScene; playing: boolean; idx: number }) {
  // Split caption into words for staggered reveal
  const words = scene.caption.split(' ')

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 1: Background illustration with slow drift */}
      <motion.div
        key={`bg-${scene.id}`}
        initial={{ scale: 1.05, x: '2%', y: '-1%' }}
        animate={{
          scale: [1.05, 1.15, 1.1, 1.12],
          x: ['2%', '-3%', '1%', '-2%'],
          y: ['-1%', '2%', '-2%', '1%'],
        }}
        transition={{ duration: 25, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className="absolute inset-0"
      >
        <Image
          src={scene.illustration}
          alt={scene.title}
          fill
          priority
          className="object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      </motion.div>

      {/* Layer 2: Dark gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-navy/30" />

      {/* Layer 3: Floating concept bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`bubble-${scene.id}-${i}`}
            className="absolute rounded-2xl bg-white/10 backdrop-blur-sm"
            style={{
              left: `${10 + i * 18}%`,
              top: `${15 + (i % 3) * 20}%`,
              width: `${40 + i * 10}px`,
              height: `${40 + i * 10}px`,
            }}
            animate={{
              y: [0, -25, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 4 + i,
              delay: i * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Layer 4: Sparkle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`spark-${scene.id}-${i}`}
            className="absolute"
            style={{
              left: `${5 + i * 11}%`,
              top: `${10 + (i % 4) * 22}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2.5,
              delay: i * 0.4,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          >
            <Sparkles className="h-4 w-4 text-sunshine" />
          </motion.div>
        ))}
      </div>

      {/* Layer 5: Scene badge */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute left-4 top-4"
      >
        <div className="flex items-center gap-2 rounded-full bg-turquoise px-4 py-1.5 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-navy">
            Scene {idx + 1}
          </span>
        </div>
      </motion.div>

      {/* Layer 6: Scene title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="absolute right-4 top-4"
      >
        <div className="rounded-lg bg-navy/80 px-4 py-2 backdrop-blur ring-1 ring-turquoise/30">
          <span className="text-sm font-bold text-sunshine">{scene.title}</span>
        </div>
      </motion.div>

      {/* Layer 7: Caption with word-by-word reveal */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-20">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-navy/75 px-5 py-3 text-center backdrop-blur-md ring-1 ring-turquoise/30">
            <p className="text-base font-semibold text-cream sm:text-lg">
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={playing ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.3 }}
                  className="inline-block mr-1"
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* Layer 8: Vance mascot floating in corner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute right-4 bottom-24"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/assets/mascot/vance-robot.png"
            alt="Vance"
            width={48}
            height={48}
            className="opacity-80"
          />
        </motion.div>
      </motion.div>

      {/* Layer 9: Playing indicator */}
      {playing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-4 bottom-24 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-0.5 backdrop-blur"
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full bg-white"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">Play</span>
        </motion.div>
      )}
    </div>
  )
}

export function LessonPlayer({ scenes, missionId, nextScreen }: Props) {
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const record = useProgressRecorder()

  const [idx, setIdx] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [ccOn, setCcOn] = React.useState(true)
  const [transcriptOpen, setTranscriptOpen] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [voiceReady, setVoiceReady] = React.useState(false)
  const recordedRef = React.useRef(false)
  const utterRef = React.useRef<SpeechSynthesisUtterance | null>(null)
  const progressTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const scene = scenes[idx]
  const total = scenes.length

  // Load voices
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) setVoiceReady(true)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Get best English voice
  const getVoice = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const voices = window.speechSynthesis.getVoices()
    // Priority list of native English voices
    const preferred = [
      'Google US English', 'Google UK English Male', 'Google UK English Female',
      'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Aria', 'Microsoft Davis',
      'Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa',
    ]
    for (const name of preferred) {
      const v = voices.find(v => v.name === name)
      if (v) return v
    }
    // Any English voice
    return voices.find(v => v.lang.startsWith('en')) || null
  }, [])

  // Speak using browser SpeechSynthesis (native English voice)
  const speak = React.useCallback((text: string, onDone: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // Fallback: timer-based
      const estMs = Math.max(10000, text.length * 55)
      const start = Date.now()
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - start
        setProgress(Math.min(100, (elapsed / estMs) * 100))
        if (elapsed >= estMs) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current)
          setProgress(100)
          onDone()
        }
      }, 200)
      return
    }

    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    const voice = getVoice()
    if (voice) {
      utter.voice = voice
      utter.lang = voice.lang
    } else {
      utter.lang = 'en-US'
    }
    utter.rate = 0.85
    utter.pitch = 1.0
    utter.volume = 1.0

    const estMs = Math.max(10000, text.length * 65)

    utter.onstart = () => {
      const start = Date.now()
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - start
        setProgress(Math.min(95, (elapsed / estMs) * 100))
      }, 200)
    }

    utter.onend = () => {
      setProgress(100)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      onDone()
    }

    utter.onerror = () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      onDone()
    }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [getVoice])

  // Play scene
  const playScene = React.useCallback((i: number) => {
    const sc = scenes[i]
    if (!sc) return

    // Stop existing speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgress(0)

    if (soundOn) {
      speak(sc.transcript, () => {
        // Auto-advance
        if (i < scenes.length - 1) {
          setIdx(i + 1)
        } else {
          setPlaying(false)
          setProgress(100)
        }
      })
    } else {
      // No sound: timer-based auto-advance
      const estMs = Math.max(10000, sc.transcript.length * 55)
      const start = Date.now()
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - start
        setProgress(Math.min(100, (elapsed / estMs) * 100))
        if (elapsed >= estMs) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current)
          if (i < scenes.length - 1) {
            setIdx(i + 1)
          } else {
            setPlaying(false)
            setProgress(100)
          }
        }
      }, 200)
    }
  }, [scenes, soundOn, speak])

  // When scene changes and playing, start narration
  React.useEffect(() => {
    if (playing) {
      playScene(idx)
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [idx, playing, playScene])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    } else {
      setPlaying(true)
      playScene(idx)
    }
  }

  const replay = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setIdx(0)
    setProgress(0)
    setPlaying(true)
    recordedRef.current = false
    playScene(0)
  }

  const goToScene = (i: number) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setIdx(i)
    setProgress(0)
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
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    nextScreen()
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Animated video stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-40" aria-hidden />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-navy-soft shadow-2xl ring-1 ring-turquoise/30"
            >
              <AnimatedScene scene={scene} playing={playing} idx={idx} />

              {/* Big play button overlay when paused */}
              {!playing && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
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
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-full max-w-3xl">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-cream/20">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-turquoise"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
          </div>

          {/* Scene dots */}
          <div className="flex items-center gap-2">
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
            <Button
              size="icon"
              variant="sunshine"
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              className="h-12 w-12"
            >
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
            <Button
              size="icon"
              variant={ccOn ? 'sunshine' : 'ghost'}
              onClick={() => setCcOn(!ccOn)}
              aria-label="Toggle captions"
              className={cn(!ccOn && 'text-cream hover:bg-cream/10')}
            >
              <Subtitles className="h-5 w-5" />
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
