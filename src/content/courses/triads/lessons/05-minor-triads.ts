import type { Lesson } from "@/lib/courses";
import { callout, choice, exercise, shape, step, text } from "@/content/helpers";

export const minorTriads: Lesson = {
  id: "minor-triads",
  title: "Minor Triads",
  summary: "Lower one note by a semitone and the whole mood changes.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "State the minor triad formula: root, minor third, perfect fifth",
    "Explain the one-note difference between major and minor",
    "Convert major shapes to minor on the fretboard",
    "Tell major and minor triads apart by their thirds",
  ],
  prerequisites: ["major-triads"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("formula", "One note changes everything", [
      text(`
        A **minor triad** is a root, a **minor third** (3 semitones) and a **perfect fifth** (7 semitones).

        Compare it with major: the root and fifth are identical. **Only the third changes**, lowered by one semitone. In formula terms: **1 – ♭3 – 5**.

        The stack flips too: a minor third on the bottom, then a major third on top. 3 + 4 = 7.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root", label: "R" },
          { note: "Eb", role: "third", label: "♭3" },
          { note: "G", role: "fifth", label: "5" },
        ],
        showDistances: true,
        caption: "C minor: C → E♭ is 3 semitones, E♭ → G is 4.",
      },
      { type: "triad-stack", chord: { root: "A", quality: "minor" }, caption: "A minor: A, C, E." },
    ]),
    step("compare", "Major vs minor on the guitar", [
      {
        type: "compare",
        items: [
          { title: "E major", board: { chord: { root: "E", quality: "major", voicing: "022100" }, range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } }, note: "Third: G♯" },
          { title: "E minor", board: { chord: { root: "E", quality: "minor", voicing: "022000" }, range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } }, note: "Third: G" },
        ],
        caption: "The only difference: G♯ (fret 1 on the G string) becomes the open G.",
      },
      {
        type: "compare",
        items: [
          { title: "A major", board: { chord: { root: "A", quality: "major", voicing: "x02220" }, range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } }, note: "Third: C♯" },
          { title: "A minor", board: { chord: { root: "A", quality: "minor", voicing: "x02210" }, range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } }, note: "Third: C" },
        ],
        caption: "Same idea: C♯ on the B string drops one fret to C.",
      },
      callout("guitar", "Strum E, then Em, back and forth. Only one finger moves, yet the mood shifts from bright to dark. That's the third at work.", "Hear the difference"),
    ]),
    step("practice", "Practice", [
      choice(
        "am-major-or-minor",
        "Is this a major or minor triad?",
        [
          ["minor", "Minor"],
          ["major", "Major", "Look at the third: A up to C is 3 semitones, a minor third. Major would need C♯."],
        ],
        "minor",
        { board: { chord: { root: "A", quality: "minor", voicing: "x02210" }, range: { start: 0, end: 4 }, labels: "note", layout: { mobile: "chord", desktop: "chord" } } },
      ),
      choice(
        "g-major-or-minor",
        "Is this a major or minor triad?",
        [
          ["major", "Major"],
          ["minor", "Minor", "The notes are G, B and D. G up to B is 4 semitones, a major third. G minor would use B♭."],
        ],
        "major",
        { board: { chord: { root: "G", quality: "major", voicing: "320003" }, range: { start: 0, end: 4 }, labels: "note", layout: { mobile: "chord", desktop: "chord" } } },
      ),
      exercise({
        id: "e-to-em",
        kind: "fretboard",
        task: "construct",
        prompt: "This is E major. Change one note to turn it into E minor.",
        hint: "Find the third (G♯) and lower it by one semitone.",
        explanation: "Lowering the third from G♯ to G is all it takes.",
        board: { range: { start: 0, end: 4 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        initialSelection: shape("022100"),
        rule: { type: "chord", chord: { root: "E", quality: "minor" } },
        solution: shape("022000"),
      }),
      exercise({
        id: "build-a-minor",
        kind: "fretboard",
        task: "construct",
        prompt: "Build an A minor chord (A, C, E).",
        hint: "Start from the open A string. C is fret 1 on the B string.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "A", quality: "minor" } },
        solution: shape("x02210"),
      }),
      choice(
        "third-of-d-minor",
        "What is the third of D minor?",
        [
          ["f", "F"],
          ["f-sharp", "F♯", "F♯ is the major third. That's D major."],
          ["e-sharp", "E♯", "E♯ sounds like F, but a third above D must use the letter F (D E F)."],
          ["g", "G", "G is a perfect fourth above D, not a third."],
        ],
        "f",
      ),
    ]),
  ],
};
