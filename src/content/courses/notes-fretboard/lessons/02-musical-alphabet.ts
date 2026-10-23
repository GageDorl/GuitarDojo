import type { Lesson } from "@/lib/courses";
import { NECK, buildUp, callout, choice, drill, exercise, step, text } from "@/content/helpers";

export const musicalAlphabet: Lesson = {
  id: "musical-alphabet",
  title: "The Musical Alphabet: Whole and Half Steps",
  summary: "Seven letters, two kinds of step, and the two places where the pattern tightens.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Recite the musical alphabet forwards from any letter",
    "Explain half steps (1 fret) and whole steps (2 frets)",
    "Remember that E–F and B–C are only a half step apart",
  ],
  prerequisites: ["strings-and-tuning"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("letters", "Seven letters", [
      text(`
        Music names notes with just seven letters: **A B C D E F G**. After G, the letters start again at A, one **octave** higher.

        The distance between notes is measured in steps:

        - A **half step** (or *semitone*) is the smallest distance: **one fret** on the guitar.
        - A **whole step** (or *tone*) is two half steps: **two frets**.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: ["C", "D", "E", "F", "G", "A", "B", "C"].map((note, i) => ({
          note,
          role: i === 0 || i === 7 ? ("root" as const) : ("tone" as const),
        })),
        showDistances: true,
        caption: "The natural notes from C to C. Most neighbours are a whole step (2) apart; E–F and B–C are a half step (1).",
      },
      callout(
        "tip",
        "**E–F** and **B–C** are the only pairs of letters with no note between them. Everywhere else there's a note in the gap.",
        "The two half steps",
      ),
    ]),
    step("on-a-string", "Steps on a string", [
      {
        type: "demo",
        title: "Walking up the A string",
        board: { range: { start: 0, end: 12 }, labels: "note", strings: [5], layout: NECK },
        frames: buildUp([
          { at: { string: 5, fret: 0, role: "root" }, caption: "Start on the open A string." },
          { at: { string: 5, fret: 2, role: "tone" }, caption: "A to B is a **whole step**: two frets." },
          { at: { string: 5, fret: 3, role: "tone" }, caption: "B to C is a **half step**: just one fret." },
          { at: { string: 5, fret: 5, role: "tone" }, caption: "C to D: whole step, two frets." },
          { at: { string: 5, fret: 7, role: "tone" }, caption: "D to E: whole step." },
          { at: { string: 5, fret: 8, role: "tone" }, caption: "E to F: the other **half step**, one fret." },
          { at: { string: 5, fret: 10, role: "tone" }, caption: "F to G: whole step." },
          { at: { string: 5, fret: 12, role: "root" }, caption: "G to A: whole step. We're back to A, an octave higher, at fret 12." },
        ]),
      },
    ]),
    step("practice", "Practice", [
      choice(
        "half-step-pairs",
        "Which pairs of natural notes are only a half step apart?",
        [
          ["ef-bc", "E–F and B–C"],
          ["ab-de", "A–B and D–E", "Both of these are whole steps: there's a note in each gap (A♯, D♯)."],
          ["cd-fg", "C–D and F–G", "Both are whole steps, with C♯ and F♯ in between."],
        ],
        "ef-bc",
      ),
      choice(
        "whole-step-from-g",
        "What note is a whole step above G?",
        [
          ["a", "A"],
          ["g-sharp", "G♯", "G♯ is only a half step (one fret) above G."],
          ["a-sharp", "A♯", "A♯ is three half steps above G, more than a whole step."],
        ],
        "a",
      ),
      exercise({
        id: "find-b-on-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Starting from the open A string, find **B**, a whole step up.",
        hint: "A whole step is two frets.",
        board: { range: { start: 0, end: 5 }, labels: "none", strings: [5], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["B"], region: { range: { start: 0, end: 5 }, strings: [5] }, match: "all" },
        solution: [{ string: 5, fret: 2 }],
      }),
      exercise({
        id: "find-f-on-d",
        kind: "fretboard",
        task: "locate",
        prompt: "Find **F** on the D string.",
        hint: "D to E is a whole step, and E to F is a half step.",
        explanation: "D (open), E (fret 2), F (fret 3): whole step, then half step.",
        board: { range: { start: 0, end: 5 }, labels: "none", strings: [4], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["F"], region: { range: { start: 0, end: 5 }, strings: [4] }, match: "all" },
        solution: [{ string: 4, fret: 3 }],
      }),
      drill(
        "name-naturals-near-nut",
        "Name the natural notes near the nut on the two lowest strings.",
        { type: "note-naming", strings: [5, 6], range: { start: 0, end: 5 }, naturalsOnly: true },
        { rounds: 6, hint: "Count up from the open string: two frets per whole step, one fret for E–F and B–C." },
      ),
    ]),
  ],
};
