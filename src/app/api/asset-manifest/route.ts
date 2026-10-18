import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  MISSIONS,
  MISSION_CONTENT,
  AVATARS,
  SORT_CARDS,
  WELCOME_AUDIO,
} from '@/lib/curriculum'

export const dynamic = 'force-static'

function collectAssetUrls(): string[] {
  const urls = new Set<string>()
  urls.add(WELCOME_AUDIO)
  for (const a of AVATARS) urls.add(a.src)
  for (const m of MISSIONS) urls.add(m.badge)
  for (const missionId of Object.keys(MISSION_CONTENT) as (keyof typeof MISSION_CONTENT)[]) {
    const content = MISSION_CONTENT[missionId]
    for (const s of content.lesson) {
      urls.add(s.illustration)
      urls.add(s.audio)
    }
  }
  for (const c of SORT_CARDS) urls.add(c.image)
  return Array.from(urls)
}

export async function GET() {
  const publicDir = path.join(process.cwd(), 'public')
  const assets = collectAssetUrls()
  const report = assets.map((url) => {
    const rel = url.startsWith('/') ? url.slice(1) : url
    const abs = path.join(publicDir, rel)
    const exists = fs.existsSync(abs)
    return { url, exists }
  })
  return NextResponse.json({
    total: report.length,
    missing: report.filter((r) => !r.exists).map((r) => r.url),
    assets: report,
  })
}
