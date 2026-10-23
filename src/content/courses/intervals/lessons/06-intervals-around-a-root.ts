import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, drill, exercise, step, text } from "@/content/helpers";

export const intervalsAroundARoot: Lesson = {
  id: "intervals-around-a-root",
  title: "Intervals Around a Root",
  summary: "Find intervals below a note and beyond the octave, and recognise them by shape alone.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Invert intervals (a 5th up lands on the same note as a 4th down)",
    "Name compound intervals like 9ths and 10ths",
    "Recognise intervals by their fretboard shape",
  ],
  prerequisites: ["interval-shapes"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("inversion", "Up, down and beyond", [
      text(`
        A note's interval can be measured **up** or **down** from the root. Flipping an interval is called **inverting** it:

        - The numbers add up to **9**: a 5th up reaches the same note name as a 4th down; a 3rd becomes a 6th.
        - **Major ↔ minor**, **augmented ↔ diminished**, and **perfect stays perfect**.

        So C up to G is a perfect 5th, and G up to C is a perfect 4th. A major 3rd inverted is a minor 6th.

        Intervals larger than an octave are **compound**: add 7 to the number. A **9th** is a 2nd plus an octave; a **10th** is a 3rd plus an octave. On guitar they're often just a stretch away.
      `),
      { type: "interval-explorer", root: { string: 4, fret: 7 }, range: { start: 0, end: 12 }, caption: "Explore: this root is in the middle of the neck. Tap notes above and below it." },
      callout(
        "tip",
        "Chord and scale shapes use notes in *every* octave around the root. Knowing that a 4th below is \"the 5th\" lets you find chord tones wherever your hand is.",
        "Why this matters",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "invert-p5",
        "C up to G is a perfect 5th. What is G up to C?",
        [
          ["P4", "A perfect 4th"],
          ["P5", "A perfect 5th", "Inverted intervals add up to 9: a 5th flips into a 4th."],
          ["M4", "A major 4th", "Fourths are never major. Perfect intervals stay perfect when inverted."],
        ],
        "P4",
      ),
      choice(
        "invert-m3",
        "What does a major 3rd become when inverted?",
        [
          ["m6", "A minor 6th"],
          ["M6", "A major 6th", "Major flips to minor when inverted."],
          ["m5", "A minor 5th", "3 + 6 = 9, so a 3rd becomes a 6th. (Fifths are never minor.)"],
        ],
        "m6",
      ),
      choice(
        "tenth",
        "A major 10th is…",
        [
          ["m3-octave", "A major 3rd plus an octave"],
          ["m3", "A major 3rd minus an octave", "Compound intervals are *larger* than an octave."],
          ["5ths", "Two perfect 5ths", "Two 5ths make a 9th (5 + 5 − 1). A 10th is 3 + 7."],
        ],
        "m3-octave",
      ),
      exercise({
        id: "fifth-of-c-any-octave",
        kind: "fretboard",
        task: "locate",
        prompt: "Find a **perfect 5th** of this C in any octave: a G anywhere on the neck.",
        board: { range: { start: 0, end: 12 }, labels: "none", positions: [{ string: 5, fret: 3, role: "root", label: "C" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 3 }, interval: "P5", octave: "any-octave" },
        solution: [{ string: 4, fret: 5 }],
      }),
      exercise({
        id: "fourth-below-c",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the **perfect 4th below** this C.",
        hint: "A 4th down lands on the same letter as a 5th up: G. It must be lower than this C.",
        explanation: "G3: five half steps below C4. Same note name as the 5th of C, an octave lower.",
        board: { range: { start: 0, end: 12 }, labels: "none", positions: [{ string: 4, fret: 10, role: "root", label: "C" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 4, fret: 10 }, interval: "P4", direction: "down" },
        solution: [{ string: 4, fret: 5 }],
      }),
      drill(
        "recognise-interval-shapes",
        "Name intervals by shape alone (no note names).",
        {
          type: "interval-recognition",
          intervals: ["m3", "M3", "P4", "P5", "m6", "M6", "P8"],
          rootStrings: [6, 5],
          rootRange: { start: 0, end: 7 },
          boardRange: { start: 0, end: 12 },
        },
        { rounds: 8, hint: "Picture the shape from the square root: same fret on the next string is a 4th, two frets forward a 5th…" },
      ),
    ]),
  ],
};
