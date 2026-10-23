import type { Lesson } from "@/lib/courses";
import { NECK, buildUp, callout, choice, drill, exercise, step, text } from "@/content/helpers";

export const octaves: Lesson = {
  id: "octaves",
  title: "Octave Shapes",
  summary: "Two compact shapes that let you copy any note across the whole neck.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Define an octave",
    "Use the two-strings-two-frets octave shape",
    "Adjust the shape when it crosses the B string",
  ],
  prerequisites: ["same-note-different-strings"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("what", "Same name, higher sound", [
      text(`
        An **octave** is the distance between a note and the next note with the same name: **12 half steps**. The two notes sound so similar that they share a letter, but one is clearly higher.

        On one string, an octave is 12 frets. Across strings there are shorter shapes:

        - From strings **6 or 5**: go **two strings up and two frets up**.
        - From strings **4 or 3**, the shape crosses the B string, which is tuned one fret lower than the pattern expects: go **two strings up and three frets up**.
      `),
      {
        type: "demo",
        title: "G in three octaves",
        board: { range: { start: 0, end: 10 }, labels: "pitch", layout: NECK },
        frames: buildUp([
          { at: { string: 6, fret: 3, role: "root" }, caption: "G2 on the low E string, fret 3." },
          { at: { string: 4, fret: 5, role: "root" }, caption: "Two strings up, two frets up: **G3**." },
          { at: { string: 2, fret: 8, role: "root" }, caption: "Crossing the B string, two strings up and **three** frets up: **G4**." },
        ]),
      },
      callout(
        "guitar",
        "Play the three Gs one after another. Each one is the same note, higher. Now try it from A (low E string, fret 5).",
        "Try it",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "octave-semitones",
        "How many half steps are in an octave?",
        [
          ["12", "12"],
          ["8", "8", "*Oct-* means eight, but that counts letter names (C D E F G A B C), not half steps."],
          ["7", "7", "Seven half steps is a perfect fifth, not an octave."],
        ],
        "12",
      ),
      exercise({
        id: "octave-above-g",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the octave above this G.",
        hint: "Two strings up, two frets up.",
        board: { range: { start: 0, end: 10 }, labels: "none", positions: [{ string: 6, fret: 3, role: "root", label: "G" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 6, fret: 3 }, interval: "P8" },
        solution: [{ string: 4, fret: 5 }],
      }),
      exercise({
        id: "octave-above-a3",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the octave above this A (D string, fret 7).",
        hint: "This shape crosses the B string: two strings up, three frets up.",
        explanation: "B string, fret 10. The high E string's fret 5 is the same pitch.",
        board: { range: { start: 3, end: 12 }, labels: "none", positions: [{ string: 4, fret: 7, role: "root", label: "A" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 4, fret: 7 }, interval: "P8" },
        solution: [{ string: 2, fret: 10 }],
      }),
      choice(
        "octave-shape-string-3",
        "What's the octave shape from the G string (string 3) to the high E string (string 1)?",
        [
          ["three", "Two strings up, three frets up"],
          ["two", "Two strings up, two frets up", "That works from the low E or A string. This shape crosses the B string, so add one fret."],
          ["same", "Two strings up, same fret", "From the G string, the same fret two strings up is a different note (a major sixth higher), not an octave."],
        ],
        "three",
      ),
      drill(
        "octave-drill",
        "Find octaves from any root.",
        { type: "interval-construction", intervals: ["P8"], rootStrings: [6, 5, 4, 3], rootRange: { start: 0, end: 7 }, boardRange: { start: 0, end: 12 } },
        { rounds: 6, hint: "Two strings up and two frets up; add a fret if the shape crosses the B string." },
      ),
    ]),
  ],
};
