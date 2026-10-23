/**
 * Independent reference cases. Every expected value here is written out by hand from standard
 * music-theory tables, NOT computed with the engine, so these tests catch errors that
 * self-consistency checks (content answers vs. validators) cannot.
 */
import { describe, expect, it } from "vitest";
import { PENTATONIC_POSITION_OFFSETS, pentatonicPositionRange, lowStringFret, rangeForVoicing } from "@/lib/fretboard";
import {
  STANDARD_TUNING,
  buildChord,
  buildScale,
  intervalBetween,
  intervalCode,
  midiAt,
  noteName,
  parseNote,
  parseVoicing,
  pitchClassAt,
  relativeMajor,
  relativeMinor,
  shiftVoicing,
  spellPitchClass,
  transpose,
  voicingInversion,
  voicingMatchesChord,
  voicingShape,
} from ".";

const ascii = (notes: { letter: string; accidental: number }[]) =>
  notes.map((n) => noteName(n as Parameters<typeof noteName>[0], { ascii: true })).join(" ");

/** Standard tuning, frets 0–12, sharp spellings. */
const FRETBOARD: Record<number, string> = {
  6: "E F F# G G# A A# B C C# D D# E",
  5: "A A# B C C# D D# E F F# G G# A",
  4: "D D# E F F# G G# A A# B C C# D",
  3: "G G# A A# B C C# D D# E F F# G",
  2: "B C C# D D# E F F# G G# A A# B",
  1: "E F F# G G# A A# B C C# D D# E",
};

/** Open-string MIDI numbers in standard tuning (E2 A2 D3 G3 B3 E4). */
const OPEN_MIDI: Record<number, number> = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };

const MAJOR_SCALES: Record<string, string> = {
  C: "C D E F G A B",
  G: "G A B C D E F#",
  D: "D E F# G A B C#",
  A: "A B C# D E F# G#",
  E: "E F# G# A B C# D#",
  B: "B C# D# E F# G# A#",
  "F#": "F# G# A# B C# D# E#",
  "C#": "C# D# E# F# G# A# B#",
  F: "F G A Bb C D E",
  Bb: "Bb C D Eb F G A",
  Eb: "Eb F G Ab Bb C D",
  Ab: "Ab Bb C Db Eb F G",
  Db: "Db Eb F Gb Ab Bb C",
  Gb: "Gb Ab Bb Cb Db Eb F",
  Cb: "Cb Db Eb Fb Gb Ab Bb",
};

const NATURAL_MINOR_SCALES: Record<string, string> = {
  A: "A B C D E F G",
  E: "E F# G A B C D",
  B: "B C# D E F# G A",
  "F#": "F# G# A B C# D E",
  "C#": "C# D# E F# G# A B",
  D: "D E F G A Bb C",
  G: "G A Bb C D Eb F",
  C: "C D Eb F G Ab Bb",
  F: "F G Ab Bb C Db Eb",
};

const MAJOR_PENTATONIC: Record<string, string> = {
  C: "C D E G A",
  G: "G A B D E",
  D: "D E F# A B",
  E: "E F# G# B C#",
  F: "F G A C D",
};

const MINOR_PENTATONIC: Record<string, string> = {
  A: "A C D E G",
  E: "E G A B D",
  D: "D F G A C",
  G: "G Bb C D F",
  B: "B D E F# A",
  C: "C Eb F G Bb",
};

/** Relative major → minor. */
const RELATIVE_KEYS: [string, string][] = [
  ["C", "A"],
  ["G", "E"],
  ["D", "B"],
  ["A", "F#"],
  ["E", "C#"],
  ["F", "D"],
  ["Bb", "G"],
  ["Eb", "C"],
];

/** Intervals above C and E, by quality code. */
const INTERVALS_ABOVE: Record<string, Record<string, string>> = {
  C: {
    m2: "Db",
    M2: "D",
    m3: "Eb",
    M3: "E",
    P4: "F",
    A4: "F#",
    d5: "Gb",
    P5: "G",
    A5: "G#",
    m6: "Ab",
    M6: "A",
    m7: "Bb",
    M7: "B",
    P8: "C",
  },
  E: { m2: "F", M2: "F#", m3: "G", M3: "G#", P4: "A", P5: "B", m6: "C", M6: "C#", m7: "D", M7: "D#" },
};

const TRIADS: [string, "major" | "minor", string][] = [
  ["G", "major", "G B D"],
  ["G", "minor", "G Bb D"],
  ["B", "major", "B D# F#"],
  ["B", "minor", "B D F#"],
  ["F", "major", "F A C"],
  ["F", "minor", "F Ab C"],
  ["Eb", "major", "Eb G Bb"],
  ["C#", "minor", "C# E G#"],
  ["Ab", "major", "Ab C Eb"],
];

/** A minor pentatonic, five positions, frets per string (high E first … low E last) — written out from a reference chart. */
const A_MINOR_PENTATONIC_POSITIONS: Record<number, Record<number, [number, number]>> = {
  1: { 1: [5, 8], 2: [5, 8], 3: [5, 7], 4: [5, 7], 5: [5, 7], 6: [5, 8] },
  2: { 1: [8, 10], 2: [8, 10], 3: [7, 9], 4: [7, 10], 5: [7, 10], 6: [8, 10] },
  3: { 1: [10, 12], 2: [10, 13], 3: [9, 12], 4: [10, 12], 5: [10, 12], 6: [10, 12] },
  4: { 1: [12, 15], 2: [13, 15], 3: [12, 14], 4: [12, 14], 5: [12, 15], 6: [12, 15] },
  5: { 1: [15, 17], 2: [15, 17], 3: [14, 17], 4: [14, 17], 5: [15, 17], 6: [15, 17] },
};

describe("reference: fretboard note names", () => {
  it("matches the standard-tuning chart for frets 0–12", () => {
    for (const [string, row] of Object.entries(FRETBOARD)) {
      const names = row.split(" ");
      names.forEach((name, fret) => {
        const pos = { string: Number(string), fret };
        expect(noteName(spellPitchClass(pitchClassAt(STANDARD_TUNING, pos)), { ascii: true }), `${string}:${fret}`).toBe(name);
        expect(midiAt(STANDARD_TUNING, pos)).toBe(OPEN_MIDI[Number(string)]! + fret);
      });
    }
  });
});

describe("reference: scales", () => {
  it.each(Object.entries(MAJOR_SCALES))("%s major", (key, notes) => {
    expect(ascii([...buildScale(key, "major").degrees.map((d) => d.note)])).toBe(notes);
  });
  it.each(Object.entries(NATURAL_MINOR_SCALES))("%s natural minor", (key, notes) => {
    expect(ascii([...buildScale(key, "natural-minor").degrees.map((d) => d.note)])).toBe(notes);
  });
  it.each(Object.entries(MAJOR_PENTATONIC))("%s major pentatonic", (key, notes) => {
    expect(ascii([...buildScale(key, "major-pentatonic").degrees.map((d) => d.note)])).toBe(notes);
  });
  it.each(Object.entries(MINOR_PENTATONIC))("%s minor pentatonic", (key, notes) => {
    expect(ascii([...buildScale(key, "minor-pentatonic").degrees.map((d) => d.note)])).toBe(notes);
  });
  it.each(RELATIVE_KEYS)("%s major ↔ %s minor", (major, minor) => {
    expect(noteName(relativeMinor(major), { ascii: true })).toBe(minor);
    expect(noteName(relativeMajor(minor), { ascii: true })).toBe(major);
  });
});

describe("reference: intervals and triads", () => {
  it.each(Object.entries(INTERVALS_ABOVE))("intervals above %s", (root, table) => {
    for (const [code, expected] of Object.entries(table)) {
      expect(noteName(transpose(parseNote(root), code), { ascii: true }), code).toBe(expected);
      if (code !== "P8") expect(intervalCode(intervalBetween(parseNote(root), parseNote(expected))), code).toBe(code);
    }
  });
  it.each(TRIADS)("%s %s", (root, quality, notes) => {
    expect(ascii([...buildChord(root, quality).tones.map((t) => t.note)])).toBe(notes);
  });
});

describe("reference: voicings", () => {
  it("moves open shapes into known barre chords", () => {
    expect(voicingShape(shiftVoicing(parseVoicing("022100"), 1))).toBe("133211"); // F
    expect(voicingShape(shiftVoicing(parseVoicing("022100"), 3))).toBe("355433"); // G
    expect(voicingShape(shiftVoicing(parseVoicing("x02220"), 3))).toBe("x35553"); // C
    expect(voicingShape(shiftVoicing(parseVoicing("x02210"), 2))).toBe("x24432"); // Bm
    expect(voicingShape(shiftVoicing(parseVoicing("022000"), 5))).toBe("577555"); // Am
    for (const [shape, root, q] of [
      ["133211", "F", "major"],
      ["355433", "G", "major"],
      ["x35553", "C", "major"],
      ["x24432", "B", "minor"],
      ["577555", "A", "minor"],
    ] as const) {
      expect(voicingMatchesChord(STANDARD_TUNING, buildChord(root, q), parseVoicing(shape)), shape).toBe(true);
    }
  });

  it("names inversions of known top-string triads", () => {
    const g = buildChord("G", "major");
    expect(voicingInversion(STANDARD_TUNING, g, parseVoicing("xxx433"))).toBe("first-inversion"); // B D G
    expect(voicingInversion(STANDARD_TUNING, g, parseVoicing("xxx787"))).toBe("second-inversion"); // D G B
    expect(voicingInversion(STANDARD_TUNING, g, parseVoicing("x.x.x.12.12.10"))).toBe("root-position"); // G B D
  });

  it("frames diagrams around a voicing", () => {
    expect(rangeForVoicing(parseVoicing("x32010"))).toEqual({ start: 0, end: 4 });
    expect(rangeForVoicing(parseVoicing("x35553"))).toEqual({ start: 3, end: 6 });
    expect(rangeForVoicing(parseVoicing("8.10.10.9.8.8"))).toEqual({ start: 8, end: 11 });
  });
});

describe("reference: pentatonic positions", () => {
  it("reproduces the five A minor pentatonic positions from a reference chart", () => {
    const rootFret = lowStringFret("A");
    expect(rootFret).toBe(5);
    for (const [pos, rows] of Object.entries(A_MINOR_PENTATONIC_POSITIONS)) {
      // Positions 4 and 5 are folded below fret 12 by the helper; compare an octave up.
      const range = pentatonicPositionRange(rootFret, Number(pos) as 1 | 2 | 3 | 4 | 5);
      const shift = range.start < rootFret ? 12 : 0;
      for (const [string, frets] of Object.entries(rows)) {
        const found: number[] = [];
        for (let fret = range.start; fret <= range.end; fret++) {
          const pc = pitchClassAt(STANDARD_TUNING, { string: Number(string), fret });
          if ([9, 0, 2, 4, 7].includes(pc)) found.push(fret + shift);
        }
        expect(found, `position ${pos} string ${string}`).toEqual(frets);
      }
    }
  });

  it("gives exactly two scale tones per string in every key and position", () => {
    for (let rootFret = 0; rootFret < 12; rootFret++) {
      const rootPc = (40 + rootFret) % 12;
      const pcs = [0, 3, 5, 7, 10].map((i) => (rootPc + i) % 12);
      for (let p = 1; p <= PENTATONIC_POSITION_OFFSETS.length; p++) {
        const range = pentatonicPositionRange(rootFret, p as 1 | 2 | 3 | 4 | 5);
        expect(range.start).toBeGreaterThanOrEqual(0);
        for (let string = 1; string <= 6; string++) {
          let count = 0;
          for (let fret = range.start; fret <= range.end; fret++) {
            if (pcs.includes((OPEN_MIDI[string]! + fret) % 12)) count++;
          }
          expect(count, `root fret ${rootFret} position ${p} string ${string}`).toBe(2);
        }
      }
    }
  });
});
