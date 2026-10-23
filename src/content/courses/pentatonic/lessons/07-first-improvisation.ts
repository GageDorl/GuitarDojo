import type { Lesson } from "@/lib/courses";
import { NECK, buildUp, callout, choice, drill, exercise, step, text } from "@/content/helpers";

export const firstImprovisation: Lesson = {
  id: "first-improvisation",
  title: "Making Music with the Pentatonic",
  summary: "Turn shapes into phrases: target roots, repeat ideas, leave space.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Choose the right pentatonic for a minor key",
    "End phrases on the root",
    "Use simple ideas (repetition, space) to make a scale sound like music",
  ],
  prerequisites: ["moving-keys"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("phrases", "From scale to phrase", [
      text(`
        Running up and down a shape isn't improvising yet. A few simple habits make the same notes sound musical:

        - **Land on roots.** Ending a phrase on the root sounds finished; ending elsewhere sounds like a question.
        - **Keep it short.** Three to five notes, then a pause.
        - **Repeat and vary.** Play an idea twice, then change its last note.
        - **Move between positions** using the bridges from earlier.
      `),
      {
        type: "demo",
        title: "A four-note phrase in A minor",
        board: { range: { start: 4, end: 9 }, root: "A", labels: "note", layout: NECK },
        frames: buildUp(
          [
            { at: { string: 3, fret: 7, role: "tone" }, caption: "Start on D (G string, fret 7)…" },
            { at: { string: 2, fret: 5, role: "tone" }, caption: "…step to E…" },
            { at: { string: 2, fret: 8, role: "tone" }, caption: "…up to G…" },
            { at: { string: 1, fret: 5 }, caption: "…and resolve to **A**, the root. Listen to how final that sounds." },
          ],
          { ghostPrevious: true },
        ),
      },
      callout(
        "guitar",
        "Play an A note or A minor chord and let it ring (or loop a drone). Play a short phrase from position 1 that ends on A. Then play the same phrase ending on G instead, and hear the difference.",
        "Call and response",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "most-final",
        "Which note sounds most 'finished' at the end of an A minor phrase?",
        [
          ["a", "A"],
          ["e", "E", "The 5th is stable, but it still leans back toward the root."],
          ["g", "G", "G (the ♭7) sounds like it wants to keep going, up to A."],
        ],
        "a",
      ),
      exercise({
        id: "resolve-to-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Your phrase stopped on this G. Resolve it: tap the **nearest A** on the top three strings.",
        hint: "A is a whole step above G.",
        board: { range: { start: 4, end: 11 }, labels: "none", strings: [1, 2, 3], positions: [{ string: 2, fret: 8, role: "tone", label: "G" }], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["A"], region: { range: { start: 4, end: 11 }, strings: [1, 2, 3] }, match: "any" },
        solution: [{ string: 2, fret: 10 }],
      }),
      choice(
        "which-scale-a-minor",
        "A song is in A minor. Which pentatonic fits?",
        [
          ["a-minor", "A minor pentatonic"],
          ["a-major", "A major pentatonic", "A major pentatonic has C♯, which clashes with the C of A minor."],
          ["c-sharp-minor", "C♯ minor pentatonic", "Its notes (C♯ E F♯ G♯ B) mostly clash with A minor."],
        ],
        "a-minor",
      ),
      drill(
        "identify-major-pent",
        "Name the major pentatonic key from a position (roots shown as squares).",
        { type: "scale-identification", scale: "major-pentatonic", roots: ["C", "G", "D", "A", "F"], positions: [1, 2, 3, 4, 5] },
        { rounds: 6 },
      ),
    ]),
  ],
};
