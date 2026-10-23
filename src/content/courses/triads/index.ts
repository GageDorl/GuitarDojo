import type { Course } from "@/lib/courses";
import { notesAndSemitones } from "./lessons/01-notes-and-semitones";
import { intervals } from "./lessons/02-intervals";
import { rootsThirdsFifths } from "./lessons/03-roots-thirds-fifths";
import { majorTriads } from "./lessons/04-major-triads";
import { minorTriads } from "./lessons/05-minor-triads";
import { triadsOnTheFretboard } from "./lessons/06-triads-on-the-fretboard";
import { triadsAssessment } from "./lessons/07-assessment";

/**
 * The original proof-of-concept course. Its id predates the curriculum and is kept because it is
 * the key for existing students' saved progress. Its first two lessons are a compact review of
 * Notes and the Fretboard / Understanding Intervals, so it still works as a standalone entry point.
 */
export const majorMinorTriads: Course = {
  id: "fretboard-foundations",
  title: "Major and Minor Triads",
  description:
    "Learn how major and minor chords are built, why they sound different, and where to find them on the fretboard.",
  level: "beginner",
  stage: "intermediate",
  prerequisites: ["intervals"],
  outcomes: [
    "Spell any major or minor triad from its formula",
    "Hear and explain the one-note difference between major and minor",
    "Build triads anywhere on the neck and name their inversions",
  ],
  modules: [
    {
      id: "major-minor-triads",
      title: "Understanding Major and Minor Triads",
      description:
        "From semitones to chords: learn how major and minor triads are built, why they sound different, and where to find them on the fretboard.",
      lessons: [
        notesAndSemitones,
        intervals,
        rootsThirdsFifths,
        majorTriads,
        minorTriads,
        triadsOnTheFretboard,
        triadsAssessment,
      ],
    },
  ],
};
