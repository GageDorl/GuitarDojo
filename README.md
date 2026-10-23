# Guitar Dojo

Interactive guitar education: students learn theory by playing with a fretboard, not by reading about it.

The first release is a vertical slice. It has one course module, **Understanding Major and Minor Triads**, with seven lessons and a checkpoint assessment. It is built on a reusable theory engine, fretboard renderer, exercise system and progress model.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (theory, validation, progress, content integrity) |
| `npm run test:e2e` | Playwright tests on desktop, 390px and 360px phones (builds and serves on port 3100) |
| `npm run check` | Typecheck and unit tests |

First Playwright run: `npx playwright install chromium`. Set `CI=1` to force a fresh build instead of reusing a running server on port 3100.

## Stack

Next.js 16 (App Router), React 19, TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), Tailwind CSS 4, Vitest, Playwright. There are no other runtime dependencies.

## Where things live

```
src/
  lib/theory/      Music theory engine (pure TS, no React)
  lib/fretboard/   Presentation-independent board model, spec resolver, selection reducer
  lib/exercises/   Exercise definitions, validators, feedback
  lib/courses/     Course/lesson/block types, completion rules
  lib/progress/    Event-sourced progress reducer + repository (localStorage today)
  content/         Course content as typed data (lessons are data, not components)
  components/
    fretboard/     SVG renderer (neck + chord diagram) and responsive windowing wrapper
    exercises/     Multiple-choice and fretboard exercise UIs, feedback panel
    lesson/        Lesson player and one renderer per block type
    course/ home/ layout/ progress/ ui/
  app/             Routes: /, /learn, /learn/[courseId], /learn/[courseId]/[lessonId]
  config/site.ts   Site name and navigation (shop/blog/tools slots, disabled)
e2e/               Playwright specs
docs/              Architecture and decisions
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design, extension points and decision log.

## Adding content

1. Create a lesson file in `src/content/courses/<course>/lessons/` that exports a `Lesson`. The helpers in `src/content/helpers.ts` keep it terse.
2. Add it to the course's module list in `src/content/courses/<course>/index.ts`.
3. Run `npm test`. The content-integrity test validates every exercise's `solution` against its own rule, checks ids and prerequisites, and resolves every diagram. Musically wrong content fails CI.
