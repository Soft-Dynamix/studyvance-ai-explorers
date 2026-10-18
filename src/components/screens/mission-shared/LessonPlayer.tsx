'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Subtitles,
  ChevronDown, ChevronUp, ArrowRight,
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

// Animated floating shapes for video-like background
function AnimatedShapes({ sceneId }: { sceneId: string }) {
  const shapes = React.useMemo(() => {
    const rng = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 8 }, (_, i) => ({
      id: `${sceneId}-${i}`,
      left: `${rng(i * 3 + 1) * 90}%`,
      top: `${rng(i * 7 + 3) * 90}%`,
      size: 20 + rng(i * 11 + 7) * 40,
      delay: rng(i * 13 + 5) * 3,
      duration: 3 + rng(i * 17 + 11) * 4,
      color: ['bg-turquoise/20', 'bg-sunshine/15', 'bg-white/10'][i % 3],
    }))
  }, [sceneId])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className={cn('absolute rounded-full blur-md', s.color)}
          style={{ left: s.left, top: s.top, width: s.size, height: s.size }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Animated typing text effect
function TypingCaption({ text, active }: { text: string; active: boolean }) {
  const [displayText, setDisplayText] = React.useState('')
  const [charIdx, setCharIdx] = React.useState(0)

  React.useEffect(() => {
    if (!active) {
      setDisplayText('')
      setCharIdx(0)
      return
    }
    if (charIdx < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.substring(0, charIdx + 1))
        setCharIdx(charIdx + 1)
      }, 45)
      return () => clearTimeout(timer)
    }
  }, [charIdx, text, active])

  React.useEffect(() => {
    if (active) {
      setDisplayText('')
      setCharIdx(0)
    }
  }, [text, active])

  return (
    <span>
      {displayText}
      {active && charIdx < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-sunshine ml-0.5"
        />
      )}
    </span>
  )
}

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
  const [audioError, setAudioError] = React.useState(false)
  const recordedRef = React.useRef(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const progressTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const scene = scenes[idx]
  const total = scenes.length

  // Start audio for a scene
  const playScene = React.useCallback((i: number) => {
    const sc = scenes[i]
    if (!sc) return

    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProgress(0)
    setAudioError(false)

    if (!soundOn) {
      // No sound: use estimated duration timer
      const estMs = Math.max(10000, sc.transcript.length * 60)
      const startTime = Date.now()
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
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
      return
    }

    // Play WAV audio file
    const audio = new Audio(sc.audio)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration
      if (duration && isFinite(duration)) {
        progressTimerRef.current = setInterval(() => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100)
          }
        }, 200)
      }
    })

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener('ended', () => {
      setProgress(100)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      // Auto-advance to next scene
      if (i < scenes.length - 1) {
        setIdx(i + 1)
      } else {
        setPlaying(false)
      }
    })

    audio.addEventListener('error', () => {
      setAudioError(true)
      setPlaying(false)
      // Fallback: use timer-based auto-advance
      const estMs = Math.max(10000, sc.transcript.length * 60)
      const startTime = Date.now()
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
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
    })

    // Try to play (may fail if autoplay blocked)
    audio.play().catch(() => {
      setAudioError(true)
      // Fallback: timer-based
      const estMs = Math.max(10000, sc.transcript.length * 60)
      const startTime = Date.now()
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
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
    })
  }, [scenes, soundOn])

  // When scene changes and playing, start audio
  React.useEffect(() => {
    if (playing) {
      playScene(idx)
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [idx, playing, playScene])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      if (audioRef.current) audioRef.current.pause()
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    } else {
      setPlaying(true)
      playScene(idx)
    }
  }

  const replay = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    setIdx(0)
    setProgress(0)
    setPlaying(true)
    recordedRef.current = false
    playScene(0)
  }

  const goToScene = (i: number) => {
    if (audioRef.current) audioRef.current.pause()
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
    if (audioRef.current) audioRef.current.pause()
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    nextScreen()
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Video stage */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatedShapes sceneId={scene.id} />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-navy-soft shadow-2xl ring-1 ring-turquoise/30"
            >
              {/* Layer 1: Illustration with Ken Burns zoom (slow pan) */}
              <motion.div
                key={`img-${scene.id}`}
                initial={{ scale: 1.0, x: '0%', y: '0%' }}
                animate={reducedMotion ? {} : {
                  scale: [1.0, 1.12, 1.08, 1.15],
                  x: ['0%', '3%', '-2%', '1%'],
                  y: ['0%', '-2%', '2%', '-1%'],
                }}
                transition={{
                  duration: 20,
                  times: [0, 0.33, 0.66, 1],
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
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

              {/* Layer 2: Gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-navy/50" />

              {/* Layer 3: Animated floating particles (sparkle effect) */}
              {!reducedMotion && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`sparkle-${scene.id}-${i}`}
                      className="absolute h-1.5 w-1.5 rounded-full bg-sunshine"
                      style={{
                        left: `${15 + i * 13}%`,
                        top: `${20 + (i % 3) * 25}%`,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        y: [0, -20, -40],
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Layer 4: Scene badge (top-left, video chapter style) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="absolute left-4 top-4"
              >
                <div className="flex items-center gap-2 rounded-full bg-turquoise px-4 py-1.5 shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-navy">
                    Scene {idx + 1} / {total}
                  </span>
                </div>
              </motion.div>

              {/* Layer 5: Scene title (top-right, animated reveal) */}
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

              {/* Layer 6: Playing indicator (pulsing red dot) */}
              {playing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-4 bottom-24 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1 backdrop-blur shadow-lg"
                >
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-white"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Playing</span>
                </motion.div>
              )}

              {/* Layer 7: Audio error indicator */}
              {audioError && soundOn && (
                <div className="absolute left-4 bottom-24 flex items-center gap-2 rounded-full bg-amber-500/90 px-3 py-1.5 backdrop-blur">
                  <span className="text-xs font-semibold text-navy">Audio loading — tap play</span>
                </div>
              )}

              {/* Layer 8: Caption with typing effect (bottom, video subtitles) */}
              {ccOn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="absolute bottom-0 left-0 right-0 p-6 pt-16"
                >
                  <div className="mx-auto max-w-2xl">
                    <div className="rounded-xl bg-navy/70 px-5 py-3 text-center backdrop-blur-md ring-1 ring-turquoise/30">
                      <p className="text-base font-semibold text-cream sm:text-lg">
                        <TypingCaption text={scene.caption} active={playing} />
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress scrubber (video player style) */}
          <div className="w-full max-w-3xl">
            <div className="group relative h-1.5 overflow-hidden rounded-full bg-cream/15">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-turquoise"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.15 }}
              />
              {playing && (
                <motion.div
                  className="absolute top-0 h-full w-1 rounded-full bg-sunshine shadow-lg"
                  style={{ left: `${progress}%` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
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
            <Button
              size="icon"
              variant="ghost"
              onClick={replay}
              aria-label="Replay"
              className="text-cream hover:bg-cream/10"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setSoundOn(!soundOn)
                if (!soundOn && audioRef.current) {
                  audioRef.current.pause()
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
