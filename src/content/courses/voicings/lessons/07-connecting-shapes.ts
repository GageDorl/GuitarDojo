import type { Lesson } from "@/lib/courses";
import { COMMON_VOICINGS } from "@/lib/theory";
import { callout, choice, drill, exercise, step, text, voicingBoard } from "@/content/helpers";

const C = { root: "C", quality: "major" } as const;
const [OPEN_C, A_SHAPE_C, E_SHAPE_C] = COMMON_VOICINGS.C!.shapes as [string, string, string];

export const connectingShapes: Lesson = {
  id: "connecting-shapes",
  title: "How Chord Shapes Connect",
  summary: "Follow the roots and one chord's shapes link together all the way up the neck.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "See how neighbouring voicings of one chord share roots",
    "Find the roots inside moveable shapes",
    "Recognise chords anywhere on the neck",
  ],
  prerequisites: ["barre-chords"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("chain", "A chain of shapes", [
      text(`
        Play C major three ways: the **open C shape**, the **A shape at fret 3**, and the **E shape at fret 8**. They overlap: the open C's root on the A string (fret 3) is the *same note* as the A shape's root. Each shape hands off to the next through a shared chord tone.

        This idea (five open shapes linking into a chain for every chord) is called the **CAGED system**. It gets its own course later; for now, notice that **roots are the links**.
      `),
      {
        type: "compare",
        items: [
          { title: "Open C shape", board: voicingBoard(C, OPEN_C) },
          { title: "A shape, fret 3", board: voicingBoard(C, A_SHAPE_C) },
          { title: "E shape, fret 8", board: voicingBoard(C, E_SHAPE_C) },
        ],
        caption: "C major climbing the neck. Follow the R markers.",
      },
      callout("guitar", "Strum the open C, then slide your hand to the A-shape C at fret 3, then up to the E-shape C at fret 8. Same chord, rising brightness.", "Hear the chain"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "roots-a-shape-c",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap **every root** in this A-shape C chord.",
        board: voicingBoard(C, A_SHAPE_C, { labels: "none", roles: false }),
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: {
          type: "exact-positions",
          positions: [
            { string: 5, fret: 3 },
            { string: 3, fret: 5 },
          ],
          context: { chord: C },
        },
        solution: [
          { string: 5, fret: 3 },
          { string: 3, fret: 5 },
        ],
      }),
      choice(
        "e-shape-c-bass",
        "What is the lowest note of the E-shape C chord at fret 8?",
        [
          ["c", "C, the root"],
          ["e", "E", "E-shape barre chords have the root on the low E string: fret 8 is C."],
          ["g", "G", "G is the fifth; it's on the A string in this shape."],
        ],
        "c",
      ),
      drill(
        "recognise-anywhere",
        "Name chords anywhere on the neck.",
        { type: "chord-recognition", roots: ["C", "D", "E", "F", "G", "A"], qualities: ["major", "minor"], range: { start: 0, end: 12 } },
        { rounds: 8, hint: "Find the lowest note first; it's usually the root. Then check the third." },
      ),
    ]),
  ],
};
