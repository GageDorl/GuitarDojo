import type { Lesson } from "@/lib/courses";
import { CHORD, callout, choice, drill, step, text } from "@/content/helpers";

const f = (root: string, quality: "major" | "minor", voicing: string, caption: string) => ({
  caption,
  board: { chord: { root, quality, voicing } },
});

export const minorKeys: Lesson = {
  id: "minor-keys",
  title: "Minor Keys",
  summary: "The same chords as the relative major, with a different home, and one common twist.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Name the chords of a natural minor key: i ii° III iv v VI VII",
    "Relate a minor key's chords to its relative major",
    "Explain why minor-key songs often use a major V",
  ],
  prerequisites: ["common-progressions"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("minor-chords", "Chords of a minor key", [
      text(`
        Build triads on the natural minor scale and the pattern starts on a minor chord:

        **i – ii° – III – iv – v – VI – VII**

        In A minor: **Am – Bdim – C – Dm – Em – F – G**. These are exactly the chords of **C major**, its relative major, just with A as home.

        **The twist:** many minor-key songs replace the minor v with a **major V** (E major instead of E minor in A minor). Its G♯ is a half step below A and pulls strongly back home. That raised note comes from the *harmonic minor* scale.
      `),
      {
        type: "demo",
        title: "i – VI – III – VII in A minor",
        board: { range: { start: 0, end: 4 }, labels: "interval", layout: CHORD },
        frames: [
          f("A", "minor", "x02210", "**i**: A minor, home."),
          f("F", "major", "133211", "**VI**: F major."),
          f("C", "major", "x32010", "**III**: C major."),
          f("G", "major", "320003", "**VII**: G major, then back to Am."),
        ],
      },
      callout("guitar", "Play Am – Dm – E – Am, then Am – Dm – Em – Am. Hear how the major E pulls home much more strongly than Em.", "Hear the major V"),
    ]),
    step("practice", "Practice", [
      choice(
        "iv-in-a-minor",
        "What is the iv chord in A minor?",
        [
          ["dm", "D minor"],
          ["d", "D major", "Lowercase iv is minor. A natural minor has F, not F♯."],
          ["e-minor", "E minor", "E minor is v, degree 5."],
        ],
        "dm",
      ),
      choice(
        "relative-of-e-minor",
        "Which major key uses the same chords as E minor?",
        [
          ["g", "G major"],
          ["e", "E major", "E major has G♯, C♯ and D♯. The relative major is a minor third up: G."],
          ["c", "C major", "C major's relative minor is A minor."],
        ],
        "g",
      ),
      choice(
        "why-major-v",
        "Why do many A minor songs use E major instead of E minor?",
        [
          ["leading", "Its G♯ is a half step below A and leads strongly home"],
          ["easier", "E major is easier to play", "It's about sound, not fingering: the G♯ pulls to A."],
          ["key", "Because E major is in the key of A minor", "Natural A minor has G, not G♯. The G♯ is borrowed for its pull."],
        ],
        "leading",
      ),
      drill(
        "minor-key-drill",
        "Chords and numerals in minor keys.",
        { type: "diatonic-chord", keys: ["A", "E", "D", "B"], scale: "natural-minor", ask: "mixed" },
        { rounds: 6, hint: "Minor-key pattern: minor, diminished, major, minor, minor, major, major." },
      ),
    ]),
  ],
};
