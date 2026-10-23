import type { Lesson } from "@/lib/courses";
import { BUILD, choice, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const BHD = { root: "B", quality: "halfDiminished7" } as const;
const BDIM7 = { root: "B", quality: "diminished7" } as const;

export const diminishedSevenths: Lesson = {
  id: "diminished-sevenths",
  title: "Half-Diminished and Diminished Sevenths",
  summary: "Two darker sevenths: the vii of a major key, and a perfectly symmetrical chord.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Build half-diminished (m7♭5) and diminished seventh chords",
    "Find the half-diminished chord in a major key",
    "Use the symmetry of diminished sevenths on the fretboard",
  ],
  prerequisites: ["major-and-minor-sevenths"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("dark", "Two diminished sevenths", [
      text(`
        - **Half-diminished (m7♭5 or ø7):** R ♭3 ♭5 ♭7, a diminished triad plus a minor seventh. It's the chord on **degree 7** of a major key: **Bm7♭5** in C major (B D F A).
        - **Diminished seventh (dim7 or °7):** R ♭3 ♭5 𝄫7, made **entirely of minor thirds**. Bdim7 is B D F A♭.

        Because every gap in a dim7 is a minor third (3 frets), the chord is **symmetrical**: move the same shape up 3 frets and you get the same four notes in a new order. One shape gives you four chords, each named after whichever note is in the bass.
      `),
      { type: "triad-stack", chord: BHD, caption: "Bm7♭5: minor third, minor third, major third." },
      { type: "triad-stack", chord: BDIM7, caption: "Bdim7: three minor thirds stacked." },
      {
        type: "compare",
        items: [
          { title: "Bm7♭5", board: voicingBoard(BHD, "x2323x") },
          { title: "Bdim7", board: voicingBoard(BDIM7, "x2313x") },
        ],
        caption: "The two chords differ by one note: A in Bm7♭5, A♭ in Bdim7.",
      },
    ]),
    step("practice", "Practice", [
      choice(
        "bm7b5-notes",
        "Which notes make Bm7♭5?",
        [
          ["bdfa", "B D F A"],
          ["bdf#a", "B D F♯ A", "F♯ is a perfect fifth: that's Bm7. Half-diminished lowers the fifth to F."],
          ["bdfab", "B D F A♭", "A♭ makes it a fully diminished seventh."],
        ],
        "bdfa",
      ),
      choice(
        "dim7-repeat",
        "Move a diminished seventh shape up the neck. After how many frets does it contain the same notes again?",
        [
          ["3", "3 frets"],
          ["12", "12 frets", "It repeats at 12 like everything, but much sooner too: every minor third (3 frets)."],
          ["4", "4 frets", "Four frets is a major third. Dim7 is built from minor thirds."],
        ],
        "3",
      ),
      exercise({
        id: "build-bm7b5",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **Bm7♭5** (B, D, F, A).",
        hint: "Root on the A string at fret 2; the other notes are on the D, G and B strings close by.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: BHD },
        solution: shape("x2323x"),
      }),
    ]),
  ],
};
