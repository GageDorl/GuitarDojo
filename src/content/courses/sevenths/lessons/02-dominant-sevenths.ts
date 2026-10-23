import type { Lesson } from "@/lib/courses";
import { COMMON_VOICINGS } from "@/lib/theory";
import { BUILD, callout, choice, drill, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

const open = (symbol: string) => {
  const entry = COMMON_VOICINGS[symbol]!;
  return { title: symbol, board: voicingBoard(entry.chord, entry.shapes[0]!) };
};

export const dominantSevenths: Lesson = {
  id: "dominant-sevenths",
  title: "Dominant Sevenths",
  summary: "The chord with built-in tension: it's the V of a key, and the sound of the blues.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Explain why the V7 chord pulls toward the I",
    "Play the open dominant seventh chords",
    "Tell a dominant seventh from a plain major chord",
  ],
  prerequisites: ["adding-the-seventh"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("tension", "Why it wants to resolve", [
      text(`
        In a major key, stacking four scale notes on degree 5 gives a **dominant seventh**: in C major, **G7** (G B D F). It's the only dominant seventh in the key, which is why it's called the **V7**.

        Inside G7, the **B and F** are a **tritone** apart (a diminished fifth). That unstable interval wants to resolve: B rises a half step to C, F falls a half step to E. Together they land on C major. That pull is what makes V7 → I sound like arriving home.

        The blues breaks the rule on purpose: it uses dominant sevenths on **I, IV and V** for a gritty, unresolved sound.
      `),
      {
        type: "compare",
        items: ["E7", "A7", "D7", "G7", "B7"].map(open),
        caption: "Open dominant seventh chords. Find the ♭7 in each: it's the note that differs from the plain major chord.",
      },
      callout("guitar", "Play G7 then C, slowly. Feel the B in G7 rise to C and the F fall to E. Then play E7 – A7 – B7 – E7 for the blues.", "Hear the pull"),
    ]),
    step("practice", "Practice", [
      choice(
        "v7-in-c",
        "What is the V7 chord in C major?",
        [
          ["g7", "G7"],
          ["gmaj7", "Gmaj7", "Gmaj7 has F♯, which isn't in C major. Stacking C major notes on G gives G B D F: G7."],
          ["c7", "C7", "C7 is built on degree 1 and has B♭, outside the key."],
        ],
        "g7",
      ),
      choice(
        "tritone",
        "Which interval inside G7 creates its tension?",
        [
          ["tritone", "The tritone between B and F"],
          ["fifth", "The perfect fifth between G and D", "Perfect fifths are stable. The restless interval is B–F."],
          ["octave", "The octave G to G", "Octaves are the most stable interval of all."],
        ],
        "tritone",
      ),
      exercise({
        id: "build-e7",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **E7** (E, G♯, B, D) near the nut.",
        hint: "Start from open E major and add D: the open D string's note, or D on the B string at fret 3.",
        board: { range: { start: 0, end: 5 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "E", quality: "dominant7" } },
        solution: shape("020100"),
      }),
      drill(
        "major-vs-dominant",
        "Major or dominant seventh? Name the chord.",
        { type: "chord-recognition", roots: ["E", "A", "D", "G", "B", "C"], qualities: ["major", "dominant7"], range: { start: 0, end: 5 } },
        { rounds: 8, hint: "Look for a fourth note name: the ♭7." },
      ),
    ]),
  ],
};
