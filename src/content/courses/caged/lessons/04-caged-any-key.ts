import type { Lesson } from "@/lib/courses";
import { type CagedShape } from "@/lib/theory";
import { caged, callout, choice, drill, step, text, voicingBoard } from "@/content/helpers";

const G = { root: "G", quality: "major" } as const;
const G_ORDER: CagedShape[] = ["G", "E", "D", "C", "A"];

export const cagedAnyKey: Lesson = {
  id: "caged-any-key",
  title: "CAGED in Any Key",
  summary: "The order never changes; only the starting shape does.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Find which shape is at the nut for a given chord",
    "Continue the sequence from any starting shape",
    "Recognise shapes in any key",
  ],
  prerequisites: ["caged-sequence"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("start", "Same order, different start", [
      text(`
        For C major the sequence starts with the C shape at the nut. For other chords it starts somewhere else in the cycle, but the order is always **C–A–G–E–D**, wrapping around:

        - **G major** starts with the open **G** shape: G → E → D → C → A
        - **E major** starts with the open **E** shape: E → D → C → A → G
        - **A major** starts with the open **A** shape: A → G → E → D → C

        So for any chord: start with whichever open shape *is* that chord (or the nearest one), then keep going in CAGED order.
      `),
      {
        type: "demo",
        title: "G major up the neck",
        board: { labels: "interval", layout: { mobile: "chord", desktop: "chord" } },
        frames: G_ORDER.map((s, i) => ({
          caption: `**${s} shape**${i === 0 ? " at the nut: the open G chord" : ""}.`,
          board: voicingBoard(G, caged(s, "G")),
        })),
      },
      callout("tip", "If you know where a chord's root is on the low E and A strings, you know where its E shape and A shape are. The other three fill the gaps.", "Anchor on E and A"),
    ]),
    step("practice", "Practice", [
      choice(
        "g-at-nut",
        "For G major, which shape is played at the nut?",
        [
          ["g", "The G shape"],
          ["c", "The C shape", "The C shape at the nut is C major."],
          ["e", "The E shape", "The E shape for G is at fret 3."],
        ],
        "g",
      ),
      choice(
        "e-shape-g-fret",
        "Where is the E-shape G major chord?",
        [
          ["3", "At fret 3"],
          ["5", "At fret 5", "The E shape's root is on the low E string: G is at fret 3."],
          ["10", "At fret 10", "Fret 10 on the A string is G, which is where the A shape goes."],
        ],
        "3",
      ),
      choice(
        "after-e-for-g",
        "Playing G major up the neck, which shape follows the E shape?",
        [
          ["d", "The D shape"],
          ["g", "The G shape", "G comes *before* E in C–A–G–E–D."],
          ["c", "The C shape", "C follows D."],
        ],
        "d",
      ),
      drill(
        "identify-shapes-any-key",
        "Name the shape, in any key.",
        { type: "caged-identification", roots: ["C", "D", "E", "F", "G", "A", "B", "Bb"] },
        { rounds: 8 },
      ),
    ]),
  ],
};
