import type { Lesson } from "@/lib/courses";
import { callout, choice, exercise, step, text } from "@/content/helpers";

export const intervals: Lesson = {
  id: "intervals",
  title: "What Is an Interval?",
  summary: "Measure the distance between two notes and give it a name.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Define an interval as the distance between two notes",
    "Count intervals in semitones",
    "Recognise minor thirds, major thirds and perfect fifths",
    "Find intervals on one string and across strings",
  ],
  prerequisites: ["notes-and-semitones"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("distance", "The distance between notes", [
      text(`
        An **interval** is the distance between two notes. We measure it in semitones and give it a name.

        Intervals have two parts. The **number** counts letter names, including both ends: C to E spans C–D–E, so it is a *third*. The **quality** (major, minor, perfect …) tells you exactly how many semitones the interval contains.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root", label: "C" },
          { note: "E", role: "third", label: "E" },
        ],
        showDistances: true,
        caption: "C up to E is 4 semitones: a major third.",
      },
      text(`
        The intervals you'll use most in this module:

        - **Minor third**: 3 semitones (A → C)
        - **Major third**: 4 semitones (C → E)
        - **Perfect fifth**: 7 semitones (C → G)
        - **Octave**: 12 semitones (C → the next C)
      `),
      callout(
        "note",
        "A minor third and a major third both span three letter names, which is why both are called *thirds*. The quality is what separates them: a major third is one semitone wider.",
        "Why both are thirds",
      ),
    ]),
    step("on-the-neck", "Intervals on the fretboard", [
      text(`
        On a single string an interval is just a fret count: a major third is 4 frets, a perfect fifth is 7.

        Across strings it gets more convenient. Each string is a **perfect fourth** (5 semitones) above the one below it, except G → B, which is a major third (4 semitones). That gives intervals compact shapes you can reach without moving your hand.
      `),
      {
        type: "demo",
        title: "Intervals above A",
        board: { range: { start: 3, end: 12 }, root: "A", labels: "interval", layout: { mobile: "neck", desktop: "neck" } },
        frames: [
          { caption: "Our root: A on the low E string, fret 5.", board: { positions: [{ string: 6, fret: 5 }] } },
          { caption: "3 frets up is C: a minor third (♭3).", board: { positions: [{ string: 6, fret: 5 }, { string: 6, fret: 8, role: "third" }] } },
          { caption: "4 frets up is C♯: a major third (3).", board: { positions: [{ string: 6, fret: 5 }, { string: 6, fret: 9, role: "third" }] } },
          { caption: "7 frets up is E: a perfect fifth (5).", board: { positions: [{ string: 6, fret: 5 }, { string: 6, fret: 12, role: "fifth" }] } },
          { caption: "The same E is easier to reach on the next string: one string over, two frets up.", board: { positions: [{ string: 6, fret: 5 }, { string: 6, fret: 12, role: "fifth", state: "ghost" }, { string: 5, fret: 7, role: "fifth" }] } },
        ],
      },
      {
        type: "interval-explorer",
        root: { string: 6, fret: 5 },
        range: { start: 0, end: 12 },
        caption: "Explore: tap any note to see its interval from the root A.",
      },
    ]),
    step("practice", "Practice", [
      choice(
        "name-c-e",
        "What interval separates these two notes?",
        [
          ["m3", "Minor third", "A minor third is 3 semitones. Count the frets: 3 up to 7 is 4 semitones."],
          ["M3", "Major third"],
          ["P4", "Perfect fourth", "A perfect fourth is 5 semitones; these notes are 4 apart."],
          ["P5", "Perfect fifth", "A perfect fifth is 7 semitones; these notes are only 4 apart."],
        ],
        "M3",
        {
          board: {
            range: { start: 0, end: 9 },
            root: "C",
            labels: "note",
            positions: [
              { string: 5, fret: 3, role: "root" },
              { string: 5, fret: 7, role: "tone" },
            ],
          },
          explanation: "C to E: 4 semitones and three letter names, so a major third.",
        },
      ),
      choice(
        "name-a-c",
        "These notes are on different strings. What interval is it?",
        [
          ["m3", "Minor third"],
          ["M3", "Major third", "Count it: A, A♯, B, C is 3 semitones. A major third would be C♯."],
          ["P5", "Perfect fifth", "The fifth above A is E. This note is C."],
        ],
        "m3",
        {
          board: {
            range: { start: 0, end: 8 },
            root: "A",
            labels: "note",
            positions: [
              { string: 6, fret: 5, role: "root" },
              { string: 5, fret: 3, role: "tone" },
            ],
          },
          hint: "The A string's fret 3 is the same pitch as the low E string's fret 8.",
        },
      ),
      exercise({
        id: "fifth-above-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the perfect fifth above this A.",
        hint: "A perfect fifth is 7 semitones. Try one string higher, two frets up.",
        explanation: "E is a perfect fifth above A. This root-and-fifth shape is the classic power chord.",
        board: {
          range: { start: 3, end: 10 },
          labels: "none",
          positions: [{ string: 6, fret: 5, role: "root", label: "A" }],
          layout: { mobile: "neck", desktop: "neck" },
        },
        selection: "single",
        rule: { type: "interval", from: { string: 6, fret: 5 }, interval: "P5" },
        solution: [{ string: 5, fret: 7 }],
      }),
      exercise({
        id: "major-third-of-c",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the major third above this C.",
        hint: "A major third is 4 semitones above C. It's E.",
        board: {
          range: { start: 0, end: 7 },
          labels: "none",
          positions: [{ string: 5, fret: 3, role: "root", label: "C" }],
          layout: { mobile: "neck", desktop: "neck" },
        },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 3 }, interval: "M3" },
        solution: [{ string: 4, fret: 2 }],
      }),
    ]),
  ],
};
