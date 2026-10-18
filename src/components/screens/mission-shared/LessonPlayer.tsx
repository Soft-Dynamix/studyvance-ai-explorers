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
import { Progress } from '@/components/ui/progress'
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

export function LessonPlayer({ scenes, missionId, nextScreen }: Props) {
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const reducedMotion = useApp((s) => s.reducedMotion)
  const record = useProgressRecorder()

  const [idx, setIdx] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [ccOn, setCcOn] = React.useState(true)
  const [transcriptOpen, setTranscriptOpen] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const recordedRef = React.useRef(false)

  const scene = scenes[idx]
  const total = scenes.length
  const progress = ((idx + (playing ? 0.5 : 1)) / total) * 100

  const playScene = React.useCallback(
    (i: number) => {
      const sc = scenes[i]
      if (!sc) return
      // Try to play audio
      try {
        if (audioRef.current) {
          audioRef.current.pause()
        }
        if (soundOn) {
          const el = new Audio(sc.audio)
          audioRef.current = el
          el.play().catch(() => {
            // Autoplay may fail; the user can press play
          })
          el.addEventListener('ended', () => {
            // Auto-advance
            if (i < scenes.length - 1) {
              setPlaying(true)
              setIdx(i + 1)
            } else {
              setPlaying(false)
            }
          })
        }
      } catch {
        // ignore
      }
    },
    [scenes, soundOn]
  )

  // When scene changes, restart audio if playing
  React.useEffect(() => {
    if (playing) playScene(idx)
    return () => {
      try {
        audioRef.current?.pause()
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      audioRef.current?.pause()
    } else {
      setPlaying(true)
      playScene(idx)
    }
  }

  const replay = () => {
    setIdx(0)
    setPlaying(true)
    playScene(0)
    recordedRef.current = false
  }

  const next = () => {
    // Mark lesson complete once when advancing past the last scene
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({
        missionId,
        activityId: 'lesson',
        eventType: 'completed',
      })
    }
    nextScreen()
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-50" aria-hidden />
        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-4 px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-2xl bg-navy-soft shadow-2xl"
            >
              <Image
                src={scene.illustration}
                alt={scene.title}
                fill
                className="object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-7xl" aria-hidden>
                    🪐
                  </span>
                  <p className="mt-2 text-xs uppercase tracking-widest opacity-70">
                    Illustration
                  </p>
                </div>
              </div>
              <div className="absolute left-4 top-4 rounded-full bg-navy/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream backdrop-blur">
                Scene {idx + 1} / {total} · {scene.title}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Caption */}
          {ccOn && (
            <motion.div
              key={`caption-${scene.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl rounded-xl bg-cream/95 px-4 py-2 text-center text-base font-semibold text-navy shadow-md"
            >
              {scene.caption}
            </motion.div>
          )}

          {/* Scene dots */}
          <div className="flex items-center gap-2">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setIdx(i)
                  setPlaying(false)
                }}
                aria-label={`Scene ${i + 1}`}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  i === idx ? 'w-7 bg-sunshine' : 'w-2.5 bg-cream/40 hover:bg-cream/60'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="z-20 border-t border-cream/10 bg-navy-soft/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-4xl space-y-3">
          <Progress value={progress} indicatorClassName="bg-sunshine" />
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

            <Button variant="sunshine" onClick={next} disabled={idx < total - 1 && !playing && idx === 0 ? false : false}>
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
