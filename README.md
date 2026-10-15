# StudyVance AI Explorers — Level 1

A friendly, child-friendly AI learning app for South African Grade 4–6 learners (ages 9–12). Six interactive missions teach what AI is, how to ask good questions, how to fact-check AI claims, how to create with AI safely, how to learn with AI (not just copy), and how to present original work.

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Set up the database
bun run db:push

# 3. Start the dev server
bun run dev

# 4. In another terminal, create the default tutor + sample learners
curl -X POST http://localhost:3000/api/setup

# 5. Open http://localhost:3000
```

## Sample credentials (created by setup)

| Role | Username/Code | PIN |
|------|--------------|-----|
| Tutor | `tutor` | (shown once by setup) |
| Learner "Pip" | `EX-XXXX` | (shown once by setup) |
| Learner "Luna" | `EX-XXXX` | (shown once by setup) |

Run `curl -X POST http://localhost:3000/api/setup` to get fresh credentials.

## Generating brand assets

The app needs 57 brand assets (images + audio). Generate them:

```bash
bash scripts/gen-all-assets.sh
```

This uses the z-ai CLI to generate:
- 1 mascot (Vance the robot)
- 6 avatars
- 7 badges
- 25 illustrations (lesson scenes + game cards)
- 19 audio narration files (English `jam` voice)

## Tech stack

- **Framework**: Next.js 16 with App Router (TypeScript)
- **Database**: Prisma ORM with SQLite
- **Styling**: Tailwind CSS 4 + shadcn/ui + custom StudyVance brand palette
- **State**: Zustand
- **Audio**: Pre-generated TTS narration (WAV) bundled in `/public/assets/audio/`
- **No paid AI API at runtime** — all content is pre-generated and bundled

## Project structure

```
src/
  app/
    page.tsx              # Main orchestrator
    layout.tsx            # Root layout + metadata
    globals.css           # Tailwind + StudyVance brand palette
    api/                  # All API routes (auth, progress, tutor, etc.)
  lib/
    curriculum.ts         # Source of truth: all 6 missions' content
    auth.ts               # PIN hashing, sessions, rate-limiting
    db.ts                 # Prisma client
    store.ts              # Zustand app state
    offline.ts           # Offline queue + cache helpers
  components/
    ui/                   # shadcn/ui + custom (mascot, sync-badge, help-button)
    screens/              # All screen components (welcome, missions, tutor)
public/assets/            # Generated images + audio
prisma/schema.prisma     # Data model
scripts/gen-all-assets.sh # Asset generation script
```

## License

Brand illustrations: AI-generated for StudyVance AI Explorers. UI components: shadcn/ui (MIT), Lucide icons (ISC).
