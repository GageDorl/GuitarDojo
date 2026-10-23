import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, exercise, step, text } from "@/content/helpers";

export const intervalNumbers: Lesson = {
  id: "interval-numbers",
  title: "Interval Numbers: Counting Letters",
  summary: "Seconds, thirds, fifths: an interval's number comes from letter names.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Count an interval's number from letter names",
    "Explain why accidentals don't change the number",
    "Name unisons through octaves",
  ],
  prerequisites: ["measuring-distance"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("counting", "Count the letters", [
      text(`
        Musicians name intervals with a **number** and a **quality** ("major third", "perfect fifth"). The number is the easy part: **count the letter names from the lower note to the upper note, including both**.

        - C to D: C D, two letters, a **second**
        - C to E: C D E, a **third**
        - C to G: C D E F G, a **fifth**
        - C to the next C: eight letters, an **octave**

        The same letter twice (C to C) is a **unison**.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: ["C", "D", "E", "F", "G", "A", "B"].map((note, i) => ({
          note,
          role: i === 0 ? ("root" as const) : ("tone" as const),
          label: String(i + 1),
        })),
        caption: "Interval numbers above C, counted in letters. The next C (the 8th letter) is the octave.",
      },
      callout(
        "note",
        "Sharps and flats don't change the number. C to E and C to E♭ are both **thirds**, because both use the letters C–D–E. Their *quality* differs, which is the next lesson.",
        "Accidentals don't count",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "c-to-a",
        "What is the interval number from C up to A?",
        [
          ["6", "A sixth"],
          ["5", "A fifth", "Count every letter, including both ends: C D E F G A."],
          ["7", "A seventh", "C to B would be a seventh. C to A is one letter less."],
        ],
        "6",
      ),
      choice(
        "d-to-f-sharp",
        "D up to F♯ is what number?",
        [
          ["3", "A third"],
          ["4", "A fourth", "The sharp doesn't add a letter. D E F is three letters."],
          ["2", "A second", "D to E is a second. F♯ is one letter further."],
        ],
        "3",
      ),
      choice(
        "g-to-f",
        "G up to F is what number?",
        [
          ["7", "A seventh"],
          ["2", "A second", "Going *up* from G: G A B C D E F, seven letters. G *down* to F would be a second."],
          ["6", "A sixth", "Count again: G A B C D E F."],
        ],
        "7",
      ),
      choice(
        "b-to-d",
        "B up to D is what number?",
        [
          ["3", "A third"],
          ["2", "A second", "B C D is three letter names."],
          ["4", "A fourth", "B C D E would be a fourth."],
        ],
        "3",
      ),
      exercise({
        id: "fourth-above-c",
        kind: "fretboard",
        task: "locate",
        prompt: "Count four letters up from this C (C D E **F**) and find that note on a higher string.",
        hint: "F is one fret above E. The D string has E at fret 2.",
        explanation: "F is a fourth above C. On the next string up it's at the same fret: a pattern you'll use constantly.",
        board: {
          range: { start: 0, end: 9 },
          labels: "none",
          strings: [4, 3, 2, 1],
          positions: [{ string: 5, fret: 3, role: "root", label: "C" }],
          layout: NECK,
        },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 3 }, interval: "P4", octave: "any-octave" },
        solution: [{ string: 4, fret: 3 }],
      }),
    ]),
  ],
};
