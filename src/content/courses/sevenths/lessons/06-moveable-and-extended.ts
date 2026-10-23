import type { Lesson } from "@/lib/courses";
import { BUILD, NECK, board, choice, drill, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

export const moveableAndExtended: Lesson = {
  id: "moveable-and-extended",
  title: "Moveable Sevenths and Extended Chords",
  summary: "Barre shapes for every seventh chord, and a first look at 9ths, 11ths and 13ths.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Play E-shape and A-shape seventh barre chords",
    "Explain what a 9th, 11th and 13th are",
    "Know which notes guitarists leave out of big chords",
  ],
  prerequisites: ["sevenths-in-a-key"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("barres", "Seventh barre chords", [
      text(`
        The E and A barre shapes have seventh versions you can move anywhere: root on the low E string or the A string, as before.
      `),
      {
        type: "compare",
        items: [
          { title: "F7", board: voicingBoard({ root: "F", quality: "dominant7" }, "131211") },
          { title: "Fm7", board: voicingBoard({ root: "F", quality: "minor7" }, "131111") },
          { title: "Fmaj7", board: voicingBoard({ root: "F", quality: "major7" }, "1x221x") },
        ],
        caption: "E-shape sevenths at fret 1 (root on the low E string).",
      },
      {
        type: "compare",
        items: [
          { title: "B♭7", board: voicingBoard({ root: "Bb", quality: "dominant7" }, "x13131") },
          { title: "B♭m7", board: voicingBoard({ root: "Bb", quality: "minor7" }, "x13121") },
          { title: "B♭maj7", board: voicingBoard({ root: "Bb", quality: "major7" }, "x13231") },
        ],
        caption: "A-shape sevenths at fret 1 (root on the A string).",
      },
    ]),
    step("extensions", "Beyond the seventh", [
      text(`
        Keep stacking thirds past the seventh and the notes wrap past the octave:

        - **9th** = the 2nd, an octave up (in C: D)
        - **11th** = the 4th, an octave up (F)
        - **13th** = the 6th, an octave up (A)

        A **C9** is C E G B♭ D. That's five notes, and a 13th chord would have seven, so guitarists **leave notes out**. The **5th** goes first (it adds little colour), then often the root (the bass player has it). The 3rd and 7th stay: they define the chord's quality.
      `),
      board(
        {
          range: { start: 0, end: 5 },
          labels: "none",
          positions: [
            { string: 5, fret: 3, role: "root", label: "R" },
            { string: 4, fret: 2, role: "third", label: "3" },
            { string: 3, fret: 3, role: "seventh", label: "♭7" },
            { string: 2, fret: 3, role: "tone", label: "9" },
            { string: 1, fret: 3, role: "fifth", label: "5" },
          ],
          layout: NECK,
        },
        "C9: root, 3rd, ♭7 and 9th, with the 5th on top (G). Many players drop that top note.",
      ),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "f7-e-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **F7** with the E-shape barre at fret 1.",
        hint: "Like an F barre chord, but lift the finger on the D string so the barre plays E♭ there.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape("131211"), context: { chord: { root: "F", quality: "dominant7" } } },
        solution: shape("131211"),
      }),
      choice(
        "ninth-of-c",
        "What is the 9th of C?",
        [
          ["d", "D"],
          ["e", "E", "E is the 3rd (or 10th). The 9th is the 2nd an octave up."],
          ["a", "A", "A is the 13th (the 6th an octave up)."],
        ],
        "d",
      ),
      choice(
        "drop-which",
        "In a G9 chord (G B D F A) on guitar, which note is usually the first to leave out?",
        [
          ["d", "D, the 5th"],
          ["b", "B, the 3rd", "The 3rd decides major or minor; keep it."],
          ["f", "F, the ♭7", "The ♭7 makes it a dominant chord; keep it."],
        ],
        "d",
      ),
      drill(
        "moveable-sevenths-drill",
        "Build seventh chords away from the nut.",
        { type: "chord-construction", roots: ["F", "G", "A", "B", "C", "D"], qualities: ["dominant7", "minor7", "major7"], range: { start: 1, end: 10 } },
        { rounds: 5, hint: "Pick an E-shape or A-shape seventh barre, then place its root." },
      ),
    ]),
  ],
};
