import type { Lesson } from "@/lib/courses";
import { choice, exercise, shape, step, text } from "@/content/helpers";

export const triadsAssessment: Lesson = {
  id: "triads-checkpoint",
  title: "Checkpoint: Major and Minor Triads",
  summary: "Eight questions covering intervals, spelling, recognition and construction.",
  kind: "assessment",
  estimatedMinutes: 10,
  objectives: [
    "Demonstrate interval knowledge",
    "Spell and recognise major and minor triads",
    "Build triads on the fretboard",
  ],
  prerequisites: ["triads-on-the-fretboard"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [
      text(`
        This checkpoint has **eight questions**. Your score counts **first attempts only**, and you need **6 of 8** to pass.

        You can still retry a question after a wrong answer, so you'll always see the right answer before moving on. If you don't pass, you can retake the checkpoint.
      `),
    ]),
    step("theory", "Intervals and spelling", [
      choice(
        "a-major-third-size",
        "How many semitones are in a major third?",
        [
          ["3", "3", "Three semitones is a minor third."],
          ["4", "4"],
          ["5", "5", "Five semitones is a perfect fourth."],
          ["7", "7", "Seven semitones is a perfect fifth."],
        ],
        "4",
      ),
      choice(
        "a-name-interval",
        "What interval is shown?",
        [
          ["M3", "Major third", "G up to D spans five letter names (G A B C D), so it's a fifth."],
          ["P4", "Perfect fourth", "A perfect fourth is 5 semitones. G2 to D3 is 7."],
          ["P5", "Perfect fifth"],
          ["M6", "Major sixth", "A major sixth above G would be E."],
        ],
        "P5",
        {
          board: {
            range: { start: 0, end: 7 },
            root: "G",
            labels: "note",
            positions: [
              { string: 6, fret: 3, role: "root" },
              { string: 5, fret: 5, role: "tone" },
            ],
          },
        },
      ),
      choice(
        "a-spell-f-major",
        "Which notes form F major?",
        [
          ["f-a-c", "F – A – C"],
          ["f-ab-c", "F – A♭ – C", "A♭ is a minor third above F. That's F minor."],
          ["f-a-cs", "F – A – C♯", "C♯ is an augmented fifth above F. The perfect fifth is C."],
          ["f-bb-c", "F – B♭ – C", "B♭ is a fourth above F, not a third."],
        ],
        "f-a-c",
      ),
    ]),
    step("recognition", "Recognition", [
      choice(
        "a-identify-em",
        "Identify this chord.",
        [
          ["e-major", "E major", "E major needs G♯. This chord has G, a minor third above E."],
          ["e-minor", "E minor"],
          ["g-major", "G major", "G major needs D. The notes here are E, G and B."],
          ["a-minor", "A minor", "A minor is A, C, E. There's no C here."],
        ],
        "e-minor",
        { board: { chord: { root: "E", quality: "minor", voicing: "022000" }, range: { start: 0, end: 4 }, labels: "note", layout: { mobile: "chord", desktop: "chord" } } },
      ),
      exercise({
        id: "a-tap-third-a",
        kind: "fretboard",
        task: "identify",
        prompt: "This is A major. Tap its third.",
        board: { chord: { root: "A", quality: "major", voicing: "x02220" }, range: { start: 0, end: 4 }, labels: "none", roles: false, layout: { mobile: "chord", desktop: "chord" } },
        selection: "single",
        selectableOnlyMarkers: true,
        rule: { type: "exact-positions", positions: [{ string: 2, fret: 2 }], context: { chord: { root: "A", quality: "major" } } },
        solution: [{ string: 2, fret: 2 }],
      }),
    ]),
    step("construction", "Construction", [
      exercise({
        id: "a-build-d-major",
        kind: "fretboard",
        task: "construct",
        prompt: "Build a D major chord.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "D", quality: "major" } },
        solution: shape("xx0232"),
      }),
      exercise({
        id: "a-build-d-minor",
        kind: "fretboard",
        task: "construct",
        prompt: "Build a D minor chord.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: { mobile: "chord", desktop: "neck" } },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "D", quality: "minor" } },
        solution: shape("xx0231"),
      }),
      exercise({
        id: "a-minor-third-above-a",
        kind: "fretboard",
        task: "locate",
        prompt: "Find the minor third above the open A string.",
        board: {
          range: { start: 0, end: 8 },
          labels: "none",
          positions: [{ string: 5, fret: 0, role: "root", label: "A" }],
          layout: { mobile: "neck", desktop: "neck" },
        },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 0 }, interval: "m3" },
        solution: [{ string: 5, fret: 3 }],
      }),
    ]),
  ],
};
