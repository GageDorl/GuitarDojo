import type { Lesson } from "@/lib/courses";
import { type ChordQualityId, COMMON_VOICINGS } from "@/lib/theory";
import { BUILD, callout, choice, drill, exercise, shape, step, text, voicingBoard } from "@/content/helpers";

/** Open-chord voicings come from the engine's verified voicing library, not hand-typed shapes. */
const open = (symbol: string) => {
  const minor = symbol.endsWith("m");
  const chord = { root: minor ? symbol.slice(0, -1) : symbol, quality: (minor ? "minor" : "major") as ChordQualityId };
  return { title: COMMON_VOICINGS[symbol]!.name, board: voicingBoard(chord, COMMON_VOICINGS[symbol]!.shapes[0]!) };
};

export const openChords: Lesson = {
  id: "open-chords",
  title: "The Open Chord Family",
  summary: "The first chords most guitarists learn, seen as voicings: which notes, which doubles, which bass.",
  kind: "lesson",
  estimatedMinutes: 11,
  objectives: [
    "Read the common open chords as voicings of triads",
    "Recognise major and minor open shapes by their notes",
    "Build open chords from their chord tones",
  ],
  prerequisites: ["string-groups"],
  completion: { type: "all-exercises-solved" },
  steps: [
    step("family", "Five majors, three minors", [
      text(`
        **Open chords** use open strings as chord tones, which makes them easy to play and gives them a ringing sound. Every one of these is a voicing of a triad, almost always in **root position**, with doubled notes filling out the strings.
      `),
      { type: "compare", items: ["C", "A", "G", "E", "D"].map(open), caption: "The open major chords. Look for where the third (3) sits in each." },
      { type: "compare", items: ["Am", "Em", "Dm"].map(open), caption: "Open minor chords: the third becomes ♭3." },
      callout("guitar", "Play E then Em, A then Am, D then Dm. In each pair only the third moves, down one fret.", "Hear the pairs"),
    ]),
    step("practice", "Practice", [
      choice(
        "identify-am-shape",
        "Which chord is this?",
        [
          ["am", "A minor"],
          ["a", "A major", "A major has C♯ on the B string (fret 2). This has C (fret 1)."],
          ["c", "C major", "The lowest note is A, and there's no G: A, C and E make A minor."],
        ],
        "am",
        { board: voicingBoard({ root: "A", quality: "minor" }, "x02210", { labels: "note", roles: false }) },
      ),
      exercise({
        id: "build-e-minor-open",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **E minor** near the nut.",
        hint: "E minor is E, G and B. Four of the six open strings are in it.",
        board: { range: { start: 0, end: 4 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "E", quality: "minor" } },
        solution: shape(COMMON_VOICINGS.Em!.shapes[0]!),
      }),
      exercise({
        id: "build-d-major-open",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **D major** near the nut.",
        hint: "D, F♯, A. The open D string is the root.",
        board: { range: { start: 0, end: 4 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: { root: "D", quality: "major" } },
        solution: shape(COMMON_VOICINGS.D!.shapes[0]!),
      }),
      drill(
        "recognise-near-nut",
        "Name chords played near the nut.",
        { type: "chord-recognition", roots: ["C", "A", "G", "E", "D"], qualities: ["major", "minor"], range: { start: 0, end: 4 } },
        { rounds: 8, hint: "Find the root, then check the third: 4 half steps above the root is major, 3 is minor." },
      ),
    ]),
  ],
};
