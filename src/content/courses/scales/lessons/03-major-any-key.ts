import type { Lesson } from "@/lib/courses";
import { callout, choice, drill, step, text } from "@/content/helpers";

export const majorInAnyKey: Lesson = {
  id: "major-any-key",
  title: "Major Scales in Any Key",
  summary: "Two rules let you spell any major scale without memorising charts.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Spell a major scale from any tonic",
    "Decide between sharps and flats using the one-letter rule",
    "Name scale degrees in unfamiliar keys",
  ],
  prerequisites: ["major-scale-pattern"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("rules", "Two rules", [
      text(`
        To spell any major scale:

        - **Use every letter once, in order.** Starting on F: F G A B C D E.
        - **Adjust with sharps or flats** until the steps match W W H W W W H.

        F to G (W), G to A (W), then A to B is a *whole* step but we need a *half*, so B becomes **B♭**. The rest fits: **F G A B♭ C D E**.

        Why not A♯? Because then the letter A would appear twice and B would be missing. The one-letter rule settles every sharp-or-flat question.
      `),
      {
        type: "chromatic",
        start: "F",
        highlight: ["F", "G", "A", "Bb", "C", "D", "E", "F"].map((note, i) => ({ note, role: i === 0 || i === 7 ? ("root" as const) : ("tone" as const) })),
        showDistances: true,
        caption: "F major: the same 2 2 1 2 2 2 1 pattern, with B♭.",
      },
      callout("note", "Major keys use either sharps or flats, never both. G, D, A, E and B major use sharps; F, B♭, E♭ and A♭ major use flats.", "Sharps or flats"),
    ]),
    step("practice", "Practice", [
      choice(
        "spell-f-major",
        "Which is the F major scale?",
        [
          ["correct", "F G A B♭ C D E"],
          ["a-sharp", "F G A A♯ C D E", "A♯ is the right fret, but it repeats the letter A and skips B. Each letter appears once."],
          ["b-natural", "F G A B C D E", "A to B is a whole step. The pattern needs a half step there: B♭."],
        ],
        "correct",
      ),
      choice(
        "d-major-sharps",
        "How many sharps are in D major?",
        [
          ["2", "Two: F♯ and C♯"],
          ["1", "One: F♯", "Check the 7th degree too: C to D must be a half step, so C becomes C♯."],
          ["3", "Three: F♯, C♯ and G♯", "G is the 4th degree of D major: F♯ to G is already a half step."],
        ],
        "2",
      ),
      choice(
        "e-major-third",
        "What's the 3rd degree of E major?",
        [
          ["g-sharp", "G♯"],
          ["g", "G", "E to G is only 3 half steps. A major scale's 3rd is 4 half steps above the tonic."],
          ["a-flat", "A♭", "Right sound, wrong letter: the 3rd above E uses G."],
        ],
        "g-sharp",
      ),
      choice(
        "spell-b-flat-major",
        "Which is the B♭ major scale?",
        [
          ["correct", "B♭ C D E♭ F G A"],
          ["sharps", "A♯ B♯ C𝄪 D♯ E♯ F𝄪 G𝄪", "That's technically the same sound, but nobody spells it that way. Start from B♭."],
          ["e-natural", "B♭ C D E F G A", "D to E is a whole step. The 3rd-to-4th step must be a half: E♭."],
        ],
        "correct",
      ),
      drill(
        "major-degree-drill",
        "Name degrees of major scales in many keys.",
        { type: "scale-degree", scale: "major", roots: ["C", "G", "D", "A", "E", "F", "Bb", "Eb"] },
        { rounds: 8, hint: "Spell the scale letter by letter, then fix the steps: W W H W W W H." },
      ),
      drill(
        "major-on-string-drill",
        "Build major scales along a string in different keys.",
        { type: "scale-on-string", scales: ["major"], roots: ["C", "G", "D", "A", "F", "Bb"], strings: [6, 5, 4] },
        { rounds: 4, passScore: 0.75, hint: "Find the tonic first, then follow W W H W W W H up and down the string." },
      ),
    ]),
  ],
};
