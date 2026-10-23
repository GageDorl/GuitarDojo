/**
 * The long-term curriculum, organised as LEARNING PATHS (disciplines) → stages → courses.
 *
 * Entries with a `courseId` are live courses; the rest are planned and shown as "coming soon" so
 * students can see where each path leads. Adding a course means building it in
 * src/content/courses and setting its courseId here. Planned entries have no id yet, so moving
 * them between paths or stages is free; never rename a live courseId (it's a progress key).
 */

export interface RoadmapEntry {
  readonly title: string;
  readonly courseId?: string;
  /** One line shown for planned courses. */
  readonly summary?: string;
}

export interface RoadmapStage {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly courses: readonly RoadmapEntry[];
}

export interface LearningPath {
  /** Stable id, used in URLs (#path-<id>) and for future enrolment. */
  readonly id: "theory" | "technique" | "luthiery";
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  /** "available" once at least one course is live. */
  readonly status: "available" | "coming-soon";
  readonly stages: readonly RoadmapStage[];
}

export const LEARNING_PATHS: readonly LearningPath[] = [
  {
    id: "theory",
    title: "Music Theory & Fretboard Mastery",
    tagline: "Understand what you play.",
    description: "Notes, intervals, chords, scales and harmony, learned directly on the fretboard, from first notes to fluent musicianship.",
    status: "available",
    stages: [
      {
        id: "foundation",
        title: "Foundation",
        description: "The language of music on the guitar: notes and intervals.",
        courses: [
          { title: "Notes and the Fretboard", courseId: "notes-and-fretboard" },
          { title: "Understanding Intervals", courseId: "intervals" },
          { title: "Reading Guitar Music", summary: "Tab, chord charts and rhythm notation." },
        ],
      },
      {
        id: "intermediate",
        title: "Intermediate foundations",
        description: "Chords, scales, keys and the shapes that connect the whole neck.",
        courses: [
          { title: "Major and Minor Triads", courseId: "fretboard-foundations" },
          { title: "Major and Minor Scales", courseId: "major-minor-scales" },
          { title: "Pentatonic Scales and Fretboard Navigation", courseId: "pentatonic-scales" },
          { title: "Chord Voicings and Inversions", courseId: "chord-voicings" },
          { title: "Keys and Chord Progressions", courseId: "keys-and-progressions" },
          { title: "The CAGED System", courseId: "caged-system" },
        ],
      },
      {
        id: "fluency",
        title: "Musical fluency",
        description: "Richer harmony, improvisation and your ear.",
        courses: [
          { title: "Seventh and Extended Chords", courseId: "seventh-chords" },
          { title: "Arpeggios and Chord-Tone Navigation", summary: "Outline any chord with single notes, anywhere on the neck." },
          { title: "Modes and Tonal Color", summary: "Dorian, Mixolydian and friends, and when to use them." },
          { title: "Ear Training for Guitar", summary: "Hear intervals, chords and progressions, then find them." },
          { title: "Improvisation Fundamentals", summary: "Phrasing, targeting chord tones and soloing over changes." },
          { title: "Songwriting Foundations", summary: "Melody, harmony and form for your own songs." },
        ],
      },
      {
        id: "advanced",
        title: "Advanced",
        description: "Deep harmony, advanced improvisation and complete fretboard mastery.",
        courses: [
          { title: "Advanced Harmony", summary: "Secondary dominants, modulation and borrowed chords." },
          { title: "Advanced Improvisation", summary: "Outside playing, superimposition and motif development." },
          { title: "Composition and Arrangement", summary: "Writing and arranging for guitar and ensembles." },
          { title: "Fretboard Mastery", summary: "Everything connected: any note, chord or scale, anywhere." },
        ],
      },
    ],
  },
  {
    id: "technique",
    title: "Guitar Playing & Technique",
    tagline: "Build the hands to play it.",
    description:
      "Guided technique with animated exercises, an adjustable metronome and daily practice routines, tracking real progress like clean tempo over time.",
    status: "coming-soon",
    stages: [
      {
        id: "getting-started",
        title: "Getting started",
        description: "Holding the guitar, first chords and keeping time.",
        courses: [
          { title: "Getting to Know Your Guitar", summary: "Posture, tuning, holding the pick, and your first sounds." },
          { title: "Your First Chords", summary: "Open chords, clean changes and your first songs." },
          { title: "Rhythm and Timing", summary: "Pulse, subdivision and strumming with a metronome." },
        ],
      },
      {
        id: "building-technique",
        title: "Building technique",
        description: "Both hands working together, cleanly and in time.",
        courses: [
          { title: "Guitar Technique Fundamentals", summary: "Alternate picking, finger independence and spider walks." },
          { title: "Applied Rhythm Guitar", summary: "Strumming patterns, muting, dynamics and groove." },
          { title: "Fingerstyle Foundations", summary: "Fingerpicking patterns, independence and arrangements." },
        ],
      },
      {
        id: "advanced-technique",
        title: "Advanced technique",
        description: "Speed, fluency and expressive techniques.",
        courses: [
          { title: "Advanced Guitar Techniques", summary: "Legato, string skipping, bending, vibrato and tapping." },
          { title: "Practice Studio", summary: "Metronome, timed exercises and personal practice routines." },
        ],
      },
    ],
  },
  {
    id: "luthiery",
    title: "Guitar Anatomy & Luthiery",
    tagline: "Understand, maintain and build the instrument.",
    description: "How guitars work, from vibrating strings and pickups to setups, repairs and building your own electric guitar.",
    status: "coming-soon",
    stages: [
      {
        id: "how-guitars-work",
        title: "How guitars work",
        description: "The parts, the physics and the electronics.",
        courses: [
          { title: "Guitar Anatomy", summary: "Every part of acoustic and electric guitars, and what it does." },
          { title: "How Guitars Produce Sound", summary: "Strings, scale length, harmonics and resonance." },
          { title: "Guitar Electronics", summary: "Pickups, pots, capacitors, switches and wiring." },
        ],
      },
      {
        id: "care-and-setup",
        title: "Care and setup",
        description: "Keep a guitar playing its best.",
        courses: [{ title: "Guitar Setup and Maintenance", summary: "Strings, truss rod, action, intonation and fret buzz." }],
      },
      {
        id: "building",
        title: "Building",
        description: "From materials to a finished instrument.",
        courses: [
          { title: "Guitar Materials and Construction", summary: "Woods, neck joints, hardware, geometry and finishes." },
          { title: "Building Your First Electric Guitar", summary: "Plan, cut, route, finish, wire and set up a guitar." },
          { title: "Advanced Luthiery", summary: "Necks, fretwork, acoustic builds and repairs." },
        ],
      },
    ],
  },
];

/** The theory path's stages (kept for callers that only need the live curriculum). */
export const CURRICULUM: readonly RoadmapStage[] = LEARNING_PATHS[0]!.stages;

export function liveCourseIds(path: LearningPath): string[] {
  return path.stages.flatMap((s) => s.courses.flatMap((c) => (c.courseId ? [c.courseId] : [])));
}
