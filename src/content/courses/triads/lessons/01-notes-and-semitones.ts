import type { Lesson } from "@/lib/courses";
import { board, callout, choice, exercise, step, text } from "@/content/helpers";

const CHROMATIC_SHARPS = ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#"];

export const notesAndSemitones: Lesson = {
  id: "notes-and-semitones",
  title: "Notes and Semitones",
  summary: "The twelve notes of Western music, and why every fret is one semitone.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Name the seven natural notes and the five notes between them",
    "Explain what a semitone is and find one on the guitar",
    "Understand why one pitch can have two names (C♯ and D♭)",
    "Find a note on a string by counting frets",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("alphabet", "The musical alphabet", [
      text(`
        Music uses just seven letter names: **A B C D E F G**. After G the letters start again at A, only higher.

        Between most of these *natural* notes there is one extra note, which gives **twelve different notes** in total before the pattern repeats. The repeat point, where a note comes back sounding "the same but higher", is called an **octave**.
      `),
      { type: "chromatic", start: "C", caption: "The twelve notes from C to B. Natural notes are labelled; the shaded keys sit between them." },
      text(`
        The in-between notes are named from their neighbours. A **sharp (♯)** raises a note by the smallest step; a **flat (♭)** lowers it. So the note between C and D is both **C♯** and **D♭**.

        Two pairs of naturals have *no* note between them: **E–F** and **B–C**.
      `),
      callout(
        "note",
        "C♯ and D♭ sound identical, but they are not interchangeable in writing. Which name is correct depends on the musical context, such as the chord being built. You'll see why when we spell triads.",
        "Same sound, different names",
      ),
    ]),
    step("semitones", "One fret, one semitone", [
      text(`
        The smallest step between two of the twelve notes is a **semitone** (also called a half step). Two semitones make a **whole tone**.

        On the guitar this is wonderfully simple: **moving up one fret raises the pitch by one semitone.** Twelve frets take you up an octave, which is why fret 12 is marked with a double dot.
      `),
      board(
        { range: { start: 0, end: 12 }, strings: [6], notes: CHROMATIC_SHARPS, labels: "note", layout: { mobile: "neck", desktop: "neck" } },
        "The low E string, open to fret 12. Each fret is one semitone higher than the last.",
      ),
      callout(
        "guitar",
        "Play the low E string open, then fret 1, 2, 3 … up to 12. Every step is a semitone. Fret 12 sounds an octave above the open string.",
        "Try it on your guitar",
      ),
      choice(
        "semitones-e-f",
        "How many semitones are there from E up to F?",
        [
          ["1", "1 semitone"],
          ["2", "2 semitones", "Most neighbouring naturals are 2 semitones apart, but E and F have no note between them."],
          ["0", "0 semitones", "E and F are different notes, so there is at least one semitone between them."],
        ],
        "1",
        { explanation: "E–F and B–C are the two natural pairs only a semitone apart." },
      ),
      choice(
        "semitone-above-b",
        "Which note is one semitone above B?",
        [
          ["c", "C"],
          ["c-sharp", "C♯", "C♯ is two semitones above B. There's no note between B and C."],
          ["a-sharp", "A♯", "A♯ (also called B♭) is a semitone *below* B."],
        ],
        "c",
      ),
    ]),
    step("finding-notes", "Finding notes by counting frets", [
      text(`
        To find any note, start from the name of an open string and count up one semitone per fret.

        In standard tuning the open strings, from the thickest (string 6) to the thinnest (string 1), are **E A D G B E**.
      `),
      {
        type: "demo",
        title: "Counting up to G on the low E string",
        board: { range: { start: 0, end: 5 }, labels: "note", layout: { mobile: "neck", desktop: "neck" } },
        frames: [
          { caption: "Start on the open low E string.", board: { positions: [{ string: 6, fret: 0, role: "tone" }] } },
          { caption: "Fret 1 is F. E to F is a single semitone.", board: { positions: [{ string: 6, fret: 0, state: "ghost" }, { string: 6, fret: 1, role: "tone" }] } },
          { caption: "Fret 2 is F♯ (or G♭).", board: { positions: [{ string: 6, fret: 0, state: "ghost" }, { string: 6, fret: 1, state: "ghost" }, { string: 6, fret: 2, role: "tone" }] } },
          { caption: "Fret 3 is G: three semitones above E.", board: { positions: [{ string: 6, fret: 0, state: "ghost" }, { string: 6, fret: 1, state: "ghost" }, { string: 6, fret: 2, state: "ghost" }, { string: 6, fret: 3, role: "root" }] } },
        ],
      },
      exercise({
        id: "find-f-low-e",
        kind: "fretboard",
        task: "locate",
        prompt: "Find F on the low E string (string 6).",
        hint: "F is one semitone above E.",
        board: { range: { start: 0, end: 5 }, labels: "none", strings: [6], layout: { mobile: "neck", desktop: "neck" } },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["F"], region: { range: { start: 0, end: 5 }, strings: [6] }, match: "all" },
        solution: [{ string: 6, fret: 1 }],
      }),
      exercise({
        id: "every-g-0-5",
        kind: "fretboard",
        task: "locate",
        prompt: "Find every G between the open strings and fret 5.",
        hint: "There are four. One of them is an open string, and the two E strings share the same pattern.",
        explanation: "The two E strings always have the same notes at the same frets, just two octaves apart.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "neck", desktop: "neck" } },
        selection: "multi",
        rule: { type: "pitch-classes", notes: ["G"], region: { range: { start: 0, end: 5 } }, match: "all" },
        solution: [
          { string: 6, fret: 3 },
          { string: 4, fret: 5 },
          { string: 3, fret: 0 },
          { string: 1, fret: 3 },
        ],
      }),
      choice(
        "enharmonic-a-string",
        "The highlighted note (A string, fret 1) is A♯. What is its other name?",
        [
          ["b-flat", "B♭"],
          ["b", "B", "B is two semitones above A, at fret 2."],
          ["a-flat", "A♭", "A♭ is a semitone *below* A, so it can't be on a fret above the open A string."],
        ],
        "b-flat",
        { board: { range: { start: 0, end: 4 }, positions: [{ string: 5, fret: 1, role: "tone", label: "?" }], layout: { mobile: "neck", desktop: "neck" } } },
      ),
    ]),
  ],
};
