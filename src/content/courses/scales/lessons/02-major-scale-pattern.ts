import type { Lesson } from "@/lib/courses";
import { NECK, buildUp, callout, choice, exercise, scaleAlongString, step, text } from "@/content/helpers";

export const majorScalePattern: Lesson = {
  id: "major-scale-pattern",
  title: "The Major Scale Pattern",
  summary: "Whole, whole, half, whole, whole, whole, half: the recipe behind every major scale.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "State the major scale's step pattern",
    "Build a major scale along a single string",
    "Explain why some keys need sharps",
  ],
  prerequisites: ["what-is-a-scale"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("pattern", "The recipe", [
      text(`
        Every major scale follows the same pattern of steps from the tonic:

        **W – W – H – W – W – W – H**

        (W = whole step, 2 frets; H = half step, 1 fret.) C major happens to fit the natural notes exactly, because its two half steps land on E–F and B–C.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: ["C", "D", "E", "F", "G", "A", "B", "C"].map((note, i) => ({ note, role: i === 0 || i === 7 ? ("root" as const) : ("tone" as const) })),
        showDistances: true,
        caption: "C major: 2 2 1 2 2 2 1.",
      },
    ]),
    step("on-a-string", "Building G major on one string", [
      text("A single string is the clearest way to see the pattern: whole steps are 2 frets, half steps are 1."),
      {
        type: "demo",
        title: "G major up the G string",
        board: { range: { start: 0, end: 12 }, root: "G", labels: "note", strings: [3], layout: NECK },
        frames: buildUp([
          { at: { string: 3, fret: 0 }, caption: "Start on the tonic: the open G string." },
          { at: { string: 3, fret: 2, role: "tone" }, caption: "**Whole** step: A." },
          { at: { string: 3, fret: 4, role: "tone" }, caption: "**Whole** step: B." },
          { at: { string: 3, fret: 5, role: "tone" }, caption: "**Half** step: C." },
          { at: { string: 3, fret: 7, role: "tone" }, caption: "**Whole** step: D." },
          { at: { string: 3, fret: 9, role: "tone" }, caption: "**Whole** step: E." },
          { at: { string: 3, fret: 11, role: "tone", label: "F♯" }, caption: "**Whole** step from E lands on **F♯**, not F. The pattern decides the sharps." },
          { at: { string: 3, fret: 12 }, caption: "**Half** step back home to G, an octave higher." },
        ]),
      },
      callout("tip", "Each letter appears **exactly once**. G major needs F♯ (not G♭) because F is the only letter left between E and G.", "One letter each"),
    ]),
    step("practice", "Practice", [
      choice(
        "major-pattern",
        "Which step pattern makes a major scale?",
        [
          ["wwhwwwh", "W W H W W W H"],
          ["whwwhww", "W H W W H W W", "That's the natural minor pattern, coming up later in this course."],
          ["wwwhwwh", "W W W H W W H", "The first half step comes after two whole steps, not three."],
        ],
        "wwhwwwh",
      ),
      choice(
        "d-third",
        "Following the pattern from D, what's the 3rd note?",
        [
          ["f-sharp", "F♯"],
          ["f", "F", "D to E is a whole step, and E to the next note must be a whole step too: F♯."],
          ["g-flat", "G♭", "Same fret, but the 3rd note must use the letter F (D E F)."],
        ],
        "f-sharp",
      ),
      exercise({
        id: "c-major-a-string",
        kind: "fretboard",
        task: "construct",
        prompt: "Select every note of **C major** on the A string, from the open string to fret 11.",
        hint: "C major uses only natural notes.",
        board: { range: { start: 0, end: 11 }, labels: "none", strings: [5], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "C", type: "major" }, region: { range: { start: 0, end: 11 }, strings: [5] } },
        solution: scaleAlongString("C", "major", 5),
      }),
      exercise({
        id: "g-major-g-string",
        kind: "fretboard",
        task: "construct",
        prompt: "Now build **G major** along the G string (open to fret 11), without the demo.",
        hint: "W W H W W W H from the open string.",
        board: { range: { start: 0, end: 11 }, labels: "none", strings: [3], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "G", type: "major" }, region: { range: { start: 0, end: 11 }, strings: [3] } },
        solution: scaleAlongString("G", "major", 3),
      }),
    ]),
  ],
};
