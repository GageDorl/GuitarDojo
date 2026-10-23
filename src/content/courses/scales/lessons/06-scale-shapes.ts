import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, drill, exercise, step, text } from "@/content/helpers";
import { majorShape } from "./shapes";

export const scaleShapes: Lesson = {
  id: "scale-shapes",
  title: "Scale Shapes Across Strings",
  summary: "Play a scale in one hand position instead of sliding along a single string.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Play a one-octave major scale shape from a low-E root",
    "See how the shape fits inside a full scale position",
    "Reuse the same shape from a different root",
  ],
  prerequisites: ["relative-keys"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("one-octave", "One octave, one hand position", [
      text(`
        Playing along one string shows the pattern, but guitarists usually play scales **across strings**, so the hand barely moves. Here's a one-octave major scale from a root on the low E string:

        - **Low E string:** degrees 1, 2, 3
        - **A string:** degrees 4, 5, 6
        - **D string:** degrees 7, 1 (the octave)
      `),
      board(
        { root: "G", positions: majorShape(3).map((p) => ({ ...p, role: "tone" as const })), range: { start: 1, end: 8 }, labels: "interval", layout: NECK },
        "G major, one octave, starting on G (fret 3). Labels are scale degrees.",
      ),
      board(
        { scale: { root: "G", type: "major" }, region: { start: 2, end: 5 }, range: { start: 1, end: 6 }, labels: "interval", layout: NECK },
        "The full G major position from fret 2 to 5, across all six strings. The one-octave shape sits inside it.",
      ),
      callout("guitar", "Play the one-octave shape slowly, saying the degree numbers out loud: 1 2 3, 4 5 6, 7 1. Then play it back down.", "Practise with numbers"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "g-major-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play the one-octave **G major** shape: from G on the low E string (fret 3) up to G on the D string.",
        hint: "Low E: frets 3, 5, 7. A string: 3, 5, 7. D string: 4, 5.",
        board: { range: { start: 1, end: 8 }, labels: "none", strings: [6, 5, 4], layout: NECK },
        selection: "multi",
        rule: { type: "exact-positions", positions: majorShape(3) },
        solution: majorShape(3),
      }),
      exercise({
        id: "a-major-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Same shape, new root: play one octave of **A major** starting at fret 5.",
        hint: "Every note moves up two frets.",
        explanation: "A B C♯ D E F♯ G♯ A: the shape is the same, so the step pattern is the same.",
        board: { range: { start: 3, end: 10 }, labels: "none", strings: [6, 5, 4], layout: NECK },
        selection: "multi",
        rule: { type: "exact-positions", positions: majorShape(5) },
        solution: majorShape(5),
      }),
      drill(
        "scale-on-string-mixed",
        "Build major and minor scales along a string in different keys.",
        { type: "scale-on-string", scales: ["major", "natural-minor"], roots: ["C", "D", "E", "F", "G", "A", "Bb"], strings: [5, 4, 3] },
        { rounds: 4, passScore: 0.75 },
      ),
    ]),
  ],
};
