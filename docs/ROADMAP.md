# Guitar Dojo — Product Roadmap

_Last updated: 2026-10-22._

Checkboxes reflect what is built and tested in this repository. Items marked _(partial)_ have a working foundation but don't yet meet the full description. Items that need people, such as expert review and user testing, stay unchecked until that work actually happens.

## Progress at a Glance

| Phase | Status |
| --- | --- |
| 1. Core Education Platform | Done; refinement ongoing |
| 2. Music Theory Curriculum | Foundation batch done: 5 new courses plus the original triads course. Expert review and user testing pending. Intermediate and advanced theory not started. |
| 3. Learning Paths & Discovery | _(partial)_ A single theory curriculum with stages, soft course prerequisites and a roadmap view. No multi-discipline paths or onboarding yet. |
| 4. Practice System | Not started |
| 5. Luthiery Path | Not started |
| 6. Standalone Tools | Not started. Explorers exist only inside lessons. |
| 7. Audio & Live Assessment | Not started |
| 8. Accounts & Personalization | _(partial)_ Optional accounts with verification and recovery, plus cross-device progress sync, built and tested. Personalization not started. |
| Production hosting | Prepared, not yet deployed: Docker Compose, Caddy, PostgreSQL, encrypted off-server backups (docs/DEPLOYMENT.md). |
| 9. Content, Community & Shop | Not started (intentionally) |
| 10. Monetization | Not started (intentionally) |

---

## Product Vision

Guitar Dojo is an interactive guitar education platform designed to help people understand music, develop practical playing skills, and learn how guitars work.

The central philosophy is **learning through understanding, interaction, memorization, and practical application**, rather than relying primarily on passive videos, static diagrams, or memorized instructions.

The long-term vision includes three educational pathways:

1. **Music Theory & Fretboard Mastery** — Understanding notes, intervals, chords, scales, harmony, improvisation, and songwriting.
2. **Guitar Playing & Technique** — Developing practical guitar skills through guided exercises, technique demonstrations, metronome practice, and measurable progress.
3. **Guitar Anatomy & Luthiery** — Understanding guitar components, acoustics, electronics, maintenance, construction, and repair.

The platform may eventually expand beyond education into a guitar shop, original content, and community features.

---

## Phase 1 — Core Education Platform

**Status: Initial implementation completed; refinement ongoing**

The initial proof of concept establishes the foundation for future development.

### Existing capabilities

- [x] Next.js, React, and TypeScript application
- [x] Reusable music theory engine
- [x] Interactive fretboard and chord diagrams
- [x] Responsive desktop and mobile layouts
- [x] Chord construction and identification
- [x] Procedural chord voicing generation
- [x] Interval, note, and tuning calculations
- [x] Data-driven lesson content
- [x] Interactive recognition and construction exercises
- [x] Exercise validation and feedback
- [x] Course progression and local progress tracking
- [x] Introductory course: Understanding Major and Minor Triads. It is now titled "Major and Minor Triads"; its course id is unchanged so saved progress still works.
- [x] Unit tests and Playwright testing infrastructure

### Improvements

- [ ] Refine mobile fretboard touch interactions and usability. _(partial: on phones the neck shows a window of frets with arrows and swipe, and fret widths are tuned per pointer type. No dedicated touch usability pass yet.)_
- [ ] Support realistic versus educational fretboard geometry. _(Only even fret spacing exists today.)_
- [ ] Improve fretboard animations and visual transitions.
- [ ] Expand accessibility and keyboard navigation. _(partial: arrow-key navigation with a focus ring, screen-reader labels and note lists, and reduced-motion support. No formal accessibility audit yet.)_
- [ ] Independently review music theory content and algorithms. _(Needs a qualified human reviewer.)_
- [ ] Add stronger validation for user-selected fret positions.
- [ ] Improve chord voicing recommendations using playability and difficulty. _(partial: the generator enforces fret span and finger count and sorts simple shapes first. It has no difficulty scoring.)_
- [x] Expand independent reference tests for musical correctness. The tests compare the engine with hand-written tables, never with values computed by the engine:
  - the standard-tuning note chart
  - all 15 major scales, plus natural minor and both pentatonics
  - relative keys, interval spellings and triads
  - barre shapes and the five A minor pentatonic positions
  - drill answers
- [ ] Conduct usability testing with beginner and intermediate guitarists.

---

## Phase 2 — Expand Music Theory Curriculum

**Priority: High**
**Status: Foundation batch done. Each course is 7–8 lessons ending in a scored checkpoint. Awaiting expert review and student testing.**

Build a comprehensive sequence of interactive music theory courses using the existing data-driven lesson architecture.

### Foundations

- [x] Notes and the Fretboard (`notes-and-fretboard`, 8 lessons)
  - Musical alphabet, sharps/flats, semitones, standard tuning
  - Finding notes on individual strings and across the neck
  - Octaves and repeated note positions
  - Fretboard memorization exercises

- [x] Understanding Intervals (`intervals`, 7 lessons)
  - Interval numbers and qualities
  - Semitone relationships
  - Major, minor, perfect, diminished, and augmented intervals
  - Recognizing and constructing intervals on the fretboard

- [x] Major and Minor Scales (`major-minor-scales`, 8 lessons)
  - Scale construction
  - Whole-step and half-step patterns
  - Scale degrees
  - Relative major/minor relationships
  - Transposition and fretboard positions

- [x] Pentatonic Scales (`pentatonic-scales`, 8 lessons)
  - Major and minor pentatonic formulas
  - Five common scale positions
  - Recognizing roots within each position
  - Connecting neighboring positions
  - Transposing patterns and navigating the entire fretboard

- [x] Chord Voicings and Inversions (`chord-voicings`, 8 lessons)
  - Different fingerings for the same chord
  - Root position and inversions
  - Three-string triad shapes
  - Moveable chord patterns
  - Barre chords and introductory CAGED relationships. CAGED is introduced only; a full CAGED course is on the roadmap.

**Built alongside these courses:**
- A `drill` exercise kind with 11 data-driven question generators. Each run draws new questions in random keys, strings and positions, and only first tries count.
- A note-explorer block.
- Course-level prerequisites, stages and outcomes.
- Theory additions: `relativeMinor`/`relativeMajor`, `shiftVoicing` for barre shapes, and pentatonic position windows.

### Intermediate music theory

- [x] Major and Minor Triads. This is the original course, now placed on the pathway after Intervals.
- [ ] Keys and Chord Progressions
- [ ] Diatonic Harmony and Roman Numerals
- [ ] Seventh and Extended Chords
- [ ] Arpeggios and Chord-Tone Navigation
- [ ] Modes and Tonal Color
- [ ] Ear Training Fundamentals. _(Blocked on audio, Phase 7.)_
- [ ] Improvisation Fundamentals. _(A first-phrases lesson exists inside the pentatonic course.)_
- [ ] Songwriting and Melody Construction

### Advanced music theory

- [ ] Advanced Harmony
- [ ] Chord Substitutions and Borrowed Chords
- [ ] Modulation and Secondary Dominants
- [ ] Advanced Improvisation
- [ ] Voice Leading and Advanced Arpeggios
- [ ] Composition and Arrangement
- [ ] Complete Fretboard Mastery

### Curriculum design standards

Each course should use a progression of:

**Understand → Explore → Recognize → Recall → Apply → Master**

- [x] Provide interactive demonstrations rather than relying only on explanations. These are step-through demos, explorers and comparisons, and a content test requires one in every lesson.
- [x] Gradually remove note labels and visual hints. Lessons go from a labelled demo, to unlabelled recognition, to building it yourself, to a drill.
- [x] Test concepts using different roots, keys, and fretboard positions. Drills generate new keys and positions every run.
- [x] Include construction, recognition, and application exercises.
- [x] Provide meaningful explanations for incorrect answers.
- [ ] Distinguish lesson completion from long-term mastery. _(partial: drills score first tries only, but passing once still marks a drill done.)_
- [ ] Add review exercises to improve automatic recall. _(partial: drills can be re-run at any time. There is no scheduled review and no spaced repetition.)_
- [x] Support prerequisite relationships between courses. They recommend but never lock.

---

## Phase 3 — Learning Paths and Course Discovery

**Priority: High**
**Status: _(partial)_ One theory curriculum, organized by stage, with a roadmap view on `/learn`.**

Expand the existing course catalog into a platform supporting multiple educational disciplines.

### Learning path architecture

- [ ] Organize content into Learning Paths → Courses → Modules → Lessons → Exercises. _(partial: Courses → Modules → Lessons → Exercises exists. Courses are grouped into curriculum stages in `src/content/curriculum.ts`, but there is no "Learning Path" level for separate disciplines yet.)_
- [x] Preserve existing progress and course identifiers during migration. The triads course keeps its id, and a test guards this.
- [ ] Allow users to enroll in multiple paths independently.
- [ ] Support prerequisite relationships across learning paths. _(Prerequisites between courses work; paths don't exist yet.)_
- [x] Allow experienced users to skip introductory courses. Prerequisites only recommend; any course or lesson can be opened directly.
- [ ] Provide progress summaries for each learning path. _(partial: there are per-course progress bars, but no per-path summary.)_

### Personalized onboarding

- [ ] Add a "New to Guitar" beginner pathway.
- [ ] Add an "Already Play Guitar" pathway.
- [ ] Create a diagnostic assessment of theory and fretboard knowledge. _(The course checkpoints and drill generators could be reused for this.)_
- [ ] Recommend courses based on demonstrated skill gaps.
- [ ] Allow users to define learning goals and interests.

---

## Phase 4 — Guitar Playing & Practice System

**Priority: High**
**Status: Not started.**

Develop a dedicated practice experience that complements the educational courses.

### Interactive metronome

- [ ] Implement a Web Audio API metronome.
- [ ] Adjustable BPM.
- [ ] Time signatures and subdivisions.
- [ ] Beat accents.
- [ ] Optional visual beat indicator.
- [ ] Synchronize fretboard animations to the metronome.
- [ ] Support adjustable exercise tempo.

### Animated technique exercises

- [ ] Spider walk and finger-independence exercises.
- [ ] Alternate picking exercises.
- [ ] Pentatonic ascending and descending runs.
- [ ] Scale sequencing exercises.
- [ ] String-skipping exercises.
- [ ] Hammer-on and pull-off exercises.
- [ ] Legato practice.
- [ ] Arpeggio exercises.
- [ ] Rhythm and strumming patterns.
- [ ] Fingerpicking exercises.

### Exercise engine enhancements

- [ ] Represent exercises as reusable note sequences. _(The step-through demo block is the closest existing piece. It steps through frames, but it isn't a timed sequence.)_
- [ ] Associate notes with string/fret positions.
- [ ] Support finger assignments and picking directions.
- [ ] Highlight the current note on the fretboard.
- [ ] Animate exercise playback at adjustable tempos.
- [ ] Support looping, pausing, and restarting. _(partial: demos already play, pause, step and replay. There is no tempo control.)_
- [ ] Allow different fingering patterns such as 1-2-3-4 and 1-3-2-4.
- [ ] Support custom practice patterns.

### Daily practice routines

- [ ] Create user-defined daily practice schedules.
- [ ] Generate recommended routines based on learning goals.
- [ ] Assign exercises by duration or repetitions.
- [ ] Allow students to adjust practice difficulty.
- [ ] Schedule recurring practice sessions.
- [ ] Track completed and skipped practice activities.
- [ ] Combine technique exercises with theory review.

### Performance tracking

- [ ] Record practice duration.
- [ ] Track clean BPM for individual exercises.
- [ ] Display tempo improvements over time.
- [ ] Track accuracy in theory and note-recognition exercises. _(partial: attempts, correct and incorrect counts, and first-try correctness are stored per exercise, but nothing shows them over time.)_
- [ ] Show concepts requiring additional review.
- [ ] Provide weekly practice summaries.
- [ ] Distinguish self-reported performance from automatically verified performance.

Avoid punishing users for missing practice days. Prioritize meaningful improvement rather than streak-based engagement.

---

## Phase 5 — Guitar Anatomy & Luthiery Path

**Priority: Medium–High**
**Status: Not started.**

Build a separate educational pathway about how guitars physically work, how their components affect sound and playability, and how to build and maintain instruments.

### Course 1: Guitar Anatomy

- [ ] Identify major components of acoustic and electric guitars.
- [ ] Explain the purpose of each component.
- [ ] Introduce guitar hardware and common terminology.
- [ ] Create an interactive guitar anatomy diagram.
- [ ] Allow students to select components to view explanations.
- [ ] Include component recognition exercises.

### Course 2: How Guitars Produce Sound

- [ ] Fundamentals of vibrating strings.
- [ ] Frequency, pitch, and harmonics.
- [ ] Scale length and fret placement.
- [ ] String gauge and tension.
- [ ] Sustain and resonance.
- [ ] Acoustic versus electric sound production.
- [ ] Pickup position and harmonic response.
- [ ] Interactive string-length and tension demonstrations.
- [ ] Interactive overtone and harmonic visualizations.

Distinguish experimentally established physical principles from disputed claims about instrument materials and tone.

### Course 3: Guitar Electronics

- [ ] Single-coil pickups.
- [ ] Humbuckers.
- [ ] Pickup positioning.
- [ ] Pickup configurations.
- [ ] Volume and tone controls.
- [ ] Potentiometers and capacitors.
- [ ] Pickup selector switches.
- [ ] Series and parallel wiring.
- [ ] Introductory soldering.
- [ ] Interactive pickup and wiring diagrams.
- [ ] Virtual guitar electronics configurator.

### Course 4: Guitar Setup & Maintenance

- [ ] String changes.
- [ ] Neck relief and truss rods.
- [ ] Action adjustment.
- [ ] Intonation.
- [ ] Nut height and slot geometry.
- [ ] Pickup height.
- [ ] Fret buzz diagnosis.
- [ ] Basic cleaning and maintenance.
- [ ] Safe tool usage and repair precautions.
- [ ] Interactive virtual setup simulations.
- [ ] Troubleshooting exercises based on common symptoms.

### Course 5: Guitar Materials & Construction

- [ ] Body woods and other construction materials.
- [ ] Neck and fretboard materials.
- [ ] Neck joints and construction methods.
- [ ] Scale lengths and fret spacing.
- [ ] Bridges, tuners, and hardware.
- [ ] Guitar body geometry.
- [ ] Ergonomics and balance.
- [ ] Finishing materials and techniques.

### Course 6: Building Your First Electric Guitar

- [ ] Planning a first guitar build.
- [ ] Designing a custom body shape.
- [ ] Templates and measurements.
- [ ] Choosing compatible premade necks and hardware.
- [ ] Body cutting and routing.
- [ ] Neck pocket geometry.
- [ ] Drilling and hardware placement.
- [ ] Sanding and finishing.
- [ ] Electronics installation.
- [ ] Guitar assembly.
- [ ] Initial setup and troubleshooting.
- [ ] Guided build checklist and material planning tool.

### Advanced luthiery

- [ ] Building guitar necks.
- [ ] Installing and leveling frets.
- [ ] Designing neck profiles.
- [ ] Constructing acoustic guitars.
- [ ] Advanced repairs and restorations.
- [ ] Custom instrument design.

Practical construction and safety content should receive expert review before being presented as authoritative guidance.

---

## Phase 6 — Standalone Interactive Guitar Tools

**Priority: Medium**
**Status: Not started as standalone pages. The engine and renderer they need already exist, and "Tools" is reserved but disabled in the site navigation.**

Allow users to explore musical concepts freely without starting a structured course.

### Chord Explorer

- [ ] Search for chords by name.
- [ ] Dynamically generate chord tones and guitar voicings. _(The engine already does this with `buildChord` and `findVoicings`; it just has no standalone page.)_
- [ ] Display multiple playable fingerings.
- [ ] Filter by fret position and difficulty.
- [ ] Explore chord inversions.
- [ ] Show interval and note labels.
- [ ] Suggest alternative chord voicings.

### Scale Explorer

- [ ] Display scales in any key.
- [ ] Highlight scale degrees and root notes.
- [ ] Show commonly taught scale positions. _(The five pentatonic position windows are implemented and tested.)_
- [ ] Connect overlapping scale shapes.
- [ ] Compare related scales.
- [ ] Generate scale exercises.

### Interval Explorer

- [ ] Select a root and find intervals. _(partial: an interval-explorer block exists inside lessons.)_
- [ ] Identify intervals between selected notes.
- [ ] Display equivalent interval shapes across the neck.
- [ ] Explore octave relationships. _(partial: the in-lesson note explorer shows unisons and octaves.)_

### Additional utilities

- [ ] Interactive guitar tuner.
- [ ] Standalone metronome.
- [ ] Chord progression explorer.
- [ ] Guitar configurator.
- [ ] Custom scale and exercise builder.
- [ ] Saved chord, scale, and practice collections.

---

## Phase 7 — Audio and Advanced Interactive Assessment

**Priority: Medium — Long Term**
**Status: Not started. Lessons currently describe sounds in "Hear it" callouts for students to play on their own guitar.**

### Audio demonstrations

- [ ] Play notes from the interactive fretboard.
- [ ] Play chords and scale sequences.
- [ ] Adjustable playback speed.
- [ ] Support different instrument sounds.
- [ ] Synchronize audio with animated fretboard positions.

### Microphone integration

- [ ] Request microphone permission when required.
- [ ] Detect individual pitches from live guitar input.
- [ ] Provide real-time note recognition feedback.
- [ ] Add tuning detection.
- [ ] Support pitch accuracy exercises.
- [ ] Experiment with timing accuracy detection.
- [ ] Explore chord recognition from live input.

### Advanced practice feedback

- [ ] Detect whether a student played the expected notes. _(The existing answer checkers could grade detected pitches once input exists.)_
- [ ] Measure timing relative to metronome beats.
- [ ] Evaluate note-sequence accuracy.
- [ ] Support gradually increasing practice tempo.
- [ ] Provide personalized recommendations based on observed performance.

Microphone-based chord identification and reliable timing assessment should be treated as research and development features rather than guaranteed near-term capabilities.

---

## Phase 8 — Accounts, Personalization & Learning Analytics

**Priority: Medium**
**Status: _(partial)_ Accounts and sync are built and tested locally, and ready to deploy. Personalization and analytics are not started.**

### Accounts and cloud synchronization

- [x] User registration and authentication. Better Auth with email and password, required email verification, password recovery, database-backed rate limiting, and server-side sessions that revoke immediately. Registration stays closed until email delivery is configured.
- [x] Cloud-backed progress persistence. An idempotent PostgreSQL event log with a rebuildable snapshot.
- [x] Cross-device synchronization. The server replays events in a deterministic order, the client keeps an offline outbox, and tabs refresh when they regain focus.
- [x] Preserve and migrate existing local progress. Anonymous progress is imported once on sign-in, with a content-hash id, and the merge never loses completed work.
- [ ] Student profiles and preferences. _(partial: name, email, password change and sign-out only.)_
- [ ] Account deletion and data export.

### Personalized education

- [ ] Learning goals.
- [ ] Skill-level assessments.
- [ ] Recommended course sequences. _(partial: there is a fixed recommended pathway order, but it isn't personalized.)_
- [ ] Personalized practice routines.
- [ ] Adaptive exercise difficulty.
- [ ] Spaced repetition for fretboard knowledge.
- [ ] Weak-area identification.
- [ ] Progress history and mastery visualization.

### Learning analytics

- [ ] Lesson completion and abandonment analytics.
- [ ] Exercise error patterns. _(Error types are recorded in the answer-checker results, but they are not stored or aggregated.)_
- [ ] Repeat-attempt performance.
- [ ] Course difficulty analysis.
- [ ] Educational effectiveness testing.
- [ ] Optional feedback collection.
- [ ] Privacy-conscious analytics.

---

## Phase 9 — Content, Community & Guitar Shop

**Priority: Long Term**
**Status: Not started (intentionally). "Shop" and "Blog" are reserved but disabled in the site navigation.**

These features support Guitar Dojo becoming a broader guitar-focused brand.

### Articles and educational content

- [ ] Educational blog.
- [ ] Guitar-building journals.
- [ ] Guitar repair and maintenance guides.
- [ ] Gear explanations and comparisons.
- [ ] Searchable knowledge library.
- [ ] Embedded interactive demonstrations in articles.
- [ ] Video and social media content integration.

### Community

- [ ] User profiles.
- [ ] Shared practice achievements.
- [ ] Student discussions.
- [ ] Community-submitted exercises.
- [ ] Guitar-building project showcases.
- [ ] Feedback and feature requests.
- [ ] Moderation and reporting tools.

### Guitar shop

- [ ] Product catalog.
- [ ] Guitar and accessory listings.
- [ ] Product detail pages.
- [ ] Shopping cart and checkout.
- [ ] Order management.
- [ ] Custom guitar configurator.
- [ ] Custom build inquiries.
- [ ] Build progress updates.
- [ ] Integration with guitar-building educational content.

Do not implement e-commerce functionality until there is a clear business reason.

---

## Phase 10 — Business Development & Monetization

**Priority: Explore after initial user validation**
**Status: Not started. All content is free during the public beta. The architecture is ready for paid content: a central server-side access layer, per-course access rules that currently mark everything public, and an entitlement model that supports subscriptions, purchases, promotions and admin grants. No payment code or billing tables exist yet; "Future: paid courses" in docs/DEPLOYMENT.md describes where they connect.**

Possible business models:

- Free introductory courses.
- Premium advanced curriculum.
- Optional subscription for personalized practice and progress tools.
- One-time course purchases.
- Paid specialized technique or luthiery courses.
- Guitar-related affiliate partnerships.
- Sponsored content with clear disclosures.
- Custom guitars and accessories.
- Digital products and downloadable educational materials.

### Validation milestones

- [ ] Recruit a small group of beta testers. _(One real user has tried the original triads course.)_
- [ ] Test with complete beginners and self-taught intermediate players.
- [ ] Identify which lessons produce measurable learning improvements.
- [ ] Collect feedback on mobile fretboard usability.
- [ ] Understand which features encourage voluntary return visits.
- [ ] Test demand for premium functionality.
- [ ] Validate willingness to pay before introducing substantial billing infrastructure.

---

## Cross-Cutting Engineering Priorities

These should continue throughout development. A checked item is a practice that is in place and enforced today. It still needs ongoing attention.

### Software quality

- [x] Maintain separation between music theory and presentation layers. The theory, fretboard, exercise, course and progress code has no React.
- [x] Keep lessons and exercises data-driven.
- [x] Add independent music theory reference tests.
- [x] Verify chord voicings and enharmonic spelling.
- [x] Add automated curriculum integrity checks. They check every exercise solution and 60 generated questions per drill, plus ids, prerequisites, lesson counts and checkpoints.
- [x] Test mobile viewports and touch interaction. Playwright runs on desktop plus 390px and 360px phone widths, including a no-sideways-scroll check.
- [x] Implement reusable visualizations rather than one-off lesson components.
- [ ] Maintain accessible keyboard and screen-reader interactions. _(partial: a baseline is in place but hasn't been audited.)_
- [x] Preserve progress compatibility when updating the curriculum.
- [ ] Monitor application performance as content grows.

### Educational quality

- [ ] Have music theory content independently reviewed.
- [ ] Have luthiery and guitar-maintenance lessons reviewed by qualified practitioners.
- [ ] Test lessons with real students.
- [ ] Separate recognition from recall and practical application. _(partial: exercises are labelled recognition, construction or drill. Recall still isn't separated from a single success.)_
- [ ] Avoid presenting memorized patterns as complete understanding. _(partial: lessons explain how shapes are generated before drilling them. This needs validation with students.)_
- [x] Use meaningful feedback to explain errors.
- [ ] Review confusing or frequently failed exercises. _(Needs analytics or student testing.)_
- [x] Keep educational activities engaging without unnecessary gamification.

### Design quality

- [x] Mobile-first interface.
- [ ] Realistic and simplified fretboard rendering options. _(Simplified only.)_
- [x] Consistent lesson and exercise design.
- [ ] Animations that communicate actual musical relationships. _(partial: step-through demos build shapes note by note. Transitions between related shapes aren't animated yet.)_
- [x] Usable touch targets.
- [ ] Optional full-screen fretboard interactions.
- [ ] Accessible contrast and reduced-motion support. _(partial: reduced motion is supported, but contrast hasn't been audited.)_
- [x] Responsive layouts for desktop, tablet, and phone.

---

## Recommended Development Order

**Immediate priorities**

1. ~~Complete~~ and review the five additional introductory music theory courses. **The courses are complete. Expert review and student testing remain.**
2. Implement learning paths for Theory, Technique, and Luthiery. _(The theory curriculum structure exists to build on.)_
3. Build the interactive metronome and animated practice exercise foundation.
4. Create the first luthiery courses: Guitar Anatomy and How Guitars Produce Sound.
5. Improve mastery tracking and recall exercises. _(Drills exist. Next comes spaced review, optional timing, and separating "passed once" from "mastered".)_

**Next priorities**

6. Expand the remaining intermediate theory curriculum.
7. Add daily practice scheduling and performance tracking.
8. Develop standalone chord, scale, and interval explorers.
9. Implement audio demonstrations.
10. ~~Introduce student accounts and synchronized progress when needed.~~ **Built; launching with the public beta.**

**Long-term priorities**

11. Advanced theory and luthiery education.
12. Live guitar input and automated performance assessment.
13. Personalized learning paths and adaptive practice.
14. Blog, social content, and community.
15. Guitar shop and custom instrument configurator.
16. Sustainable monetization based on demonstrated user demand.

## Guiding Principle

**Guitar Dojo should not simply explain the guitar. It should help people develop an intuitive understanding of the instrument through interaction, repetition, experimentation, and real-world application.**

Every significant feature should contribute to one of three outcomes:

- Helping students understand something they previously found confusing.
- Helping students perform a skill they previously couldn't perform.
- Helping students apply what they learn to playing, maintaining, or building real guitars.

Prioritize those outcomes over adding features for their own sake.
