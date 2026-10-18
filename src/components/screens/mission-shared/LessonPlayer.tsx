'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Subtitles,
  ChevronDown, ChevronUp, ArrowRight, Maximize2,
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

export function LessonPlayer({ scenes, missionId, nextScreen }: Props) {
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const record = useProgressRecorder()

  const [idx, setIdx] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [ccOn, setCcOn] = React.useState(true)
  const [transcriptOpen, setTranscriptOpen] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const recordedRef = React.useRef(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  const scene = scenes[idx]
  const total = scenes.length

  // Play video for a scene
  const playScene = React.useCallback((i: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    if (soundOn) {
      video.muted = false
    } else {
      video.muted = true
    }

    video.play().then(() => {
      setPlaying(true)
    }).catch(() => {
      // Autoplay blocked — user needs to click play
      setPlaying(false)
    })
  }, [soundOn])

  // When scene changes, reload video
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.load()
    if (playing) {
      playScene(idx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
      setPlaying(false)
    } else {
      video.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  const replay = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play().then(() => {
      setPlaying(true)
      setIdx(0)
      setProgress(0)
      recordedRef.current = false
    }).catch(() => {})
  }

  const goToScene = (i: number) => {
    setPlaying(false)
    setIdx(i)
    setProgress(0)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setProgress((video.currentTime / video.duration) * 100)
  }

  const handleVideoEnded = () => {
    setPlaying(false)
    setProgress(100)
    // Auto-advance to next scene
    if (idx < total - 1) {
      setTimeout(() => {
        setIdx(idx + 1)
        setPlaying(true)
      }, 500)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    video.currentTime = ratio * video.duration
    setProgress(ratio * 100)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const newMuted = !soundOn
    setSoundOn(newMuted)
    video.muted = !newMuted
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (video.requestFullscreen) {
      video.requestFullscreen()
    }
  }

  const next = () => {
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({ missionId, activityId: 'lesson', eventType: 'completed' })
    }
    const video = videoRef.current
    if (video) video.pause()
    nextScreen()
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Video stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-40" aria-hidden />
        <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-4 px-4 py-6">
          {/* Video player */}
          <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-turquoise/30">
            <video
              ref={videoRef}
              className="aspect-video w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              playsInline
              preload="auto"
            >
              <source src={scene.video} type="video/mp4" />
            </video>

            {/* Scene badge (top-left) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute left-3 top-3 rounded-full bg-turquoise/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy backdrop-blur"
            >
              Scene {idx + 1} / {total}
            </motion.div>

            {/* Scene title (top-right) */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute right-3 top-3 rounded-lg bg-navy/80 px-3 py-1.5 backdrop-blur"
            >
              <span className="text-sm font-bold text-sunshine">{scene.title}</span>
            </motion.div>

            {/* Playing indicator */}
            {playing && (
              <div className="absolute right-3 bottom-16 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-0.5 backdrop-blur">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-white"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Play</span>
              </div>
            )}

            {/* Caption (bottom, video subtitles) */}
            {ccOn && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                <p className="text-center text-sm font-semibold text-white sm:text-base">
                  {scene.caption}
                </p>
              </div>
            )}

            {/* Big play button overlay when paused */}
            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
                aria-label="Play video"
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-turquoise/90 shadow-xl">
                  <Play className="h-8 w-8 text-navy" fill="currentColor" />
                </div>
              </button>
            )}
          </div>

          {/* Progress bar (clickable scrubber) */}
          <div
            className="w-full cursor-pointer"
            onClick={handleSeek}
            role="slider"
            aria-label="Video progress"
          >
            <div className="relative h-1.5 overflow-hidden rounded-full bg-cream/20">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-turquoise transition-[width] duration-100"
                style={{ width: `${progress}%` }}
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
              onClick={toggleMute}
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
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
              className="text-cream hover:bg-cream/10"
            >
              <Maximize2 className="h-5 w-5" />
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
