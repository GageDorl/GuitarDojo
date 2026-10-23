import type { Lesson } from "@/lib/courses";
import { BUILD, callout, choice, drill, exercise, moved, shape, step, text, voicingBoard } from "@/content/helpers";

const E_SHAPE = "022100";
const A_SHAPE = "x02220";
const AM_SHAPE = "x02210";

const major = (root: string) => ({ root, quality: "major" as const });

export const barreChords: Lesson = {
  id: "barre-chords",
  title: "Moveable Shapes and Barre Chords",
  summary: "Slide an open shape up the neck, barre where the nut was, and one shape plays twelve chords.",
  kind: "lesson",
  estimatedMinutes: 12,
  objectives: [
    "Turn the open E and A shapes into barre chords",
    "Name a barre chord from the note under the barre",
    "Play major and minor barre chords in any key",
  ],
  prerequisites: ["open-chords"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("moveable", "Your finger becomes the nut", [
      text(`
        Open chords rely on open strings, so they can't move. But if you **lay one finger across all the strings** (a **barre**) it does the nut's job, and the rest of the shape can go anywhere.

        - **E shape:** the open E chord moved up. Root on the **low E string**, under the barre.
        - **A shape:** the open A chord moved up. Root on the **A string**.
        - Both have minor versions from the Em and Am shapes.

        **The chord is named after the note under the barre** on the root string.
      `),
      {
        type: "compare",
        items: [
          { title: "F (E shape, fret 1)", board: voicingBoard(major("F"), moved(E_SHAPE, 1)) },
          { title: "G (E shape, fret 3)", board: voicingBoard(major("G"), moved(E_SHAPE, 3)) },
          { title: "A (E shape, fret 5)", board: voicingBoard(major("A"), moved(E_SHAPE, 5)) },
        ],
        caption: "The open E shape, moved: one fingering, three chords.",
      },
      {
        type: "compare",
        items: [
          { title: "B♭ (A shape, fret 1)", board: voicingBoard(major("Bb"), moved(A_SHAPE, 1)) },
          { title: "C (A shape, fret 3)", board: voicingBoard(major("C"), moved(A_SHAPE, 3)) },
          { title: "D (A shape, fret 5)", board: voicingBoard(major("D"), moved(A_SHAPE, 5)) },
        ],
        caption: "The A shape: root on the A string.",
      },
      callout("guitar", "Barres take practice. Roll your first finger slightly onto its bony edge, keep it close to the fret, and check each string one at a time.", "Getting a clean barre"),
    ]),
    step("practice", "Practice", [
      choice(
        "e-shape-fret-5",
        "An E-shape major barre chord at fret 5 is which chord?",
        [
          ["a", "A major"],
          ["e", "E major", "The *shape* comes from E, but the chord is named after the note under the barre: low E string fret 5 is A."],
          ["d", "D major", "D is fret 10 on the low E string (or fret 5 on the A string)."],
        ],
        "a",
      ),
      choice(
        "a-shape-c",
        "Which fret do you barre to play C major with the A shape?",
        [
          ["3", "Fret 3"],
          ["8", "Fret 8", "Fret 8 is C on the *low E* string, which is where the E shape would go."],
          ["1", "Fret 1", "Fret 1 on the A string is B♭."],
        ],
        "3",
      ),
      choice(
        "am-shape-fret-2",
        "The Am shape barred at fret 2 is which chord?",
        [
          ["bm", "B minor"],
          ["am", "A minor", "Named after the note under the barre: A string fret 2 is B."],
          ["b", "B major", "It's the *minor* shape, so it's B minor."],
        ],
        "bm",
      ),
      exercise({
        id: "g-e-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **G major using the E shape** (barre at fret 3).",
        hint: "Barre fret 3; the shape's other notes are on frets 4 and 5.",
        board: { range: { start: 1, end: 6 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(moved(E_SHAPE, 3)), context: { chord: major("G") } },
        solution: shape(moved(E_SHAPE, 3)),
      }),
      exercise({
        id: "bm-am-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **B minor using the Am shape** (barre at fret 2, root on the A string).",
        board: { range: { start: 1, end: 6 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(moved(AM_SHAPE, 2)), context: { chord: { root: "B", quality: "minor" } } },
        solution: shape(moved(AM_SHAPE, 2)),
      }),
      drill(
        "moveable-chord-drill",
        "Build major and minor chords away from the nut (frets 1–10).",
        { type: "chord-construction", roots: ["F", "G", "A", "B", "C", "D"], qualities: ["major", "minor"], range: { start: 1, end: 10 } },
        { rounds: 6, hint: "Find the root on the low E or A string, then use the E, Em, A or Am shape." },
      ),
    ]),
  ],
};
