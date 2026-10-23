import type { Lesson } from "@/lib/courses";
import { BUILD, caged, choice, drill, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const D = { root: "D", quality: "major" } as const;
const eShapeD = caged("E", "D");

export const cagedCheckpoint: Lesson = {
  id: "caged-checkpoint",
  title: "Checkpoint: The CAGED System",
  summary: "Name, find and play CAGED shapes for any chord.",
  kind: "assessment",
  estimatedMinutes: 10,
  objectives: ["Recite and continue the CAGED order", "Find roots in moved shapes", "Play chords with a chosen shape"],
  prerequisites: ["caged-and-scales"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [text("**Eight questions**, first attempts only; **6 of 8** to pass. Drills count when passed on the first run.")]),
    step("theory", "Shapes and order", [
      choice(
        "c-order",
        "What is the order of the shapes moving up the neck?",
        [
          ["caged", "C – A – G – E – D, then repeat"],
          ["cdega", "C – D – E – G – A", "That's alphabetical order of the notes, not the shape order."],
          ["eadgc", "E – A – D – G – C", "Not quite: the order spells CAGED."],
        ],
        "caged",
      ),
      choice(
        "c-a-root-string",
        "Which string holds the lowest root of the A shape?",
        [
          ["5", "The A string (5)"],
          ["6", "The low E string (6)", "That's for the E and G shapes."],
          ["4", "The D string (4)", "That's for the D shape."],
        ],
        "5",
      ),
      choice(
        "c-e-shape-c-fret",
        "Where is the E-shape C major chord?",
        [
          ["8", "At fret 8"],
          ["3", "At fret 3", "Fret 3 on the A string is C, which is where the A shape goes."],
          ["10", "At fret 10", "That's where the D-shape C major goes."],
        ],
        "8",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      exercise({
        id: "c-roots-e-shape-d",
        kind: "fretboard",
        task: "identify",
        prompt: "This is **D major** with the **E shape**. Tap every root (D).",
        board: voicingBoard(D, eShapeD, { labels: "none", roles: false }),
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: {
          type: "exact-positions",
          positions: [
            { string: 6, fret: 10 },
            { string: 4, fret: 12 },
            { string: 1, fret: 10 },
          ],
          context: { chord: D },
        },
        solution: [
          { string: 6, fret: 10 },
          { string: 4, fret: 12 },
          { string: 1, fret: 10 },
        ],
      }),
      exercise({
        id: "c-d-with-a-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **D major** with the **A shape**.",
        board: { range: { start: 0, end: 10 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(caged("A", "D")), context: { chord: D } },
        solution: shape(caged("A", "D")),
      }),
      drill(
        "c-identify-drill",
        "Name the shape.",
        { type: "caged-identification", roots: ["C", "D", "E", "F", "G", "A", "B"] },
        { rounds: 6, passScore: 0.83 },
      ),
      drill(
        "c-build-drill",
        "Play chords with a given shape.",
        { type: "caged-construction", roots: ["C", "D", "E", "G", "A"] },
        { rounds: 4, passScore: 0.75 },
      ),
    ]),
  ],
};
