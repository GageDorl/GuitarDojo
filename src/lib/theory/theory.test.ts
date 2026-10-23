import { describe, expect, it } from "vitest";
import {
  STANDARD_TUNING,
  buildChord,
  buildScale,
  chordName,
  chordSymbol,
  findMidi,
  findPitchClass,
  findVoicings,
  formulaLabel,
  identifyChord,
  intervalBetween,
  intervalBetweenPitches,
  intervalCode,
  intervalFromSemitones,
  intervalName,
  inversionForBass,
  midi,
  midiAt,
  noteName,
  parseInterval,
  parseNote,
  parsePitch,
  parseVoicing,
  pitchClass,
  pitchClassAt,
  pitchFromMidi,
  pitchName,
  semitones,
  spelledPitchAt,
  stepPattern,
  transpose,
  transposePitch,
  voicingInversion,
  voicingMatchesChord,
  voicingShape,
  COMMON_VOICINGS,
} from ".";

const names = (notes: { letter: string; accidental: number }[]) =>
  notes.map((n) => noteName(n as Parameters<typeof noteName>[0], { ascii: true }));

describe("notes", () => {
  it("parses and names notes with sharps, flats and unicode accidentals", () => {
    expect(noteName(parseNote("C#"))).toBe("C♯");
    expect(noteName(parseNote("Bb"), { ascii: true })).toBe("Bb");
    expect(noteName(parseNote("E♭"))).toBe("E♭");
    expect(parseNote("Fx")).toEqual({ letter: "F", accidental: 2 });
    expect(() => parseNote("H")).toThrow();
  });

  it("maps notes to pitch classes, treating enharmonics as equal pitch classes", () => {
    expect(pitchClass(parseNote("C"))).toBe(0);
    expect(pitchClass(parseNote("C#"))).toBe(pitchClass(parseNote("Db")));
    expect(pitchClass(parseNote("B#"))).toBe(0);
    expect(pitchClass(parseNote("Cb"))).toBe(11);
  });

  it("computes MIDI numbers with correct octave boundaries", () => {
    expect(midi(parsePitch("C4"))).toBe(60);
    expect(midi(parsePitch("A4"))).toBe(69);
    expect(midi(parsePitch("E2"))).toBe(40);
    expect(midi(parsePitch("B#3"))).toBe(60);
    expect(midi(parsePitch("Cb4"))).toBe(59);
  });

  it("builds pitches from MIDI with a requested spelling", () => {
    expect(pitchName(pitchFromMidi(61), { ascii: true })).toBe("C#4");
    expect(pitchName(pitchFromMidi(61, parseNote("Db")), { ascii: true })).toBe("Db4");
    expect(pitchName(pitchFromMidi(60, parseNote("B#")), { ascii: true })).toBe("B#3");
    expect(() => pitchFromMidi(60, parseNote("D"))).toThrow();
  });
});

describe("intervals", () => {
  it("parses codes and computes semitones", () => {
    const table: [string, number][] = [
      ["P1", 0],
      ["m2", 1],
      ["M2", 2],
      ["m3", 3],
      ["M3", 4],
      ["P4", 5],
      ["A4", 6],
      ["d5", 6],
      ["P5", 7],
      ["A5", 8],
      ["m6", 8],
      ["M6", 9],
      ["m7", 10],
      ["M7", 11],
      ["P8", 12],
      ["M10", 16],
    ];
    for (const [code, size] of table) expect(semitones(parseInterval(code)), code).toBe(size);
    expect(() => parseInterval("M5")).toThrow();
    expect(() => parseInterval("P3")).toThrow();
  });

  it("names intervals", () => {
    expect(intervalName(parseInterval("M3"))).toBe("major third");
    expect(intervalName(parseInterval("m3"))).toBe("minor third");
    expect(intervalName(parseInterval("P5"))).toBe("perfect fifth");
    expect(intervalName(parseInterval("P1"))).toBe("unison");
    expect(intervalName(parseInterval("P8"))).toBe("octave");
  });

  it("identifies intervals between spelled notes using letters, not just semitones", () => {
    expect(intervalCode(intervalBetween(parseNote("C"), parseNote("E")))).toBe("M3");
    expect(intervalCode(intervalBetween(parseNote("A"), parseNote("C")))).toBe("m3");
    expect(intervalCode(intervalBetween(parseNote("A"), parseNote("C#")))).toBe("M3");
    // Same sound as C♯, different letter: a diminished fourth, not a third.
    expect(intervalCode(intervalBetween(parseNote("A"), parseNote("Db")))).toBe("d4");
    expect(intervalCode(intervalBetween(parseNote("B"), parseNote("F")))).toBe("d5");
    expect(intervalCode(intervalBetween(parseNote("F"), parseNote("B")))).toBe("A4");
    expect(intervalCode(intervalBetween(parseNote("E"), parseNote("D")))).toBe("m7");
  });

  it("identifies octave-aware and compound intervals between pitches", () => {
    const up = intervalBetweenPitches(parsePitch("C3"), parsePitch("E4"));
    expect(intervalCode(up.interval)).toBe("M10");
    expect(up.direction).toBe("up");
    const down = intervalBetweenPitches(parsePitch("G4"), parsePitch("C4"));
    expect(intervalCode(down.interval)).toBe("P5");
    expect(down.direction).toBe("down");
    expect(intervalCode(intervalBetweenPitches(parsePitch("E2"), parsePitch("E3")).interval)).toBe("P8");
  });

  it("transposes with correct spelling", () => {
    expect(noteName(transpose(parseNote("A"), "M3"), { ascii: true })).toBe("C#");
    expect(noteName(transpose(parseNote("Eb"), "M3"), { ascii: true })).toBe("G");
    expect(noteName(transpose(parseNote("F#"), "M3"), { ascii: true })).toBe("A#");
    expect(noteName(transpose(parseNote("Db"), "m3"), { ascii: true })).toBe("Fb");
    expect(noteName(transpose(parseNote("B"), "P5"), { ascii: true })).toBe("F#");
    expect(noteName(transpose(parseNote("G#"), "M3"), { ascii: true })).toBe("B#");
    expect(pitchName(transposePitch(parsePitch("A2"), "P5"), { ascii: true })).toBe("E3");
    expect(pitchName(transposePitch(parsePitch("B3"), "m3"), { ascii: true })).toBe("D4");
    expect(pitchName(transposePitch(parsePitch("C4"), "M3", "down"), { ascii: true })).toBe("Ab3");
  });

  it("provides default interval names and formula labels for semitone counts", () => {
    expect(intervalCode(intervalFromSemitones(4))).toBe("M3");
    expect(intervalCode(intervalFromSemitones(6))).toBe("d5");
    expect(intervalCode(intervalFromSemitones(6, { tritone: "A4" }))).toBe("A4");
    expect(intervalCode(intervalFromSemitones(12))).toBe("P8");
    expect(intervalCode(intervalFromSemitones(16))).toBe("M10");
    expect(formulaLabel(parseInterval("P1"))).toBe("R");
    expect(formulaLabel(parseInterval("m3"))).toBe("♭3");
    expect(formulaLabel(parseInterval("M3"))).toBe("3");
    expect(formulaLabel(parseInterval("P5"))).toBe("5");
  });
});

describe("chords", () => {
  it("builds correctly spelled major and minor triads", () => {
    expect(names(buildChord("C", "major").tones.map((t) => t.note))).toEqual(["C", "E", "G"]);
    expect(names(buildChord("A", "major").tones.map((t) => t.note))).toEqual(["A", "C#", "E"]);
    expect(names(buildChord("A", "minor").tones.map((t) => t.note))).toEqual(["A", "C", "E"]);
    expect(names(buildChord("Eb", "major").tones.map((t) => t.note))).toEqual(["Eb", "G", "Bb"]);
    expect(names(buildChord("F#", "minor").tones.map((t) => t.note))).toEqual(["F#", "A", "C#"]);
    expect(names(buildChord("Bb", "minor").tones.map((t) => t.note))).toEqual(["Bb", "Db", "F"]);
    expect(names(buildChord("B", "diminished").tones.map((t) => t.note))).toEqual(["B", "D", "F"]);
    expect(names(buildChord("C", "augmented").tones.map((t) => t.note))).toEqual(["C", "E", "G#"]);
  });

  it("names chords and roles", () => {
    const am = buildChord("A", "minor");
    expect(chordSymbol(am)).toBe("Am");
    expect(chordName(am)).toBe("A minor");
    expect(am.tones.map((t) => t.role)).toEqual(["root", "third", "fifth"]);
  });

  it("identifies chords and inversions from pitch classes", () => {
    const cMajor = identifyChord([0, 4, 7], 0);
    expect(cMajor).toEqual([{ rootPc: 0, quality: "major", inversion: "root-position" }]);
    expect(identifyChord([0, 4, 7, 0], 4)[0]).toMatchObject({ rootPc: 0, quality: "major", inversion: "first-inversion" });
    expect(identifyChord([9, 0, 4])[0]).toMatchObject({ rootPc: 9, quality: "minor" });
    expect(identifyChord([0, 4])).toEqual([]);
    expect(inversionForBass(buildChord("C", "major"), 7)).toBe("second-inversion");
    // Augmented triads are symmetrical: three valid roots.
    expect(identifyChord([0, 4, 8]).length).toBe(3);
  });
});

describe("scales", () => {
  it("builds scales with one letter per degree", () => {
    expect(names(buildScale("C", "major").degrees.map((d) => d.note))).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(names(buildScale("F", "major").degrees.map((d) => d.note))).toEqual(["F", "G", "A", "Bb", "C", "D", "E"]);
    expect(names(buildScale("A", "natural-minor").degrees.map((d) => d.note))).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
    expect(names(buildScale("A", "minor-pentatonic").degrees.map((d) => d.note))).toEqual(["A", "C", "D", "E", "G"]);
    expect(names(buildScale("G", "major-pentatonic").degrees.map((d) => d.note))).toEqual(["G", "A", "B", "D", "E"]);
  });

  it("produces the expected step patterns", () => {
    expect(stepPattern(buildScale("C", "major"))).toEqual([2, 2, 1, 2, 2, 2, 1]);
    expect(stepPattern(buildScale("A", "natural-minor"))).toEqual([2, 1, 2, 2, 1, 2, 2]);
    expect(stepPattern(buildScale("A", "minor-pentatonic"))).toEqual([3, 2, 2, 3, 2]);
  });
});

describe("fretboard mapping", () => {
  it("maps positions to pitches in standard tuning", () => {
    expect(midiAt(STANDARD_TUNING, { string: 6, fret: 0 })).toBe(40); // E2
    expect(midiAt(STANDARD_TUNING, { string: 1, fret: 0 })).toBe(64); // E4
    expect(midiAt(STANDARD_TUNING, { string: 2, fret: 1 })).toBe(60); // C4
    expect(midiAt(STANDARD_TUNING, { string: 5, fret: 3 })).toBe(48); // C3
    expect(pitchClassAt(STANDARD_TUNING, { string: 3, fret: 2 })).toBe(9); // A
  });

  it("spells fretboard pitches in context", () => {
    const aMajor = buildChord("A", "major").tones.map((t) => t.note);
    const pos = { string: 2, fret: 2 }; // C♯4 / D♭4
    expect(pitchName(spelledPitchAt(STANDARD_TUNING, pos, aMajor), { ascii: true })).toBe("C#4");
    const bbMinor = buildChord("Bb", "minor").tones.map((t) => t.note);
    expect(pitchName(spelledPitchAt(STANDARD_TUNING, pos, bbMinor), { ascii: true })).toBe("Db4");
    expect(pitchName(spelledPitchAt(STANDARD_TUNING, pos, undefined, "flat"), { ascii: true })).toBe("Db4");
  });

  it("finds pitch classes and exact pitches within a region", () => {
    const gs = findPitchClass(STANDARD_TUNING, 7, { start: 0, end: 5 });
    expect(gs).toEqual(
      expect.arrayContaining([
        { string: 6, fret: 3 },
        { string: 4, fret: 5 },
        { string: 3, fret: 0 },
        { string: 1, fret: 3 },
      ]),
    );
    expect(gs).toHaveLength(4);
    // E4 (open high E) also sounds at B-string fret 5 and G-string fret 9.
    expect(findMidi(STANDARD_TUNING, 64, { start: 0, end: 12 })).toEqual([
      { string: 3, fret: 9 },
      { string: 2, fret: 5 },
      { string: 1, fret: 0 },
    ]);
  });
});

describe("voicings", () => {
  it("parses and prints voicing shapes", () => {
    expect(parseVoicing("x32010").frets).toEqual([null, 3, 2, 0, 1, 0]);
    expect(voicingShape(parseVoicing("8.10.10.9.8.8"))).toBe("8.10.10.9.8.8");
  });

  it("validates the common voicing library against the chord engine", () => {
    for (const [symbol, { chord: spec, shapes }] of Object.entries(COMMON_VOICINGS)) {
      const chord = buildChord(spec.root, spec.quality);
      // The library key is the chord symbol (ASCII flats), e.g. "Bbm7".
      expect(chordSymbol(chord).replace("♭5", "b5").replace("♭", "b"), symbol).toBe(symbol);
      for (const shape of shapes) {
        expect(voicingMatchesChord(STANDARD_TUNING, chord, parseVoicing(shape)), `${symbol} ${shape}`).toBe(true);
      }
    }
  });

  it("reports inversions from the lowest sounding note", () => {
    const c = buildChord("C", "major");
    expect(voicingInversion(STANDARD_TUNING, c, parseVoicing("x32010"))).toBe("root-position");
    expect(voicingInversion(STANDARD_TUNING, c, parseVoicing("032010"))).toBe("first-inversion");
    expect(voicingInversion(STANDARD_TUNING, c, parseVoicing("332010"))).toBe("second-inversion");
  });

  it("generates playable voicings that include known shapes", () => {
    const shapes = findVoicings(STANDARD_TUNING, buildChord("E", "major"), { range: { start: 0, end: 5 } }).map(
      voicingShape,
    );
    expect(shapes).toContain("022100");
    const am = findVoicings(STANDARD_TUNING, buildChord("A", "minor"), { range: { start: 0, end: 4 } }).map(voicingShape);
    expect(am).toContain("x02210");
    const firstInversion = findVoicings(STANDARD_TUNING, buildChord("C", "major"), {
      range: { start: 0, end: 5 },
      inversion: "first-inversion",
    });
    expect(firstInversion.length).toBeGreaterThan(0);
    for (const v of firstInversion) {
      expect(voicingInversion(STANDARD_TUNING, buildChord("C", "major"), v)).toBe("first-inversion");
    }
  });
});
