import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, exercise, step, text } from "@/content/helpers";

export const measuringDistance: Lesson = {
  id: "measuring-distance",
  title: "Measuring the Distance Between Notes",
  summary: "An interval is the gap between two notes. On guitar, you can count it in frets.",
  kind: "lesson",
  estimatedMinutes: 7,
  objectives: [
    "Explain what an interval measures",
    "Count intervals in half steps on one string",
    "Hear that different distances have different characters",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("idea", "What an interval is", [
      text(`
        An **interval** is the distance between two notes. Melodies are made of intervals one after another; chords are intervals stacked together.

        The simplest way to measure an interval is in **half steps** (semitones). On one string, that's just the number of frets between the notes.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root" },
          { note: "E", role: "third" },
          { note: "G", role: "fifth" },
        ],
        showDistances: true,
        caption: "C to E is 4 half steps; E to G is 3 more; so C to G is 7.",
      },
      callout(
        "guitar",
        "Play the open A string, then fret 3, then fret 4, then fret 7 on the same string, each time returning to the open A. Every distance has its own sound: dark, bright, open.",
        "Hear the distances",
      ),
      { type: "interval-explorer", root: { string: 5, fret: 3 }, range: { start: 0, end: 12 }, caption: "Explore: tap any note to see its distance from C." },
    ]),
    step("practice", "Practice", [
      choice(
        "c-to-e",
        "How many half steps are there from C up to E?",
        [
          ["4", "4"],
          ["2", "2", "C to D is 2. Keep going: D to E is 2 more."],
          ["3", "3", "Count every fret: C, C♯, D, D♯, E. That's 4 steps."],
        ],
        "4",
      ),
      choice(
        "a-to-c",
        "How many half steps from A up to C?",
        [
          ["3", "3"],
          ["4", "4", "A to B is 2 and B to C is only 1 (a natural half step)."],
          ["2", "2", "A to B is 2, but you still need to get from B to C."],
        ],
        "3",
      ),
      choice(
        "five-frets",
        "Two notes on the same string are five frets apart. How big is the interval?",
        [
          ["5", "5 half steps"],
          ["6", "6 half steps", "Count the frets you move, not the frets you touch."],
          ["10", "10 half steps", "Each fret is one half step, not two."],
        ],
        "5",
      ),
      exercise({
        id: "seven-above-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the note **7 half steps** above the open A string.",
        hint: "On the A string that's fret 7. Is there a closer place on another string?",
        explanation: "E: 7 half steps above A. It's at fret 7 on the A string and fret 2 on the D string.",
        board: { range: { start: 0, end: 9 }, labels: "none", positions: [{ string: 5, fret: 0, role: "root", label: "A" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 0 }, interval: "P5" },
        solution: [{ string: 5, fret: 7 }],
      }),
    ]),
  ],
};
