import type { Lesson } from "@/lib/courses";
import { BUILD, NECK, callout, drill, exercise, moved, shape, step, text } from "@/content/helpers";

const E_SHAPE = "022100";
const A_SHAPE = "x02220";

export const progressionsOnTheNeck: Lesson = {
  id: "progressions-on-the-neck",
  title: "Progressions on the Fretboard",
  summary: "With barre shapes, I–IV–V is one hand shape you can move to any key.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Find the roots of I, IV and V from a low-E-string root",
    "Play I–IV–V with E-shape and A-shape barre chords",
    "Move a progression to a new key by moving your hand",
  ],
  prerequisites: ["minor-keys"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("shape", "A moveable progression", [
      text(`
        Put the **I** chord's root on the **low E string**. Then:

        - **IV** has its root on the **A string at the same fret**.
        - **V** has its root on the **A string two frets higher**.

        Play I as an **E-shape** barre chord and IV and V as **A-shape** barre chords, and the whole progression moves to any key just by sliding your hand.
      `),
      {
        type: "demo",
        title: "I – IV – V in A major",
        board: { range: { start: 3, end: 10 }, labels: "interval", layout: NECK },
        frames: [
          { caption: "**I**: A major, E shape at fret 5.", board: { chord: { root: "A", quality: "major", voicing: moved(E_SHAPE, 5) } } },
          { caption: "**IV**: D major, A shape at fret 5 (root straight across on the A string).", board: { chord: { root: "D", quality: "major", voicing: moved(A_SHAPE, 5) } } },
          { caption: "**V**: E major, A shape at fret 7.", board: { chord: { root: "E", quality: "major", voicing: moved(A_SHAPE, 7) } } },
        ],
      },
      callout("tip", "Need a different key? Put the I chord's root on the low E string at the right fret (G at 3, A at 5, C at 8) and play the same three shapes.", "Change key"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "iv-root-in-g",
        kind: "fretboard",
        task: "locate",
        prompt: "I is G (low E string, fret 3). Tap the root of the **IV** chord on the A string.",
        hint: "IV's root is straight across on the next string.",
        explanation: "C, at the same fret on the A string: the IV of G.",
        board: { range: { start: 0, end: 8 }, labels: "none", strings: [5], positions: [{ string: 6, fret: 3, role: "root", label: "I" }], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["C"], region: { range: { start: 0, end: 8 }, strings: [5] }, match: "all" },
        solution: [{ string: 5, fret: 3 }],
      }),
      exercise({
        id: "iv-in-a-a-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play the **IV** chord in A major using the **A shape** at fret 5.",
        hint: "IV in A is D major. Barre fret 5, then fret 7 on the D, G and B strings.",
        board: { range: { start: 3, end: 9 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(moved(A_SHAPE, 5)), context: { chord: { root: "D", quality: "major" } } },
        solution: shape(moved(A_SHAPE, 5)),
      }),
      drill(
        "moveable-progression-drill",
        "Build I, IV and V chords in different keys, away from the nut.",
        { type: "diatonic-construction", keys: ["G", "A", "C", "D", "E"], scale: "major", degrees: [1, 4, 5], range: { start: 1, end: 10 } },
        { rounds: 6, hint: "I on the low E string (E shape), IV and V on the A string (A shape)." },
      ),
    ]),
  ],
};
