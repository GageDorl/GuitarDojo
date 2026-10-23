import type { Lesson } from "@/lib/courses";
import { CHORD, callout, choice, drill, step, text } from "@/content/helpers";

const f = (root: string, quality: "major" | "minor", voicing: string, caption: string) => ({
  caption,
  board: { chord: { root, quality, voicing } },
});

export const commonProgressions: Lesson = {
  id: "common-progressions",
  title: "Progressions You Already Know",
  summary: "A handful of numeral patterns power a huge share of popular music.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Recognise I–IV–V, I–V–vi–IV, ii–V–I and vi–IV–I–V",
    "Play a progression in a new key from its numerals",
    "Build the chords of a progression on the fretboard",
  ],
  prerequisites: ["roman-numerals"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("patterns", "Four famous patterns", [
      text(`
        A **chord progression** is a sequence of chords. A few patterns appear again and again:

        - **I – IV – V**: blues, rock and roll, folk.
        - **I – V – vi – IV**: countless pop songs.
        - **vi – IV – I – V**: the same four chords starting on the minor one, for a moodier feel.
        - **ii – V – I**: the backbone of jazz, and a strong way to arrive home in any style.

        Because they're numerals, each pattern works in every key.
      `),
      {
        type: "demo",
        title: "I – V – vi – IV in G major",
        board: { range: { start: 0, end: 4 }, labels: "interval", layout: CHORD },
        frames: [
          f("G", "major", "320003", "**I**: G major, home."),
          f("D", "major", "xx0232", "**V**: D major, pulling away."),
          f("E", "minor", "022000", "**vi**: E minor, the minor colour."),
          f("C", "major", "x32010", "**IV**: C major, then back to I."),
        ],
      },
      callout("guitar", "Loop G–D–Em–C with four strums per chord. Then try it starting on Em (vi–IV–I–V): same chords, different feeling.", "Play it"),
    ]),
    step("practice", "Practice", [
      choice(
        "pop-in-c",
        "What is I – V – vi – IV in C major?",
        [
          ["c-g-am-f", "C – G – Am – F"],
          ["c-g-a-f", "C – G – A – F", "vi is lowercase: A minor, not A major."],
          ["c-f-am-g", "C – F – Am – G", "That's I – IV – vi – V. The V (G) comes second."],
        ],
        "c-g-am-f",
      ),
      choice(
        "ii-v-i-in-f",
        "What is ii – V – I in F major?",
        [
          ["gm-c-f", "Gm – C – F"],
          ["g-c-f", "G – C – F", "ii is minor: G minor."],
          ["dm-g-c", "Dm – G – C", "That's ii – V – I in C major."],
        ],
        "gm-c-f",
      ),
      drill(
        "build-progression-chords",
        "Build chords from progressions in different keys.",
        { type: "diatonic-construction", keys: ["C", "G", "D", "A"], scale: "major", degrees: [1, 4, 5, 6], range: { start: 0, end: 5 } },
        { rounds: 6, hint: "Turn the numeral into a chord first, then build it near the nut." },
      ),
    ]),
  ],
};
