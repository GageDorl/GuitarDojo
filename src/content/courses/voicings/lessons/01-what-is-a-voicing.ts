import type { Lesson } from "@/lib/courses";
import { COMMON_VOICINGS } from "@/lib/theory";
import { BUILD, choice, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const C = { root: "C", quality: "major" } as const;
const G = { root: "G", quality: "major" } as const;

export const whatIsAVoicing: Lesson = {
  id: "what-is-a-voicing",
  title: "What Is a Voicing?",
  summary: "One chord, many ways to play it. The notes decide the chord, the shape decides the sound.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Define a chord voicing",
    "Recognise that different shapes can be the same chord",
    "Build a chord away from its familiar open shape",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("idea", "Same chord, different shapes", [
      text(`
        A chord is defined by its **notes**: C major is C, E and G. A **voicing** is one particular way of arranging those notes: which strings, which octaves, which note is lowest, and which notes are repeated.

        On guitar every chord has many voicings. They all *are* C major, but each has its own colour: low and full, high and bright, thin and cutting.
      `),
      {
        type: "compare",
        items: COMMON_VOICINGS.C!.shapes.map((s, i) => ({
          title: ["Open C", "C at fret 3", "C at fret 8"][i] ?? `C (${s})`,
          board: voicingBoard(C, s),
        })),
        caption: "Three voicings of C major. Every marker is a C (R), E (3) or G (5).",
      },
      {
        type: "compare",
        items: COMMON_VOICINGS.G!.shapes.map((s, i) => ({ title: ["Open G", "G at fret 3"][i] ?? s, board: voicingBoard(G, s) })),
        caption: "Two voicings of G major.",
      },
    ]),
    step("practice", "Practice", [
      choice(
        "same-chord",
        "Two guitarists play C major with completely different shapes. Are they playing the same chord?",
        [
          ["yes", "Yes, if both shapes contain only C, E and G"],
          ["no", "No, a chord has one correct shape", "Chords are defined by notes, not shapes."],
          ["depends-bass", "Only if the lowest note is the same", "The lowest note changes the *inversion*, not which chord it is."],
        ],
        "yes",
      ),
      exercise({
        id: "c-away-from-open",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **C major** somewhere between frets 2 and 8, away from the open chord.",
        hint: "Try the root on the A string at fret 3, then look for E and G nearby on higher strings.",
        board: { range: { start: 2, end: 8 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: C },
        solution: shape("x35553"),
      }),
      exercise({
        id: "g-any",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **G major** (G, B, D) any way you like near the nut.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: G },
        solution: shape("320003"),
      }),
    ]),
  ],
};
