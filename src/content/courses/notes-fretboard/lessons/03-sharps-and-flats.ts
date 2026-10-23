import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, choice, drill, exercise, notePositions, step, text } from "@/content/helpers";

export const sharpsAndFlats: Lesson = {
  id: "sharps-and-flats",
  title: "Sharps, Flats and the Chromatic Scale",
  summary: "The five notes between the letters, and why each has two names.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Explain what sharps (♯) and flats (♭) do",
    "Give both names of every in-between note",
    "Find sharp and flat notes on a string",
  ],
  prerequisites: ["musical-alphabet"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("between", "The notes in between", [
      text(`
        The gaps between most letters hold one more note, giving **twelve notes** per octave. Together they form the **chromatic scale**.

        - A **sharp (♯)** raises a note by a half step: one fret **up**.
        - A **flat (♭)** lowers a note by a half step: one fret **down**.

        So the note between F and G is **F♯** (F raised) *and* **G♭** (G lowered). Same fret, same sound, two names. Notes like this are called **enharmonic**.
      `),
      board(
        {
          range: { start: 0, end: 12 },
          strings: [6],
          notes: ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#"],
          labels: "note",
          layout: NECK,
        },
        "The low E string named with sharps…",
      ),
      board(
        {
          range: { start: 0, end: 12 },
          strings: [6],
          notes: ["E", "F", "Gb", "G", "Ab", "A", "Bb", "B", "C", "Db", "D", "Eb"],
          labels: "note",
          layout: NECK,
        },
        "…and with flats. The frets and sounds are identical; only the names change.",
      ),
      callout(
        "note",
        "Which name is correct depends on the musical context, such as the key or chord. You'll see why in the scales and chords courses. For finding notes, either name gets you to the same fret.",
        "Which name do I use?",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "half-step-above-c",
        "What note is a half step above C?",
        [
          ["c-sharp", "C♯ (also called D♭)"],
          ["d", "D", "D is a whole step above C. There's a note in between."],
          ["b", "B", "B is a half step *below* C."],
        ],
        "c-sharp",
      ),
      choice(
        "other-name-g-flat",
        "What's another name for G♭?",
        [
          ["f-sharp", "F♯"],
          ["g-sharp", "G♯", "G♯ is a half step *above* G; G♭ is a half step below it."],
          ["f", "F", "F is a half step below G♭, so it's a different note."],
        ],
        "f-sharp",
      ),
      choice(
        "half-step-below-f",
        "What note is a half step below F?",
        [
          ["e", "E"],
          ["e-flat", "E♭", "E♭ is a whole step below F. E–F is one of the two natural half steps."],
          ["f-sharp", "F♯", "F♯ is above F, not below."],
        ],
        "e",
      ),
      exercise({
        id: "find-b-flat-low-e",
        kind: "fretboard",
        task: "locate",
        prompt: "Find **B♭** on the low E string.",
        hint: "B♭ is a half step below B. Where is B on the low E string?",
        explanation: "B is at fret 7, so B♭ (also called A♯) is at fret 6.",
        board: { range: { start: 0, end: 12 }, labels: "none", strings: [6], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["Bb"], region: { range: { start: 0, end: 11 }, strings: [6] }, match: "all" },
        solution: [{ string: 6, fret: 6 }],
      }),
      exercise({
        id: "every-f-sharp-0-5",
        kind: "fretboard",
        task: "locate",
        prompt: "Find every **F♯** between the open strings and fret 5.",
        hint: "There are three. F♯ is one fret above F.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "pitch-classes", notes: ["F#"], region: { range: { start: 0, end: 5 } }, match: "all" },
        solution: notePositions("F#", { start: 0, end: 5 }),
      }),
      drill(
        "name-all-notes-low",
        "Name any note on the two lowest strings, sharps and flats included.",
        { type: "note-naming", strings: [5, 6], range: { start: 0, end: 7 } },
        { rounds: 8 },
      ),
    ]),
  ],
};
