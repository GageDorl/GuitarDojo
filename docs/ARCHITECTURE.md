# Architecture

## Layers

Dependencies point downward only. The lower four layers are framework-free TypeScript and are unit-tested in Node.

```
app/ (routes, API)  ─┐
components/         ─┤  React (client components never import content/ or server/)
server/             ─┤  server-only: auth, database, progress API, access checks
content/            ─┘  server-only typed data (curriculum, access rules)
lib/access     ─┐
lib/courses    ─┤
lib/progress   ─┤  pure TypeScript
lib/exercises  ─┤
lib/fretboard  ─┤
lib/theory     ─┘
```

`src/content` and `src/server` import `server-only`, so a client component importing them is a build error. That guarantee is what makes server-side access control meaningful: lesson content reaches the browser only through the lesson page, after authorization.

### 1. Theory engine (`src/lib/theory`)

- **Spelling first.** There are three levels of identity. A `PitchClass` is 0–11. A `Note` is a letter plus an accidental, so C♯ and D♭ are distinct. A `Pitch` is a note in an octave, with MIDI 60 = C4. Intervals have a *number* taken from letters and a *quality* taken from semitones. That is why `transpose(A, "M3")` gives C♯, and why A→D♭ is identified as a diminished fourth.
- Chord qualities (`CHORD_QUALITIES`) and scale types (`SCALE_TYPES`) are data tables. Seventh chords, modes and other scales are new table entries.
- `tuning.ts` maps `{ string, fret }` to pitches. Strings use guitarist numbering, so 1 is high E. Alternate tunings are data (`TUNINGS`).
- `voicings.ts` parses shapes such as `"x32010"`, reports inversions, and enumerates playable voicings under span and finger constraints. A small library of common voicings is checked against the chord engine in tests. `shiftVoicing` moves a shape up the neck, turning open strings into a barre. It was added for the barre-chord lessons.
- `scales.ts` adds `relativeMinor` and `relativeMajor`. They are needed by the relative-key lessons and the pentatonic generators.
- `src/lib/theory/reference.test.ts` checks the engine against **hand-written reference tables**. These cover the standard-tuning note chart, all 15 major scales, natural minor, both pentatonics, relative keys, interval spellings, triads, barre shapes and the five A minor pentatonic positions. These tests catch errors that self-consistency checks cannot.
- Guitar-navigation helpers that depend on the instrument and not on theory live in `src/lib/fretboard/positions.ts`. They are the five pentatonic position windows, the fret of a note on the low string, and `rangeForVoicing` for framing diagrams.

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
- **Drills** (`kind: "drill"`, `src/lib/exercises/drills.ts`) handle recall and transfer. A drill holds a `DrillGenerator`, which is data describing a family of questions such as "find a random natural note on one of these strings" or "build a random triad in a random inversion on a random string group". Each round draws fresh parameters from an RNG and produces an ordinary multiple-choice or fretboard exercise. Every solution or answer is computed by the theory engine. `DrillView` renders rounds with the existing views, counts **first tries only**, auto-advances on a correct answer, and records one attempt per run: correct when the pass score is met. Generators are pure functions of the RNG, so tests seed them and validate hundreds of generated questions per drill.

  | Generator | Question |
  | --- | --- |
  | `note-location` / `note-naming` | Find a note on a string / name a highlighted note |
  | `interval-construction` / `interval-recognition` | Find an interval above a root / name an interval, optionally shape-only |
  | `chord-construction` / `chord-recognition` / `inversion-recognition` | Build or name triads, inversions and string groups, using `findVoicings` |
  | `scale-roots` / `scale-identification` | Tap every root in a pentatonic position / name the key of a position |
  | `scale-on-string` / `scale-degree` | Play a scale along one string / name a scale degree, in random keys |

- **Adding a strategy** means adding a rule type, a validator and a test. The UI needs no change. **Adding an exercise kind** means a new type and a component registered in `ExerciseView.tsx`.

### 5. Lessons and courses (`src/lib/courses`, `src/content`)

- Course → Module → Lesson → Step → Block. Block types: `text` (paragraphs, lists, bold and italic), `callout`, `fretboard`, `demo`, `chromatic`, `triad-stack`, `compare`, `interval-explorer`, `note-explorer` (tap a note to see its name, unisons and octaves) and `exercise`.
- **Curriculum.** `src/content/index.ts` lists the courses in pathway order. `src/content/curriculum.ts` is the long-term roadmap by stage: entries with a `courseId` are live, and the rest show as "coming later" on `/learn`. Each `Course` declares a `stage`, its `outcomes`, and **course-level prerequisites** (course ids). These are soft: the catalog and course page recommend them, and nothing is ever locked. Lesson prerequisites stay within a course.
- **Teaching pattern.** Each course moves from **labelled demonstrations** to **unlabelled recognition**, then **construction**, then **drills in random keys and positions**, ending in a scored checkpoint. Content helpers (`src/content/helpers.ts`) compute solutions from the engine. Examples are `scaleInWindow`, `notePositions`, `generatedVoicings`, `moved` for barre shapes, and `pentatonicWindow`. They keep hand-typed answers to a minimum. `BlockRenderer.tsx` maps each type to a component.
- Each lesson declares its objectives, prerequisites (soft: recommended, not locked), estimated time and a **completion rule**. `all-exercises-solved` is used for lessons. `min-score` is used for assessments and scores first attempts only.
- Content is TypeScript modules today, so it is type-checked and versioned with the code. Every shape is plain data, so moving content to a CMS or database later only replaces `src/content/index.ts`.

### 6. Progress (`src/lib/progress`)

- **Event-sourced.** UI actions dispatch events: `lesson-visited`, `exercise-attempted`, `lesson-completed`, `lesson-reset` and `progress-cleared`. A pure reducer folds them into a snapshot. The snapshot holds per-lesson status, the resume step, and per-exercise attempts, correct and incorrect counts, first-attempt correctness, best score and last visited.
- **Anonymous visitors** keep the snapshot in localStorage under its original key and format, so no existing progress was lost when accounts arrived.
- **Signed-in students** (`src/lib/progress/sync.ts`, wrapped by `ProgressProvider`):
  1. Every event gets a random UUID, is applied locally at once, and goes into a persisted **outbox**.
  2. The outbox is flushed to `POST /api/progress/events` in batches of up to 100, with backoff when offline.
  3. The server stores events in `progress_event`. A unique `(user_id, event_id)` index makes every write idempotent, so retries after lost responses can't double-count. The server then replays **all** the user's events in canonical order (time, then id) and returns that snapshot. Local state is the server snapshot plus the events still in the outbox.
  4. When a tab regains focus, it fetches the latest snapshot, which picks up other devices. Every device converges on the same state, because the state is a pure function of the event set.
  5. **On sign-in**, the device's anonymous snapshot is imported once as a `snapshot-imported` event. Its id is `sha256(deviceId + canonical snapshot)`, so retries are no-ops. The merge (`mergeLesson`) never loses completion, solved exercises or best scores, and attempt counts add up. After a successful import, the anonymous copy is cleared.
  6. **On sign-out**, queued events are flushed and this account's cached copy is removed from the device, which matters on shared computers. If a session merely expires, queued events are kept until the same account signs in again.
- The server validates every event with strict schemas. Unknown keys are rejected, including any client-supplied `userId`. Events must refer to an existing course, lesson, exercise and step, and to a lesson the user may access. `progress-cleared` is local-only and never synced. `progress_snapshot` is a cache: delete a row and it's rebuilt from the log on the next write.
- `ProgressProvider` follows the Better Auth session (`useSession`). Visitors' progress syncs across tabs through `storage` events.

### 6a. Accounts (`src/server/auth.ts`, `src/app/(account)/*`)

- **Better Auth** with email and password, backed by PostgreSQL through Drizzle. Email verification is required before sign-in. Password recovery uses single-use tokens that expire in one hour, and a reset revokes every session.
- **No session cookie cache.** Every session check reads the session table, so sign-out and password resets take effect immediately. Tests caught a 5-minute window when the cache was on.
- **Rate limits**, stored in the database so they survive restarts:

  | Action | Limit |
  | --- | --- |
  | Sign-up | 5 per hour per IP |
  | Sign-in | 5 per minute |
  | Password-reset request | 3 per hour |
  | Reset submission | 5 per 15 minutes |
  | Verification resend | 3 per hour |

- Client IPs come from `X-Forwarded-For`, which the reverse proxy overwrites with the real address (Caddy, or the host nginx in production).
- **Registration closes itself** in production unless SMTP email is configured. Recovery must work before anyone can register. It can also be closed explicitly with `AUTH_REGISTRATION=closed`.
- `user.role` (`user` | `admin`) is a *permission*. Better Auth's `input: false` stops clients from setting it.
- Configuration is validated lazily by `src/server/env.ts`, so `next build` needs no secrets. In production it refuses to start without a real secret, a `postgres://` URL and HTTPS.

### 6b. Access control (`src/lib/access`, `src/content/access.ts`, `src/server/access.ts`)

- `decideAccess(policy, subject, { courseId })` is a pure function. Policies are `public`, `account`, or `entitlement` (with product ids). A subject is a user id, a role and entitlements.
- **Entitlements** record their source (`subscription`, `purchase`, `promotion`, `complimentary` or `admin-grant`), with optional start and expiry. Admins get a separate staff-preview *permission*, so they're never mistaken for customers.
- `COURSE_ACCESS` is keyed by stable course ids, with optional lesson overrides for free previews. It is **empty**, so every course is public during the beta.
- **Enforcement is server-side:**
  - The lesson page authorizes before sending content. Public lessons skip the session lookup and stay statically rendered.
  - The progress API authorizes every event and import.
- Client components receive content-free `CourseOutline`s.
- Where payments plug in: `EntitlementProvider` returns no entitlements today. See "Future: paid courses" in [DEPLOYMENT.md](DEPLOYMENT.md).

### 6c. Data and deployment

- Drizzle schema: `src/server/db/schema.ts`. Migrations are generated with `npm run db:generate` and committed in `drizzle/`.
- Production applies migrations with the one-shot `migrate` container. Locally, PGlite databases migrate themselves.
- `DATABASE_URL=pglite://…` runs real PostgreSQL in WebAssembly, used for development and all tests. Production uses `postgres://` against PostgreSQL 17.
- `GET /api/health` checks the database and feeds the Docker and Caddy health checks.
- Deployment, backups and rollback: [DEPLOYMENT.md](DEPLOYMENT.md).

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
| Event-sourced progress behind a repository | Visitors keep a local snapshot. Accounts sync events, which are idempotent by id, and replay them server-side. |
| Server replays the full event log on every write | Simplest correct merge across devices; each user's log is small. Optimize with incremental apply if logs grow large. |
| Better Auth + Drizzle + PostgreSQL | Self-hostable, sessions in our own database, no third-party auth service. |
| PGlite for development and tests | Docker isn't required locally; the same schema and migrations run as in production. |
| No session cookie cache | Immediate revocation beats saving one indexed lookup per request. |
| Content is `server-only`; clients get outlines | Paid content can't leak through the JavaScript bundle. Verified: lesson text no longer appears in client chunks. |
| Roles and entitlements are separate | Permissions (admin) and commercial access (paid) change for different reasons. |
| Soft prerequisites | Experienced students can jump ahead; the UI recommends but doesn't lock. |
| Assessments score first attempts but allow retries | Students always see the right answer before moving on, and the score stays honest. |
| System font stack, no `next/font` | No build-time network dependency. Swap in a brand font in `layout.tsx` and the `--font-sans` token. |
| No ESLint yet | `tsc --strict` and tests gate quality. Add `eslint-config-next` when the team grows. |
| Design tokens in `globals.css` | Rebranding means editing two token blocks, light and dark. Components use semantic Tailwind colours (`bg-surface`, `text-muted`, `bg-root` …). |

| Drills as data generators, not bespoke components | One component runs every kind of recall practice. Generated questions reuse the existing validators and feedback, and seeded tests validate them in bulk. |
| Pentatonic positions numbered from the minor root's box | It's a common teaching convention and makes the windows a fixed offset table. The same shapes serve the relative major. |
| Original triads course keeps id `fretboard-foundations` | Course ids are progress keys. Only its title and metadata changed. |

## Known gaps and next steps

- No audio yet. Hearing major vs minor is the obvious next win. Web Audio and a small sampler keyed by MIDI would cover it.
- Exercises with the same `id` in different lessons are tracked separately by the lesson key. That is intentional, but ids must be unique within a lesson, and the content test enforces this.
- Anonymous progress lives in one localStorage key; clearing site data resets it. An account avoids this.
- No account deletion or data export UI yet. Both are needed before a wide launch in privacy-regulated regions. Deleting a `user` row cascades to sessions and progress.
- Content-Security-Policy is limited to `frame-ancestors`, `base-uri`, `form-action` and `object-src`. A full script policy needs a nonce for the inline theme script.
- Drills measure accuracy, not speed, and there is no spaced repetition. A student who passes a drill once is marked done. A review queue that resurfaces drills over days, plus optional timing, would better measure automatic recall.
- Pentatonic and scale "positions" are rectangular fret windows. That's exact for pentatonic boxes, but three-notes-per-string and CAGED scale shapes will need explicit per-string position lists.
- Without audio, ear-based activities such as hearing major vs minor or call-and-response phrasing are described in callouts rather than interactive.
