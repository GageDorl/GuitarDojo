import type { Lesson } from "@/lib/courses";
import { BUILD, NECK, choice, drill, exercise, generatedVoicings, shape, step, text, voicingBoard } from "@/content/helpers";

const G = { root: "G", quality: "major" } as const;
const DM = { root: "D", quality: "minor" } as const;
const C = { root: "C", quality: "major" } as const;

const dmFirst = generatedVoicings(DM, { range: { start: 0, end: 10 }, inversion: "first-inversion", limit: 1 })[0]!;
const c321 = generatedVoicings(C, { strings: [3, 2, 1], range: { start: 0, end: 12 }, minStrings: 3, limit: 1 })[0]!;

export const voicingsCheckpoint: Lesson = {
  id: "voicings-checkpoint",
  title: "Checkpoint: Voicings and Inversions",
  summary: "Recognise, name and build voicings and inversions across the neck.",
  kind: "assessment",
  estimatedMinutes: 12,
  objectives: ["Explain voicings and inversions", "Identify bass notes", "Build chords on string groups and with moveable shapes"],
  prerequisites: ["connecting-shapes"],
  completion: { type: "min-score", score: 0.75 },
  steps: [
    step("intro", "Before you start", [text("**Eight questions**, first attempts only; **6 of 8** to pass. Drills count when passed on the first run.")]),
    step("concepts", "Concepts", [
      choice(
        "c-voicing-def",
        "What is a chord voicing?",
        [
          ["arrangement", "A particular arrangement of a chord's notes on the instrument"],
          ["new-chord", "A different chord with similar notes", "A voicing is the *same* chord, arranged differently."],
          ["inversion-only", "Another word for inversion", "Inversion describes only the bass note. Voicing covers the whole arrangement."],
        ],
        "arrangement",
      ),
      choice(
        "c-c-over-e",
        "C/E is which inversion of C major?",
        [
          ["first", "First inversion"],
          ["second", "Second inversion", "E is the third of C, so E in the bass is first inversion."],
          ["root", "Root position", "Root position has C in the bass."],
        ],
        "first",
      ),
      choice(
        "c-e-shape-7",
        "An E-shape major barre at fret 7 is which chord?",
        [
          ["b", "B major"],
          ["a", "A major", "A is fret 5 on the low E string."],
          ["e", "E major", "Named after the note under the barre: low E string fret 7 is B."],
        ],
        "b",
      ),
    ]),
    step("fretboard", "On the fretboard", [
      exercise({
        id: "c-bass-g-over-b",
        kind: "fretboard",
        task: "identify",
        prompt: "Tap the **bass note** of this G major voicing.",
        board: voicingBoard(G, "x20003", { labels: "none", roles: false }),
        selection: "single",
        selectableOnlyMarkers: true,
        rule: { type: "exact-positions", positions: [{ string: 5, fret: 2 }], context: { chord: G } },
        solution: [{ string: 5, fret: 2 }],
      }),
      exercise({
        id: "c-dm-first",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **D minor in first inversion** (F in the bass).",
        board: { range: { start: 0, end: 10 }, labels: "none", layout: BUILD },
        selection: "per-string",
        rule: { type: "chord", chord: DM, inversion: "first-inversion" },
        solution: shape(dmFirst),
      }),
      exercise({
        id: "c-c-top-strings",
        kind: "fretboard",
        task: "construct",
        prompt: "Build **C major** on strings **3, 2 and 1**.",
        board: { range: { start: 0, end: 12 }, labels: "none", strings: [3, 2, 1], layout: NECK },
        selection: "per-string",
        rule: { type: "chord", chord: C, strings: [3, 2, 1] },
        solution: shape(c321),
      }),
      drill(
        "c-inversion-drill",
        "Name inversions.",
        { type: "inversion-recognition", roots: ["C", "G", "D", "A", "F"], qualities: ["major", "minor"], stringGroups: [[3, 2, 1], [4, 3, 2]], range: { start: 0, end: 12 } },
        { rounds: 6, passScore: 0.83 },
      ),
      drill(
        "c-build-drill",
        "Build triads on string groups.",
        { type: "chord-construction", roots: ["C", "G", "D", "A", "E"], qualities: ["major", "minor"], stringGroups: [[3, 2, 1], [4, 3, 2]], range: { start: 0, end: 12 } },
        { rounds: 5, passScore: 0.8 },
      ),
    ]),
  ],
};
