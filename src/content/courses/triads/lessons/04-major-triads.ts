import type { Lesson } from "@/lib/courses";
import { callout, choice, exercise, shape, step, text } from "@/content/helpers";

const C_MAJOR = { root: "C", quality: "major" } as const;

export const majorTriads: Lesson = {
  id: "major-triads",
  title: "Building Major Triads",
  summary: "The major triad formula, correct spelling, and your first chord builds.",
  kind: "lesson",
  estimatedMinutes: 12,
  objectives: [
    "State the major triad formula: root, major third, perfect fifth",
    "Spell major triads with the correct note names",
    "Build major chords on the fretboard",
    "Recognise a major chord from its notes",
  ],
  prerequisites: ["roots-thirds-fifths"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("formula", "The major formula", [
      text(`
        A **major triad** is a root, a **major third** (4 semitones above the root) and a **perfect fifth** (7 semitones above the root).

        Seen as a stack: a major third on the bottom, then a minor third (3 semitones) on top. 4 + 3 = 7.
      `),
      {
        type: "chromatic",
        start: "C",
        highlight: [
          { note: "C", role: "root", label: "R" },
          { note: "E", role: "third", label: "3" },
          { note: "G", role: "fifth", label: "5" },
        ],
        showDistances: true,
        caption: "C → E is 4 semitones; E → G is 3 more.",
      },
      callout("tip", "Major triad = **1 – 3 – 5**: root, major third, perfect fifth.", "Formula"),
    ]),
    step("spelling", "Spelling matters", [
      text(`
        Let's build **A major**. Four semitones above A is the note between C and D. Is it C♯ or D♭?

        The third must be a *third*: three letter names up from A (A B **C**). So the answer is **C♯**. The fifth is E (A B C D **E**, 7 semitones).

        A useful habit: **triads always use every other letter.** Get the letters first, then add sharps or flats until the semitone counts are right.
      `),
      { type: "triad-stack", chord: { root: "A", quality: "major" }, caption: "A major: A, C♯, E. Never A, D♭, E." },
      text(`
        A few more to check against the formula:

        - **G major**: G – B – D
        - **D major**: D – F♯ – A
        - **E major**: E – G♯ – B
        - **F major**: F – A – C
      `),
    ]),
    step("watch", "Watch a chord take shape", [
      {
        type: "demo",
        title: "Building the open C chord",
        board: { range: { start: 0, end: 4 }, labels: "interval", layout: { mobile: "chord", desktop: "neck" } },
        frames: [
          { caption: "Start with the root: C on the A string, fret 3.", board: { chord: { ...C_MAJOR, voicing: "x3xxxx" } } },
          { caption: "Add the major third: E on the D string, fret 2.", board: { chord: { ...C_MAJOR, voicing: "x32xxx" } } },
          { caption: "Add the fifth: the open G string.", board: { chord: { ...C_MAJOR, voicing: "x320xx" } } },
          { caption: "Double the root on the B string, and let the open high E ring: the full C chord.", board: { chord: { ...C_MAJOR, voicing: "x32010" } } },
        ],
      },
    ]),
    step("practice", "Build it", [
      exercise({
        id: "build-c-major",
        kind: "fretboard",
        task: "construct",
        prompt: "Build a C major chord (C, E, G). Any voicing works, as long as it only contains those notes.",
        hint: "Start with C on the A string, fret 3. Tap above the nut to add an open string.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: C_MAJOR },
        solution: shape("x32010"),
      }),
      exercise({
        id: "build-g-major",
        kind: "fretboard",
        task: "construct",
        prompt: "Build a G major chord (G, B, D).",
        hint: "G is at fret 3 of both E strings. The open G, B and D strings are all in the chord.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "G", quality: "major" } },
        solution: shape("320003"),
      }),
      exercise({
        id: "build-a-major",
        kind: "fretboard",
        task: "construct",
        prompt: "Build an A major chord (A, C♯, E).",
        hint: "The open A and E strings are both in the chord. C♯ is fret 2 on the B string.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "A", quality: "major" } },
        solution: shape("x02220"),
      }),
      choice(
        "identify-d",
        "Identify this chord.",
        [
          ["d-major", "D major"],
          ["d-minor", "D minor", "D minor contains F, a minor third above D. This chord has F♯, a major third."],
          ["g-major", "G major", "G major needs a G and a B. This chord has D, F♯ and A."],
          ["f-sharp-minor", "F♯ minor", "F♯ minor is F♯, A, C♯. There's no C♯ here, and D isn't in F♯ minor."],
        ],
        "d-major",
        { board: { chord: { root: "D", quality: "major", voicing: "xx0232" }, range: { start: 0, end: 4 }, labels: "note", layout: { mobile: "chord", desktop: "chord" } } },
      ),
      choice(
        "spell-e-major",
        "Which notes form E major?",
        [
          ["e-gs-b", "E – G♯ – B"],
          ["e-g-b", "E – G – B", "G is only 3 semitones above E, a minor third. That's E minor."],
          ["e-ab-b", "E – A♭ – B", "A♭ sounds the same as G♯, but a third above E must use the letter G (E F G)."],
          ["e-gs-c", "E – G♯ – C", "C is not a perfect fifth above E. Count 7 semitones: B."],
        ],
        "e-gs-b",
      ),
    ]),
  ],
};
