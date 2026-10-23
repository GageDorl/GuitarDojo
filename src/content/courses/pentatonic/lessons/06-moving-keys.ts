import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, drill, exercise, pentatonicWindow, scaleInWindow, step, text } from "@/content/helpers";

const G_POS1 = pentatonicWindow("G", 1);
const E_POS2 = pentatonicWindow("E", 2);
const around = (w: { start: number; end: number }) => ({ start: Math.max(0, w.start - 1), end: w.end + 1 });

export const movingKeys: Lesson = {
  id: "moving-keys",
  title: "Moving Pentatonic Shapes to Any Key",
  summary: "One rule moves all five positions: put position 1 on the minor root.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Place position 1 for any minor key",
    "Use minor shapes to play major pentatonic",
    "Play positions in unfamiliar keys",
  ],
  prerequisites: ["connecting-positions"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("rule", "Find the root, place the box", [
      text(`
        To play minor pentatonic in any key:

        - Find the **minor root on the low E string**. Position 1 starts there.
        - The other positions follow in order up the neck (and repeat below fret 12).

        For **major pentatonic**, find the **relative minor**, three frets below the major root on the same string, and use the same shapes. C major pentatonic uses the A minor shapes; G major pentatonic uses E minor's.
      `),
      callout("tip", "G minor: G is fret 3 on the low E string, so position 1 is frets 3–6. D minor: fret 10, so position 1 is frets 10–13.", "Examples"),
    ]),
    step("practice", "Practice", [
      choice(
        "g-minor-pos1",
        "Where does position 1 of G minor pentatonic start?",
        [
          ["3", "Fret 3"],
          ["5", "Fret 5", "Fret 5 on the low E string is A. G is fret 3."],
          ["10", "Fret 10", "Fret 10 is D."],
        ],
        "3",
      ),
      choice(
        "c-major-pent-box",
        "To play C major pentatonic using the minor box shape, which fret does position 1 start on?",
        [
          ["5", "Fret 5 (the relative minor, A)"],
          ["8", "Fret 8 (C)", "Fret 8 is C, but the *minor* box starts on the relative minor: three frets lower."],
          ["3", "Fret 3", "Fret 3 is G."],
        ],
        "5",
      ),
      exercise({
        id: "g-minor-position-1",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **G minor pentatonic, position 1**.",
        hint: "G is fret 3 on the low E string. Two notes per string.",
        board: { range: around(G_POS1), region: G_POS1, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "G", type: "minor-pentatonic" }, region: { range: G_POS1 } },
        solution: scaleInWindow("G", "minor-pentatonic", G_POS1),
      }),
      exercise({
        id: "e-minor-position-2",
        kind: "fretboard",
        task: "construct",
        prompt: "Transfer a different shape: play **E minor pentatonic, position 2**.",
        hint: "Position 1 of E minor is at the nut, so position 2 starts at fret 2.",
        board: { range: around(E_POS2), region: E_POS2, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "E", type: "minor-pentatonic" }, region: { range: E_POS2 } },
        solution: scaleInWindow("E", "minor-pentatonic", E_POS2),
      }),
      drill(
        "major-pent-roots",
        "Find the roots of major pentatonic positions in different keys.",
        { type: "scale-roots", scale: "major-pentatonic", roots: ["C", "G", "D", "F", "A"], positions: [1, 2, 3, 4, 5] },
        { rounds: 8, hint: "The major root is three frets above the minor root of the same shape." },
      ),
    ]),
  ],
};
