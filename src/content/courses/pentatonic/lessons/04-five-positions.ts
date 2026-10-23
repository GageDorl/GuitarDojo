import type { Lesson } from "@/lib/courses";
import { NECK, callout, drill, exercise, notePositions, pentatonicWindow, scaleInWindow, step, text } from "@/content/helpers";

const windows = ([1, 2, 3, 4, 5] as const).map((p) => pentatonicWindow("A", p));
// Positions 4 and 5 fold below fret 12; for the demo show them in their familiar higher place.
const display = windows.map((w) => (w.start < 5 ? { start: w.start + 12, end: w.end + 12 } : w));
const POS2 = windows[1]!;

export const fivePositions: Lesson = {
  id: "five-positions",
  title: "The Five Positions",
  summary: "Five boxes cover the whole neck. Each one starts where the last one ends.",
  kind: "lesson",
  estimatedMinutes: 12,
  objectives: [
    "Recognise all five minor pentatonic positions",
    "Find the roots in every position",
    "Understand that the positions repeat every 12 frets",
  ],
  prerequisites: ["position-one"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("all-five", "Five boxes", [
      text(`
        Position 1 is only one slice of the scale. The same five notes continue up the neck in **five positions**, each with two notes per string. Above fret 12, the pattern starts again with position 1.

        We number positions from the minor root's box, as many teachers do. The same shapes serve the relative major pentatonic: **position 1 of A minor is position 1 of C major pentatonic** in our numbering.
      `),
      {
        type: "demo",
        title: "A minor pentatonic, positions 1 to 5",
        board: { scale: { root: "A", type: "minor-pentatonic" }, range: { start: 4, end: 18 }, labels: "interval", layout: NECK },
        frames: display.map((region, i) => ({
          caption: `**Position ${i + 1}**: frets ${region.start}–${region.end}.${i === 0 ? " The box, starting on the low-E root." : " Its lowest notes are the previous position's highest notes."}`,
          board: { region },
        })),
      },
      callout(
        "tip",
        "Every position has at least two roots. Before learning a new position's notes, find its roots: they're your landmarks.",
        "Roots first",
      ),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "roots-in-position-2",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap every **root (A)** in position 2 (frets 7–10).",
        board: { scale: { root: "A", type: "minor-pentatonic" }, region: POS2, range: { start: POS2.start - 1, end: POS2.end + 1 }, labels: "none", roles: false, layout: NECK },
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: { type: "pitch-classes", notes: ["A"], region: { range: POS2 }, match: "all" },
        solution: notePositions("A", POS2),
      }),
      exercise({
        id: "play-position-2",
        kind: "fretboard",
        task: "construct",
        prompt: "Play every note of **A minor pentatonic, position 2**.",
        hint: "Start from the roots you just found. Low E string: frets 8 and 10.",
        board: { range: { start: POS2.start - 1, end: POS2.end + 1 }, region: POS2, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "A", type: "minor-pentatonic" }, region: { range: POS2 } },
        solution: scaleInWindow("A", "minor-pentatonic", POS2),
      }),
      drill(
        "roots-any-position",
        "Find the roots in any position, in any key.",
        { type: "scale-roots", scale: "minor-pentatonic", roots: ["A", "E", "G", "D", "C"], positions: [1, 2, 3, 4, 5] },
        { rounds: 8, hint: "Roots come in octave shapes: two strings and two (or three) frets apart." },
      ),
    ]),
  ],
};
