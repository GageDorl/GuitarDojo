import type { Lesson } from "@/lib/courses";
import { board, callout, exercise, shape, step, text } from "@/content/helpers";

const C_MAJOR = { root: "C", quality: "major" } as const;

export const triadsOnTheFretboard: Lesson = {
  id: "triads-on-the-fretboard",
  title: "Triads Across the Fretboard",
  summary: "One chord, many voicings: find triads anywhere on the neck and meet inversions.",
  kind: "lesson",
  estimatedMinutes: 14,
  objectives: [
    "See every root, third and fifth of a chord across the neck",
    "Understand that different voicings are the same chord",
    "Play compact triads on the top three strings",
    "Name root position, first inversion and second inversion",
  ],
  prerequisites: ["minor-triads"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("everywhere", "The same chord, everywhere", [
      text(`
        Because the guitar repeats notes across its strings, every chord tone appears in several places. Any combination of the root, third and fifth is a **voicing** of that chord.

        Here is every C, E and G in the first twelve frets. Any playable group of these notes is a C major chord.
      `),
      board(
        { chord: C_MAJOR, range: { start: 0, end: 12 }, labels: "interval", layout: { mobile: "neck", desktop: "neck" } },
        "Every C major chord tone up to fret 12. Swipe or use the arrows to move along the neck on small screens.",
      ),
      {
        type: "compare",
        items: [
          { title: "Open position", board: { chord: { ...C_MAJOR, voicing: "x32010" }, range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } } },
          { title: "3rd position", board: { chord: { ...C_MAJOR, voicing: "x35553" }, range: { start: 2, end: 6 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } } },
          { title: "8th position", board: { chord: { ...C_MAJOR, voicing: "8.10.10.9.8.8" }, range: { start: 7, end: 11 }, labels: "interval", layout: { mobile: "chord", desktop: "chord" } } },
        ],
        caption: "Three voicings of C major. Different shapes and registers, same three notes.",
      },
    ]),
    step("inversions", "Small shapes and inversions", [
      text(`
        You don't need six strings to play a triad. Three adjacent strings are enough, and the top three (G, B and high E) give bright, compact shapes.

        On three strings, the order of the notes matters. The **lowest note** decides the triad's *inversion*:

        - **Root position**: the root is lowest (C–E–G)
        - **First inversion**: the third is lowest (E–G–C)
        - **Second inversion**: the fifth is lowest (G–C–E)

        The chord is still C major in every case. Inversions just change its colour and let you move smoothly between chords.
      `),
      {
        type: "demo",
        title: "C major on strings 3, 2 and 1",
        board: { range: { start: 0, end: 10 }, labels: "interval", layout: { mobile: "neck", desktop: "neck" } },
        frames: [
          { caption: "Second inversion: G (the fifth) is lowest, using the open G string.", board: { chord: { ...C_MAJOR, voicing: "xxx010" } } },
          { caption: "Root position: C on the G string, fret 5, is lowest.", board: { chord: { ...C_MAJOR, voicing: "xxx553" } } },
          { caption: "First inversion: E (the third) is lowest, at fret 9.", board: { chord: { ...C_MAJOR, voicing: "xxx988" } } },
        ],
      },
      callout(
        "tip",
        "Moving up the neck, the three shapes cycle: second inversion, root position, first inversion, then second inversion again an octave higher.",
        "The cycle",
      ),
    ]),
    step("practice", "Practice", [
      exercise({
        id: "a-minor-top-strings",
        kind: "fretboard",
        task: "construct",
        prompt: "Build an A minor triad (A, C, E) using only strings 1, 2 and 3.",
        hint: "Fret 5 is a good place to look: the G string gives C, the B string gives E and the high E string gives A.",
        board: { range: { start: 0, end: 12 }, labels: "none", strings: [1, 2, 3], layout: { mobile: "neck", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "A", quality: "minor" }, strings: [1, 2, 3] },
        solution: shape("xxx555"),
      }),
      exercise({
        id: "c-first-inversion",
        kind: "fretboard",
        task: "construct",
        prompt: "Build C major in first inversion: the third (E) must be the lowest note.",
        hint: "On the top three strings, try E on the G string at fret 9.",
        explanation: "With E in the bass, the C major triad is in first inversion.",
        board: { range: { start: 0, end: 12 }, labels: "none", layout: { mobile: "neck", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: C_MAJOR, inversion: "first-inversion" },
        solution: shape("xxx988"),
      }),
      exercise({
        id: "a-minor-tones-5-8",
        kind: "fretboard",
        task: "locate",
        prompt: "Select every A minor chord tone (A, C and E) between frets 5 and 8.",
        hint: "There are eight in total. Both E strings have A at fret 5 and C at fret 8.",
        board: { range: { start: 3, end: 10 }, region: { start: 5, end: 8 }, labels: "none", layout: { mobile: "neck", desktop: "neck" } },
        selection: "multi",
        rule: { type: "pitch-classes", notes: ["A", "C", "E"], region: { range: { start: 5, end: 8 } }, match: "all" },
        solution: [
          { string: 6, fret: 5 },
          { string: 6, fret: 8 },
          { string: 5, fret: 7 },
          { string: 4, fret: 7 },
          { string: 3, fret: 5 },
          { string: 2, fret: 5 },
          { string: 1, fret: 5 },
          { string: 1, fret: 8 },
        ],
      }),
      exercise({
        id: "find-a3",
        kind: "fretboard",
        task: "locate",
        prompt: "Find A3: the A one octave above the open A string.",
        hint: "Counting 12 frets up the A string works, but there are closer options on the D and G strings.",
        explanation: "A3 appears in three places in the first 12 frets: the A string at fret 12, the D string at fret 7 and the G string at fret 2.",
        board: { range: { start: 0, end: 12 }, labels: "none", layout: { mobile: "neck", desktop: "neck" } },
        selection: "single",
        rule: { type: "pitches", pitches: ["A3"] },
        solution: [{ string: 4, fret: 7 }],
      }),
    ]),
  ],
};
