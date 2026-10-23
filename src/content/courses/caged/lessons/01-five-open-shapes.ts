import type { Lesson } from "@/lib/courses";
import { CAGED_ORDER, CAGED_SHAPES } from "@/lib/theory";
import { callout, choice, exercise, step, text, voicingBoard } from "@/content/helpers";

export const fiveOpenShapes: Lesson = {
  id: "five-open-shapes",
  title: "Five Open Shapes, One System",
  summary: "C, A, G, E and D: the open chords you know are the five building blocks of the whole neck.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Name the five CAGED shapes",
    "Find the roots inside each open shape",
    "Know which string carries each shape's lowest root",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("shapes", "The five shapes", [
      text(`
        **CAGED** is a way of seeing the whole fretboard through five open major chords: **C, A, G, E and D**.

        Each open chord is a *shape*. Slide it up the neck (with your index finger replacing the nut) and it plays a different chord. And for any chord, the five shapes link together, one after another, all the way up the neck.

        The key to every shape is **where its roots are**. The lowest root of each shape sits on:

        - **C and A shapes:** the A string (5)
        - **G and E shapes:** the low E string (6)
        - **D shape:** the D string (4)
      `),
      {
        type: "compare",
        items: CAGED_ORDER.map((s) => ({ title: `${s} shape`, board: voicingBoard(CAGED_SHAPES[s].open, CAGED_SHAPES[s].voicing) })),
        caption: "The five open shapes. R marks the roots: notice how many each shape has, and on which strings.",
      },
      callout("tip", "Learn shapes by their roots, not just their finger patterns. Roots are what let you move a shape to any chord.", "Roots first"),
    ]),
    step("practice", "Practice", [
      choice(
        "caged-meaning",
        "What does CAGED stand for?",
        [
          ["shapes", "The five open major chord shapes: C, A, G, E and D"],
          ["notes", "The five notes of a pentatonic scale", "The letters name chord shapes, not scale notes."],
          ["tuning", "An alternative guitar tuning", "CAGED works in standard tuning; it's a way of seeing chord shapes."],
        ],
        "shapes",
      ),
      exercise({
        id: "roots-of-open-g",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap **every root (G)** in the open G shape.",
        hint: "There are three: one on each E string and one open string.",
        board: voicingBoard({ root: "G", quality: "major" }, "320003", { labels: "none", roles: false }),
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: {
          type: "exact-positions",
          positions: [
            { string: 6, fret: 3 },
            { string: 3, fret: 0 },
            { string: 1, fret: 3 },
          ],
          context: { chord: { root: "G", quality: "major" } },
        },
        solution: [
          { string: 6, fret: 3 },
          { string: 3, fret: 0 },
          { string: 1, fret: 3 },
        ],
      }),
      choice(
        "d-shape-root-string",
        "Which string carries the lowest root of the D shape?",
        [
          ["4", "The D string (4)"],
          ["5", "The A string (5)", "The A string is the root string for the C and A shapes."],
          ["6", "The low E string (6)", "The low E string is the root string for the G and E shapes."],
        ],
        "4",
      ),
    ]),
  ],
};
