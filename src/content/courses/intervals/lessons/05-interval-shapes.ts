import type { Lesson } from "@/lib/courses";
import { NECK, callout, drill, exercise, step, text } from "@/content/helpers";

const ROOT_A = { string: 6, fret: 5 };

const intervalTask = (id: string, prompt: string, from: { string: number; fret: number }, label: string, interval: string, solution: { string: number; fret: number }, hint: string) =>
  exercise({
    id,
    kind: "fretboard",
    task: "locate",
    prompt,
    hint,
    board: { range: { start: 0, end: 10 }, labels: "none", positions: [{ ...from, role: "root", label }], layout: NECK },
    selection: "single",
    rule: { type: "interval", from, interval },
    solution: [solution],
  });

export const intervalShapes: Lesson = {
  id: "interval-shapes",
  title: "Interval Shapes Across Strings",
  summary: "Every interval has a shape you can see and reach without counting.",
  kind: "lesson",
  estimatedMinutes: 12,
  objectives: [
    "Play thirds, fourths, fifths and octaves as shapes across two strings",
    "Adjust shapes that cross between the G and B strings",
    "Find intervals from any root without counting frets",
  ],
  prerequisites: ["augmented-diminished"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("shapes", "Shapes from the bass strings", [
      text(`
        Because neighbouring strings are a perfect 4th apart, intervals form **fixed shapes**. From a root on the low E or A string, to the **next string up**:

        - **Perfect 4th**: same fret
        - **Major 3rd**: one fret back
        - **Minor 3rd**: two frets back
        - **Perfect 5th**: two frets forward
        - **Octave**: two strings up, two frets forward

        Learn the shape and you can play the interval from any root.
      `),
      {
        type: "demo",
        title: "Interval shapes from A",
        board: { range: { start: 2, end: 9 }, root: "A", labels: "interval", layout: NECK },
        frames: [
          { caption: "Our root: A, low E string, fret 5.", board: { positions: [ROOT_A] } },
          { caption: "**Perfect 4th** (D): next string, same fret.", board: { positions: [ROOT_A, { string: 5, fret: 5, role: "tone" }] } },
          { caption: "**Major 3rd** (C♯): next string, one fret back.", board: { positions: [ROOT_A, { string: 5, fret: 4, role: "third" }] } },
          { caption: "**Minor 3rd** (C): next string, two frets back.", board: { positions: [ROOT_A, { string: 5, fret: 3, role: "third" }] } },
          { caption: "**Perfect 5th** (E): next string, two frets forward.", board: { positions: [ROOT_A, { string: 5, fret: 7, role: "fifth" }] } },
          { caption: "**Octave** (A): two strings up, two frets forward.", board: { positions: [ROOT_A, { string: 4, fret: 7, role: "root" }] } },
        ],
      },
    ]),
    step("b-string", "The B-string shift", [
      text(`
        The G and B strings are only a major 3rd apart, one fret less than the others. So when a shape **crosses from the G string to the B string**, move the upper note **one fret forward**:

        - Major 3rd: same fret (instead of one back)
        - Perfect 4th: one fret forward (instead of same fret)
        - Perfect 5th: three frets forward (instead of two)
      `),
      {
        type: "demo",
        title: "Shapes from A on the G string",
        board: { range: { start: 0, end: 7 }, root: "A", labels: "interval", layout: NECK },
        frames: [
          { caption: "Root: A on the G string, fret 2.", board: { positions: [{ string: 3, fret: 2 }] } },
          { caption: "**Major 3rd** (C♯) on the B string: the *same* fret.", board: { positions: [{ string: 3, fret: 2 }, { string: 2, fret: 2, role: "third" }] } },
          { caption: "**Perfect 4th** (D): one fret forward.", board: { positions: [{ string: 3, fret: 2 }, { string: 2, fret: 3, role: "tone" }] } },
          { caption: "**Perfect 5th** (E): three frets forward.", board: { positions: [{ string: 3, fret: 2 }, { string: 2, fret: 5, role: "fifth" }] } },
        ],
      },
      callout("tip", "If a shape sounds one fret off, check whether it crosses the G–B pair.", "Quick check"),
    ]),
    step("practice", "Practice", [
      intervalTask("p4-above-d", "Find the **perfect 4th** above this D.", { string: 5, fret: 5 }, "D", "P4", { string: 4, fret: 5 }, "Next string up, same fret."),
      intervalTask("m3-above-g", "Find the **minor 3rd** above this G.", { string: 6, fret: 3 }, "G", "m3", { string: 5, fret: 1 }, "Next string up, two frets back."),
      intervalTask("p5-above-e", "Find the **perfect 5th** above this E.", { string: 4, fret: 2 }, "E", "P5", { string: 3, fret: 4 }, "Next string up, two frets forward."),
      intervalTask(
        "maj3-above-a-g-string",
        "Find the **major 3rd** above this A on the G string, using the B string.",
        { string: 3, fret: 2 },
        "A",
        "M3",
        { string: 2, fret: 2 },
        "Crossing to the B string: the major 3rd is at the same fret.",
      ),
      drill(
        "interval-shape-drill",
        "Play intervals from any root.",
        { type: "interval-construction", intervals: ["m3", "M3", "P4", "P5", "P8"], rootStrings: [6, 5, 4, 3], rootRange: { start: 0, end: 7 }, boardRange: { start: 0, end: 12 } },
        { rounds: 8, hint: "Use the shapes. Remember to shift one fret when crossing from G to B." },
      ),
    ]),
  ],
};
