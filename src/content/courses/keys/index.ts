import type { Course } from "@/lib/courses";
import { whatIsAKey } from "./lessons/01-what-is-a-key";
import { diatonicTriads } from "./lessons/02-diatonic-triads";
import { romanNumerals } from "./lessons/03-roman-numerals";
import { commonProgressions } from "./lessons/04-common-progressions";
import { minorKeys } from "./lessons/05-minor-keys";
import { progressionsOnTheNeck } from "./lessons/06-progressions-on-the-neck";
import { keysCheckpoint } from "./lessons/07-checkpoint";

export const keysAndProgressions: Course = {
  id: "keys-and-progressions",
  title: "Keys and Chord Progressions",
  description:
    "Understand why chords belong together: build the chords of any key, read Roman numerals, and play the progressions behind thousands of songs in any key.",
  level: "intermediate",
  stage: "intermediate",
  prerequisites: ["fretboard-foundations", "major-minor-scales"],
  outcomes: [
    "Name the chords of any major or minor key",
    "Translate progressions between numerals and chord names",
    "Play I–IV–V and other progressions anywhere on the neck",
  ],
  modules: [
    {
      id: "keys-and-progressions",
      title: "Keys and Chord Progressions",
      description: "Key signatures, diatonic chords, Roman numerals, common progressions, minor keys and moveable progressions.",
      lessons: [whatIsAKey, diatonicTriads, romanNumerals, commonProgressions, minorKeys, progressionsOnTheNeck, keysCheckpoint],
    },
  ],
};
