import type { Course } from "@/lib/courses";
import { whatIsAScale } from "./lessons/01-what-is-a-scale";
import { majorScalePattern } from "./lessons/02-major-scale-pattern";
import { majorInAnyKey } from "./lessons/03-major-any-key";
import { naturalMinor } from "./lessons/04-natural-minor";
import { relativeKeys } from "./lessons/05-relative-keys";
import { scaleShapes } from "./lessons/06-scale-shapes";
import { transposition } from "./lessons/07-transposition";
import { scalesCheckpoint } from "./lessons/08-checkpoint";

export const majorMinorScales: Course = {
  id: "major-minor-scales",
  title: "Major and Minor Scales",
  description:
    "Understand how scales are generated from step patterns, spell them in any key, and play them on the neck in any position.",
  level: "intermediate",
  stage: "intermediate",
  prerequisites: ["intervals"],
  outcomes: [
    "Build a major or natural minor scale from any tonic",
    "Explain relative major and minor keys",
    "Play and move one-octave scale shapes to any key",
  ],
  modules: [
    {
      id: "major-minor-scales",
      title: "Major and Minor Scales",
      description: "Degrees, step patterns, spelling, relative keys, scale shapes and transposition.",
      lessons: [whatIsAScale, majorScalePattern, majorInAnyKey, naturalMinor, relativeKeys, scaleShapes, transposition, scalesCheckpoint],
    },
  ],
};
