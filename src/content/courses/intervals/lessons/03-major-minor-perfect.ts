import type { Lesson } from "@/lib/courses";
import { callout, choice, drill, step, text } from "@/content/helpers";

export const majorMinorPerfect: Lesson = {
  id: "major-minor-perfect",
  title: "Major, Minor and Perfect",
  summary: "Qualities tell you the exact size: how many half steps an interval spans.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Know which interval numbers are perfect and which are major/minor",
    "Give the half-step size of every interval up to an octave",
    "Name intervals from two note names",
  ],
  prerequisites: ["interval-numbers"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("qualities", "Two families", [
      text(`
        The **quality** pins down the exact size. Interval numbers fall into two families:

        - **Perfect** intervals: unisons, **4ths**, **5ths** and octaves. They're simply "perfect".
        - **Major/minor** intervals: **2nds, 3rds, 6ths and 7ths**. The **minor** version is one half step smaller than the **major** one.

        Sizes in half steps:

        - Minor 2nd **1** · Major 2nd **2**
        - Minor 3rd **3** · Major 3rd **4**
        - Perfect 4th **5** · Perfect 5th **7**
        - Minor 6th **8** · Major 6th **9**
        - Minor 7th **10** · Major 7th **11**
        - Octave **12**
      `),
      callout(
        "tip",
        "Above any root, the notes of its **major scale** are all major or perfect intervals: C D E F G A B = root, M2, M3, P4, P5, M6, M7. Lower one by a half step and it becomes minor (except 4ths and 5ths).",
        "A shortcut",
      ),
      { type: "interval-explorer", root: { string: 5, fret: 3 }, range: { start: 0, end: 12 }, caption: "Explore: tap notes around C and check their names against the list." },
    ]),
    step("practice", "Practice", [
      choice(
        "m3-size",
        "How many half steps are in a minor third?",
        [
          ["3", "3"],
          ["4", "4", "Four half steps is a major third. Minor is one smaller."],
          ["2", "2", "Two half steps is a major second."],
        ],
        "3",
      ),
      choice(
        "which-perfect",
        "Which of these intervals is called *perfect*?",
        [
          ["4th", "A fourth"],
          ["3rd", "A third", "Thirds are major or minor."],
          ["6th", "A sixth", "Sixths are major or minor."],
        ],
        "4th",
      ),
      choice(
        "c-to-e-flat",
        "Name the interval from C up to E♭.",
        [
          ["m3", "Minor third"],
          ["M3", "Major third", "C to E would be a major third (4 half steps). E♭ is one half step lower: 3."],
          ["A2", "Augmented second", "C to D♯ would be spelled as a second. E♭ uses the letter E, so it's a third."],
        ],
        "m3",
      ),
      choice(
        "c-to-a",
        "Name the interval from C up to A.",
        [
          ["M6", "Major sixth"],
          ["m6", "Minor sixth", "A minor sixth is 8 half steps (C to A♭). C to A is 9."],
          ["P5", "Perfect fifth", "C to G is the fifth. A is one letter further."],
        ],
        "M6",
      ),
      choice(
        "c-to-b-flat",
        "Name the interval from C up to B♭.",
        [
          ["m7", "Minor seventh"],
          ["M7", "Major seventh", "C to B is a major seventh (11). B♭ is a half step smaller."],
          ["M6", "Major sixth", "B uses the seventh letter from C: C D E F G A B."],
        ],
        "m7",
      ),
      drill(
        "recognise-named-intervals",
        "Name intervals on the fretboard (note names shown).",
        {
          type: "interval-recognition",
          intervals: ["m2", "M2", "m3", "M3", "P4", "P5", "m6", "M6", "m7", "M7", "P8"],
          rootStrings: [6, 5],
          rootRange: { start: 0, end: 7 },
          boardRange: { start: 0, end: 12 },
          showNames: true,
        },
        { rounds: 8, hint: "Count letters for the number, then half steps for the quality." },
      ),
    ]),
  ],
};
