import type { Lesson } from "@/lib/courses";
import { CHORD, callout, choice, drill, step, text } from "@/content/helpers";

const c = (root: string, quality: "major" | "minor" | "diminished", voicing: string, caption: string) => ({
  caption,
  board: { chord: { root, quality, voicing } },
});

export const diatonicTriads: Lesson = {
  id: "diatonic-triads",
  title: "Building Chords from a Scale",
  summary: "Stack thirds on every note of the scale and you get the seven chords of the key.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Build a triad on each degree of a major scale",
    "Remember the major-key pattern: major, minor, minor, major, major, minor, diminished",
    "Recognise a diminished triad",
  ],
  prerequisites: ["what-is-a-key"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("stack", "Every other note", [
      text(`
        Build a triad on each note of a scale using **only notes from that scale**: take a note, skip one, take one, skip one, take one. In C major:

        - Degree 1: **C** E G (C major)
        - Degree 2: **D** F A (D minor)
        - Degree 7: **B** D F (B diminished)

        Because the scale's whole and half steps fall in the same places in every major key, the **chord qualities always come out the same**:

        **major, minor, minor, major, major, minor, diminished**
      `),
      { type: "triad-stack", chord: { root: "D", quality: "minor" }, caption: "Degree 2 of C major: D, F, A. A minor triad." },
      { type: "triad-stack", chord: { root: "B", quality: "diminished" }, caption: "Degree 7: B, D, F. Two minor thirds make a diminished triad, with a diminished fifth." },
    ]),
    step("hear", "The seven chords of C major", [
      {
        type: "demo",
        title: "C major, degree by degree",
        board: { range: { start: 0, end: 4 }, labels: "interval", layout: CHORD },
        frames: [
          c("C", "major", "x32010", "Degree 1: **C major**."),
          c("D", "minor", "xx0231", "Degree 2: **D minor**."),
          c("E", "minor", "022000", "Degree 3: **E minor**."),
          c("F", "major", "133211", "Degree 4: **F major**."),
          c("G", "major", "320003", "Degree 5: **G major**."),
          c("A", "minor", "x02210", "Degree 6: **A minor**."),
          c("B", "diminished", "x2343x", "Degree 7: **B diminished**. Tense and unstable: it wants to move on."),
        ],
      },
      callout("guitar", "Strum all seven in order and back. Every chord shares notes with the C major scale, which is why they sound like they belong together.", "Play the key"),
    ]),
    step("practice", "Practice", [
      choice(
        "ii-quality",
        "In any major key, what is the quality of the chord on degree 2?",
        [
          ["minor", "Minor"],
          ["major", "Major", "Degrees 1, 4 and 5 are major. Degree 2 is minor (D minor in C)."],
          ["diminished", "Diminished", "Only degree 7 is diminished."],
        ],
        "minor",
      ),
      choice(
        "which-diminished",
        "Which degree of a major key has a diminished triad?",
        [
          ["7", "Degree 7"],
          ["4", "Degree 4", "Degree 4 is major (F in C major)."],
          ["2", "Degree 2", "Degree 2 is minor."],
        ],
        "7",
      ),
      choice(
        "iii-notes",
        "What notes make the chord on degree 3 of C major?",
        [
          ["egb", "E G B"],
          ["eg#b", "E G♯ B", "G♯ isn't in C major. Using only scale notes gives E minor."],
          ["ega", "E G A", "Skip a note each time: E (F) G (A) B."],
        ],
        "egb",
      ),
      drill(
        "name-diatonic-chords",
        "Name the chords of major keys by degree.",
        { type: "diatonic-chord", keys: ["C", "G", "D", "F"], scale: "major", ask: "chord" },
        { rounds: 8, hint: "Find the note on that degree, then apply the pattern: major, minor, minor, major, major, minor, diminished." },
      ),
    ]),
  ],
};
