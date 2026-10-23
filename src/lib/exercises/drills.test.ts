/**
 * Drill generators, checked against hand-written references rather than the engine that
 * produced them. Fretboard items are also run through their own validators.
 */
import { describe, expect, it } from "vitest";
import { resolveFretboard } from "@/lib/fretboard";
import { parseVoicing, voicingPositions } from "@/lib/theory";
import { type DrillExercise, type DrillGenerator, type DrillItem, generateDrillItem, seededRng, validate } from ".";

const OPEN_MIDI: Record<number, number> = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };
const NAMES = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"];
const midiOf = (p: { string: number; fret: number }) => OPEN_MIDI[p.string]! + p.fret;
const SIZES: Record<string, number> = {
  "Minor second": 1,
  "Major second": 2,
  "Minor third": 3,
  "Major third": 4,
  "Perfect fourth": 5,
  "Augmented fourth": 6,
  "Diminished fifth": 6,
  "Perfect fifth": 7,
  "Minor sixth": 8,
  "Major sixth": 9,
  "Minor seventh": 10,
  "Major seventh": 11,
  Octave: 12,
};
const MAJOR_SCALES: Record<string, string[]> = {
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F♯"],
  D: ["D", "E", "F♯", "G", "A", "B", "C♯"],
  F: ["F", "G", "A", "B♭", "C", "D", "E"],
  "B♭": ["B♭", "C", "D", "E♭", "F", "G", "A"],
};
const ROOT_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function drill(generator: DrillGenerator): DrillExercise {
  return { id: "t", kind: "drill", prompt: "", generator, rounds: 5, passScore: 0.8 };
}

function sample(generator: DrillGenerator, n = 150, seed = 42): DrillItem[] {
  const rng = seededRng(seed);
  return Array.from({ length: n }, (_, i) => generateDrillItem(drill(generator), i, rng));
}

function solves(item: DrillItem) {
  if (item.kind !== "fretboard") return;
  const model = resolveFretboard(item.board);
  const result = validate(item.rule, { tuning: model.tuning, selection: item.solution, range: model.range });
  expect(result.correct, `${item.prompt}: ${result.issues.map((i) => i.message).join("; ")}`).toBe(true);
}

describe("drill generators", () => {
  it("is deterministic for a given seed", () => {
    const g: DrillGenerator = { type: "note-location", strings: [6, 5] };
    expect(sample(g, 10, 7)).toEqual(sample(g, 10, 7));
  });

  it("note-naming answers match the reference fretboard chart", () => {
    for (const item of sample({ type: "note-naming", strings: [1, 2, 3, 4, 5, 6], range: { start: 0, end: 12 } })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const pos = item.board!.positions![0]!;
      expect(item.answer).toBe(NAMES[midiOf(pos) % 12]);
    }
  });

  it("naturals-only naming never shows accidentals", () => {
    for (const item of sample({ type: "note-naming", strings: [1, 2, 3, 4, 5, 6], range: { start: 0, end: 12 }, naturalsOnly: true })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      for (const c of item.choices) expect(c.label).toMatch(/^[A-G]$/);
    }
  });

  it("note-location solutions are the requested note on the requested string", () => {
    for (const item of sample({ type: "note-location", strings: [1, 2, 3, 4, 5, 6] })) {
      if (item.kind !== "fretboard") throw new Error("expected fretboard");
      solves(item);
      const letter = /\*\*([A-G])/.exec(item.prompt)![1]!;
      for (const pos of item.solution) expect(midiOf(pos) % 12).toBe(ROOT_PC[letter]);
    }
  });

  it("interval-recognition answers match the half-step distance on the board", () => {
    const g: DrillGenerator = {
      type: "interval-recognition",
      intervals: ["m2", "M2", "m3", "M3", "P4", "P5", "m6", "M6", "m7", "M7", "P8"],
      rootStrings: [6, 5],
      rootRange: { start: 0, end: 7 },
      boardRange: { start: 0, end: 12 },
    };
    for (const item of sample(g)) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const [root, other] = item.board!.positions!;
      expect(SIZES[item.answer]).toBe(midiOf(other!) - midiOf(root!));
      // No distractor may sound identical to the answer.
      for (const c of item.choices) if (c.id !== item.answer) expect(SIZES[c.label]).not.toBe(SIZES[item.answer]);
    }
  });

  it("interval-construction solutions are the right distance above the root", () => {
    const sizes: Record<string, number> = { m3: 3, M3: 4, P4: 5, P5: 7, P8: 12 };
    for (const item of sample({ type: "interval-construction", intervals: ["m3", "M3", "P4", "P5", "P8"], rootStrings: [6, 5, 4, 3], rootRange: { start: 0, end: 7 }, boardRange: { start: 0, end: 12 } })) {
      if (item.kind !== "fretboard" || item.rule.type !== "interval") throw new Error("expected interval item");
      solves(item);
      expect(midiOf(item.solution[0]!) - midiOf(item.rule.from)).toBe(sizes[item.rule.interval]);
    }
  });

  it("chord-construction solutions contain exactly the triad's notes and honour the inversion", () => {
    const g: DrillGenerator = {
      type: "chord-construction",
      roots: ["C", "G", "D", "A", "E", "F"],
      qualities: ["major", "minor"],
      stringGroups: [[3, 2, 1], [4, 3, 2], [5, 4, 3]],
      inversions: ["root-position", "first-inversion", "second-inversion"],
      range: { start: 0, end: 12 },
    };
    for (const item of sample(g)) {
      if (item.kind !== "fretboard" || item.rule.type !== "chord") throw new Error("expected chord item");
      solves(item);
      const rootPc = ROOT_PC[item.rule.chord.root]!;
      const third = item.rule.chord.quality === "major" ? 4 : 3;
      const expected = new Set([rootPc, (rootPc + third) % 12, (rootPc + 7) % 12]);
      const pcs = new Set(item.solution.map((p) => midiOf(p) % 12));
      expect(pcs).toEqual(expected);
      const bass = Math.min(...item.solution.map(midiOf)) % 12;
      const bassByInversion: Record<string, number> = {
        "root-position": rootPc,
        "first-inversion": (rootPc + third) % 12,
        "second-inversion": (rootPc + 7) % 12,
      };
      const wantBass = bassByInversion[item.rule.inversion!];
      expect(bass).toBe(wantBass);
      for (const p of item.solution) expect(item.rule.strings).toContain(p.string);
    }
  });

  it("inversion-recognition answers match the bass note of the shown voicing", () => {
    for (const item of sample({ type: "inversion-recognition", roots: ["C", "G", "D", "A", "E", "F"], qualities: ["major", "minor"], stringGroups: [[3, 2, 1], [4, 3, 2]], range: { start: 0, end: 12 } })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const chord = item.board!.chord!;
      const positions = voicingPositions(parseVoicing(chord.voicing!));
      const rootPc = ROOT_PC[chord.root]!;
      const third = chord.quality === "major" ? 4 : 3;
      const bassInterval = (Math.min(...positions.map(midiOf)) - rootPc + 120) % 12;
      const expected = { 0: "root-position", [third]: "first-inversion", 7: "second-inversion" }[bassInterval];
      expect(item.answer).toBe(expected);
    }
  });

  it("chord-recognition boards contain exactly the answer chord's notes", () => {
    for (const item of sample({ type: "chord-recognition", roots: ["C", "D", "E", "F", "G", "A"], qualities: ["major", "minor"], range: { start: 0, end: 12 } })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const chord = item.board!.chord!;
      expect(item.answer).toBe(`${chord.root} ${chord.quality}`);
      const rootPc = ROOT_PC[chord.root]!;
      const third = chord.quality === "major" ? 4 : 3;
      const pcs = new Set(voicingPositions(parseVoicing(chord.voicing!)).map((p) => midiOf(p) % 12));
      expect(pcs).toEqual(new Set([rootPc, (rootPc + third) % 12, (rootPc + 7) % 12]));
    }
  });

  it("scale-degree answers match the reference major scales", () => {
    for (const item of sample({ type: "scale-degree", scale: "major", roots: ["C", "G", "D", "F", "Bb"] })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const [, degree, key] = /\*\*(\d)\w+ degree\*\* of (\S+) major/.exec(item.prompt)!;
      expect(item.answer).toBe(MAJOR_SCALES[key!]![Number(degree) - 1]);
    }
  });

  it("scale-roots items ask for every root and nothing else in the window", () => {
    for (const item of sample({ type: "scale-roots", scale: "minor-pentatonic", roots: ["A", "E", "G", "D", "C", "B"], positions: [1, 2, 3, 4, 5] })) {
      if (item.kind !== "fretboard") throw new Error("expected fretboard");
      solves(item);
      expect(item.solution.length).toBeGreaterThanOrEqual(2);
    }
    for (const item of sample({ type: "scale-roots", scale: "major-pentatonic", roots: ["C", "G", "D", "F", "A"], positions: [1, 2, 3, 4, 5] })) solves(item);
  });

  it("scale-on-string solutions spell the scale once per pitch class", () => {
    for (const item of sample({ type: "scale-on-string", scales: ["major", "natural-minor"], roots: ["C", "D", "E", "F", "G", "A", "Bb"], strings: [6, 5, 4, 3, 2, 1] })) {
      if (item.kind !== "fretboard") throw new Error("expected fretboard");
      solves(item);
      expect(new Set(item.solution.map((p) => midiOf(p) % 12)).size).toBe(7);
      expect(item.solution).toHaveLength(7);
    }
  });

  it("diatonic-chord answers match a hand-written harmony chart", () => {
    // Chord names per key, degree 1..7 (standard tables, not computed).
    const CHART: Record<string, string[]> = {
      "C major": ["C major", "D minor", "E minor", "F major", "G major", "A minor", "B diminished"],
      "G major": ["G major", "A minor", "B minor", "C major", "D major", "E minor", "F♯ diminished"],
      "F major": ["F major", "G minor", "A minor", "B♭ major", "C major", "D minor", "E diminished"],
      "A minor": ["A minor", "B diminished", "C major", "D minor", "E minor", "F major", "G major"],
      "E minor": ["E minor", "F♯ diminished", "G major", "A minor", "B minor", "C major", "D major"],
    };
    const NUMERALS: Record<string, string[]> = {
      major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
      minor: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
    };
    for (const scale of ["major", "natural-minor"] as const) {
      const keys = scale === "major" ? ["C", "G", "F"] : ["A", "E"];
      for (const item of sample({ type: "diatonic-chord", keys, scale, ask: "mixed" })) {
        if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
        const keyLabel = /[Ii]n ([A-G][♯♭]? (?:major|minor))/.exec(item.prompt)![1]!;
        const names = CHART[keyLabel]!;
        const numerals = NUMERALS[scale === "major" ? "major" : "minor"]!;
        const asked = /\*\*([^*]+)\*\* chord in/.exec(item.prompt);
        if (asked) expect(item.answer).toBe(names[numerals.indexOf(asked[1]!)]);
        else {
          const chordAsked = /\*\*([^*]+)\*\* is which chord/.exec(item.prompt)![1]!;
          expect(item.answer).toBe(numerals[names.indexOf(chordAsked)]);
        }
      }
    }
  });

  it("diatonic-construction asks for the right chord and its solution plays it", () => {
    const C_MAJOR_TRIADS: Record<string, string> = { I: "C major", IV: "F major", V: "G major", vi: "A minor" };
    for (const item of sample({ type: "diatonic-construction", keys: ["C"], scale: "major", range: { start: 0, end: 12 } })) {
      if (item.kind !== "fretboard" || item.rule.type !== "chord") throw new Error("expected chord item");
      solves(item);
      const numeral = /\*\*([^*]+)\*\*/.exec(item.prompt)![1]!;
      expect(`${item.rule.chord.root} ${item.rule.chord.quality}`).toBe(C_MAJOR_TRIADS[numeral]);
    }
  });

  it("CAGED items use the named shape, moved to the right root", () => {
    // Open shapes and their root pitch classes, written out by hand.
    const OPEN: Record<string, { frets: (number | null)[]; rootPc: number }> = {
      C: { frets: [null, 3, 2, 0, 1, 0], rootPc: 0 },
      A: { frets: [null, 0, 2, 2, 2, 0], rootPc: 9 },
      G: { frets: [3, 2, 0, 0, 0, 3], rootPc: 7 },
      E: { frets: [0, 2, 2, 1, 0, 0], rootPc: 4 },
      D: { frets: [null, null, 0, 2, 3, 2], rootPc: 2 },
    };
    for (const item of sample({ type: "caged-identification", roots: ["C", "D", "E", "F", "G", "A", "B"] })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const shapeName = item.answer.charAt(0);
      const offset = (ROOT_PC[item.board!.chord!.root]! - OPEN[shapeName]!.rootPc + 12) % 12;
      const expected = OPEN[shapeName]!.frets.map((f) => (f === null ? null : f + offset));
      expect(parseVoicing(item.board!.chord!.voicing!).frets).toEqual(expected);
    }
    for (const item of sample({ type: "caged-construction", roots: ["C", "D", "E", "F", "G", "A", "B"] })) solves(item);
    for (const item of sample({ type: "caged-construction", roots: ["C", "D", "E", "G", "A"], quality: "minor" })) solves(item);
  });

  it("chord recognition distinguishes seventh chords", () => {
    const FORMULA = { major7: [0, 4, 7, 11], dominant7: [0, 4, 7, 10], minor7: [0, 3, 7, 10] } as const;
    for (const item of sample({ type: "chord-recognition", roots: ["C", "D", "E", "G", "A"], qualities: ["major7", "dominant7", "minor7"], range: { start: 0, end: 12 } })) {
      if (item.kind !== "multiple-choice") throw new Error("expected multiple choice");
      const chord = item.board!.chord!;
      const rootPc = ROOT_PC[chord.root]!;
      const pcs = new Set(voicingPositions(parseVoicing(chord.voicing!)).map((p) => midiOf(p) % 12));
      expect(pcs).toEqual(new Set(FORMULA[chord.quality as keyof typeof FORMULA].map((i) => (rootPc + i) % 12)));
    }
  });
});
