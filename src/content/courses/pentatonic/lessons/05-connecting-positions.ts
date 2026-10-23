import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, choice, drill, exercise, notePositions, scaleInWindow, step, text } from "@/content/helpers";

export const connectingPositions: Lesson = {
  id: "connecting-positions",
  title: "Connecting the Positions",
  summary: "Stop being stuck in one box: move along strings and slide between shapes.",
  kind: "lesson",
  estimatedMinutes: 12,
  objectives: [
    "Explain how neighbouring positions overlap",
    "Play the scale horizontally along one string",
    "Recognise any position and name its key",
  ],
  prerequisites: ["five-positions"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("overlap", "Shared notes are bridges", [
      text(`
        Neighbouring positions **share notes**: the higher note of each string in one position is the lower note in the next. Those shared notes are bridges.

        There are two ways to move around:

        - **Vertically**: across the strings inside one position (what you've done so far).
        - **Horizontally**: along a string, sliding from one position into the next.

        Combining both turns five separate boxes into one connected scale.
      `),
      board(
        { scale: { root: "A", type: "minor-pentatonic" }, range: { start: 0, end: 17 }, labels: "interval", layout: NECK },
        "A minor pentatonic across the whole neck. Follow the roots (R) to see how the positions link up.",
      ),
      callout("guitar", "Play position 1, then on the G string slide from fret 7 to fret 9 and finish the phrase in position 2. Repeat the other way.", "Slide between boxes"),
    ]),
    step("practice", "Practice", [
      choice(
        "shared-notes",
        "How do positions 1 and 2 connect?",
        [
          ["shared", "The higher notes of position 1 are the lower notes of position 2"],
          ["gap", "There's a gap of one fret between them", "They overlap; there's no gap."],
          ["same", "They contain exactly the same frets", "They share some notes, but position 2 extends further up."],
        ],
        "shared",
      ),
      exercise({
        id: "g-string-horizontal",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **A minor pentatonic horizontally**: every scale note on the G string from fret 2 to fret 14.",
        hint: "A C D E G A along one string. Start at fret 2 (A).",
        board: { range: { start: 0, end: 15 }, labels: "none", strings: [3], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "A", type: "minor-pentatonic" }, region: { range: { start: 2, end: 14 }, strings: [3] } },
        solution: scaleInWindow("A", "minor-pentatonic", { start: 2, end: 14 }, [3]),
      }),
      exercise({
        id: "every-a-to-12",
        kind: "fretboard",
        task: "locate",
        prompt: "Find **every A** from the nut to fret 12. These roots anchor every position.",
        hint: "Use octave shapes from the A on the low E string (fret 5).",
        board: { range: { start: 0, end: 12 }, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "pitch-classes", notes: ["A"], region: { range: { start: 0, end: 12 } }, match: "all" },
        solution: notePositions("A", { start: 0, end: 12 }),
      }),
      drill(
        "identify-position-key",
        "Which minor pentatonic is this? Name the key from any position.",
        { type: "scale-identification", scale: "minor-pentatonic", roots: ["A", "E", "D", "G", "C", "B", "F#"], positions: [1, 2, 3, 4, 5] },
        { rounds: 8, hint: "Find a square on the low E or A string and name that note." },
      ),
    ]),
  ],
};
