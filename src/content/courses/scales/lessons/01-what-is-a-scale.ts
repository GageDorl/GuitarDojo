import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, choice, exercise, step, text } from "@/content/helpers";

export const whatIsAScale: Lesson = {
  id: "what-is-a-scale",
  title: "What Is a Scale?",
  summary: "A scale is a set of notes in order, starting from a home note called the tonic.",
  kind: "lesson",
  estimatedMinutes: 7,
  objectives: ["Define a scale, its tonic and its degrees", "Number the degrees of a scale", "Find a scale's tonic on the fretboard"],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("idea", "Notes in order", [
      text(`
        A **scale** is a set of notes played in order, rising or falling, starting from a home note called the **tonic**. Most songs take their notes from one scale, which is why a melody sounds like it "belongs" together.

        Each note of the scale gets a number called a **degree**: the tonic is **1**, the next note **2**, and so on up to **7**. Then the tonic returns an octave higher and the pattern repeats.

        The **C major scale** uses only the natural notes: C D E F G A B.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: ["C", "D", "E", "F", "G", "A", "B"].map((note, i) => ({ note, role: i === 0 ? ("root" as const) : ("tone" as const), label: String(i + 1) })),
        caption: "C major: seven notes, numbered as degrees 1–7 from the tonic C.",
      },
      board(
        { scale: { root: "C", type: "major" }, range: { start: 0, end: 12 }, strings: [5], labels: "interval", layout: NECK },
        "C major along the A string, labelled by degree (R = the tonic). The A string's open note is degree 6 of C major.",
      ),
      callout("guitar", "Play C major up the A string: frets 3, 5, 7, 8, 10, 12, then 14 and 15 for the high C. Notice how the last note feels like home.", "Hear the tonic"),
    ]),
    step("practice", "Practice", [
      choice(
        "tonic-name",
        "What's the name for the home note a scale starts from?",
        [
          ["tonic", "The tonic"],
          ["octave", "The octave", "The octave is the distance back to the same letter. The note itself is the tonic."],
          ["degree-7", "The seventh", "The 7th degree is the note just *before* the tonic returns."],
        ],
        "tonic",
      ),
      choice(
        "c-major-degree-5",
        "In C major, which note is degree 5?",
        [
          ["g", "G"],
          ["f", "F", "Count from C as 1: C D E F G. F is degree 4."],
          ["a", "A", "A is degree 6."],
        ],
        "g",
      ),
      exercise({
        id: "c-tonic-on-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the tonic of C major on the A string.",
        board: { range: { start: 0, end: 12 }, labels: "none", strings: [5], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["C"], region: { range: { start: 0, end: 11 }, strings: [5] }, match: "all" },
        solution: [{ string: 5, fret: 3 }],
      }),
    ]),
  ],
};
