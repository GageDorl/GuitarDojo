# Architecture

## Layers

Dependencies point downward only. The lower four layers are framework-free TypeScript and are unit-tested in Node.

```
app/ (routes)  ─┐
components/    ─┤  React
content/       ─┘  typed data, no React
lib/courses    ─┐
lib/progress   ─┤
lib/exercises  ─┤  pure TypeScript
lib/fretboard  ─┤
lib/theory     ─┘
```

### 1. Theory engine (`src/lib/theory`)

- **Spelling first.** There are three levels of identity. A `PitchClass` is 0–11. A `Note` is a letter plus an accidental, so C♯ and D♭ are distinct. A `Pitch` is a note in an octave, with MIDI 60 = C4. Intervals have a *number* taken from letters and a *quality* taken from semitones. That is why `transpose(A, "M3")` gives C♯, and why A→D♭ is identified as a diminished fourth.
- Chord qualities (`CHORD_QUALITIES`) and scale types (`SCALE_TYPES`) are data tables. Seventh chords, modes and other scales are new table entries.
- `tuning.ts` maps `{ string, fret }` to pitches. Strings use guitarist numbering, so 1 is high E. Alternate tunings are data (`TUNINGS`).
- `voicings.ts` parses shapes such as `"x32010"`, reports inversions, and enumerates playable voicings under span and finger constraints. A small library of common voicings is checked against the chord engine in tests.

### 2. Fretboard model (`src/lib/fretboard`)

- `FretboardSpec` is *declarative content*. It says things like "show C major, voicing x32010, interval labels, frets 0–4, chord diagram on phones".
- `resolveFretboard(spec)` produces a `FretboardModel`: tuning, range, and markers with role, state and label, plus string indicators, active strings and region. Renderers only ever see models.
- **Role vs state.** A marker's *role* (root, third, fifth, tone) sets its colour family. Its *state* (selected, correct, incorrect, missed, hint, ghost) sets the treatment. Roots are also drawn as rounded squares, so colour is never the only cue.
- `selectionReducer` is a pure reducer with three modes: `single`, `per-string` (a playable chord, where tapping another fret moves the finger) and `multi`.

### 3. Fretboard rendering (`src/components/fretboard`)

- `geometry.ts` lays out positions on two logical axes, *along* the neck and *across* the strings. It then maps them to x/y per presentation. The horizontal **neck** and the vertical **chord diagram** share one code path.
- `Fretboard.tsx` is SVG. Hit targets are `<rect role="button">` cells with roving tabindex. Arrow keys move between cells, Enter or Space presses, and a visible focus ring appears for keyboard users. Read-only boards are `role="img"` with a screen-reader list of the notes.
- `ResponsiveFretboard.tsx` picks the presentation per breakpoint, which a lesson sets per block. When a neck can't fit at a touch-friendly fret width, it shows a **window** of frets with arrow buttons and swipe. A phone never gets a squashed neck or sideways page scroll. The minimum width is 54px per fret on touch devices and 46px with a mouse.
- Animation is CSS: markers pop in, wrong answers shake, and everything respects `prefers-reduced-motion`. Programmatic animation is a `demo` block that steps through frames, with play and pause.

**Why SVG.** Boards have at most a few hundred elements. SVG gives crisp scaling, CSS theming through custom properties, real DOM nodes for accessibility and testing, and no extra dependency. Canvas or WebGL would only pay off for something like a real-time pitch-detection visualiser. That would be a separate renderer consuming the same `FretboardModel`.

### 4. Exercises (`src/lib/exercises`)

- An `Exercise` is serializable data. It is either `multiple-choice` (recognition, with an optional board) or `fretboard` (construct, locate or identify). A fretboard exercise holds a selection mode, an optional starting selection, a **validation rule** and a canonical **solution**.
- Validation strategies form a discriminated union, and each has a pure validator in a registry (`VALIDATORS`):

  | Rule | Use |
  | --- | --- |
  | `exact-positions` | Specific fingering; "tap the root" (`match: "any"` for either of two roots) |
  | `chord` | **Any** voicing of a chord, with optional inversion and string restrictions |
  | `pitch-classes` | Every occurrence of notes in a region ("find every G in frets 0–5") |
  | `pitches` | Octave-specific notes on any string ("find A3") |
  | `interval` | A note at an interval from a given position, exact octave or any |
  | `scale` | Every scale tone in a region (a scale shape) |

- A `ValidationResult` holds a headline, a list of **issues** with codes and musical explanations, and **per-position marks** that the UI paints on the board. Examples:
  - "Those notes form A minor, not A major."
  - "C is a minor third above A. A major needs a major third: C♯."
  - "You found the right note name, but this C is C3: an octave lower than the C4 this exercise asks for."
  - "These notes form C major, but the lowest note is E (the third) … put the root (C) in the bass."
- **Adding a strategy** means adding a rule type, a validator and a test. The UI needs no change. **Adding an exercise kind** means a new type and a component registered in `ExerciseView.tsx`.

### 5. Lessons and courses (`src/lib/courses`, `src/content`)

- Course → Module → Lesson → Step → Block. Block types: `text` (paragraphs, lists, bold and italic), `callout`, `fretboard`, `demo`, `chromatic`, `triad-stack`, `compare`, `interval-explorer` and `exercise`. `BlockRenderer.tsx` maps each type to a component.
- Each lesson declares its objectives, prerequisites (soft: recommended, not locked), estimated time and a **completion rule**. `all-exercises-solved` is used for lessons. `min-score` is used for assessments and scores first attempts only.
- Content is TypeScript modules today, so it is type-checked and versioned with the code. Every shape is plain data, so moving content to a CMS or database later only replaces `src/content/index.ts`.

### 6. Progress (`src/lib/progress`)

- **Event-sourced.** UI actions dispatch events: `lesson-visited`, `exercise-attempted`, `lesson-completed`, `lesson-reset` and `progress-cleared`. A pure reducer folds them into a snapshot. The snapshot holds per-lesson status, the resume step, and per-exercise attempts, correct and incorrect counts, first-attempt correctness, best score and last visited.
- `ProgressRepository` is the persistence boundary. `LocalProgressRepository` writes the snapshot to localStorage, with a schema version and defensive parsing. Its optional `record(event)` hook is where an API client would send events once accounts exist. The server can run the same reducer, and merging devices becomes replaying events.
- `ProgressProvider` wraps the store with `useSyncExternalStore`. It renders empty progress on the server, hydrates on the client, and syncs across tabs through `storage` events.

### 7. Shell and future sections

`src/config/site.ts` declares nav items, with Tools, Shop and Blog present but disabled. New sections become sibling route folders under `src/app/` and new `lib/` modules. Two later features already have a natural home:

- **Standalone tools** such as a chord explorer, scale finder or tuner reuse `lib/theory`, `lib/fretboard` and the renderer directly.
- **Audio playback** can hang off `FretboardModel` markers through `midiAt`. **Pitch detection** would produce a selection the existing validators can grade.

## Decision log

| Decision | Why |
| --- | --- |
| Spelled notes everywhere; pitch classes only for comparisons | Teaching material must say C♯ in A major and D♭ in B♭ minor. Validators compare sounds but explain with spelled names. |
| Chord validation by pitch-class set plus bass note | Accepts **any voicing** (doublings, open strings, other positions). Inversions and string sets are opt-in constraints. |
| One geometry engine for neck and chord diagram | Features land in both presentations at once, and lessons pick a presentation per breakpoint. |
| Windowed neck on phones instead of shrinking it | Keeps touch targets usable with no horizontal page scroll and no forced landscape. |
| Identify boards use `roles: false` | Colour-coded roles would give away "tap the root". |
| Content as typed TS data, with a content-integrity test | Compile-time shape checking, and every exercise's solution is proven against its own validator. |
| Event-sourced progress behind a repository | Local now; the backend sync path is clear without building auth. |
| Soft prerequisites | Experienced students can jump ahead; the UI recommends but doesn't lock. |
| Assessments score first attempts but allow retries | Students always see the right answer before moving on, and the score stays honest. |
| System font stack, no `next/font` | No build-time network dependency. Swap in a brand font in `layout.tsx` and the `--font-sans` token. |
| No ESLint yet | `tsc --strict` and tests gate quality. Add `eslint-config-next` when the team grows. |
| Design tokens in `globals.css` | Rebranding means editing two token blocks, light and dark. Components use semantic Tailwind colours (`bg-surface`, `text-muted`, `bg-root` …). |

## Known gaps and next steps

- No audio yet. Hearing major vs minor is the obvious next win. Web Audio and a small sampler keyed by MIDI would cover it.
- Exercises with the same `id` in different lessons are tracked separately by the lesson key. That is intentional, but ids must be unique within a lesson, and the content test enforces this.
- Progress lives in a single localStorage key. Clearing site data resets it.
- The voicing generator is not yet used in lessons. It is ready for a "show me other voicings" feature and for chord-explorer tooling.
