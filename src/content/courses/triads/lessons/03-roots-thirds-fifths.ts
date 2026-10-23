import type { Lesson } from "@/lib/courses";
import { board, callout, choice, exercise, step, text } from "@/content/helpers";

export const rootsThirdsFifths: Lesson = {
  id: "roots-thirds-fifths",
  title: "Roots, Thirds and Fifths",
  summary: "The three jobs inside every triad, and how to spot them in a chord shape.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Explain what a triad is",
    "Identify the root, third and fifth of a triad",
    "Recognise that repeated notes don't change a chord's identity",
    "Find chord tones inside familiar open chord shapes",
  ],
  prerequisites: ["intervals"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("triads", "Stacking thirds", [
      text(`
        A **chord** is three or more notes sounding together. The most fundamental chord is the **triad**: three notes stacked in thirds.

        - The **root** names the chord. C major is built on C.
        - The **third** sits a third above the root.
        - The **fifth** sits a third above the third, which is a fifth above the root.

        In letters, a triad skips every other note: C (D) **E** (F) **G**.
      `),
      { type: "triad-stack", chord: { root: "C", quality: "major" }, caption: "C major: C, E and G, stacked in thirds." },
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root", label: "R" },
          { note: "E", role: "third", label: "3" },
          { note: "G", role: "fifth", label: "5" },
        ],
        caption: "The same three notes on the chromatic strip.",
      },
    ]),
    step("in-shapes", "Chord tones in a real shape", [
      text(`
        Guitar chords usually contain **more than three strings' worth of notes**, but still only three *different* notes. The open C chord plays C, E, G, C, E: the root and third are doubled an octave higher.

        Doubling notes doesn't change the chord. It's still a C major triad, just voiced across more strings.
      `),
      board(
        { chord: { root: "C", quality: "major", voicing: "x32010" }, range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } },
        "The open C chord. R = root (C), 3 = third (E), 5 = fifth (G). The × means the low E string isn't played.",
      ),
      callout("tip", "The colours stay the same throughout the course: **amber for roots**, **teal for thirds**, **violet for fifths**.", "Colour key"),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "tap-root-c",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap a root of this C major chord.",
        hint: "The root is the note the chord is named after. There are two of them; either one counts.",
        board: { chord: { root: "C", quality: "major", voicing: "x32010" }, range: { start: 0, end: 4 }, labels: "none", roles: false, layout: { mobile: "chord", desktop: "chord" } },
        selection: "single",
        selectableOnlyMarkers: true,
        rule: {
          type: "exact-positions",
          positions: [
            { string: 5, fret: 3 },
            { string: 2, fret: 1 },
          ],
          match: "any",
          context: { chord: { root: "C", quality: "major" } },
        },
        solution: [{ string: 5, fret: 3 }],
      }),
      choice(
        "third-of-c",
        "In a C major triad, which note is the third?",
        [
          ["d", "D", "D is only a second above C. Skip one letter: C (D) E."],
          ["e", "E"],
          ["f", "F", "F is a fourth above C (C D E F)."],
          ["g", "G", "G is the fifth of C major: five letter names up, C D E F G."],
        ],
        "e",
      ),
      choice(
        "fifth-of-a",
        "What is the perfect fifth above A?",
        [
          ["e", "E"],
          ["d", "D", "D is a perfect fourth above A (5 semitones)."],
          ["f", "F", "F is a minor sixth above A (8 semitones)."],
          ["e-flat", "E♭", "E♭ is only 6 semitones above A. A perfect fifth is 7."],
        ],
        "e",
        { explanation: "Count five letters, A B C D E, and check it's 7 semitones." },
      ),
      exercise({
        id: "tap-fifth-g",
        kind: "fretboard",
        task: "identify",
        prompt: "This is an open G major chord (G, B, D). Tap its fifth.",
        hint: "Count five letter names up from G: G A B C D.",
        explanation: "D is the fifth of G major, played here on the open D string.",
        board: { chord: { root: "G", quality: "major", voicing: "320003" }, range: { start: 0, end: 4 }, labels: "none", roles: false, layout: { mobile: "chord", desktop: "chord" } },
        selection: "single",
        selectableOnlyMarkers: true,
        rule: { type: "exact-positions", positions: [{ string: 4, fret: 0 }], context: { chord: { root: "G", quality: "major" } } },
        solution: [{ string: 4, fret: 0 }],
      }),
    ]),
  ],
};
