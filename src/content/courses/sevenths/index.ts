import type { Course } from "@/lib/courses";
import { addingTheSeventh } from "./lessons/01-adding-the-seventh";
import { dominantSevenths } from "./lessons/02-dominant-sevenths";
import { majorAndMinorSevenths } from "./lessons/03-major-and-minor-sevenths";
import { diminishedSevenths } from "./lessons/04-diminished-sevenths";
import { seventhsInAKey } from "./lessons/05-sevenths-in-a-key";
import { moveableAndExtended } from "./lessons/06-moveable-and-extended";
import { seventhsCheckpoint } from "./lessons/07-checkpoint";

export const seventhChords: Course = {
  id: "seventh-chords",
  title: "Seventh and Extended Chords",
  description:
    "Add colour beyond triads: dominant, major, minor and diminished sevenths, how they work in a key, moveable shapes, and an introduction to 9ths and beyond.",
  level: "intermediate",
  stage: "fluency",
  prerequisites: ["keys-and-progressions"],
  outcomes: [
    "Spell and play the five common seventh chords",
    "Use seventh chords in a key, including ii–V–I",
    "Play moveable seventh barre chords and understand extended chords",
  ],
  modules: [
    {
      id: "sevenths",
      title: "Seventh and Extended Chords",
      description: "Seventh chord qualities, open and barre shapes, sevenths in a key, and extensions.",
      lessons: [addingTheSeventh, dominantSevenths, majorAndMinorSevenths, diminishedSevenths, seventhsInAKey, moveableAndExtended, seventhsCheckpoint],
    },
  ],
};
