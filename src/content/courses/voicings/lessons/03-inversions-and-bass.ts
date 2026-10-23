import type { Lesson } from "@/lib/courses";
import { BUILD, choice, drill, exercise, generatedVoicings, shape, step, text, voicingBoard } from "@/content/helpers";

const C = { root: "C", quality: "major" } as const;
const D = { root: "D", quality: "major" } as const;
const G = { root: "G", quality: "major" } as const;

const gFirstInversion = generatedVoicings(G, { range: { start: 0, end: 7 }, inversion: "first-inversion", limit: 1 })[0]!;

export const inversionsAndBass: Lesson = {
  id: "inversions-and-bass",
  title: "Inversions and the Bass Note",
  summary: "The lowest note gives a voicing its foundation, and its name.",
  kind: "lesson",
  estimatedMinutes: 10,
  objectives: [
    "Find the bass (lowest) note of any voicing",
    "Name root position, first and second inversion",
    "Read slash-chord names like C/E",
  ],
  prerequisites: ["doubling"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("bass", "The note at the bottom", [
      text(`
        The **bass note** is the lowest note sounding. It shapes the whole chord, so it decides the voicing's **inversion**:

        - **Root position**: the root is lowest.
        - **First inversion**: the third is lowest.
        - **Second inversion**: the fifth is lowest.

        Chord charts show inversions as **slash chords**: **C/E** means "C major with E in the bass". On guitar, the bass note is usually on the lowest string that's played, but always check which note is *lowest in pitch*.
      `),
      {
        type: "compare",
        items: [
          { title: "C", board: voicingBoard(C, "x32010"), note: "Root position: C in the bass" },
          { title: "C/E", board: voicingBoard(C, "032010"), note: "First inversion: E in the bass" },
          { title: "C/G", board: voicingBoard(C, "332010"), note: "Second inversion: G in the bass" },
        ],
        caption: "Adding one bass note to the open C chord creates each inversion.",
      },
    ]),
    step("practice", "Practice", [
      exercise({
        id: "bass-of-d-over-f-sharp",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap the **bass note** of this D major voicing.",
        hint: "The lowest-pitched note, usually on the thickest string that's played.",
        board: voicingBoard(D, "2x0232", { labels: "none", roles: false }),
        selection: "single",
        selectableOnlyMarkers: true,
        rule: { type: "exact-positions", positions: [{ string: 6, fret: 2 }], context: { chord: D } },
        solution: [{ string: 6, fret: 2 }],
      }),
      choice(
        "d-over-f-sharp-inversion",
        "That D chord has F♯ in the bass. Which inversion is it?",
        [
          ["first", "First inversion (D/F♯)"],
          ["root", "Root position", "Root position needs D in the bass."],
          ["second", "Second inversion", "Second inversion has the fifth (A) in the bass. F♯ is the third."],
        ],
        "first",
      ),
      exercise({
        id: "g-first-inversion",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **G major in first inversion**: the third (B) must be the lowest note.",
        hint: "B is fret 2 on the A string. Leave the low E string unplayed.",
        board: { range: { start: 0, end: 7 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: G, inversion: "first-inversion" },
        solution: shape(gFirstInversion),
      }),
      drill(
        "inversion-drill",
        "Name the inversion of triads on the higher strings.",
        { type: "inversion-recognition", roots: ["C", "G", "D", "A", "E", "F"], qualities: ["major", "minor"], stringGroups: [[3, 2, 1], [4, 3, 2]], range: { start: 0, end: 12 } },
        { rounds: 8, hint: "Find the lowest note, then ask: is it the root, the third or the fifth?" },
      ),
    ]),
  ],
};
