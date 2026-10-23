import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, choice, drill, step, text } from "@/content/helpers";

export const whatIsAKey: Lesson = {
  id: "what-is-a-key",
  title: "What Is a Key?",
  summary: "A home note plus a scale. Key signatures and the circle of fifths tell you which notes belong.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Explain what it means for music to be in a key",
    "Read a key signature as the sharps or flats of a scale",
    "Use the circle of fifths to know how many sharps or flats a key has",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("home", "A home note and a scale", [
      text(`
        When a song is **in the key of G major**, two things are true: **G feels like home** (the tonic), and most of the notes come from the **G major scale**: G A B C D E F♯.

        The sharps or flats a key uses are its **key signature**. G major has one sharp (F♯), so in sheet music a single ♯ at the start of each line means "play every F as F♯".
      `),
      board(
        { scale: { root: "G", type: "major" }, region: { start: 2, end: 5 }, range: { start: 1, end: 6 }, labels: "note", layout: NECK },
        "The notes of G major in one position. The squares are G, the tonic.",
      ),
    ]),
    step("circle", "The circle of fifths", [
      text(`
        Keys are related in a neat chain. Start at C major (no sharps or flats) and keep moving **up a perfect fifth**: each new key adds **one sharp**.

        - **Sharps:** C (0) → G (1) → D (2) → A (3) → E (4) → B (5) → F♯ (6)

        Move **up a perfect fourth** instead (the same as down a fifth) and each key adds **one flat**:

        - **Flats:** C (0) → F (1) → B♭ (2) → E♭ (3) → A♭ (4) → D♭ (5) → G♭ (6)

        The new sharp is always the **7th degree** of the new key (G major adds F♯), and the new flat is always the **4th degree** (F major adds B♭).
      `),
      callout(
        "guitar",
        "On the guitar, a perfect fifth up is one string higher and two frets up. Trace the sharp keys from C on the A string: C, G, D, A, E… they climb the neck in the same shape.",
        "See the fifths",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "e-major-sharps",
        "How many sharps does E major have?",
        [
          ["4", "Four: F♯, C♯, G♯ and D♯"],
          ["3", "Three: F♯, C♯ and G♯", "That's A major. E is one more step round the circle, so one more sharp."],
          ["5", "Five", "Five sharps is B major."],
        ],
        "4",
      ),
      choice(
        "one-flat",
        "Which major key has exactly one flat?",
        [
          ["f", "F major (B♭)"],
          ["b-flat", "B♭ major", "B♭ major has two flats: B♭ and E♭."],
          ["d", "D major", "D major has two sharps, not flats."],
        ],
        "f",
      ),
      choice(
        "fifth-above-a",
        "Moving up a fifth from A major, which key comes next, and what does it add?",
        [
          ["e", "E major, adding D♯"],
          ["d", "D major, removing G♯", "D is a fifth *below* A. Up a fifth from A is E."],
          ["e-flat", "E major, adding E♯", "The new sharp is the 7th degree of the new key: in E major that's D♯."],
        ],
        "e",
      ),
      choice(
        "new-sharp-degree",
        "In each new sharp key, the added sharp is always which degree of that key's scale?",
        [
          ["7", "The 7th"],
          ["4", "The 4th", "The 4th degree is the one that gets *flattened* in the flat keys."],
          ["1", "The 1st (the tonic)", "G major adds F♯, not G♯. The new sharp is just below the tonic."],
        ],
        "7",
      ),
      drill(
        "key-degree-drill",
        "Name notes in different keys.",
        { type: "scale-degree", scale: "major", roots: ["C", "G", "D", "A", "E", "F", "Bb", "Eb"] },
        { rounds: 6, hint: "Use the circle: count the sharps or flats, then spell the scale." },
      ),
    ]),
  ],
};
