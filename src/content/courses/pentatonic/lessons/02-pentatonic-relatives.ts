import type { Lesson } from "@/lib/courses";
import { NECK, board, choice, drill, pentatonicWindow, step, text } from "@/content/helpers";

const POS1_A = pentatonicWindow("A", 1);

export const pentatonicRelatives: Lesson = {
  id: "pentatonic-relatives",
  title: "Major and Minor Pentatonic: Same Notes",
  summary: "Relative keys carry over: every minor pentatonic is also a major pentatonic.",
  kind: "lesson",
  estimatedMinutes: 8,
  objectives: [
    "Find the relative major pentatonic of a minor pentatonic (and back)",
    "Explain how pentatonics relate to seven-note scales",
    "Name pentatonic degrees in several keys",
  ],
  prerequisites: ["five-note-scales"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("relatives", "One set of notes, two homes", [
      text(`
        **A minor pentatonic** (A C D E G) and **C major pentatonic** (C D E G A) are the same five notes, just as A minor and C major are relative keys.

        This means **every pentatonic shape you learn works twice**: once as minor (home on its minor root) and once as major (home on the note three half steps higher).

        Pentatonics are also *inside* seven-note scales: A minor pentatonic is A natural minor with B and F removed, so it fits anywhere A minor or C major does.
      `),
      board(
        { scale: { root: "A", type: "minor-pentatonic" }, region: POS1_A, range: { start: POS1_A.start - 1, end: POS1_A.end + 1 }, labels: "note", layout: NECK },
        "A minor pentatonic around fret 5. Squares mark A, the minor root.",
      ),
      board(
        { scale: { root: "C", type: "major-pentatonic" }, region: POS1_A, range: { start: POS1_A.start - 1, end: POS1_A.end + 1 }, labels: "note", layout: NECK },
        "The same notes as C major pentatonic. Now the squares are on C.",
      ),
    ]),
    step("practice", "Practice", [
      choice(
        "relative-e-minor-pent",
        "Which major pentatonic has the same notes as E minor pentatonic?",
        [
          ["g", "G major pentatonic"],
          ["e", "E major pentatonic", "Same root, different notes (G♯, C♯). The relative major is 3 half steps up."],
          ["c", "C major pentatonic", "C major pentatonic is the relative of A minor pentatonic."],
        ],
        "g",
      ),
      choice(
        "why-safe",
        "Why do pentatonic scales sound so 'safe' to improvise with?",
        [
          ["half-steps", "They leave out the notes that form half steps"],
          ["fewer", "Fewer notes means fewer wrong notes", "It's not the count, it's *which* notes: the ones that form half steps are gone."],
          ["minor", "They are always minor", "There's a major pentatonic too."],
        ],
        "half-steps",
      ),
      choice(
        "minor-pent-from-minor",
        "A minor pentatonic is A natural minor without which degrees?",
        [
          ["2-b6", "The 2nd (B) and ♭6th (F)"],
          ["4-7", "The 4th and 7th", "That's how *major* pentatonic is made from major."],
          ["b3-b7", "The ♭3rd and ♭7th", "Those stay: 1 ♭3 4 5 ♭7."],
        ],
        "2-b6",
      ),
      drill(
        "minor-pent-degree-drill",
        "Name degrees of minor pentatonic scales.",
        { type: "scale-degree", scale: "minor-pentatonic", roots: ["A", "E", "D", "G", "B", "C"] },
        { rounds: 6, hint: "Minor pentatonic keeps degrees 1, ♭3, 4, 5 and ♭7 of natural minor." },
      ),
    ]),
  ],
};
