import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, choice, drill, exercise, step, text } from "@/content/helpers";

export const stringsAndTuning: Lesson = {
  id: "strings-and-tuning",
  title: "Your Six Strings",
  summary: "Name and number the strings, and learn the notes they're tuned to.",
  kind: "lesson",
  estimatedMinutes: 6,
  objectives: [
    "Name the six open strings in standard tuning",
    "Use string numbers the way guitarists do",
    "Recall each open string's note without looking",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("meet", "Meet the strings", [
      text(`
        A standard guitar has six strings. Played open (without pressing any fret), they sound these notes, from the **thickest** string to the **thinnest**:

        **E A D G B E**

        A popular way to remember them: **E**ddie **A**te **D**ynamite, **G**ood **B**ye **E**ddie.

        Thicker strings sound **lower**; thinner strings sound **higher**. The two E strings are both E, but the thin one is two octaves higher, so we call them **low E** and **high E**.
      `),
      board(
        {
          range: { start: 0, end: 5 },
          labels: "note",
          positions: [6, 5, 4, 3, 2, 1].map((string) => ({ string, fret: 0, role: "tone" as const })),
          layout: NECK,
        },
        "The open strings. This diagram is drawn as you'd see the neck looking down at it: high E at the top, low E at the bottom.",
      ),
      text(`
        Guitarists **number** the strings from the thinnest: **string 1** is high E and **string 6** is low E. Lessons and chord charts use these numbers all the time, so they're worth learning now.
      `),
      callout(
        "guitar",
        "Pluck each open string from string 6 to string 1 and say its name out loud: E, A, D, G, B, E. Then go back down.",
        "Try it on your guitar",
      ),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "tap-open-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Tap the open **A** string.",
        hint: "A is the second-thickest string (string 5). Tap the space beside the nut, where the open strings are.",
        board: { range: { start: 0, end: 4 }, labels: "none", layout: NECK },
        selection: "single",
        rule: { type: "exact-positions", positions: [{ string: 5, fret: 0 }] },
        solution: [{ string: 5, fret: 0 }],
      }),
      choice(
        "which-is-string-1",
        "Which string is string 1?",
        [
          ["high-e", "The thinnest string (high E)"],
          ["low-e", "The thickest string (low E)", "Strings are numbered from the thinnest. The thickest string is string 6."],
          ["a", "The A string", "The A string is string 5."],
        ],
        "high-e",
      ),
      choice(
        "open-string-order",
        "What are the open strings, from thickest to thinnest?",
        [
          ["eadgbe", "E A D G B E"],
          ["ebgdae", "E B G D A E", "That's the right set of notes in reverse: thinnest to thickest."],
          ["adgbea", "A D G B E A", "The thickest string is E, not A."],
          ["eadgce", "E A D G C E", "The fifth string from the bottom is B, not C."],
        ],
        "eadgbe",
      ),
      exercise({
        id: "tap-open-g",
        kind: "fretboard",
        task: "locate",
        prompt: "Tap the open **G** string (string 3).",
        board: { range: { start: 0, end: 4 }, labels: "none", layout: NECK },
        selection: "single",
        rule: { type: "exact-positions", positions: [{ string: 3, fret: 0 }] },
        solution: [{ string: 3, fret: 0 }],
      }),
      drill(
        "name-open-strings",
        "Name the open strings from memory.",
        { type: "note-naming", strings: [1, 2, 3, 4, 5, 6], range: { start: 0, end: 0 }, naturalsOnly: true },
        { rounds: 6, passScore: 0.83, hint: "Eddie Ate Dynamite, Good Bye Eddie." },
      ),
    ]),
  ],
};
