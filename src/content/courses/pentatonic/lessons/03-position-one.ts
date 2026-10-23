import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, drill, exercise, notePositions, pentatonicWindow, scaleInWindow, step, text } from "@/content/helpers";

const POS1_A = pentatonicWindow("A", 1);
const POS1_E = pentatonicWindow("E", 1);
const around = (w: { start: number; end: number }) => ({ start: Math.max(0, w.start - 1), end: w.end + 1 });

export const positionOne: Lesson = {
  id: "position-one",
  title: "Position 1: The Box",
  summary: "The most famous shape in rock and blues, and exactly where its roots are.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Play minor pentatonic position 1",
    "Find every root inside the shape",
    "Move position 1 to a new key",
  ],
  prerequisites: ["pentatonic-relatives"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("box", "The box", [
      text(`
        **Position 1** of the minor pentatonic starts on the **root on the low E string**. It spans four frets with **two notes on every string**.

        In A minor, it sits between frets 5 and 8. The roots (A) are on the **low E, D and high E strings**. Knowing where they are is what lets you start and end phrases on home base, and move the shape to other keys.
      `),
      board(
        { scale: { root: "A", type: "minor-pentatonic" }, region: POS1_A, range: around(POS1_A), labels: "interval", layout: NECK },
        "A minor pentatonic, position 1. R = root (A), ♭3 = C, 4 = D, 5 = E, ♭7 = G.",
      ),
      callout("guitar", "Index finger on fret 5, ring finger on fret 7, pinky on fret 8. Play up and down, then try it while naming each root as you hit it.", "Fingering"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "play-position-1",
        kind: "fretboard",
        task: "construct",
        prompt: "Play every note of **A minor pentatonic, position 1** (frets 5–8).",
        hint: "Two notes per string. Low E: 5 and 8.",
        board: { range: around(POS1_A), region: POS1_A, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "A", type: "minor-pentatonic" }, region: { range: POS1_A } },
        solution: scaleInWindow("A", "minor-pentatonic", POS1_A),
      }),
      exercise({
        id: "roots-in-position-1",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap every **root (A)** in position 1.",
        hint: "There are three: one each on the low E, D and high E strings.",
        board: { scale: { root: "A", type: "minor-pentatonic" }, region: POS1_A, range: around(POS1_A), labels: "none", roles: false, layout: NECK },
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: { type: "pitch-classes", notes: ["A"], region: { range: POS1_A }, match: "all" },
        solution: notePositions("A", POS1_A),
      }),
      exercise({
        id: "e-minor-position-1",
        kind: "fretboard",
        task: "construct",
        prompt: "Move the box: play **E minor pentatonic, position 1**, which starts on the open low E.",
        hint: "The root is fret 0, so the shape uses open strings and frets up to 3.",
        board: { range: around(POS1_E), region: POS1_E, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "E", type: "minor-pentatonic" }, region: { range: POS1_E } },
        solution: scaleInWindow("E", "minor-pentatonic", POS1_E),
      }),
      drill(
        "position-1-roots-drill",
        "Find the roots of position 1 in different keys.",
        { type: "scale-roots", scale: "minor-pentatonic", roots: ["A", "E", "G", "D", "C", "B"], positions: [1] },
        { rounds: 6 },
      ),
    ]),
  ],
};
