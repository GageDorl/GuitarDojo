import type { Lesson } from "@/lib/courses";
import { NECK, choice, drill, exercise, notePositions, pentatonicWindow, scaleInWindow, step, text } from "@/content/helpers";

const D_POS1 = pentatonicWindow("D", 1);
const A_POS3 = pentatonicWindow("A", 3);
const around = (w: { start: number; end: number }) => ({ start: Math.max(0, w.start - 1), end: w.end + 1 });

export const pentatonicCheckpoint: Lesson = {
  id: "pentatonic-checkpoint",
  title: "Checkpoint: Pentatonic Navigation",
  summary: "Build, place and navigate pentatonic scales in any key and position.",
  kind: "assessment",
  estimatedMinutes: 12,
  objectives: ["Spell pentatonic scales", "Play positions in new keys", "Find roots and name keys in any position"],
  prerequisites: ["first-improvisation"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [
      text("**Eight questions**, first attempts only; **6 of 8** to pass. Drills count when passed on the first run."),
    ]),
    step("theory", "Theory", [
      choice(
        "c-spell-e-minor-pent",
        "Which notes are in E minor pentatonic?",
        [
          ["egabd", "E G A B D"],
          ["efgab", "E F♯ G A B", "Minor pentatonic skips the 2nd (F♯): 1 ♭3 4 5 ♭7."],
          ["egsabcs", "E G♯ B C♯ D", "G♯ and C♯ aren't in E minor."],
        ],
        "egabd",
      ),
      choice(
        "c-relative-d-minor",
        "D minor pentatonic has the same notes as which major pentatonic?",
        [
          ["f", "F major pentatonic"],
          ["d", "D major pentatonic", "That has F♯ and B; D minor pentatonic has F and C."],
          ["b-flat", "B♭ major pentatonic", "The relative major is 3 half steps *up* from D: F."],
        ],
        "f",
      ),
      choice(
        "c-major-pent-formula",
        "What is the major pentatonic formula?",
        [
          ["12356", "1 2 3 5 6"],
          ["1b345b7", "1 ♭3 4 5 ♭7", "That's minor pentatonic."],
          ["12345", "1 2 3 4 5", "Major pentatonic drops the 4th (and the 7th), keeping the 6th."],
        ],
        "12356",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      exercise({
        id: "c-d-minor-pos1",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **D minor pentatonic, position 1**.",
        board: { range: around(D_POS1), region: D_POS1, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "D", type: "minor-pentatonic" }, region: { range: D_POS1 } },
        solution: scaleInWindow("D", "minor-pentatonic", D_POS1),
      }),
      exercise({
        id: "c-roots-pos3",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap every **root** in this position of **A minor pentatonic** (position 3).",
        board: { scale: { root: "A", type: "minor-pentatonic" }, region: A_POS3, range: around(A_POS3), labels: "none", roles: false, layout: NECK },
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: { type: "pitch-classes", notes: ["A"], region: { range: A_POS3 }, match: "all" },
        solution: notePositions("A", A_POS3),
      }),
      drill(
        "c-key-drill",
        "Name the key of a minor pentatonic position.",
        { type: "scale-identification", scale: "minor-pentatonic", roots: ["A", "E", "D", "G", "C", "B"], positions: [1, 2, 3, 4, 5] },
        { rounds: 6, passScore: 0.83 },
      ),
      drill(
        "c-roots-drill",
        "Find the roots in any position.",
        { type: "scale-roots", scale: "minor-pentatonic", roots: ["A", "E", "D", "G", "C"], positions: [1, 2, 3, 4, 5] },
        { rounds: 6, passScore: 0.83 },
      ),
    ]),
  ],
};
