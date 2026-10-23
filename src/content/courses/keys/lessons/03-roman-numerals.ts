import type { Lesson } from "@/lib/courses";
import { BUILD, NECK, board, choice, drill, exercise, shape, step, text } from "@/content/helpers";

export const romanNumerals: Lesson = {
  id: "roman-numerals",
  title: "Roman Numerals: Chords by Number",
  summary: "Name chords by their place in the key, and every progression works in every key.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Read Roman numerals: uppercase major, lowercase minor, ° diminished",
    "Translate numerals into chords in any key",
    "Translate chords into numerals",
  ],
  prerequisites: ["diatonic-triads"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("numbers", "Numbers instead of names", [
      text(`
        Musicians name the chords of a key with **Roman numerals** for their scale degree:

        **I – ii – iii – IV – V – vi – vii°**

        - **Uppercase** = major, **lowercase** = minor, **°** = diminished.
        - "I–IV–V" means the chords on degrees 1, 4 and 5, **in any key**: C–F–G in C major, G–C–D in G major, A–D–E in A major.

        This is how session players change key on the spot: learn the progression as numbers, then play it from any root.
      `),
      board(
        {
          range: { start: 0, end: 7 },
          labels: "none",
          positions: [
            { string: 6, fret: 3, role: "root", label: "I" },
            { string: 5, fret: 3, role: "tone", label: "IV" },
            { string: 5, fret: 5, role: "tone", label: "V" },
          ],
          layout: NECK,
        },
        "In G major the roots of I (G), IV (C) and V (D) sit close together: the IV is straight across on the next string, the V two frets higher.",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "v-in-d",
        "What is the V chord in D major?",
        [
          ["a", "A major"],
          ["g", "G major", "G is the IV chord in D. Count five scale notes: D E F♯ G A."],
          ["a-minor", "A minor", "Uppercase V means major: A major."],
        ],
        "a",
      ),
      choice(
        "a-minor-in-c",
        "In C major, A minor is which chord?",
        [
          ["vi", "vi"],
          ["VI", "VI", "Uppercase would mean major. A minor is lowercase vi."],
          ["iv", "iv", "Degree 4 of C major is F."],
        ],
        "vi",
      ),
      exercise({
        id: "build-iv-in-g",
        kind: "fretboard",
        task: "construct",
        prompt: "Build the **IV** chord in G major.",
        hint: "Count up the G major scale to degree 4: G A B **C**.",
        explanation: "IV in G is C major.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "C", quality: "major" } },
        solution: shape("x32010"),
      }),
      drill(
        "numeral-drill",
        "Name the numeral of chords in different keys.",
        { type: "diatonic-chord", keys: ["C", "G", "D", "A", "F", "Bb"], scale: "major", ask: "numeral" },
        { rounds: 8 },
      ),
    ]),
  ],
};
