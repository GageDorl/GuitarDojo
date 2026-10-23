import type { Lesson } from "@/lib/courses";
import { NECK, choice, exercise, step, text } from "@/content/helpers";

export const addingTheSeventh: Lesson = {
  id: "adding-the-seventh",
  title: "Adding a Seventh",
  summary: "Stack one more third on a triad and you get a seventh chord. Which third decides its character.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Build a seventh chord by stacking a third on a triad",
    "Name the formulas of maj7, 7 and m7 chords",
    "Hear and explain the difference between a major and a minor seventh",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("stack", "Four notes, stacked in thirds", [
      text(`
        A triad is three notes stacked in thirds. Add **one more third** on top and you have a **seventh chord**: the new note is a seventh above the root.

        Three seventh chords cover most music:

        - **Major seventh (maj7):** R 3 5 **7**. Soft, dreamy.
        - **Dominant seventh (7):** R 3 5 **♭7**. Bluesy, restless: it wants to resolve.
        - **Minor seventh (m7):** R ♭3 5 **♭7**. Mellow, smooth.

        The names describe two things: the triad (major or minor) and the seventh (major 7 = 11 half steps, minor ♭7 = 10).
      `),
      { type: "triad-stack", chord: { root: "C", quality: "major7" }, caption: "Cmaj7: C E G B. A major triad plus a major seventh." },
      { type: "triad-stack", chord: { root: "C", quality: "dominant7" }, caption: "C7: C E G B♭. A major triad plus a minor seventh." },
      { type: "triad-stack", chord: { root: "C", quality: "minor7" }, caption: "Cm7: C E♭ G B♭. A minor triad plus a minor seventh." },
    ]),
    step("practice", "Practice", [
      choice(
        "cmaj7-notes",
        "Which notes make Cmaj7?",
        [
          ["cegb", "C E G B"],
          ["cegbb", "C E G B♭", "That's C7. Maj7 has a major seventh: B."],
          ["cebgbb", "C E♭ G B♭", "That's Cm7."],
        ],
        "cegb",
      ),
      choice(
        "g7-notes",
        "Which notes make G7?",
        [
          ["gbdf", "G B D F"],
          ["gbdf#", "G B D F♯", "F♯ is the major seventh: Gmaj7. A plain \"7\" means a minor seventh."],
          ["gbbdf", "G B♭ D F", "B♭ makes it minor: Gm7."],
        ],
        "gbdf",
      ),
      choice(
        "maj7-vs-7",
        "What's the only difference between Cmaj7 and C7?",
        [
          ["seventh", "The seventh: B in Cmaj7, B♭ in C7"],
          ["third", "The third", "Both have E, a major third. Only the seventh changes."],
          ["root", "The root", "Both are built on C."],
        ],
        "seventh",
      ),
      exercise({
        id: "seventh-above-g",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the **minor seventh** above this G: the note that turns G major into G7.",
        hint: "A minor seventh is 10 half steps, or two half steps below the octave.",
        explanation: "F: the ♭7 of G. Same fret on the D string is a quick way to find it from a low-E root.",
        board: { range: { start: 0, end: 10 }, labels: "none", positions: [{ string: 6, fret: 3, role: "root", label: "G" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 6, fret: 3 }, interval: "m7" },
        solution: [{ string: 4, fret: 3 }],
      }),
    ]),
  ],
};
