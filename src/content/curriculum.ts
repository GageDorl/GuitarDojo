/**
 * The long-term curriculum roadmap. Entries with a `courseId` are available; the rest are planned
 * and shown as "coming later" so students can see where the path leads. Adding a course means
 * building it in src/content/courses and setting its courseId here.
 */
import type { CurriculumStage } from "@/lib/courses";

export interface RoadmapEntry {
  readonly title: string;
  readonly courseId?: string;
}

export interface RoadmapStage {
  readonly id: CurriculumStage;
  readonly title: string;
  readonly description: string;
  readonly courses: readonly RoadmapEntry[];
}

export const CURRICULUM: readonly RoadmapStage[] = [
  {
    id: "foundation",
    title: "Foundation",
    description: "Know your instrument: notes, rhythm, first chords and intervals.",
    courses: [
      { title: "Getting to Know Your Guitar" },
      { title: "Notes and the Fretboard", courseId: "notes-and-fretboard" },
      { title: "Rhythm and Timing" },
      { title: "Your First Chords" },
      { title: "Reading Guitar Music" },
      { title: "Understanding Intervals", courseId: "intervals" },
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate foundations",
    description: "Chords, scales and the shapes that connect the whole neck.",
    courses: [
      { title: "Major and Minor Triads", courseId: "fretboard-foundations" },
      { title: "Major and Minor Scales", courseId: "major-minor-scales" },
      { title: "Pentatonic Scales and Fretboard Navigation", courseId: "pentatonic-scales" },
      { title: "Chord Voicings and Inversions", courseId: "chord-voicings" },
      { title: "The CAGED System" },
      { title: "Keys and Chord Progressions" },
      { title: "Guitar Technique Fundamentals" },
      { title: "Applied Rhythm Guitar" },
    ],
  },
  {
    id: "fluency",
    title: "Musical fluency",
    description: "Richer harmony, improvisation and your ear.",
    courses: [
      { title: "Seventh and Extended Chords" },
      { title: "Arpeggios and Inversions" },
      { title: "Improvisation Fundamentals" },
      { title: "Ear Training for Guitar" },
      { title: "Modes and Tonal Color" },
      { title: "Songwriting Foundations" },
      { title: "Fingerstyle and Advanced Rhythm" },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Deep harmony, advanced improvisation and complete fretboard mastery.",
    courses: [
      { title: "Advanced Harmony" },
      { title: "Advanced Improvisation" },
      { title: "Advanced Guitar Techniques" },
      { title: "Composition and Arrangement" },
      { title: "Fretboard Mastery" },
    ],
  },
];
