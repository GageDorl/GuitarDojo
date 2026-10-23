import type { Lesson } from "@/lib/courses";
import { NECK, board, callout, choice, exercise, step, text } from "@/content/helpers";

export const relativeKeys: Lesson = {
  id: "relative-keys",
  title: "Relative Major and Minor",
  summary: "Every major scale shares its notes with a minor scale. Only the home note changes.",
  kind: "lesson",
  estimatedMinutes: 9,
  objectives: [
    "Explain what relative keys share and what differs",
    "Find the relative minor of a major key (and back)",
    "Locate relative tonics on the fretboard",
  ],
  prerequisites: ["natural-minor"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("same-notes", "Same notes, different home", [
      text(`
        **C major** and **A natural minor** use exactly the same seven notes. What differs is the **tonic**, the note that feels like home, and so the mood.

        Pairs like this are called **relative keys**:

        - The **relative minor** starts on the **6th degree** of the major scale: **3 half steps below** the major tonic.
        - The **relative major** is **3 half steps above** the minor tonic.
      `),
      board(
        { scale: { root: "C", type: "major" }, range: { start: 0, end: 5 }, labels: "note", layout: NECK },
        "C major near the nut. Squares mark C, its tonic.",
      ),
      board(
        { scale: { root: "A", type: "natural-minor" }, range: { start: 0, end: 5 }, labels: "note", layout: NECK },
        "A natural minor in the same place: the identical notes, but now A is home.",
      ),
      callout("guitar", "Play the notes above ending on C, then again ending on A. Same notes; the second version sounds sadder because your ear hears A as home.", "Hear it"),
    ]),
    step("practice", "Practice", [
      choice(
        "relative-minor-g",
        "What is the relative minor of G major?",
        [
          ["e", "E minor"],
          ["g", "G minor", "G minor has the same tonic but different notes (B♭, E♭, F). That's the *parallel* minor."],
          ["b", "B minor", "Count three half steps *down* from G: G♭, F, E."],
        ],
        "e",
      ),
      choice(
        "relative-major-d",
        "What is the relative major of D minor?",
        [
          ["f", "F major"],
          ["b-flat", "B♭ major", "Relative major is 3 half steps *up* from the minor tonic: D♯, E, F."],
          ["d", "D major", "D major has F♯; D minor has F. Different notes."],
        ],
        "f",
      ),
      choice(
        "same-notes",
        "What do C major and A minor have in common?",
        [
          ["notes", "Exactly the same notes"],
          ["tonic", "The same tonic", "Their tonics differ: C and A."],
          ["nothing", "Nothing; they're unrelated keys", "They're relative keys: same notes, different home."],
        ],
        "notes",
      ),
      exercise({
        id: "relative-minor-of-c",
        kind: "fretboard",
        task: "locate",
        prompt: "This C is the tonic of C major. Find the tonic of its **relative minor**: three half steps lower.",
        hint: "Three frets down on the same string.",
        board: { range: { start: 0, end: 7 }, labels: "none", positions: [{ string: 5, fret: 3, role: "root", label: "C" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 5, fret: 3 }, interval: "m3", direction: "down" },
        solution: [{ string: 5, fret: 0 }],
      }),
      exercise({
        id: "relative-major-of-e",
        kind: "fretboard",
        task: "locate",
        prompt: "The open low E is the tonic of E minor. Find the tonic of its **relative major**.",
        hint: "Three half steps up.",
        explanation: "G: E minor and G major share the same notes.",
        board: { range: { start: 0, end: 7 }, labels: "none", positions: [{ string: 6, fret: 0, role: "root", label: "E" }], layout: NECK },
        selection: "single",
        rule: { type: "interval", from: { string: 6, fret: 0 }, interval: "m3" },
        solution: [{ string: 6, fret: 3 }],
      }),
    ]),
  ],
};
