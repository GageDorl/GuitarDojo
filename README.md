# Guitar Dojo

Interactive guitar education: students learn theory by playing with a fretboard, not by reading about it.

There are six live courses, laid out as a learning path from first notes to fluent musicianship. Each course ends in a checkpoint assessment. All of them share a reusable theory engine, fretboard renderer, exercise and drill system, and progress model.

| Course | Lessons |
| --- | --- |
| Notes and the Fretboard | 8 |
| Understanding Intervals | 7 |
| Major and Minor Triads | 7 |
| Major and Minor Scales | 8 |
| Pentatonic Scales and Fretboard Navigation | 8 |
| Chord Voicings and Inversions | 8 |

The planned roadmap lives in `src/content/curriculum.ts` and appears on `/learn` as "coming later".

Every lesson is free and works without an account. A free account adds cross-device progress sync and a saved exercise history.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

No database setup is needed for development. The app uses PGlite, which is PostgreSQL compiled to WebAssembly, stored in `.data/pglite` and migrated automatically. Emails such as verification and password-reset links are written to `.data/mail` and printed in the terminal.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest tests: theory, validation, progress, content integrity, auth flows and the progress API against a real in-memory PostgreSQL |
| `npm run test:e2e` | Playwright tests on desktop, 390px and 360px phones, including sign-up, verification, sync and password reset |
| `npm run check` | Typecheck and unit tests |
| `npm run db:generate` | Create a SQL migration after changing `src/server/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

First Playwright run: `npx playwright install chromium`. Set `CI=1` to force a fresh build instead of reusing a running server on port 3100.

## Deployment

Production runs with Docker Compose: Caddy for HTTPS, the Next.js app, a one-shot migration job and PostgreSQL 17. Backups are encrypted and stored off-server. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step VPS setup, backups, restore, rollback and the security checklist. Configuration comes from `.env`; the template is `.env.example`, and real secrets are never committed.

## Stack

Next.js 16 (App Router), React 19, TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), Tailwind CSS 4, Better Auth, Drizzle ORM with PostgreSQL (PGlite locally), Zod, Nodemailer, Vitest and Playwright.

## Where things live

```
src/
  lib/theory/      Music theory engine (pure TS, no React)
  lib/fretboard/   Presentation-independent board model, spec resolver, selection reducer
  lib/exercises/   Exercise definitions, validators, feedback
  lib/courses/     Course/lesson/block types, completion rules, content-free outlines
  lib/progress/    Event-sourced progress reducer, replay/merge, client sync engine
  lib/access/      Pure access decisions (free, account, entitlements)
  server/          Server-only: env, database (Drizzle), auth (Better Auth), email, progress API
  content/         Server-only course content as typed data, plus access rules
  components/
    fretboard/     SVG renderer (neck + chord diagram) and responsive windowing wrapper
    exercises/     Multiple-choice and fretboard exercise UIs, feedback panel
    lesson/        Lesson player and one renderer per block type
    course/ home/ layout/ progress/ ui/
  app/             Routes: /, /learn/…, account pages, /api/auth, /api/progress, /api/health
  config/site.ts   Site name and navigation (shop/blog/tools slots, disabled)
drizzle/           Versioned SQL migrations
scripts/           migrate, deploy, rollback, backup, restore
deploy/Caddyfile   HTTPS reverse proxy
e2e/               Playwright specs
docs/              Architecture, deployment, roadmap
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design, extension points and decision log, and [docs/ROADMAP.md](docs/ROADMAP.md) for product direction and current progress.

## Adding content

1. Create a lesson file in `src/content/courses/<course>/lessons/` that exports a `Lesson`. The helpers in `src/content/helpers.ts` keep it terse and compute answers from the theory engine.
2. Add it to the course's module list in `src/content/courses/<course>/index.ts`.
3. Run `npm test`. The content-integrity test validates every exercise's `solution` against its own rule, and samples generated questions from every drill. It also checks ids, lesson and course prerequisites, and that every diagram resolves. Musically wrong content fails CI.

For recall practice, use a `drill`. It is a generator described as data that produces new questions every run, in random keys and positions. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the available generators.
