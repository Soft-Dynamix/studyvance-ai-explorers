'use client'

// Voice configuration — find the most child/robot-friendly English voice
// available on the device.

export type VoiceProfile = {
  name: string
  lang: string
  rate: number
  pitch: number
  description: string
}

// Priority list of voices that sound child-like, friendly, or robot-like.
// The browser picks the first one available on the device.
const CHILD_FRIENDLY_VOICES: VoiceProfile[] = [
  // Google voices (Chrome) — Google US English is clear and friendly
  { name: 'Google US English', lang: 'en-US', rate: 0.9, pitch: 1.3, description: 'Friendly American voice' },
  { name: 'Google UK English Female', lang: 'en-GB', rate: 0.9, pitch: 1.3, description: 'Friendly British voice' },
  
  // Microsoft voices (Edge) — Jenny and Aria sound natural and warm
  { name: 'Microsoft Jenny', lang: 'en-US', rate: 0.9, pitch: 1.2, description: 'Warm female voice' },
  { name: 'Microsoft Aria', lang: 'en-US', rate: 0.9, pitch: 1.2, description: 'Friendly female voice' },
  { name: 'Microsoft Guy', lang: 'en-US', rate: 0.85, pitch: 0.9, description: 'Calm male voice' },
  { name: 'Microsoft Davis', lang: 'en-US', rate: 0.85, pitch: 0.9, description: 'Friendly male voice' },
  
  // Apple voices (Safari/macOS) — Samantha is bright and child-friendly
  { name: 'Samantha', lang: 'en-US', rate: 0.9, pitch: 1.3, description: 'Bright friendly voice' },
  { name: 'Karen', lang: 'en-AU', rate: 0.9, pitch: 1.2, description: 'Australian voice' },
  { name: 'Daniel', lang: 'en-GB', rate: 0.85, pitch: 0.9, description: 'British male voice' },
  { name: 'Moira', lang: 'en-IE', rate: 0.9, pitch: 1.2, description: 'Irish voice' },
  { name: 'Tessa', lang: 'en-ZA', rate: 0.9, pitch: 1.2, description: 'South African voice' },
]

// Fallback: any English voice with a higher pitch for a friendlier sound
const FALLBACK_PROFILE: VoiceProfile = {
  name: '',
  lang: 'en-US',
  rate: 0.9,
  pitch: 1.3,
  description: 'Default English voice (higher pitch for friendliness)',
}

export function getBestVoice(): VoiceProfile | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // Try each preferred voice in order
  for (const profile of CHILD_FRIENDLY_VOICES) {
    const voice = voices.find(v => v.name === profile.name)
    if (voice) return profile
  }

  // Fallback: first English voice with friendly pitch
  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) {
    return {
      name: enVoice.name,
      lang: enVoice.lang,
      rate: FALLBACK_PROFILE.rate,
      pitch: FALLBACK_PROFILE.pitch,
      description: enVoice.name,
    }
  }

  return null
}

export function getVoiceList(): { name: string; lang: string }[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  return window.speechSynthesis.getVoices().map(v => ({ name: v.name, lang: v.lang }))
}
