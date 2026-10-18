'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
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
  const [audioError, setAudioError] = React.useState(false)
  const recordedRef = React.useRef(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const scene = scenes[idx]
  const total = scenes.length

  // Play scene: start video (looping) + audio narration
  const playScene = React.useCallback((i: number) => {
    const sc = scenes[i]
    if (!sc) return

    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setProgress(0)
    setAudioError(false)

    // Start video (loops while audio plays)
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      video.muted = true  // Video is always muted — audio comes from WAV file
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }

    // Play audio narration from WAV file
    if (soundOn) {
      const audio = new Audio(sc.audio)
      audioRef.current = audio

      // Track progress
      audio.addEventListener('timeupdate', () => {
        if (audio.duration && isFinite(audio.duration)) {
          setProgress((audio.currentTime / audio.duration) * 100)
        }
      })

      // When audio ends → stop video + auto-advance
      audio.addEventListener('ended', () => {
        setProgress(100)
        if (videoRef.current) videoRef.current.pause()
        setPlaying(false)
        if (i < scenes.length - 1) {
          setTimeout(() => {
            setIdx(i + 1)
            setPlaying(true)
          }, 500)
        }
      })

      // Handle audio errors
      audio.addEventListener('error', () => {
        setAudioError(true)
        // Fallback: timer-based auto-advance
        const estMs = Math.max(15000, sc.transcript.length * 55)
        const start = Date.now()
        const timer = setInterval(() => {
          const elapsed = Date.now() - start
          setProgress(Math.min(95, (elapsed / estMs) * 100))
          if (elapsed >= estMs) {
            clearInterval(timer)
            setProgress(100)
            if (videoRef.current) videoRef.current.pause()
            if (i < scenes.length - 1) {
              setIdx(i + 1)
            } else {
              setPlaying(false)
            }
          }
        }, 200)
      })

      // Try to play
      audio.play().catch(() => {
        setAudioError(true)
        // Fallback: timer-based
        const estMs = Math.max(15000, sc.transcript.length * 55)
        const start = Date.now()
        const timer = setInterval(() => {
          const elapsed = Date.now() - start
          setProgress(Math.min(95, (elapsed / estMs) * 100))
          if (elapsed >= estMs) {
            clearInterval(timer)
            setProgress(100)
            if (videoRef.current) videoRef.current.pause()
            if (i < scenes.length - 1) {
              setIdx(i + 1)
            } else {
              setPlaying(false)
            }
          }
        }, 200)
      })
    } else {
      // No sound: timer-based auto-advance (video still plays)
      const estMs = Math.max(15000, sc.transcript.length * 55)
      const start = Date.now()
      const timer = setInterval(() => {
        const elapsed = Date.now() - start
        setProgress(Math.min(95, (elapsed / estMs) * 100))
        if (elapsed >= estMs) {
          clearInterval(timer)
          setProgress(100)
          if (videoRef.current) videoRef.current.pause()
          if (i < scenes.length - 1) {
            setIdx(i + 1)
          } else {
            setPlaying(false)
          }
        }
      }, 200)
    }
  }, [scenes, soundOn])

  // When scene changes
  React.useEffect(() => {
    const video = videoRef.current
    if (video) video.load()
    if (playing) {
      playScene(idx)
    }
    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (videoRef.current) videoRef.current.pause()
    }
  }, [idx, playing, playScene])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (videoRef.current) videoRef.current.pause()
    }
  }, [])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      if (audioRef.current) audioRef.current.pause()
      if (videoRef.current) videoRef.current.pause()
    } else {
      playScene(idx)
    }
  }

  const replay = () => {
    if (audioRef.current) audioRef.current.pause()
    if (videoRef.current) videoRef.current.pause()
    setIdx(0)
    setProgress(0)
    setPlaying(true)
    recordedRef.current = false
    playScene(0)
  }

  const goToScene = (i: number) => {
    if (audioRef.current) audioRef.current.pause()
    if (videoRef.current) videoRef.current.pause()
    setPlaying(false)
    setIdx(i)
    setProgress(0)
  }

  const toggleMute = () => {
    const next = !soundOn
    setSoundOn(next)
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
    if (audioRef.current) audioRef.current.pause()
    if (videoRef.current) videoRef.current.pause()
    nextScreen()
  }

  const videoSrc = scene.video || scene.illustration

  return (
    <div className="relative flex min-h-screen flex-col bg-navy text-cream">
      {/* Video stage */}
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-stars opacity-30" aria-hidden />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-6">
          {/* Video player */}
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-turquoise/30">
            <video
              ref={videoRef}
              className="aspect-video w-full object-contain"
              playsInline
              muted
              loop
              autoPlay={false}
              preload="auto"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>

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

          {/* Progress bar (synced to audio duration) */}
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
