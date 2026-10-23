import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, exercise, step, text } from "@/content/helpers";

export const augmentedDiminished: Lesson = {
  id: "augmented-diminished",
  title: "Augmented, Diminished and the Tritone",
  summary: "Stretch or squeeze an interval by a half step and its name changes, even when the sound doesn't.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Define augmented and diminished intervals",
    "Name the tritone both ways",
    "Explain why one sound can have two interval names",
  ],
  prerequisites: ["major-minor-perfect"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("altered", "Wider and narrower", [
      text(`
        Two more qualities cover the remaining sizes:

        - **Augmented**: one half step **wider** than major or perfect (C to G♯ is an augmented 5th).
        - **Diminished**: one half step **narrower** than minor or perfect (C to G♭ is a diminished 5th).

        The six-half-step interval is called the **tritone**. Spelled C to F♯ it's an **augmented 4th**; spelled C to G♭ it's a **diminished 5th**. Same fret, same sound, different letter, so a different name.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root" },
          { note: "F#", role: "tone", label: "A4" },
        ],
        showDistances: true,
        caption: "C to F♯: a fourth by letters (C D E F), six half steps: an augmented fourth.",
      },
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root" },
          { note: "Gb", role: "tone", label: "d5" },
        ],
        showDistances: true,
        caption: "C to G♭: a fifth by letters (C D E F G), the same six half steps: a diminished fifth.",
      },
      callout(
        "note",
        "Why bother with two names? Because the letter tells you the *job* a note does. In a chord built on C, G♯ acts as a raised fifth, while A♭ acts as a sixth. You'll see this when you spell chords and scales.",
        "Names carry meaning",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "c-to-f-sharp",
        "Name the interval from C up to F♯.",
        [
          ["A4", "Augmented fourth"],
          ["d5", "Diminished fifth", "Same sound, but a fifth above C needs the letter G (C–G♭). F♯ uses F, so it's a fourth."],
          ["P4", "Perfect fourth", "C to F is the perfect fourth. F♯ is a half step wider."],
        ],
        "A4",
      ),
      choice(
        "c-to-g-sharp",
        "Name the interval from C up to G♯.",
        [
          ["A5", "Augmented fifth"],
          ["m6", "Minor sixth", "That sound is C to A♭. G♯ uses the letter G, five letters from C, so it's a fifth."],
          ["P5", "Perfect fifth", "C to G is perfect. G♯ is one half step wider: augmented."],
        ],
        "A5",
      ),
      choice(
        "b-to-f",
        "Name the interval from B up to F.",
        [
          ["d5", "Diminished fifth"],
          ["P5", "Perfect fifth", "A perfect fifth above B is F♯ (7 half steps). B to F is only 6."],
          ["A4", "Augmented fourth", "B C D E F is five letters, so it's a fifth, not a fourth."],
        ],
        "d5",
      ),
      choice(
        "d5-size",
        "How many half steps are in a diminished fifth?",
        [
          ["6", "6"],
          ["7", "7", "Seven is a perfect fifth. Diminished is one half step smaller."],
          ["5", "5", "Five is a perfect fourth."],
        ],
        "6",
      ),
      exercise({
        id: "tritone-above-c",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the **augmented fourth** (tritone) above this C.",
        hint: "Six half steps up. On the next string up, that's one fret higher than C.",
        explanation: "F♯: six half steps above C. On the D string it sits one fret above the C on the A string.",
        board: { range: { start: 0, end: 10 }, labels: "none", positions: [{ string: 5, fret: 3, role: "root", label: "C" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 3 }, interval: "A4" },
        solution: [{ string: 4, fret: 4 }],
      }),
    ]),
  ],
};
