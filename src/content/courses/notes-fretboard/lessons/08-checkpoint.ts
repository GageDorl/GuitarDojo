import type { Lesson } from "@/lib/courses";
import { NECK, choice, drill, exercise, notePositions, step, text } from "@/content/helpers";

export const notesCheckpoint: Lesson = {
  id: "notes-checkpoint",
  title: "Checkpoint: Notes and the Fretboard",
  summary: "Show that you can name, find and move notes across the neck.",
  kind: "assessment",
  estimatedMinutes: 10,
  objectives: ["Name open strings and in-between notes", "Find notes on any string", "Use unisons and octave shapes"],
  prerequisites: ["memorizing-the-fretboard"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [
      text(`
        **Eight questions.** Only first attempts count toward your score, and you need **6 of 8** to pass. The last question is a short drill: passing it on your first run counts as correct.
      `),
    ]),
    step("names", "Names", [
      choice(
        "c-open-order",
        "Which string is tuned to B?",
        [
          ["2", "String 2"],
          ["5", "String 5", "String 5 is the A string."],
          ["3", "String 3", "String 3 is the G string."],
        ],
        "2",
      ),
      choice(
        "c-half-step-above-e",
        "What is a half step above E?",
        [
          ["f", "F"],
          ["e-sharp-f-sharp", "F♯", "F♯ is a whole step above E. E–F is a natural half step."],
          ["d-sharp", "D♯", "D♯ is a half step below E."],
        ],
        "f",
      ),
      choice(
        "c-other-name-d-sharp",
        "What's another name for D♯?",
        [
          ["e-flat", "E♭"],
          ["d-flat", "D♭", "D♭ is a half step below D; D♯ is a half step above it."],
          ["e", "E", "E is a half step above D♯."],
        ],
        "e-flat",
      ),
    ]),
    step("finding", "Finding notes", [
      exercise({
        id: "c-c-on-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Find **C** on the A string.",
        board: { range: { start: 0, end: 12 }, labels: "none", strings: [5], layout: NECK },
        selection: "single",
        rule: { type: "pitch-classes", notes: ["C"], region: { range: { start: 0, end: 11 }, strings: [5] }, match: "all" },
        solution: [{ string: 5, fret: 3 }],
      }),
      exercise({
        id: "c-every-d",
        kind: "fretboard",
        task: "locate",
        prompt: "Find every **D** from the open strings to fret 5.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: NECK },
        selection: "multi",
        rule: { type: "pitch-classes", notes: ["D"], region: { range: { start: 0, end: 5 } }, match: "all" },
        solution: notePositions("D", { start: 0, end: 5 }),
      }),
      exercise({
        id: "c-octave-above-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the octave above this A.",
        board: { range: { start: 0, end: 12 }, labels: "none", positions: [{ string: 6, fret: 5, role: "root", label: "A" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 6, fret: 5 }, interval: "P8" },
        solution: [{ string: 4, fret: 7 }],
      }),
      exercise({
        id: "c-b3-on-g",
        kind: "fretboard",
        task: "locate",
        prompt: "Play the open B string's pitch (**B3**) on the G string.",
        board: { range: { start: 0, end: 7 }, labels: "none", strings: [3], layout: NECK },
        selection: "single",
        rule: { type: "pitches", pitches: ["B3"] },
        solution: [{ string: 3, fret: 4 }],
      }),
      drill(
        "c-locate-drill",
        "Find natural notes on any string.",
        { type: "note-location", strings: [1, 2, 3, 4, 5, 6] },
        { rounds: 6, passScore: 0.83 },
      ),
    ]),
  ],
};
