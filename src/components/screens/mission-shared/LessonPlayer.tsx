'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Subtitles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
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

// Ken Burns zoom variants — makes static illustrations feel like video
const ZOOM_VARIANTS = [
  { scale: 1.15, x: '2%', y: '-2%', transition: { duration: 20, ease: 'easeOut' } },
  { scale: 1.2, x: '-3%', y: '2%', transition: { duration: 22, ease: 'easeOut' } },
  { scale: 1.1, x: '0%', y: '3%', transition: { duration: 18, ease: 'easeOut' } },
  { scale: 1.18, x: '3%', y: '0%', transition: { duration: 24, ease: 'easeOut' } },
]

export function LessonPlayer({ scenes, missionId, nextScreen }: Props) {
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const reducedMotion = useApp((s) => s.reducedMotion)
  const record = useProgressRecorder()

  const [idx, setIdx] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [ccOn, setCcOn] = React.useState(true)
  const [transcriptOpen, setTranscriptOpen] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const recordedRef = React.useRef(false)
  const utterRef = React.useRef<SpeechSynthesisUtterance | null>(null)
  const progressTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const scene = scenes[idx]
  const total = scenes.length
  const zoomVariant = ZOOM_VARIANTS[idx % ZOOM_VARIANTS.length]

  // Pick the best available English voice
  const getEnglishVoice = React.useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const voices = window.speechSynthesis.getVoices()
    // Prefer native English voices
    const preferred = [
      'Google US English',
      'Google UK English Male',
      'Google UK English Female',
      'Microsoft Jenny',
      'Microsoft Guy',
      'Microsoft Aria',
      'Samantha',
      'Daniel',
      'Karen',
    ]
    for (const name of preferred) {
      const v = voices.find(v => v.name === name)
      if (v) return v
    }
    // Fallback: any English voice
    const enVoice = voices.find(v => v.lang.startsWith('en'))
    return enVoice || null
  }, [])

  // Load voices on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices() // trigger load
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const startProgressTimer = (durationMs: number) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    const startTime = Date.now()
    setProgress(0)
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min(100, (elapsed / durationMs) * 100))
    }, 200)
  }

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  const speak = React.useCallback((text: string, onDone: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // No speech synthesis — estimate duration from text length
      const estimatedMs = Math.max(8000, text.length * 55)
      startProgressTimer(estimatedMs)
      const timer = setTimeout(() => {
        setProgress(100)
        onDone()
      }, estimatedMs)
      return () => clearTimeout(timer)
    }

    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    const voice = getEnglishVoice()
    if (voice) {
      utter.voice = voice
      utter.lang = voice.lang
    } else {
      utter.lang = 'en-US'
    }
    utter.rate = 0.9
    utter.pitch = 1.0
    utter.volume = 1.0

    utter.onstart = () => {
      // Estimate duration: ~15 chars per second at rate 0.9
      const estimatedMs = Math.max(8000, text.length * 65)
      startProgressTimer(estimatedMs)
    }

    utter.onboundary = (event) => {
      // Could be used for word highlighting
      void event
    }

    utter.onend = () => {
      setProgress(100)
      stopProgressTimer()
      onDone()
    }

    utter.onerror = () => {
      stopProgressTimer()
      onDone()
    }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [getEnglishVoice])

  const playScene = React.useCallback((i: number) => {
    const sc = scenes[i]
    if (!sc) return

    // Stop any existing speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopProgressTimer()

    if (soundOn) {
      speak(sc.transcript, () => {
        // Auto-advance when speech ends
        if (i < scenes.length - 1) {
          setIdx(i + 1)
        } else {
          setPlaying(false)
          setProgress(100)
        }
      })
    } else {
      // No sound — use a timer to auto-advance
      const estimatedMs = Math.max(8000, sc.transcript.length * 55)
      startProgressTimer(estimatedMs)
      const timer = setTimeout(() => {
        setProgress(100)
        if (i < scenes.length - 1) {
          setIdx(i + 1)
        } else {
          setPlaying(false)
        }
      }, estimatedMs)
      return () => clearTimeout(timer)
    }
  }, [scenes, soundOn, speak])

  // When scene changes, play if we're in playing state
  React.useEffect(() => {
    if (playing) {
      const cleanup = playScene(idx)
      return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
        stopProgressTimer()
        cleanup?.()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, playing])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      stopProgressTimer()
    } else {
      setPlaying(true)
      playScene(idx)
    }
  }

  const replay = () => {
    setIdx(0)
    setPlaying(true)
    setProgress(0)
    recordedRef.current = false
    playScene(0)
  }

  const next = () => {
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({ missionId, activityId: 'lesson', eventType: 'completed' })
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopProgressTimer()
    nextScreen()
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-40" aria-hidden />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-6">
          {/* Video-like stage with Ken Burns effect */}
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-navy-soft shadow-2xl ring-1 ring-turquoise/20"
            >
              {/* Ken Burns zoom effect on the illustration */}
              {!reducedMotion && (
                <motion.div
                  key={`zoom-${scene.id}`}
                  initial={{ scale: 1, x: '0%', y: '0%' }}
                  animate={zoomVariant}
                  className="absolute inset-0"
                >
                  <Image
                    src={scene.illustration}
                    alt={scene.title}
                    fill
                    priority
                    className="object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </motion.div>
              )}
              {reducedMotion && (
                <Image
                  src={scene.illustration}
                  alt={scene.title}
                  fill
                  priority
                  className="object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-navy/40" />

              {/* Scene label (top-left, like a video chapter) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="absolute left-4 top-4 rounded-full bg-turquoise/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-navy backdrop-blur shadow-lg"
              >
                Scene {idx + 1} / {total}
              </motion.div>

              {/* Scene title (animated reveal, like a video title card) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute right-4 top-4 rounded-lg bg-navy/80 px-4 py-2 backdrop-blur"
              >
                <span className="text-sm font-bold text-sunshine">{scene.title}</span>
              </motion.div>

              {/* Caption / subtitle at the bottom (like video subtitles) */}
              {ccOn && (
                <motion.div
                  key={`caption-${scene.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="absolute bottom-0 left-0 right-0 p-6 pt-20"
                >
                  <div className="mx-auto max-w-2xl">
                    <div className="rounded-xl bg-navy/70 px-5 py-3 text-center backdrop-blur-md ring-1 ring-turquoise/20">
                      <p className="text-base font-semibold text-cream sm:text-lg">
                        {scene.caption}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Playing indicator (pulsing dot, like a recording light) */}
              {playing && (
                <div className="absolute right-4 bottom-20 flex items-center gap-1.5 rounded-full bg-red-500/80 px-3 py-1 backdrop-blur">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-white"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Playing</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress bar (video scrubber style) */}
          <div className="w-full max-w-3xl">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-cream/20">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-turquoise"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Scene dots */}
          <div className="flex items-center gap-2">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel()
                  }
                  stopProgressTimer()
                  setIdx(i)
                  setPlaying(false)
                  setProgress(0)
                }}
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

      {/* Controls bar (like a video player) */}
      <div className="z-20 border-t border-cream/10 bg-navy-soft/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="sunshine" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={replay} aria-label="Replay" className="text-cream hover:bg-cream/10">
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSoundOn(!soundOn)}
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
                  {transcriptOpen ? 'Hide transcript' : 'Read transcript'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-navy/40 p-3 text-sm leading-relaxed text-cream/90 scroll-area-kid">
                  {scene.transcript}
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Button variant="sunshine" onClick={next}>
              {idx < total - 1 ? (
                <>
                  Skip <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
