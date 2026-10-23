import type { Lesson } from "@/lib/courses";
import { NECK, callout, choice, exercise, scaleAlongString, step, text } from "@/content/helpers";

export const fiveNoteScales: Lesson = {
  id: "five-note-scales",
  title: "Five-Note Scales",
  summary: "Take two notes out of a major or minor scale and you get the guitarist's favourite scale.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Build major and minor pentatonic scales from their parent scales",
    "Give both pentatonic formulas",
    "Explain why pentatonic scales sound so forgiving",
  ],
  prerequisites: [],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("build", "Two notes fewer", [
      text(`
        *Penta* means five. A **pentatonic scale** has five notes per octave instead of seven.

        - **Major pentatonic** = the major scale **without its 4th and 7th**: **1 2 3 5 6**. C major pentatonic is C D E G A.
        - **Minor pentatonic** = the natural minor scale **without its 2nd and ♭6th**: **1 ♭3 4 5 ♭7**. A minor pentatonic is A C D E G.

        The removed notes are exactly the ones that form **half steps** in the parent scale. With no half steps, any pentatonic note sounds good against the others. That's why it's the go-to scale for riffs and solos.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: ["C", "D", "E", "G", "A", "C"].map((note, i) => ({ note, role: i === 0 || i === 5 ? ("root" as const) : ("tone" as const) })),
        showDistances: true,
        caption: "C major pentatonic: whole steps and minor thirds (2 2 3 2 3). No half steps.",
      },
      {
        type: "chromatic",
        start: "A",
        highlight: ["A", "C", "D", "E", "G", "A"].map((note, i) => ({ note, role: i === 0 || i === 5 ? ("root" as const) : ("tone" as const) })),
        showDistances: true,
        caption: "A minor pentatonic: 3 2 2 3 2.",
      },
      callout("guitar", "Play A minor pentatonic up the low E string: open E, then frets 3, 5, 8, 10, 12. You've probably heard this sound in a hundred songs.", "Hear it"),
    ]),
    step("practice", "Practice", [
      choice(
        "removed-from-major",
        "Which degrees does major pentatonic leave out of the major scale?",
        [
          ["4-7", "The 4th and 7th"],
          ["2-6", "The 2nd and 6th", "Those are kept: 1 2 3 5 6. The 4th and 7th go, removing both half steps."],
          ["3-7", "The 3rd and 7th", "The 3rd stays; it's what makes it *major* pentatonic."],
        ],
        "4-7",
      ),
      choice(
        "spell-a-minor-pent",
        "Which notes are in A minor pentatonic?",
        [
          ["acdeg", "A C D E G"],
          ["abcde", "A B C D E", "Minor pentatonic skips the 2nd (B): 1 ♭3 4 5 ♭7."],
          ["acdef", "A C D E F", "F is the ♭6th, which minor pentatonic leaves out. The ♭7 (G) stays."],
        ],
        "acdeg",
      ),
      choice(
        "spell-g-major-pent",
        "Which notes are in G major pentatonic?",
        [
          ["gabde", "G A B D E"],
          ["gabcd", "G A B C D", "C is the 4th of G major, which major pentatonic leaves out."],
          ["gbbcd", "G B♭ C D F", "That's G *minor* pentatonic."],
        ],
        "gabde",
      ),
      exercise({
        id: "a-minor-pent-low-e",
        kind: "fretboard",
        task: "construct",
        prompt: "Select every note of **A minor pentatonic** on the low E string (open to fret 11).",
        hint: "A C D E G. The open E string is one of them.",
        board: { range: { start: 0, end: 11 }, labels: "none", strings: [6], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "A", type: "minor-pentatonic" }, region: { range: { start: 0, end: 11 }, strings: [6] } },
        solution: scaleAlongString("A", "minor-pentatonic", 6),
      }),
    ]),
  ],
};
