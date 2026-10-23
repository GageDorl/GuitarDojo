import type { Course } from "@/lib/courses";
import { fiveOpenShapes } from "./lessons/01-five-open-shapes";
import { movingShapes } from "./lessons/02-moving-shapes";
import { cagedSequence } from "./lessons/03-caged-sequence";
import { cagedAnyKey } from "./lessons/04-caged-any-key";
import { minorShapes } from "./lessons/05-minor-shapes";
import { cagedAndScales } from "./lessons/06-caged-and-scales";
import { cagedCheckpoint } from "./lessons/07-checkpoint";

export const cagedSystem: Course = {
  id: "caged-system",
  title: "The CAGED System",
  description:
    "Five open chord shapes that unlock the whole neck. Play any chord in five places, see how they connect, and use them as landmarks for scales and solos.",
  level: "intermediate",
  stage: "intermediate",
  prerequisites: ["chord-voicings"],
  outcomes: [
    "Play any major chord with all five CAGED shapes",
    "Find the roots in every shape and continue the sequence up the neck",
    "Use moveable minor shapes and see chords inside scale positions",
  ],
  modules: [
    {
      id: "caged",
      title: "The CAGED System",
      description: "The five shapes, moving them, the sequence in any key, minor shapes, and chords inside scales.",
      lessons: [fiveOpenShapes, movingShapes, cagedSequence, cagedAnyKey, minorShapes, cagedAndScales, cagedCheckpoint],
    },
  ],
};
