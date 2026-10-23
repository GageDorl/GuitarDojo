import type { Lesson } from "@/lib/courses";
import { BUILD, caged, choice, drill, exercise, rangeOf, shape, step, text } from "@/content/helpers";

const frame = (root: string, caption: string) => {
  const voicing = caged("D", root);
  return { caption, board: { chord: { root, quality: "major" as const, voicing }, range: rangeOf(voicing) } };
};

export const movingShapes: Lesson = {
  id: "moving-shapes",
  title: "Moving Any Shape",
  summary: "Slide a shape until its root lands on the note you want, and you've played that chord.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Move any CAGED shape to a new root",
    "Name a moved shape's chord from its root",
    "Play a chord with a chosen shape",
  ],
  prerequisites: ["five-open-shapes"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("slide", "Find the root, slide the shape", [
      text(`
        To play any major chord with any shape:

        - Find the chord's root on that shape's **root string**.
        - Slide the shape so its root lands there. Your first finger (or a barre) takes over the notes that were open strings.

        The chord is always named after the **note under the root**, not after the shape. An A shape with its root on D is a D chord.
      `),
      {
        type: "demo",
        title: "The D shape on the move",
        board: { labels: "interval", layout: { mobile: "chord", desktop: "chord" } },
        frames: [
          frame("D", "Open **D**: root on the open D string."),
          frame("E", "Slide up two frets: root on E (D string, fret 2). An **E major** chord."),
          frame("F", "One more fret: **F major**."),
          frame("G", "Root at D-string fret 5: **G major**. Same shape, four chords."),
        ],
      },
    ]),
    step("practice", "Practice", [
      choice(
        "a-shape-at-5",
        "You play the A shape with its root at fret 5 on the A string. Which chord is it?",
        [
          ["d", "D major"],
          ["a", "A major", "Chords are named after the root note, not the shape. A-string fret 5 is D."],
          ["e", "E major", "E is at A-string fret 7."],
        ],
        "d",
      ),
      choice(
        "c-shape-up-2",
        "Slide the open C shape up two frets. Which chord do you get?",
        [
          ["d", "D major"],
          ["c-sharp", "C♯ major", "Two frets is a whole step: C up a whole step is D."],
          ["e", "E major", "That would be four frets."],
        ],
        "d",
      ),
      exercise({
        id: "g-with-d-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play **G major** with the **D shape**.",
        hint: "The D shape's root is on the D string. Where is G on the D string?",
        board: { range: { start: 0, end: 12 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "exact-positions", positions: shape(caged("D", "G")), context: { chord: { root: "G", quality: "major" } } },
        solution: shape(caged("D", "G")),
      }),
      drill(
        "identify-shapes",
        "Which CAGED shape is it?",
        { type: "caged-identification", roots: ["C", "D", "E", "F", "G", "A"] },
        { rounds: 6, hint: "Look at the root string and the shape around the squares." },
      ),
    ]),
  ],
};
