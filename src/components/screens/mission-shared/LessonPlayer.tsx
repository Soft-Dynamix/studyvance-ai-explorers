'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  ChevronDown, ChevronUp, ArrowRight, Maximize2,
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

export function LessonPlayer({ scenes, missionId, nextScreen }: Props) {
  const soundOn = useApp((s) => s.soundOn)
  const setSoundOn = useApp((s) => s.setSoundOn)
  const record = useProgressRecorder()

  const [idx, setIdx] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [transcriptOpen, setTranscriptOpen] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const recordedRef = React.useRef(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const scene = scenes[idx]
  const total = scenes.length

  // Play the video + audio for a scene
  const playScene = React.useCallback((i: number) => {
    const sc = scenes[i]
    if (!sc) return

    const video = videoRef.current
    const audio = audioRef.current

    // Reset video
    if (video) {
      video.currentTime = 0
      video.muted = !soundOn
    }

    // Reset audio
    if (audio) {
      audio.currentTime = 0
      audio.muted = !soundOn
    }

    // Play video (loops while audio plays)
    if (video) {
      video.play().then(() => {
        setPlaying(true)
      }).catch(() => {
        setPlaying(false)
      })
    }

    // Play audio (the actual narration)
    if (audio && soundOn) {
      audio.play().then(() => {
        setPlaying(true)
      }).catch(() => {
        // Audio failed — video still plays
      })
    }
  }, [scenes, soundOn])

  // When scene changes
  React.useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (video) video.load()
    if (audio) audio.load()
    if (playing) {
      playScene(idx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (videoRef.current) videoRef.current.pause()
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    const audio = audioRef.current
    if (playing) {
      video?.pause()
      audio?.pause()
      setPlaying(false)
    } else {
      playScene(idx)
    }
  }

  const replay = () => {
    const video = videoRef.current
    const audio = audioRef.current
    if (video) video.currentTime = 0
    if (audio) audio.currentTime = 0
    setIdx(0)
    setProgress(0)
    setPlaying(true)
    recordedRef.current = false
    playScene(0)
  }

  const goToScene = (i: number) => {
    const video = videoRef.current
    const audio = audioRef.current
    video?.pause()
    audio?.pause()
    setPlaying(false)
    setIdx(i)
    setProgress(0)
  }

  // Audio time update → progress + auto-advance
  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  // When audio ends → next scene
  const handleAudioEnded = () => {
    setProgress(100)
    const video = videoRef.current
    if (video) video.pause()
    if (idx < total - 1) {
      setTimeout(() => setIdx(idx + 1), 500)
    } else {
      setPlaying(false)
    }
  }

  // When video ends → loop it (while audio plays)
  const handleVideoEnded = () => {
    const video = videoRef.current
    if (video && playing) {
      video.currentTime = 0
      video.play().catch(() => {})
    }
  }

  const toggleMute = () => {
    const next = !soundOn
    setSoundOn(next)
    if (videoRef.current) videoRef.current.muted = !next
    if (audioRef.current) audioRef.current.muted = !next
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (video.requestFullscreen) video.requestFullscreen()
  }

  const next = () => {
    if (!recordedRef.current) {
      recordedRef.current = true
      void record({ missionId, activityId: 'lesson', eventType: 'completed' })
    }
    if (videoRef.current) videoRef.current.pause()
    if (audioRef.current) audioRef.current.pause()
    nextScreen()
  }

  // Use animated video if available, otherwise fall back to static image video
  const videoSrc = scene.video || scene.illustration
  const hasAnimatedVideo = scene.video && scene.video.includes('-anim')

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Video stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-30" aria-hidden />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-6">
          {/* Real video player */}
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-turquoise/30">
            <video
              ref={videoRef}
              className="aspect-video w-full object-contain"
              onEnded={handleVideoEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              playsInline
              loop={!hasAnimatedVideo}  // Loop static videos, but not animated ones
              muted
              autoPlay={false}
              preload="auto"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>

            {/* Hidden audio element for narration */}
            <audio
              ref={audioRef}
              src={scene.audio}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              preload="auto"
              hidden
            />

            {/* Scene badge */}
            <div className="absolute left-3 top-3 z-20 rounded-full bg-turquoise/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy backdrop-blur">
              Scene {idx + 1} / {total}
            </div>

            {/* Scene title */}
            <div className="absolute right-3 top-3 z-20 rounded-lg bg-navy/80 px-3 py-1.5 backdrop-blur">
              <span className="text-sm font-bold text-sunshine">{scene.title}</span>
            </div>

            {/* Playing indicator */}
            {playing && (
              <div className="absolute right-3 bottom-16 z-20 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-0.5 backdrop-blur">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-white"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Play</span>
              </div>
            )}

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
              <p className="text-center text-sm font-semibold text-white sm:text-base">
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

          {/* Progress bar (synced to audio) */}
          <div className="w-full max-w-3xl">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-cream/20">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-turquoise"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
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
            <Button size="icon" variant="sunshine" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="h-12 w-12">
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={replay} aria-label="Replay" className="text-cream hover:bg-cream/10">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={toggleMute} aria-label={soundOn ? 'Mute' : 'Unmute'} className="text-cream hover:bg-cream/10">
              {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={toggleFullscreen} aria-label="Fullscreen" className="text-cream hover:bg-cream/10">
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
