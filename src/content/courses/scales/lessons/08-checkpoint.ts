import type { Lesson } from "@/lib/courses";
import { NECK, choice, drill, exercise, scaleAlongString, step, text } from "@/content/helpers";
import { majorShape } from "./shapes";

export const scalesCheckpoint: Lesson = {
  id: "scales-checkpoint",
  title: "Checkpoint: Major and Minor Scales",
  summary: "Spell, build and move scales in keys you haven't practised.",
  kind: "assessment",
  estimatedMinutes: 12,
  objectives: ["Spell major and minor scales", "Relate relative keys", "Play scales on the fretboard in new keys"],
  prerequisites: ["transposition"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [
      text("**Eight questions**, first attempts only; **6 of 8** to pass. Drills count as correct if you pass them on the first run."),
    ]),
    step("theory", "Spelling", [
      choice(
        "c-pattern",
        "Which pattern makes a major scale?",
        [
          ["major", "W W H W W W H"],
          ["minor", "W H W W H W W", "That's natural minor."],
          ["even", "W W W W W W", "Six whole steps make a whole-tone scale, not a major scale."],
        ],
        "major",
      ),
      choice(
        "c-spell-a-major",
        "Which is the A major scale?",
        [
          ["correct", "A B C♯ D E F♯ G♯"],
          ["natural", "A B C D E F G", "That's A natural minor."],
          ["flats", "A B D♭ D E G♭ A♭", "Right sounds, wrong letters: each letter A–G must appear once."],
        ],
        "correct",
      ),
      choice(
        "c-relative-e-flat",
        "What is the relative minor of E♭ major?",
        [
          ["c", "C minor"],
          ["e-flat", "E♭ minor", "Same tonic, different notes: that's the parallel minor."],
          ["g", "G minor", "Relative minor is 3 half steps *below* the major tonic."],
        ],
        "c",
      ),
      choice(
        "c-b-major-4th",
        "What is the 4th degree of B major?",
        [
          ["e", "E"],
          ["e-sharp", "E♯", "The 3rd-to-4th step is a half step: D♯ to E."],
          ["f-sharp", "F♯", "F♯ is the 5th degree."],
        ],
        "e",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      exercise({
        id: "c-g-major-on-d",
        kind: "fretboard",
        task: "construct",
        prompt: "Select every note of **G major** on the D string (open to fret 11).",
        board: { range: { start: 0, end: 11 }, labels: "none", strings: [4], layout: NECK },
        selection: "multi",
        rule: { type: "scale", scale: { root: "G", type: "major" }, region: { range: { start: 0, end: 11 }, strings: [4] } },
        solution: scaleAlongString("G", "major", 4),
      }),
      exercise({
        id: "c-d-major-shape",
        kind: "fretboard",
        task: "construct",
        prompt: "Play one octave of **D major** with the major shape, root on the low E string.",
        board: { range: { start: 8, end: 15 }, labels: "none", strings: [6, 5, 4], layout: NECK },
        selection: "multi",
        rule: { type: "exact-positions", positions: majorShape(10) },
        solution: majorShape(10),
      }),
      drill("c-degree-drill", "Name scale degrees.", { type: "scale-degree", scale: "major", roots: ["G", "D", "A", "E", "F", "Bb", "Eb", "Ab"] }, { rounds: 6, passScore: 0.83 }),
      drill(
        "c-scale-string-drill",
        "Build scales along a string.",
        { type: "scale-on-string", scales: ["major", "natural-minor"], roots: ["C", "D", "E", "F", "G", "A", "Bb"], strings: [6, 5, 4] },
        { rounds: 3, passScore: 0.66 },
      ),
    ]),
  ],
};
