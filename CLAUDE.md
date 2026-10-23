# CLAUDE.md

Guidance for agents working in this repo. Read this first; [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) has the full design rationale and decision log.

## What this is

Guitar Dojo: an interactive guitar-education site (Next.js 16 App Router, React 19, TypeScript 5.9 strict, Tailwind 4). The current scope is the **course platform only**. Six courses are live, in pathway order (`src/content/index.ts`):

| Course id | Title | Stage | Recommended first |
| --- | --- | --- | --- |
| `notes-and-fretboard` | Notes and the Fretboard | foundation | — |
| `intervals` | Understanding Intervals | foundation | notes-and-fretboard |
| `fretboard-foundations` | Major and Minor Triads (the original course; id kept for saved progress) | intermediate | intervals |
| `major-minor-scales` | Major and Minor Scales | intermediate | intervals |
| `pentatonic-scales` | Pentatonic Scales and Fretboard Navigation | intermediate | major-minor-scales |
| `chord-voicings` | Chord Voicings and Inversions | intermediate | fretboard-foundations |

Every course is 7–8 lessons ending in a `kind: "assessment"` checkpoint. The full long-term roadmap (planned courses shown as "coming later") is `src/content/curriculum.ts`. Shop, blog, tools, auth and audio are intentionally **not built**; don't add them unless asked.

## Commands

```bash
npm run dev          # localhost:3000
npm run check        # tsc --noEmit + vitest (run after every change)
npm test             # vitest only
npm run test:e2e     # Playwright: desktop, 390px and 360px phones; builds + serves on :3100
npm run build
```

- Before e2e, make sure nothing is listening on port 3100, or set `CI=1`. Otherwise Playwright **reuses a stale server** and tests old code.
- First e2e run on a machine: `npx playwright install chromium`.
- There is no ESLint. `tsc` and the tests are the quality gates.

## Layering (dependencies point down only)

```
src/app/            routes (server components; thin)
src/components/     React UI ("use client")
src/content/        course data (no React)
src/lib/courses     lesson/block types, completion rules
src/lib/progress    event-sourced progress reducer + repository
src/lib/exercises   exercise types, validators, feedback, drill generators
src/lib/fretboard   board model, spec resolver, selection reducer, guitar positions (pentatonic windows, diagram ranges)
src/lib/theory      music theory engine
```

Everything under `src/lib/` and `src/content/` must stay **framework-free** (no React, no DOM), so it runs in Vitest's Node environment. Import via the barrel files (`@/lib/theory`, `@/lib/exercises` …). The path alias is `@/` → `src/`.

## Domain invariants (getting these wrong breaks correctness)

- **String numbering is guitarist convention:** string 1 = high E, string 6 = low E. Fret 0 = open. `Tuning.openStrings` is stored low→high; use `openStringPitch(tuning, string)` instead of indexing it yourself.
- **Voicing shapes are written low→high:** `"x32010"` = open C. Use `"8.10.10.9.8.8"` (dotted) when any fret is ≥ 10. Convert with `parseVoicing` / `voicingPositions` (or `shape()` in content helpers).
- **Spelling matters.** `Note` = letter + accidental (C♯ ≠ D♭). `PitchClass` (0–11) is only for comparing sounds. Never derive a displayed note name from a pitch class when a musical context exists: use `transpose`, `spellInContext`, `spelledPitchAt(tuning, pos, contextNotes)`. Interval *number* comes from letters, *quality* from semitones.
- **MIDI 60 = C4.** `midi(B#3) === 60`.
- Chord qualities and scale types are **data tables** (`CHORD_QUALITIES`, `SCALE_TYPES`). Add entries, don't add branches.
- **Chord validation is voicing-agnostic** (pitch-class set + bass note). Never make a rule reject a valid alternate voicing unless the exercise explicitly constrains inversion/strings.

## How the pieces connect

1. Content describes a board with a declarative `FretboardSpec` (chord/scale/notes/positions, range, labels, `layout: { mobile, desktop }` = `"neck" | "chord"`).
2. `resolveFretboard(spec)` → `FretboardModel` (markers with `role` = colour family and `state` = treatment).
3. `ResponsiveFretboard` picks the presentation per breakpoint and windows the neck on narrow screens; `Fretboard` renders SVG from the model plus an `overlay` (the student's selection/marks). **Renderers never see specs or exercise rules.**
4. `FretboardExerciseView` owns selection (`selectionReducer`), calls `validate(rule, { tuning, selection, range })`, and paints `result.marks` as overlay markers. It knows nothing about specific rule types.
5. Attempts dispatch progress events via `useProgress().dispatch`; `LessonPlayer` auto-completes the lesson when `evaluateCompletion` says so.

## Recipes

**Add a lesson**
1. New file in `src/content/courses/<course>/lessons/` exporting a `Lesson`. Use helpers from `src/content/helpers.ts`: `step`, `text`, `callout`, `board`, `choice`, `exercise`, `drill`, `shape`, `buildUp` (demo frames), layout presets `NECK`/`CHORD`/`BUILD`, and **engine-computed answers**: `notePositions`, `scaleAlongString`, `scaleInWindow`, `pentatonicWindow`, `voicingBoard`, `generatedVoicings`, `moved` (barre shapes). Prefer these over hand-typed fret lists.
2. Register it in that course's `index.ts` (lesson `prerequisites` are lesson ids within the same course and must come earlier).
3. `npm test`: `src/content/content.test.ts` checks every fretboard exercise's `solution` passes its own rule, solutions are inside the board range/active strings (and on markers when `selectableOnlyMarkers`), `initialSelection` isn't already correct, ids are unique per lesson, prerequisites exist and come earlier, every diagram resolves, and **samples 60 generated questions from every drill** and validates each one. **Do not weaken this test to make content pass; fix the content.**

**Add a course**: create `src/content/courses/<dir>/index.ts` exporting a `Course` (with `stage`, `prerequisites` as course ids, `outcomes`), add it to `COURSES` in `src/content/index.ts` *after* its prerequisites, and set its `courseId` on the matching entry in `src/content/curriculum.ts`. Tests enforce: unique ids, prerequisites earlier in `COURSES`, every course in the roadmap, 6–10 lessons, last lesson is an assessment. **Never rename a published course or lesson id** (they're progress keys).

**Teaching pattern** used across courses: labelled demo/explorer → unlabelled recognition → construction → a `drill` in random keys/positions → checkpoint (`min-score` 0.75, first attempts only). Drills inside checkpoints count as correct only if passed on the first run.

**Add a drill generator**: extend `DrillGenerator` in `src/lib/exercises/types.ts`, implement it in `DRILL_GENERATORS` (`drills.ts`) as a pure function of the RNG that returns a normal multiple-choice/fretboard exercise with an engine-computed `solution`/`answer`, and add a case to `drills.test.ts` that checks generated answers against a **hand-written reference** (not the engine). Use `attempt()` to retry parameter combos that have no playable answer.

**Content rules of thumb**
- Every fretboard exercise needs a `solution`. Exercise ids must be unique within a lesson (they're progress keys; renaming one orphans saved progress).
- Identify-style boards ("tap the root/third") must set `roles: false`, and interval-recognition boards must not give the answer via `role: "third"/"fifth"` on the target note.
- Construction exercises use `selection: "per-string"`, `layout: { mobile: "chord", desktop: "neck" }`, range 0–5.
- Text blocks support only paragraphs (blank line), `- ` lists, `**bold**`, `*italic*`.

**Add a validation strategy**: add a rule interface to the `ValidationRule` union in `src/lib/exercises/types.ts`, a validator registered in `VALIDATORS` (`validators.ts`; the mapped type forces you to), a case in `ruleSpelling` (`spelling.ts`), and tests in `validators.test.ts`. Feedback messages should explain the *musical* reason, with spelled note names. No UI change needed.

**Add an exercise kind**: extend the `Exercise` union, add a view component, register it in `src/components/exercises/ExerciseView.tsx`.

**Add a lesson block type**: add the interface to `LessonBlock` in `src/lib/courses/types.ts`, a component in `src/components/lesson/blocks/`, a case in `BlockRenderer.tsx`, and (if it contains boards) a case in `boardsIn()` in `content.test.ts`.

**Change progress shape**: bump `PROGRESS_SCHEMA_VERSION` and add a migration in `parseProgress` (it currently resets unknown versions, which wipes users' progress). New behaviour = new event type handled in `progressReducer` + a test.

**Add a site section** (tools/shop/blog): flip `enabled` in `src/config/site.ts`, add a route folder under `src/app/`, and put its logic in a new `src/lib/<section>` module. Standalone tools should reuse `lib/theory`, `lib/fretboard` and `ResponsiveFretboard`.

## UI conventions

- Colours come from CSS custom properties in `src/app/globals.css` (light block + `.dark` block), exposed as Tailwind colours: `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `text-text`, `text-muted`, `bg-accent`, `bg-ink`, `bg-root/third/fifth/tone`, `bg-correct(-soft)`, `bg-incorrect(-soft)`. **Don't hard-code hex colours in components**; add a token for both themes instead.
- Dark mode is class-based (`.dark` on `<html>`, set pre-paint by `THEME_INIT_SCRIPT`).
- Mobile is a primary target: touch targets ≥ 44px (`h-11`), no horizontal page scroll (there's an e2e test), no forced landscape. Breakpoint for presentation switching is 768px (`useIsDesktop`).
- Browser-only state (progress, media queries) is read through `useSyncExternalStore`; components that depend on it gate on `useHydrated()` to avoid hydration mismatches.
- Fretboard cells expose `data-testid="fret-{string}-{fret}"`, markers `marker-{string}-{fret}` with `data-state`/`data-role`; exercise cards `exercise-{id}` with `data-solved`; feedback `feedback` with `data-correct`. Use these in Playwright.
- Respect `prefers-reduced-motion` (handled globally in CSS) when adding animation.

## Environment gotchas (Windows dev machine)

- Shell is PowerShell 5.1. `Get-Content`/`Set-Content` default to ANSI and **corrupt non-ASCII** (♯, ♭, ×, –) and add BOMs. Use the Edit/Write tools for files, never PowerShell text rewrites.
- Content and UI strings deliberately use Unicode accidentals (♯ ♭) and en dashes. Keep them.

## Testing expectations

- Theory/validation/progress changes: add Vitest cases next to the code (`*.test.ts` under `src/`).
- `src/lib/theory/reference.test.ts` holds **hand-written** reference tables (fretboard chart, all major/minor/pentatonic scales, intervals, triads, barre shapes, pentatonic positions). When adding theory, add independent reference cases there; never generate expected values with the engine under test.
- User-facing flows: extend `e2e/lesson.spec.ts`. The `tap()` helper pages the fret window on small screens; reuse it.
- Run `npm run check` before finishing; run `CI=1 npm run test:e2e` for UI changes.
