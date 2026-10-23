import type { Lesson } from "@/lib/courses";
import { NECK, choice, drill, exercise, step, text } from "@/content/helpers";

const locate = (id: string, prompt: string, from: { string: number; fret: number }, label: string, interval: string, solution: { string: number; fret: number }) =>
  exercise({
    id,
    kind: "fretboard",
    task: "locate",
    prompt,
    board: { range: { start: 0, end: 10 }, labels: "none", positions: [{ ...from, role: "root", label }], layout: NECK },
    selection: "single",
    rule: { type: "interval", from, interval },
    solution: [solution],
  });

export const intervalsCheckpoint: Lesson = {
  id: "intervals-checkpoint",
  title: "Checkpoint: Intervals",
  summary: "Name, size and find intervals on the fretboard.",
  kind: "assessment",
  estimatedMinutes: 10,
  objectives: ["Name intervals by number and quality", "Find intervals from a root", "Recognise interval shapes"],
  prerequisites: ["intervals-around-a-root"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [
      text("**Eight questions**, first attempts only. You need **6 of 8** to pass. The drill counts as correct if you pass it on your first run."),
    ]),
    step("names", "Names and sizes", [
      choice(
        "c-p5-size",
        "How many half steps are in a perfect 5th?",
        [
          ["7", "7"],
          ["5", "5", "Five half steps is a perfect 4th."],
          ["8", "8", "Eight half steps is a minor 6th."],
        ],
        "7",
      ),
      choice(
        "c-c-to-a-flat",
        "Name the interval from C up to A♭.",
        [
          ["m6", "Minor 6th"],
          ["A5", "Augmented 5th", "Same sound, but A♭ uses the letter A, six letters from C."],
          ["M6", "Major 6th", "C to A is the major 6th; A♭ is a half step smaller."],
        ],
        "m6",
      ),
      choice(
        "c-e-to-c",
        "What is the interval number from E up to C?",
        [
          ["6", "A sixth"],
          ["5", "A fifth", "Count every letter: E F G A B C."],
          ["3", "A third", "C up to E is a third. E *up* to C is its inversion."],
        ],
        "6",
      ),
      choice(
        "c-tritone",
        "What are the two names of the tritone?",
        [
          ["a4-d5", "Augmented 4th or diminished 5th"],
          ["p4-p5", "Perfect 4th or perfect 5th", "Those are 5 and 7 half steps. The tritone is 6."],
          ["m3-M6", "Minor 3rd or major 6th", "Those are inversions of each other, but not the tritone."],
        ],
        "a4-d5",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      locate("c-maj3-above-c", "Find the **major 3rd** above this C.", { string: 5, fret: 3 }, "C", "M3", { string: 4, fret: 2 }),
      locate("c-m3-above-e", "Find the **minor 3rd** above this E.", { string: 6, fret: 0 }, "E", "m3", { string: 6, fret: 3 }),
      locate("c-p5-above-d", "Find the **perfect 5th** above this D.", { string: 5, fret: 5 }, "D", "P5", { string: 4, fret: 7 }),
      drill(
        "c-interval-drill",
        "Name intervals on the fretboard.",
        {
          type: "interval-recognition",
          intervals: ["m3", "M3", "P4", "P5", "m6", "M6", "P8"],
          rootStrings: [6, 5],
          rootRange: { start: 0, end: 7 },
          boardRange: { start: 0, end: 12 },
          showNames: true,
        },
        { rounds: 6, passScore: 0.83 },
      ),
    ]),
  ],
};
