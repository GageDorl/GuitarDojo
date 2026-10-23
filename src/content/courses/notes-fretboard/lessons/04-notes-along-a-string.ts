import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, drill, exercise, step, text } from "@/content/helpers";

const NATURALS = ["C", "D", "E", "F", "G", "A", "B"];

const findOn = (id: string, note: string, string: number, fret: number, stringLabel: string, hint: string) =>
  exercise({
    id,
    kind: "fretboard",
    task: "locate",
    prompt: `Find **${note}** on the ${stringLabel} string.`,
    hint,
    board: { range: { start: 0, end: 12 }, labels: "none", strings: [string], layout: NECK },
    selection: "single",
    rule: { type: "pitch-classes", notes: [note], region: { range: { start: 0, end: 11 }, strings: [string] }, match: "all" },
    solution: [{ string, fret }],
  });

export const notesAlongAString: Lesson = {
  id: "notes-along-a-string",
  title: "Notes Along a String",
  summary: "Map the natural notes on the two bass strings: the foundation for everything else.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Find any natural note on the low E and A strings",
    "Use the fret markers at 3, 5, 7 and 12 as landmarks",
    "Recall bass-string notes without counting from the nut",
  ],
  prerequisites: ["sharps-and-flats"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("map", "The bass-string map", [
      text(`
        Most chord shapes and scale patterns are found from a root on the **low E** or **A** string, so these two strings are the best place to start.

        - **Low E string:** E (open), F (1), G (3), A (5), B (7), C (8), D (10), E (12)
        - **A string:** A (open), B (2), C (3), D (5), E (7), F (8), G (10), A (12)

        At fret 12 everything repeats an octave higher, so the map above covers the whole neck.
      `),
      board(
        { range: { start: 0, end: 12 }, strings: [6, 5], notes: NATURALS, labels: "note", layout: NECK },
        "Natural notes on the low E and A strings.",
      ),
      callout(
        "tip",
        "Use the dots as anchors. On the low E string the dots at 3, 5 and 7 are **G, A and B**. On the A string they're **C, D and E**. Find the nearest anchor, then step a fret or two.",
        "Landmarks",
      ),
      { type: "note-explorer", range: { start: 0, end: 12 }, strings: [6, 5], showOctaves: false, caption: "Explore: tap any fret on the bottom two strings to see its name." },
    ]),
    step("practice", "Practice", [
      findOn("c-on-low-e", "C", 6, 8, "low E", "B is at the fret-7 dot, and B–C is a half step."),
      findOn("g-on-a", "G", 5, 10, "A", "E is at the fret-7 dot. Count up: F (8), G (10)."),
      findOn("d-on-low-e", "D", 6, 10, "low E", "C is at fret 8, and D is a whole step above."),
      findOn("f-on-a", "F", 5, 8, "A", "E is at the fret-7 dot, and E–F is a half step."),
      drill(
        "locate-bass-naturals",
        "Find natural notes on the low E and A strings.",
        { type: "note-location", strings: [6, 5] },
        { rounds: 8, hint: "Anchor on the dots: G A B on low E, C D E on the A string." },
      ),
    ]),
  ],
};
