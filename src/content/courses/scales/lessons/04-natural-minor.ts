import type { Lesson } from "@/lib/courses";
import { NECK, board, choice, drill, exercise, scaleAlongString, step, text } from "@/content/helpers";

export const naturalMinor: Lesson = {
  id: "natural-minor",
  title: "The Natural Minor Scale",
  summary: "A different step pattern gives the darker sound of minor keys.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "State the natural minor step pattern",
    "Compare minor with major degree by degree (♭3, ♭6, ♭7)",
    "Build natural minor scales in several keys",
  ],
  prerequisites: ["major-any-key"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("pattern", "W H W W H W W", [
      text(`
        The **natural minor** scale follows a different pattern:

        **W – H – W – W – H – W – W**

        Compared with the major scale on the same tonic, three degrees are a half step lower: the **3rd, 6th and 7th**. Written as a formula: **1 2 ♭3 4 5 ♭6 ♭7**. The lowered 3rd is what makes minor sound darker, just like in minor chords.
      `),
      {
        type: "chromatic",
        start: "A",
        highlight: ["A", "B", "C", "D", "E", "F", "G", "A"].map((note, i) => ({ note, role: i === 0 || i === 7 ? ("root" as const) : ("tone" as const) })),
        showDistances: true,
        caption: "A natural minor uses only natural notes: 2 1 2 2 1 2 2.",
      },
      board(
        { scale: { root: "C", type: "natural-minor" }, range: { start: 0, end: 12 }, strings: [5], labels: "interval", layout: NECK },
        "C natural minor along the A string. The ♭3, ♭6 and ♭7 are E♭, A♭ and B♭.",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "minor-pattern",
        "Which step pattern makes a natural minor scale?",
        [
          ["whwwhww", "W H W W H W W"],
          ["wwhwwwh", "W W H W W W H", "That's the major pattern."],
          ["whwwwhw", "W H W W W H W", "Close, but natural minor's second half step is between degrees 5 and 6, not 6 and 7."],
        ],
        "whwwhww",
      ),
      choice(
        "lowered-degrees",
        "Compared with major, which degrees of natural minor are lowered?",
        [
          ["367", "3, 6 and 7"],
          ["3", "Only the 3rd", "The 3rd changes, but so do the 6th and 7th."],
          ["25", "2 and 5", "The 2nd and 5th are the same in major and natural minor."],
        ],
        "367",
      ),
      exercise({
        id: "a-minor-low-e",
        kind: "fretboard",
        task: "construct",
        prompt: "Select every note of **A natural minor** on the low E string (open to fret 11).",
        hint: "A natural minor uses only natural notes.",
        board: { range: { start: 0, end: 11 }, labels: "none", strings: [6], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "A", type: "natural-minor" }, region: { range: { start: 0, end: 11 }, strings: [6] } },
        solution: scaleAlongString("A", "natural-minor", 6),
      }),
      exercise({
        id: "d-minor-a-string",
        kind: "fretboard",
        task: "construct",
        prompt: "Now **D natural minor** on the A string (open to fret 11).",
        hint: "D E F G A B♭ C.",
        board: { range: { start: 0, end: 11 }, labels: "none", strings: [5], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "D", type: "natural-minor" }, region: { range: { start: 0, end: 11 }, strings: [5] } },
        solution: scaleAlongString("D", "natural-minor", 5),
      }),
      drill(
        "minor-degree-drill",
        "Name degrees of natural minor scales.",
        { type: "scale-degree", scale: "natural-minor", roots: ["A", "E", "B", "D", "G", "C"] },
        { rounds: 8, hint: "Spell the major scale on that tonic, then lower the 3rd, 6th and 7th." },
      ),
    ]),
  ],
};
