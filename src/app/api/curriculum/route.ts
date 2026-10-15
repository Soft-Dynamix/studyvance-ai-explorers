import { NextResponse } from 'next/server'
import {
  MISSIONS,
  MISSION_CONTENT,
  AVATARS,
  SORT_CARDS,
  PRIVACY_PROMPTS,
  MISSION2_PROMPT_CATEGORIES,
  MISSION2_BEST_PROMPT,
  MISSION2_COMPARISONS,
  MISSION3_MOON_FACTS,
  MISSION3_CLAIMS,
  MISSION4_DRAFT_BRIEF,
  MISSION4_PRACTICE_DRAFT,
  MISSION4_DRAFT_ISSUES,
  MISSION4_STORY_FIELDS,
  MISSION5_MATH_PROBLEM,
  MISSION5_PASSAGE,
  MISSION5_PASSAGE_QUESTIONS,
  MISSION6_SKILLS_CHECK,
  MISSION6_RUBRIC,
  WELCOME_AUDIO,
  WELCOME_TRANSCRIPT,
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
  for (const p of PRIVACY_PROMPTS) {
    // prompts have no image assets today
    void p
  }
  void MISSION2_PROMPT_CATEGORIES
  void MISSION2_BEST_PROMPT
  void MISSION2_COMPARISONS
  void MISSION3_MOON_FACTS
  void MISSION3_CLAIMS
  void MISSION4_DRAFT_BRIEF
  void MISSION4_PRACTICE_DRAFT
  void MISSION4_DRAFT_ISSUES
  void MISSION4_STORY_FIELDS
  void MISSION5_MATH_PROBLEM
  void MISSION5_PASSAGE
  void MISSION5_PASSAGE_QUESTIONS
  void MISSION6_SKILLS_CHECK
  void MISSION6_RUBRIC
  return Array.from(urls)
}

export async function GET() {
  const manifest = {
    contentVersion: '1.0.0',
    missions: MISSIONS,
    missionContent: MISSION_CONTENT,
    sortCards: SORT_CARDS,
    privacyPrompts: PRIVACY_PROMPTS,
    mission2PromptCategories: MISSION2_PROMPT_CATEGORIES,
    mission2BestPrompt: MISSION2_BEST_PROMPT,
    mission2Comparisons: MISSION2_COMPARISONS,
    mission3MoonFacts: MISSION3_MOON_FACTS,
    mission3Claims: MISSION3_CLAIMS,
    mission4DraftBrief: MISSION4_DRAFT_BRIEF,
    mission4PracticeDraft: MISSION4_PRACTICE_DRAFT,
    mission4DraftIssues: MISSION4_DRAFT_ISSUES,
    mission4StoryFields: MISSION4_STORY_FIELDS,
    mission5MathProblem: MISSION5_MATH_PROBLEM,
    mission5Passage: MISSION5_PASSAGE,
    mission5PassageQuestions: MISSION5_PASSAGE_QUESTIONS,
    mission6SkillsCheck: MISSION6_SKILLS_CHECK,
    mission6Rubric: MISSION6_RUBRIC,
    welcomeAudio: WELCOME_AUDIO,
    welcomeTranscript: WELCOME_TRANSCRIPT,
    avatars: AVATARS,
    assets: collectAssetUrls(),
  }
  return NextResponse.json(manifest)
}
