import type { Course } from "@/lib/courses";
import { notesAndSemitones } from "./lessons/01-notes-and-semitones";
import { intervals } from "./lessons/02-intervals";
import { rootsThirdsFifths } from "./lessons/03-roots-thirds-fifths";
import { majorTriads } from "./lessons/04-major-triads";
import { minorTriads } from "./lessons/05-minor-triads";
import { triadsOnTheFretboard } from "./lessons/06-triads-on-the-fretboard";
import { triadsAssessment } from "./lessons/07-assessment";

export const fretboardFoundations: Course = {
  id: "fretboard-foundations",
  title: "Fretboard Foundations",
  description:
    "Learn the building blocks of harmony by playing them. Notes, intervals and chords, explored directly on the guitar neck.",
  level: "beginner",
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
