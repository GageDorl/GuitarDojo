import type { Lesson } from "@/lib/courses";
import { BUILD, caged, callout, drill, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const minor = (root: string) => ({ root, quality: "minor" as const });

export const minorShapes: Lesson = {
  id: "caged-minor",
  title: "Minor Shapes",
  summary: "Three minor shapes do most of the work: Am, Em and Dm, moved anywhere.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Move the Am, Em and Dm shapes to any root",
    "Play minor chords in three places",
    "Know why the C and G minor shapes are rarely used",
  ],
  prerequisites: ["caged-any-key"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("shapes", "Moveable minor chords", [
      text(`
        Every major shape has a minor version (lower the third), but only three are comfortable as moveable chords:

        - **Em shape**: root on the low E string (the classic minor barre chord)
        - **Am shape**: root on the A string
        - **Dm shape**: root on the D string

        The C-minor and G-minor shapes need awkward stretches, so players usually use one of these three instead.
      `),
      {
        type: "compare",
        items: [
          { title: "Gm (Em shape)", board: voicingBoard(minor("G"), caged("E", "G", "minor")) },
          { title: "Cm (Am shape)", board: voicingBoard(minor("C"), caged("A", "C", "minor")) },
          { title: "Fm (Dm shape)", board: voicingBoard(minor("F"), caged("D", "F", "minor")) },
        ],
        caption: "Three minor chords from three shapes. The ♭3 is the note that changed from the major shape.",
      },
      callout("guitar", "Play the A-shape C major, then the Am-shape C minor at the same fret. Only one note moves, down a fret.", "Major to minor"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "cm-am-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **C minor** with the **Am shape**.",
        hint: "The Am shape's root is on the A string: C is at fret 3.",
        board: { range: { start: 0, end: 10 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(caged("A", "C", "minor")), context: { chord: minor("C") } },
        solution: shape(caged("A", "C", "minor")),
      }),
      exercise({
        id: "gm-em-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **G minor** with the **Em shape**.",
        hint: "Root on the low E string at fret 3, then the open Em shape moved up three frets.",
        board: { range: { start: 0, end: 10 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(caged("E", "G", "minor")), context: { chord: minor("G") } },
        solution: shape(caged("E", "G", "minor")),
      }),
      drill(
        "minor-shape-drill",
        "Play minor chords with a given shape.",
        { type: "caged-construction", roots: ["C", "D", "E", "G", "A"], quality: "minor" },
        { rounds: 5, hint: "Find the root on the shape's root string first." },
      ),
    ]),
  ],
};
