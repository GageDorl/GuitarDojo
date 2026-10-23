import type { Lesson } from "@/lib/courses";
import { NECK, board, caged, chordMarkers, choice, drill, exercise, notePositions, pentatonicWindow, step, text } from "@/content/helpers";

const AM = { root: "A", quality: "minor" } as const;
const POS1 = pentatonicWindow("A", 1);
const am = caged("E", "A", "minor");
const around = { start: POS1.start - 1, end: POS1.end + 1 };

export const cagedAndScales: Lesson = {
  id: "caged-and-scales",
  title: "Chord Shapes Inside Scale Shapes",
  summary: "Every chord shape lives inside a scale position. Solo over a chord by staying near its shape.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "See a chord shape inside the matching pentatonic position",
    "Find the chord tones within a scale position",
    "Use chord shapes as landmarks for soloing",
  ],
  prerequisites: ["caged-minor"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("inside", "The chord is in the scale", [
      text(`
        The **Em-shape A minor** barre chord at fret 5 sits right inside **A minor pentatonic, position 1**. Every chord tone (A, C, E) is a scale note, and the chord's roots are the scale's roots.

        That's the link between CAGED and scale positions: each chord shape is a "skeleton" for the scale around it. Targeting the chord tones inside a position is how solos sound connected to the chords underneath.
      `),
      board(
        { scale: { root: "A", type: "minor-pentatonic" }, region: POS1, range: around, labels: "interval", positions: chordMarkers(AM, am), layout: NECK },
        "A minor pentatonic, position 1, with the Em-shape Am chord coloured in: R, ♭3 and 5 all belong to the scale.",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "which-position",
        "Which A minor pentatonic position surrounds the Em-shape A minor barre chord at fret 5?",
        [
          ["1", "Position 1 (the box at frets 5–8)"],
          ["3", "Position 3", "Position 3 is around frets 9–13."],
          ["5", "Position 5", "Position 5 is around frets 14–17 (or 2–5 an octave down)."],
        ],
        "1",
      ),
      exercise({
        id: "chord-tones-in-box",
        kind: "fretboard",
        task: "identify",
        prompt: "Inside position 1, tap **every A minor chord tone** (A, C and E).",
        hint: "Every root, every ♭3 and every 5 in the box.",
        board: { scale: { root: "A", type: "minor-pentatonic" }, region: POS1, range: around, labels: "none", roles: false, layout: NECK },
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: { type: "pitch-classes", notes: ["A", "C", "E"], region: { range: POS1 }, match: "all" },
        solution: ["A", "C", "E"].flatMap((n) => notePositions(n, POS1)),
      }),
      drill(
        "major-shape-drill",
        "Play major chords with a given CAGED shape.",
        { type: "caged-construction", roots: ["C", "D", "E", "F", "G", "A"] },
        { rounds: 6, hint: "Root string first: C and A shapes on the A string, G and E on the low E, D on the D string." },
      ),
    ]),
  ],
};
