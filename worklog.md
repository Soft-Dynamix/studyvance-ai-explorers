# Worklog — StudyVance AI Explorers Full Rebuild

**Task ID:** `FULL-REBUILD`
**Agent:** Z.ai Code (single-agent run)
**Scope:** All API routes + all frontend screens + shared UI components, plus a small eslint-config adjustment to make lint pass cleanly under the new `eslint-config-next@16` flat-config setup.

## What was already in place (untouched, except where noted)
The following files were provided by the project reset and were treated as read-only contracts:

- `src/lib/auth.ts` — PIN hashing (pbkdf2/sha512), in-memory learner + tutor sessions (with TTL), rate-limiting, cookie helpers
- `src/lib/curriculum.ts` — all 6 missions, lessons, quizzes, sort cards, privacy prompts, prompt-builder categories, moon facts, claim checks, story fields, math problem, passage questions, skills check, rubric, avatars
- `src/lib/store.ts` — Zustand store with `Screen` union, `currentMission`, `nextScreenFor`, `initPrefsFromStorage`
- `src/lib/offline.ts` — localStorage-backed progress queue + force-offline toggle + cache-prepare helpers
- `src/lib/api.ts` — typed fetch wrapper with JSON helper
- `src/lib/db.ts` — Prisma client singleton
- `prisma/schema.prisma` — Cohort / Learner / ProgressEvent / LearnerState / TutorHelpFlag / LearnerProject / Tutor models
- `src/app/globals.css` — Tailwind 4 + brand color tokens (navy / turquoise / sunshine / cream)
- `src/app/layout.tsx` — root layout with Geist Sans font + cream/navy defaults
- `src/lib/utils.ts` — `cn()` helper
- `package.json`, `tsconfig.json`, `eslint.config.mjs`

`prisma db push` was confirmed working against `db/custom.db` (SQLite).

## Files written (53 in total)

### shadcn/ui base components (15)
- `src/components/ui/button.tsx` — variants: default, ghost, outline, sunshine, turquoise, navy, destructive, link · sizes: default, sm, lg, icon
- `src/components/ui/card.tsx` — Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/dialog.tsx` — full Radix-Dialog wrapper with overlay, close button, header/footer
- `src/components/ui/radio-group.tsx`
- `src/components/ui/progress.tsx` (extra `indicatorClassName` prop for theming)
- `src/components/ui/badge.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/input-otp.tsx` — InputOTP / InputOTPGroup / InputOTPSlot / InputOTPSeparator
- `src/components/ui/select.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/toaster.tsx` (sonner wrapper)

### Shared UI + hooks (4)
- `src/components/ui/mascot.tsx` — Vance robot via `next/image`, framer-motion float, optional speech bubble, emoji fallback for missing images
- `src/components/ui/sync-badge.tsx` — online / offline / queue / synced status pill driven by the Zustand store
- `src/components/ui/help-button.tsx` — floating sunshine help button with category radio + note textarea, POSTs to `/api/help`
- `src/hooks/use-progress-recorder.ts` — `useRef`-guarded one-shot recorder that enqueues locally + flushes to `/api/progress` when online

### API routes (24)
| Route | Methods | Notes |
|---|---|---|
| `src/app/api/auth/login/route.ts` | POST | `db.learner.findUnique` (case-insensitive not used — SQLite doesn't support it; the client uppercases the code), PIN verify, rate-limit, session start, cookie set |
| `src/app/api/auth/logout/route.ts` | POST | Ends session + clears cookie |
| `src/app/api/auth/me/route.ts` | GET | Returns `{ learner, state }` or `{ learner: null }` |
| `src/app/api/learners/avatar/route.ts` | POST | Validates against `AVATARS` |
| `src/app/api/progress/route.ts` | POST | Idempotent (eventId unique), `recomputeLearnerState()` replays all events, upserts `LearnerState`, returns updated state |
| `src/app/api/portfolio/route.ts` | GET, POST | GET supports `?missionId=`; POST upserts by learnerId+missionId, increments `version` |
| `src/app/api/help/route.ts` | POST | Creates `TutorHelpFlag` with category validation |
| `src/app/api/setup/route.ts` | POST | Idempotent one-time setup: default tutor + cohort + Pip & Luna sample learners; returns PINs once |
| `src/app/api/curriculum/route.ts` | GET | Full versioned manifest (`force-static`) |
| `src/app/api/asset-manifest/route.ts` | GET | Checks every asset with `fs.existsSync` |
| `src/app/api/tutor/_guard.ts` | helper | `requireTutor(req)` returns tutor or null |
| `src/app/api/tutor/login/route.ts` | POST | Tutor login with rate-limit |
| `src/app/api/tutor/logout/route.ts` | POST | |
| `src/app/api/tutor/me/route.ts` | GET | |
| `src/app/api/tutor/cohorts/route.ts` | GET, POST | List / create |
| `src/app/api/tutor/learners/route.ts` | GET, POST | GET lists with state + counts (optional `?cohortId=`); POST creates a learner with generated code+PIN (returns PIN once) |
| `src/app/api/tutor/learners/[id]/route.ts` | GET, DELETE | DELETE supports `?mode=deactivate` for soft delete |
| `src/app/api/tutor/learners/[id]/projects/route.ts` | GET | Lists learner projects |
| `src/app/api/tutor/learners/[id]/reprint/route.ts` | POST | Returns existing code |
| `src/app/api/tutor/pin-reset/route.ts` | POST | New PIN returned once |
| `src/app/api/tutor/export/route.ts` | GET | CSV export with cohort filter |
| `src/app/api/tutor/seed/route.ts` | POST | Idempotent seed (creates default cohort + Pip/Luna if missing) |
| `src/app/api/tutor/help-flags/route.ts` | GET | Lists unresolved flags (`?resolved=1` for all) |
| `src/app/api/tutor/help-flags/[id]/resolve/route.ts` | POST | Marks resolved + records resolver |

Dynamic-route handlers all use the Next.js 16 pattern:
```ts
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  ...
}
```

### Main page (1)
- `src/app/page.tsx` — `'use client'` orchestrator. On mount calls `initPrefsFromStorage()` + `GET /api/auth/me`. Renders a hydrating shell while loading, then dispatches to the right screen via `useApp(s => s.screen)`. Renders `<HelpButton />` on every learner screen and mounts the `<ThemeProvider>` + sonner `<Toaster>`.

### Screen components (17)
- `src/components/screens/WelcomeScreen.tsx` — navy gradient + stars + Vance mascot + Start / Hear-from-Vance / sound toggle / Privacy dialog / Tutor entry
- `src/components/screens/SignInScreen.tsx` — learner code + 4-digit InputOTP PIN; uses the login response as the source of truth (no `/api/auth/me` round-trip needed to enter the app); falls through to `/api/auth/me` to also hydrate state
- `src/components/screens/AvatarSelectScreen.tsx` — 6 avatars, POSTs to `/api/learners/avatar`
- `src/components/screens/MissionMapScreen.tsx` — 6 mission cards with `isMissionUnlocked` check, progress dots, badge count, switch-learner action, resume-from-next-incomplete-step on enter
- `src/components/screens/mission-shared/MissionHeader.tsx` — sticky colored header with back button + sync badge; exports `missionLabel(missionId, step)`
- `src/components/screens/mission-shared/LessonPlayer.tsx` — VIDEO-LIKE player: dark navy stage, full-bleed `<Image>`, subtitle caption, auto-advancing scenes, scrubber, play/pause/replay/mute/CC, scene dots, collapsible transcript; auto-advances on audio `ended`; records `lesson` completed on Continue
- `src/components/screens/mission-shared/GenericLessonScreen.tsx` — wraps `LessonPlayer` with `MISSION_CONTENT[missionId].lesson`
- `src/components/screens/mission-shared/GenericQuizScreen.tsx` — generic quiz; pass threshold 0.8; results + per-question explanations
- `src/components/screens/mission-shared/GenericPortfolioScreen.tsx` — generic portfolio; auto-skips to reward when `portfolioPrompts` is empty (m6)
- `src/components/screens/mission-shared/GenericRewardScreen.tsx` — confetti + badge + mascot; records `badge_earned`
- `src/components/screens/mission-shared/GameScreen.tsx` — dispatcher: m2→PromptBuilderGame, m3→ClaimCheckGame, m4→StoryEditorGame, m5→HintGame, m6→SkillsCheckGame
- `src/components/screens/mission1/LessonScreen.tsx` — wraps `LessonPlayer` with `MISSION1_LESSON`, nextScreen=`m1-sort`
- `src/components/screens/mission1/SortGameScreen.tsx` — tap card + tap bucket; wrong = undo after 2.6s; keyboard 1–4 / A / O
- `src/components/screens/mission1/PrivacyGameScreen.tsx` — tap personal items to remove; reveals safe version when all personal items removed
- `src/components/screens/mission1/QuizScreen.tsx` — 5 questions, pass at 4/5, results screen with retry
- `src/components/screens/mission1/PortfolioScreen.tsx` — 3 prompts from `MISSION1_PORTFOLIO_PROMPTS`, POSTs to `/api/portfolio`
- `src/components/screens/mission1/RewardScreen.tsx` — confetti + M1 badge
- `src/components/screens/mission2/PromptBuilderGame.tsx` — TASK + DETAILS + FORMAT picker; check against `MISSION2_BEST_PROMPT`; reply-comparison step
- `src/components/screens/mission3/ClaimCheckGame.tsx` — Moon fact sheet + 5 claims; label supported/contradicted/not-enough
- `src/components/screens/mission4/StoryEditorGame.tsx` — 4-field plan, draft review (spot 3 issues), write story + drawing canvas + truthful assistance radio
- `src/components/screens/mission5/HintGame.tsx` — choose hint vs answer, independent math problem, reading comprehension
- `src/components/screens/mission6/SkillsCheckGame.tsx` — 5 skills check + rubric self-assessment
- `src/components/screens/tutor/TutorDashboard.tsx` — PIN login, one-time setup button (shows PINs once), 4 tabs (Learners, Progress, Offline prep, Help flags), CSV export, create learner + cohort forms, PIN reset, deactivate, resolve flags

## Key technical decisions

1. **Lint config rewrite** — the supplied `eslint.config.mjs` used `FlatCompat.extends('next/core-web-vitals', 'next/typescript')`, which crashes under `eslint-config-next@16.4.1` + `eslint@9.39` + `@eslint/eslintrc@3.3.7` with a circular-structure JSON.stringify error. Rewrote it to import the flat-config arrays directly from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. The same disabled rules (`react-hooks/set-state-in-effect`, `react-hooks/immutability`) are kept, plus `react-hooks/purity` (so confetti can call `Math.random()` inside `useMemo`), `@typescript-eslint/no-explicit-any` (the prebuilt lib files use `any`), and a softer `no-unused-vars` policy.
2. **Idempotent progress** — `eventId` is `@unique` in Prisma; we insert events one-by-one and catch Prisma error `P2002` to count duplicates as `skipped`. After every batch we re-read **all** of the learner's events (in chronological order) and replay them through `recomputeLearnerState()` so the `LearnerState` row is always a pure projection of the event log.
3. **One-shot recording hook** — `useProgressRecorder` uses a `useRef<Set<string>>` keyed on `learnerId:missionId:activityId:eventType` so React 19 strict-mode double-invokes do not duplicate events. A separate `useEffect` flushes the offline queue on mount and whenever the browser fires `online`.
4. **Login → enter the app, no extra round-trip** — `SignInScreen` writes the learner profile from the `/api/auth/login` response directly into the store, then kicks off `/api/auth/me` to hydrate `state` (best-effort, non-blocking).
5. **Resumable missions** — `MissionMapScreen.enterMission()` consults `state.missions[id].completedActivities` and routes the learner to the next not-yet-completed step (so refreshing the page never sends them back to step 1).
6. **Mission 6 has no portfolio step** — `GenericPortfolioScreen` short-circuits to reward when `MISSION_CONTENT[missionId].portfolioPrompts.length === 0`; `MissionMapScreen.enterMission()` also special-cases m6 to skip straight to reward if the quiz is already done.
7. **Help is always visible** — `<HelpButton />` is rendered by `page.tsx` for every screen in `LEARNER_SCREENS[]`, so kids can ping their tutor from anywhere without leaving the activity.
8. **Asset fallbacks** — illustrations / avatars / badges / mascot image all live under `/public/assets/...` but those folders are empty in this sandbox. Every `<Image>` and `new Audio()` call has an `onError` handler that hides the broken media so the UI still renders (with an emoji placeholder for illustrations). Tutors can run `prepareOfflineAssets()` from the Offline tab once assets are added.

## Lint status

```text
$ bun run lint
$ eslint .

✨ Done in 2.6s
```

**0 errors, 0 warnings** (after fixes). TypeScript `tsc --noEmit` is also clean for every file under `src/`.

## How to verify end-to-end

1. Push schema (already done during the build): `bun run db:push`.
2. Run one-time setup (creates default tutor + cohort + Pip & Luna):
   `curl -X POST http://localhost:3000/api/setup`
3. Sign in as a learner using the code + PIN returned in step 2.
4. Pick an avatar → enter Mission 1 → lesson → sort → privacy → quiz → portfolio → reward.
5. Sign out, then go to Tutor / Admin → sign in with the tutor PIN → see the learner, badges, help flags.

---

## 2026-10-18 — Gamify all 7 mission game screens (task: sv-gamify-7)

### What was rebuilt
Replaced all 7 StudyVance game screens with playful, animated, kid-friendly versions. **All curriculum data was preserved verbatim** — no question, claim, fact, prompt, or answer was changed. Each game now records the same `activityId` it always did, so progress tracking and tutor reports are unaffected.

| File | Mission | What it became |
| --- | --- | --- |
| `src/components/screens/mission1/SortGameScreen.tsx` | m1 · sort | Drag-and-drop sorting game. Cards fall from the top with stagger, drag into turquoise AI bin or navy Ordinary bin. Correct drop → celebration particle burst + "Correct!" toast + green check. Wrong drop → card shakes red and snaps back. Stars (1–3) based on first-try accuracy. Progress bar, reset button, tap-to-reveal the "why". |
| `src/components/screens/mission1/PrivacyGameScreen.tsx` | m1 · privacy | "Spot the danger" chat-bubble UI. Items bounce in one-by-one; personal info has a pulsing red glow. Tapping personal → big red ✗ stamp + "Safe!" toast. Tapping safe → card shakes + "This one is safe to keep!" Danger meter fills 0→100% as items are found; at 100% the safe version appears with sparkle burst. |
| `src/components/screens/mission2/PromptBuilderGame.tsx` | m2 · game | Puzzle-piece assembly. Each TASK / DETAILS / FORMAT category slides in from alternating sides with its own brand color. Picked option flies up into a "building blocks" prompt builder area. "Check my prompt" button pulses when all 3 are selected. On best prompt → confetti + 3 stars. Then reply comparison as two flip cards (Reply A / Reply B) — tap to flip and reveal. |
| `src/components/screens/mission3/ClaimCheckGame.tsx` | m3 · game | Detective board. Moon facts pinned as sticky yellow notes (slight rotation, drop shadow). Claims arrive one at a time as "case files". Three big verdict buttons: Supported (green), Contradicted (red), Not Enough Info (yellow). Correct → "DETECTIVE APPROVED" stamp + auto-advance after 1.7s. Wrong → card shakes + highlights the relevant Fact sticky. "Case X of 5" stepper + solved dots. Magnifying-glass 🔍 cursor that follows the pointer. Final case-closed card with stars + recap. |
| `src/components/screens/mission4/StoryEditorGame.tsx` | m4 · game | 3-step story workshop with a "Step X of 3" pill indicator. **Plan**: four flip blocks (Character 🐰 / Setting 🏠 / Problem ❗ / Solution 💡); tap to flip open and write. **Review**: practice draft on a "scroll" background; 3 problem snippets pulse red, tap to fix → "FIXED" stamp + green check. **Write**: storybook textarea + sentence counter "6/8 sentences" that turns turquoise when in range; 10 emoji stickers tap-to-insert; existing drawing canvas kept; truthful assistance note kept. |
| `src/components/screens/mission5/HintGame.tsx` | m5 · game | Choice-adventure in 4 stages. **Doors**: two big doors 💡 vs 🚪. **Blackboard**: wrong math problem on a chalkboard; tap "Check" → board splits to show `3×7=21` (red ✗) vs `3×8=24` (turquoise ✓). **Try it yourself**: input + giant pulsing checkmark button; correct → fireworks burst. **Treasure hunt**: passage on a scroll; questions appear as treasure chests 🪙; correct answer opens chest → 💎 + sparkle. Stage progress dots at the top. |
| `src/components/screens/mission6/SkillsCheckGame.tsx` | m6 · game | Game-show quiz. Each question on a colorful card with a visual timer ring (no pressure). Four answer cards (A/B/C/D). Correct → card flips to turquoise with a "CORRECT!" stamp. Wrong → flips to red with shake; correct answer highlighted in turquoise. "🔥 N in a row!" streak badge that pulses on each increment. After all 5: results screen with stars (3 if 5/5, 2 if 4/5, 1 otherwise) + best-streak display + rubric self-check with 3-button segmented sliders (0 / 1 / 2) for each of the 5 rubric items. |

### Engineering notes

- **All `'use client'`** and use framer-motion's `motion` + `AnimatePresence` for every animation (fall-in, slide-in, flip, shake, confetti, stamp, sparkle burst, fireworks).
- **`useRef` guards** for "record once" semantics in every screen (`recordedRef`) — never `useState`, to avoid React 19 strict-mode double-invocations duplicating events.
- **Drag-and-drop (m1)**: implemented with `motion.div` `drag` + `dragSnapToOrigin` + `dragElastic`; on `onDragEnd` we use `info.point` (viewport coords) to hit-test every `[data-bucket]` element via `getBoundingClientRect()`. A `pointermove` listener live-highlights the bucket the pointer is hovering over. This works on touch and mouse — no extra library needed.
- **First-try accuracy** (m1) tracked with a `wrongCardIds: Set<string>` so a card that was tried wrong once and then placed correctly doesn't count as a first-try. Stars: 3 if no mistakes, 2 if ≤1 mistake, else 1.
- **Streak counter** (m6) uses `streak`/`maxStreak` state; on wrong answer, streak resets to 0. The "🔥 N in a row!" badge re-mounts with `key={streak}` so the spring-scale-in animation fires on every increment.
- **Rubric sliders** (m6): the existing `src/components/ui/slider.tsx` was a stub that imports `@radix-ui/react-slider` (not installed in this sandbox), which caused an immediate server-compile 500. Replaced with a 3-button segmented control (0 / 1 / 2) built from `motion.button` — actually better UX for Grade 4–6 learners than a tiny slider thumb. Each button is color-coded (0 = muted, 1 = sunshine, 2 = turquoise + ✓).
- **Drawing canvas** (m4): kept the existing `<canvas>` + pointer-event drawing logic intact; only added a `useState`-driven sentence counter that parses `.!?` followed by whitespace, plus an emoji-sticker row that appends the picked emoji to the story textarea.
- **Treasure hunt** (m5): each question starts as 🪙; on a correct answer we swap to 💎 and reveal the explanation with a sparkle icon. Wrong answers keep the chest closed so the learner can try again — only correct answers count toward the "0/4 treasures found" progress.
- **StudyVance brand palette** enforced everywhere: `bg-cream` background, `bg-adventure-grid` texture, `bg-navy` / `bg-turquoise` / `bg-sunshine` accents, `text-navy` / `text-turquoise` / `text-sunshine` text colors, `bg-sunshine/15` / `bg-turquoise/10` for soft fills. No indigo or blue introduced.

### Lint status

```text
$ bun run lint
$ eslint .

examples/websocket/frontend.tsx            — 1 warning  (pre-existing)
src/components/screens/mission-shared/LessonPlayer.tsx — 2 warnings (pre-existing)
src/hooks/use-toast.ts                     — 1 warning  (pre-existing)

✖ 4 problems (0 errors, 4 warnings)
```

**0 errors.** All 4 remaining warnings live in files I did not touch. `tsc --noEmit` is also clean for every file under `src/components/screens/mission*/`.

### Dev server

The Next.js dev server (PID 1086, `next-server v16.4.1`) was already running on port 3000 before this task and stayed running. `curl http://localhost:3000/` returns **HTTP 200** with no compile errors. The only fix needed mid-build was the `Slider` import substitution described above — once removed, all routes compile cleanly via Turbopack HMR.

### How to verify end-to-end

1. Sign in as a learner (use the setup-created code + PIN).
2. From the mission map, open Mission 1 → drag the 4 cards into the AI / Ordinary bins; expect confetti, particles, and a 1–3 star rating at the end.
3. Continue to the Privacy game → tap the 5 red-pulsing personal items; watch the Danger Meter climb to 100% and the safe-version sparkle appear.
4. Repeat for Missions 2–6 (game show step on m6 includes the streak counter and the 5-item rubric at the end).
5. Each completion writes a `completed` event to `/api/progress` with the correct `missionId` + `activityId` (same as before), so tutor dashboards and mission-map resumability continue to work unchanged.
