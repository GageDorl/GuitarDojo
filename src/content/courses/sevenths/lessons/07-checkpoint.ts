import type { Lesson } from "@/lib/courses";
import { BUILD, choice, drill, exercise, shape, step, text } from "@/content/helpers";

export const seventhsCheckpoint: Lesson = {
  id: "sevenths-checkpoint",
  title: "Checkpoint: Seventh Chords",
  summary: "Spell, recognise and build seventh chords, in and out of a key.",
  kind: "assessment",
  estimatedMinutes: 10,
  objectives: ["Spell the main seventh chords", "Use sevenths in a key", "Build seventh chords on the fretboard"],
  prerequisites: ["moveable-and-extended"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [text("**Eight questions**, first attempts only; **6 of 8** to pass. Drills count when passed on the first run.")]),
    step("theory", "Spelling", [
      choice(
        "c-maj7-formula",
        "What is the formula of a major seventh chord?",
        [
          ["maj7", "R 3 5 7"],
          ["dom7", "R 3 5 ♭7", "That's a dominant seventh."],
          ["m7", "R ♭3 5 ♭7", "That's a minor seventh."],
        ],
        "maj7",
      ),
      choice(
        "c-dm7-notes",
        "Which notes make Dm7?",
        [
          ["dfac", "D F A C"],
          ["df#ac", "D F♯ A C", "F♯ makes it D7 (dominant)."],
          ["dfac#", "D F A C♯", "C♯ is a major seventh: that's not a minor seventh chord."],
        ],
        "dfac",
      ),
      choice(
        "c-v7-in-g",
        "What is the V7 chord in G major?",
        [
          ["d7", "D7"],
          ["dmaj7", "Dmaj7", "Stacking G major notes on D gives D F♯ A C: D7."],
          ["g7", "G7", "G is degree 1 in G."],
        ],
        "d7",
      ),
      choice(
        "c-dim7-stack",
        "A diminished seventh chord is built entirely from…",
        [
          ["m3", "Minor thirds"],
          ["M3", "Major thirds", "Stacked major thirds make an augmented triad."],
          ["4ths", "Perfect fourths", "Dim7 stacks thirds, specifically minor thirds."],
        ],
        "m3",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      exercise({
        id: "c-build-g7",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **G7**.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "G", quality: "dominant7" } },
        solution: shape("320001"),
      }),
      exercise({
        id: "c-build-dm7",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **Dm7**.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "D", quality: "minor7" } },
        solution: shape("xx0211"),
      }),
      drill(
        "c-recognition-drill",
        "Name seventh chords.",
        { type: "chord-recognition", roots: ["C", "D", "E", "F", "G", "A"], qualities: ["major7", "dominant7", "minor7"], range: { start: 0, end: 7 } },
        { rounds: 6, passScore: 0.83 },
      ),
      drill(
        "c-key-drill",
        "Seventh chords in a key.",
        { type: "diatonic-chord", keys: ["C", "G", "F", "D", "Bb"], scale: "major", ask: "mixed", sevenths: true },
        { rounds: 6, passScore: 0.83 },
      ),
    ]),
  ],
};
