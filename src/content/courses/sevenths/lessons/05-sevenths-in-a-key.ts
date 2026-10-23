import type { Lesson } from "@/lib/courses";
import { CHORD, callout, choice, drill, step, text } from "@/content/helpers";

export const seventhsInAKey: Lesson = {
  id: "sevenths-in-a-key",
  title: "Seventh Chords in a Key",
  summary: "Stack four notes on every degree: Imaj7, ii7, iii7, IVmaj7, V7, vi7, viiø7.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Name the seventh chords of a major key",
    "Play ii7–V7–Imaj7 in a key",
    "Translate between seventh chords and numerals",
  ],
  prerequisites: ["diminished-sevenths"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("pattern", "The seventh-chord pattern", [
      text(`
        Stack four scale notes on each degree (skip one each time) and every major key gives the same seventh chords:

        **Imaj7 – ii7 – iii7 – IVmaj7 – V7 – vi7 – viiø7**

        In C major: **Cmaj7 – Dm7 – Em7 – Fmaj7 – G7 – Am7 – Bm7♭5**.

        The most important progression in jazz is **ii7 – V7 – Imaj7**. In C: Dm7 – G7 – Cmaj7. The ♭7 of each chord falls a half step to become the 3rd of the next, which is why it flows so smoothly.
      `),
      {
        type: "demo",
        title: "ii7 – V7 – Imaj7 in C major",
        board: { range: { start: 0, end: 4 }, labels: "interval", layout: CHORD },
        frames: [
          { caption: "**ii7**: Dm7.", board: { chord: { root: "D", quality: "minor7", voicing: "xx0211" } } },
          { caption: "**V7**: G7. Its F (♭7) is about to fall to E.", board: { chord: { root: "G", quality: "dominant7", voicing: "320001" } } },
          { caption: "**Imaj7**: Cmaj7. Home, with a soft, open colour.", board: { chord: { root: "C", quality: "major7", voicing: "x32000" } } },
        ],
      },
      callout("guitar", "Loop Dm7 – G7 – Cmaj7. Then try the same numerals in G: Am7 – D7 – Gmaj7.", "Play it"),
    ]),
    step("practice", "Practice", [
      choice(
        "v7-in-f",
        "What is the V7 chord in F major?",
        [
          ["c7", "C7"],
          ["cmaj7", "Cmaj7", "Stacking F major notes on C gives C E G B♭: a dominant seventh."],
          ["f7", "F7", "F is degree 1; its seventh chord in F major is Fmaj7."],
        ],
        "c7",
      ),
      choice(
        "only-dominant",
        "Which degree of a major key is the only one with a dominant seventh chord?",
        [
          ["5", "Degree 5 (V7)"],
          ["1", "Degree 1", "I is a major seventh (Imaj7)."],
          ["4", "Degree 4", "IV is a major seventh (IVmaj7)."],
        ],
        "5",
      ),
      drill(
        "diatonic-sevenths-drill",
        "Seventh chords and numerals in major keys.",
        { type: "diatonic-chord", keys: ["C", "G", "F", "D"], scale: "major", ask: "mixed", sevenths: true },
        { rounds: 8, hint: "Pattern: maj7, m7, m7, maj7, 7, m7, m7♭5." },
      ),
    ]),
  ],
};
