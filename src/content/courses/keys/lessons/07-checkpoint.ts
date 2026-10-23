import type { Lesson } from "@/lib/courses";
import { choice, drill, step, text } from "@/content/helpers";

export const keysCheckpoint: Lesson = {
  id: "keys-checkpoint",
  title: "Checkpoint: Keys and Progressions",
  summary: "Name keys, chords and numerals, and build progressions in unfamiliar keys.",
  kind: "assessment",
  estimatedMinutes: 10,
  objectives: ["Read key signatures", "Translate between chords and numerals", "Build chords of a key on the fretboard"],
  prerequisites: ["progressions-on-the-neck"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [text("**Eight questions**, first attempts only; **6 of 8** to pass. Drills count when passed on the first run.")]),
    step("theory", "Keys and chords", [
      choice(
        "c-three-sharps",
        "Which major key has three sharps?",
        [
          ["a", "A major"],
          ["d", "D major", "D major has two sharps."],
          ["e", "E major", "E major has four sharps."],
        ],
        "a",
      ),
      choice(
        "c-iii-quality",
        "What quality is the iii chord in a major key?",
        [
          ["minor", "Minor"],
          ["major", "Major", "Lowercase iii means minor."],
          ["diminished", "Diminished", "Only vii is diminished."],
        ],
        "minor",
      ),
      choice(
        "c-em-in-g",
        "In G major, E minor is which chord?",
        [
          ["vi", "vi"],
          ["iii", "iii", "iii in G is B minor."],
          ["ii", "ii", "ii in G is A minor."],
        ],
        "vi",
      ),
      choice(
        "c-v-in-e",
        "What is the V chord in E major?",
        [
          ["b", "B major"],
          ["a", "A major", "A is IV in E."],
          ["b-minor", "B minor", "V is uppercase: major."],
        ],
        "b",
      ),
      choice(
        "c-i-iv-v-in-d",
        "What is I – IV – V in D major?",
        [
          ["d-g-a", "D – G – A"],
          ["d-g-am", "D – G – Am", "V is major: A major."],
          ["d-e-a", "D – E – A", "IV is degree 4: G, not E."],
        ],
        "d-g-a",
      ),
      choice(
        "c-iv-in-e-minor",
        "What is the iv chord in E minor?",
        [
          ["am", "A minor"],
          ["a", "A major", "iv is minor in a minor key."],
          ["bm", "B minor", "B minor is v."],
        ],
        "am",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      drill(
        "c-diatonic-drill",
        "Chords and numerals in major keys.",
        { type: "diatonic-chord", keys: ["C", "G", "D", "A", "F", "Bb"], scale: "major", ask: "mixed" },
        { rounds: 6, passScore: 0.83 },
      ),
      drill(
        "c-build-drill",
        "Build chords from numerals.",
        { type: "diatonic-construction", keys: ["C", "G", "D", "A", "E"], scale: "major", degrees: [1, 4, 5, 6], range: { start: 0, end: 10 } },
        { rounds: 4, passScore: 0.75 },
      ),
    ]),
  ],
};
