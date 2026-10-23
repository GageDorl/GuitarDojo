import type { Lesson } from "@/lib/courses";
import { COMMON_VOICINGS } from "@/lib/theory";
import { BUILD, callout, choice, drill, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const open = (symbol: string) => {
  const entry = COMMON_VOICINGS[symbol]!;
  return { title: symbol, board: voicingBoard(entry.chord, entry.shapes[0]!) };
};

export const majorAndMinorSevenths: Lesson = {
  id: "major-and-minor-sevenths",
  title: "Major and Minor Sevenths",
  summary: "Two smoother seventh chords: the dreamy maj7 and the mellow m7.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Play open major seventh and minor seventh chords",
    "Turn a triad into maj7 or m7 by adding one note",
    "Tell maj7, 7 and m7 apart",
  ],
  prerequisites: ["dominant-sevenths"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("shapes", "Open shapes", [
      text(`
        Many seventh chords are a familiar open chord with **one note changed or added**:

        - **Cmaj7**: open C with the B string played open (B instead of C).
        - **Am7**: open Am with the G string played open (G, the ♭7, instead of A).
        - **Em7**: open Em plus D on the B string.

        Major sevenths sound lush and unresolved in a gentle way; minor sevenths sound relaxed and smooth.
      `),
      {
        type: "compare",
        items: ["Cmaj7", "Fmaj7", "Amaj7"].map(open),
        caption: "Major seventh chords: look for the 7 (a half step below the root).",
      },
      {
        type: "compare",
        items: ["Am7", "Em7", "Dm7"].map(open),
        caption: "Minor seventh chords: ♭3 and ♭7.",
      },
      callout("guitar", "Play C then Cmaj7, Am then Am7. One finger lifts in each pair, and the whole mood softens.", "One note, new colour"),
    ]),
    step("practice", "Practice", [
      choice(
        "am7-added-note",
        "What note turns A minor into Am7?",
        [
          ["g", "G"],
          ["g-sharp", "G♯", "G♯ is a major seventh above A. Am7 uses the minor seventh: G."],
          ["f", "F", "F is a minor sixth above A."],
        ],
        "g",
      ),
      exercise({
        id: "build-am7",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **Am7** (A, C, E, G).",
        hint: "Start from open Am and let the G string ring open.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "A", quality: "minor7" } },
        solution: shape("x02010"),
      }),
      exercise({
        id: "build-cmaj7",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **Cmaj7** (C, E, G, B).",
        hint: "Open C chord, but leave the B string open.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "C", quality: "major7" } },
        solution: shape("x32000"),
      }),
      drill(
        "three-sevenths",
        "maj7, 7 or m7? Name the chord.",
        { type: "chord-recognition", roots: ["C", "D", "E", "F", "G", "A"], qualities: ["major7", "dominant7", "minor7"], range: { start: 0, end: 5 } },
        { rounds: 8, hint: "Check the third (major or minor), then the seventh (a half step or a whole step below the root)." },
      ),
    ]),
  ],
};
