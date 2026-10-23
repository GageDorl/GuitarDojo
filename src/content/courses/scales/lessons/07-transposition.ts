import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, drill, exercise, step, text } from "@/content/helpers";
import { majorShape, minorShape } from "./shapes";

const shapeFrame = (root: string, r: number, caption: string) => ({
  caption,
  board: { root, positions: majorShape(r).map((p) => ({ ...p, role: "tone" as const })) },
});

export const transposition: Lesson = {
  id: "transposition",
  title: "Moving Scales to New Keys",
  summary: "Shapes are moveable: put the root on a new fret and the whole scale follows.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Transpose a scale shape by moving its root",
    "Choose the starting fret for any key",
    "Play major and natural minor shapes in unfamiliar keys",
  ],
  prerequisites: ["scale-shapes"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("moving", "Change the root, change the key", [
      text(`
        On guitar, **transposing** (changing key) is often just moving your hand. Every note in a shape keeps its distance from the root, so the step pattern, and therefore the scale type, stays the same.

        To play a scale in a new key: **find the tonic on the low E string, and start the shape there.**
      `),
      {
        type: "demo",
        title: "One shape, three keys",
        board: { range: { start: 1, end: 13 }, labels: "interval", layout: NECK },
        frames: [
          shapeFrame("G", 3, "**G major**: root at fret 3."),
          shapeFrame("A", 5, "Slide up two frets: **A major**."),
          shapeFrame("C", 8, "Root at fret 8: **C major**. Same shape, same fingering."),
        ],
      },
      text(`
        The **natural minor** shape works the same way. From a low-E root: 1 2 ♭3 on the low E string (frets r, r+2, r+3), 4 5 ♭6 on the A string (r, r+2, r+3), then ♭7 and 1 on the D string (r, r+2).
      `),
      callout("tip", "Know your low-E-string notes (from Notes and the Fretboard) and you can start a scale in any key immediately.", "The skill that unlocks this"),
    ]),
    step("practice", "Practice", [
      choice(
        "shape-at-8",
        "You play the major shape with its root at fret 8 on the low E string. What key are you in?",
        [
          ["c", "C major"],
          ["b", "B major", "B is at fret 7 on the low E string."],
          ["d", "D major", "D is at fret 10."],
        ],
        "c",
      ),
      choice(
        "e-flat-start",
        "Where do you start the major shape to play E♭ major?",
        [
          ["11", "Fret 11"],
          ["1", "Fret 1", "Fret 1 is F. E♭ is two frets lower than F… which would be below the nut, so use fret 11, an octave higher."],
          ["6", "Fret 6", "Fret 6 is B♭."],
        ],
        "11",
      ),
      exercise({
        id: "c-major-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play one octave of **C major** with the major shape.",
        hint: "C is at fret 8 on the low E string.",
        board: { range: { start: 5, end: 12 }, labels: "none", strings: [6, 5, 4], layout: NECK },
        selection: "multi",
        rule: { type: "exact-positions", positions: majorShape(8) },
        solution: majorShape(8),
      }),
      exercise({
        id: "a-minor-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play one octave of **A natural minor** with the minor shape.",
        hint: "Root at fret 5. Low E: 5, 7, 8. A string: 5, 7, 8. D string: 5, 7.",
        board: { range: { start: 3, end: 10 }, labels: "none", strings: [6, 5, 4], layout: NECK },
        selection: "multi",
        rule: { type: "exact-positions", positions: minorShape(5) },
        solution: minorShape(5),
      }),
      exercise({
        id: "e-minor-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Now **E natural minor**, with the root on the open low E string.",
        hint: "The shape still works with open strings: r = 0.",
        board: { range: { start: 0, end: 5 }, labels: "none", strings: [6, 5, 4], layout: NECK },
        selection: "multi",
        rule: { type: "exact-positions", positions: minorShape(0) },
        solution: minorShape(0),
      }),
      drill(
        "transposition-drill",
        "Build scales in random keys along a string.",
        { type: "scale-on-string", scales: ["major", "natural-minor"], roots: ["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb"], strings: [6, 5, 4, 3, 2] },
        { rounds: 4, passScore: 0.75 },
      ),
    ]),
  ],
};
