import type { Lesson } from "@/lib/courses";
import { type CagedShape, CAGED_ORDER } from "@/lib/theory";
import { NECK, board, caged, callout, choice, exercise, step, text, voicingBoard } from "@/content/helpers";

const C = { root: "C", quality: "major" } as const;
const FRETS: Record<CagedShape, string> = { C: "open", A: "fret 3", G: "fret 5", E: "fret 8", D: "fret 10" };

export const cagedSequence: Lesson = {
  id: "caged-sequence",
  title: "The CAGED Sequence",
  summary: "One chord, five shapes, linked in a fixed order all the way up the neck.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Play C major in all five shapes",
    "Recite the order C–A–G–E–D and know that it repeats",
    "See how neighbouring shapes share chord tones",
  ],
  prerequisites: ["moving-shapes"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("sequence", "C major, five ways", [
      text(`
        Play C major with each shape in turn, moving up the neck. The shapes always come in the same order:

        **C → A → G → E → D**, then back to C an octave higher.

        Each shape **overlaps** the next: the top of one shape uses the same chord tones as the bottom of the next. That overlap is what turns five separate chords into one connected map of the neck.
      `),
      {
        type: "demo",
        title: "C major up the neck",
        board: { labels: "interval", layout: { mobile: "chord", desktop: "chord" } },
        frames: CAGED_ORDER.map((s) => ({
          caption: `**${s} shape** (${FRETS[s]}).`,
          board: voicingBoard(C, caged(s, "C")),
        })),
      },
      board(
        { chord: C, range: { start: 0, end: 15 }, labels: "interval", layout: NECK },
        "Every C, E and G up to fret 15. The five shapes are just five neighbouring groups of these notes.",
      ),
      callout("guitar", "Play the five C shapes slowly from the nut upward, then back down. Listen: it's always C major, getting brighter as you climb.", "Climb the neck"),
    ]),
    step("practice", "Practice", [
      choice(
        "after-a",
        "Moving up the neck, which shape comes after the A shape?",
        [
          ["g", "The G shape"],
          ["c", "The C shape", "C comes *before* A: C–A–G–E–D."],
          ["e", "The E shape", "E comes after G."],
        ],
        "g",
      ),
      choice(
        "after-d",
        "What comes after the D shape?",
        [
          ["c", "The C shape again, an octave higher"],
          ["e", "The E shape", "E comes before D. After D the sequence starts again."],
          ["nothing", "Nothing: D is the last shape", "The sequence repeats every 12 frets."],
        ],
        "c",
      ),
      exercise({
        id: "roots-g-shape-c",
        kind: "fretboard",
        task: "identify",
        prompt: "This is C major with the **G shape**. Tap **every root (C)**.",
        hint: "There are three, on the two E strings and the G string.",
        board: voicingBoard(C, caged("G", "C"), { labels: "none", roles: false }),
        selection: "multi",
        selectableOnlyMarkers: true,
        rule: {
          type: "exact-positions",
          positions: [
            { string: 6, fret: 8 },
            { string: 3, fret: 5 },
            { string: 1, fret: 8 },
          ],
          context: { chord: C },
        },
        solution: [
          { string: 6, fret: 8 },
          { string: 3, fret: 5 },
          { string: 1, fret: 8 },
        ],
      }),
    ]),
  ],
};
