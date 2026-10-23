import type { Lesson } from "@/lib/courses";
import { BUILD, callout, choice, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const E = { root: "E", quality: "major" } as const;

export const doubling: Lesson = {
  id: "doubling",
  title: "Doubling Chord Tones",
  summary: "Six strings, three notes: some chord tones get played more than once.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Explain doubling",
    "Count each chord tone in a voicing",
    "Build a fuller voicing with doubled notes",
  ],
  prerequisites: ["what-is-a-voicing"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("doubles", "More strings than notes", [
      text(`
        A triad has three notes, but a guitar has six strings. Fuller voicings **double** some chord tones, playing the same note name in more than one octave.

        The open E chord plays **E B E G♯ B E**: the root three times, the fifth twice, and the third once. Doubling roots and fifths makes a chord sound strong and stable. The third, which decides major or minor, often appears just once.
      `),
      { type: "fretboard", board: voicingBoard(E, "022100"), caption: "Open E: R ×3, 5 ×2, 3 ×1." },
      callout("note", "Doubling never changes which chord it is. E major is still just E, G♯ and B, however many times each appears.", "Still a triad"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "roots-in-open-e",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap **every root (E)** in this open E chord.",
        hint: "Two of them are open strings.",
        board: voicingBoard(E, "022100", { labels: "none", roles: false }),
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: {
          type: "exact-positions",
          positions: [
            { string: 6, fret: 0 },
            { string: 4, fret: 2 },
            { string: 1, fret: 0 },
          ],
          context: { chord: E },
        },
        solution: [
          { string: 6, fret: 0 },
          { string: 4, fret: 2 },
          { string: 1, fret: 0 },
        ],
      }),
      choice(
        "open-c-doubled",
        "The open C chord (x32010) plays C E G C E. Which notes are doubled?",
        [
          ["c-e", "C and E"],
          ["c-g", "C and G", "G appears only once (the open G string)."],
          ["none", "None", "Five strings, three notes: two must repeat."],
        ],
        "c-e",
      ),
      choice(
        "open-g-count",
        "How many *different* notes are in the open G chord (320003)?",
        [
          ["3", "Three"],
          ["6", "Six", "Six strings sound, but the notes are G B D G B G: only three names."],
          ["4", "Four", "G, B and D: a triad has three different notes."],
        ],
        "3",
      ),
      exercise({
        id: "full-a-major",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **A major** using at least **four strings**.",
        hint: "Doubling is allowed and expected: A, C♯ and E as many times as you like.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "A", quality: "major" }, minNotes: 4 },
        solution: shape("x02220"),
      }),
    ]),
  ],
};
