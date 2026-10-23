import type { Course } from "@/lib/courses";
import { measuringDistance } from "./lessons/01-measuring-distance";
import { intervalNumbers } from "./lessons/02-interval-numbers";
import { majorMinorPerfect } from "./lessons/03-major-minor-perfect";
import { augmentedDiminished } from "./lessons/04-augmented-diminished";
import { intervalShapes } from "./lessons/05-interval-shapes";
import { intervalsAroundARoot } from "./lessons/06-intervals-around-a-root";
import { intervalsCheckpoint } from "./lessons/07-checkpoint";

export const understandingIntervals: Course = {
  id: "intervals",
  title: "Understanding Intervals",
  description:
    "Intervals are the building blocks of melody and harmony. Learn their names, sizes and shapes, and find them anywhere on the neck.",
  level: "beginner",
  stage: "foundation",
  prerequisites: ["notes-and-fretboard"],
  outcomes: [
    "Name any interval by number and quality",
    "Connect interval names to half-step sizes and fretboard shapes",
    "Find and recognise intervals from any root",
  ],
  modules: [
    {
      id: "intervals",
      title: "Understanding Intervals",
      description: "Numbers, qualities, altered intervals, shapes across strings, and intervals in every direction.",
      lessons: [
        measuringDistance,
        intervalNumbers,
        majorMinorPerfect,
        augmentedDiminished,
        intervalShapes,
        intervalsAroundARoot,
        intervalsCheckpoint,
      ],
    },
  ],
};
