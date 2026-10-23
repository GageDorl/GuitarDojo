/**
 * Chords built from interval formulas.
 *
 * Chord qualities are data, so seventh chords, suspended chords etc. can be added by extending
 * CHORD_QUALITIES without touching the construction or identification logic.
 */
import { type Interval, type IntervalCode, intervalName, parseInterval, semitones, transpose } from "./intervals";
import { type Note, type PitchClass, mod, noteName, pitchClass, toNote } from "./notes";

/** Functional name of a chord member. Extend with "seventh", "ninth" … for larger chords. */
export type ChordRole = "root" | "third" | "fifth" | "seventh";

export interface ChordQualityDefinition {
  readonly id: string;
  /** Human name: "major", "minor". */
  readonly name: string;
  /** Suffix used in chord symbols: "" for C, "m" for Cm. */
  readonly symbol: string;
  readonly formula: readonly { interval: IntervalCode; role: ChordRole }[];
}

export const CHORD_QUALITIES = {
  major: {
    id: "major",
    name: "major",
    symbol: "",
    formula: [
      { interval: "P1", role: "root" },
      { interval: "M3", role: "third" },
      { interval: "P5", role: "fifth" },
    ],
  },
  minor: {
    id: "minor",
    name: "minor",
    symbol: "m",
    formula: [
      { interval: "P1", role: "root" },
      { interval: "m3", role: "third" },
      { interval: "P5", role: "fifth" },
    ],
  },
  diminished: {
    id: "diminished",
    name: "diminished",
    symbol: "dim",
    formula: [
      { interval: "P1", role: "root" },
      { interval: "m3", role: "third" },
      { interval: "d5", role: "fifth" },
    ],
  },
  augmented: {
    id: "augmented",
    name: "augmented",
    symbol: "aug",
    formula: [
      { interval: "P1", role: "root" },
      { interval: "M3", role: "third" },
      { interval: "A5", role: "fifth" },
    ],
  },
} as const satisfies Record<string, ChordQualityDefinition>;

export type ChordQualityId = keyof typeof CHORD_QUALITIES;

export interface ChordTone {
  readonly note: Note;
  readonly interval: Interval;
  readonly role: ChordRole;
}

export interface Chord {
  readonly root: Note;
  readonly quality: ChordQualityDefinition;
  readonly tones: readonly ChordTone[];
}

/** A chord reference as it appears in content: `{ root: "A", quality: "minor" }`. */
export interface ChordSpec {
  readonly root: string;
  readonly quality: ChordQualityId;
}

export function buildChord(root: Note | string, qualityId: ChordQualityId): Chord {
  const rootNote = toNote(root);
  const quality: ChordQualityDefinition = CHORD_QUALITIES[qualityId];
  const tones = quality.formula.map(({ interval, role }) => {
    const i = parseInterval(interval);
    return { note: transpose(rootNote, i), interval: i, role };
  });
  return { root: rootNote, quality, tones };
}

export function chordFromSpec(spec: ChordSpec): Chord {
  return buildChord(spec.root, spec.quality);
}

export function chordSymbol(chord: Chord): string {
  return noteName(chord.root) + chord.quality.symbol;
}

/** "C major", "A minor". */
export function chordName(chord: Chord): string {
  return `${noteName(chord.root)} ${chord.quality.name}`;
}

export function chordPitchClasses(chord: Chord): Set<PitchClass> {
  return new Set(chord.tones.map((t) => pitchClass(t.note)));
}

export function chordToneForPitchClass(chord: Chord, pc: PitchClass): ChordTone | undefined {
  return chord.tones.find((t) => pitchClass(t.note) === mod(pc, 12));
}

export function describeChordTone(tone: ChordTone): string {
  return `${noteName(tone.note)} (the ${tone.role}, a ${intervalName(tone.interval)} above the root)`;
}

// ---------------------------------------------------------------------------------------------
// Inversions
// ---------------------------------------------------------------------------------------------

export type Inversion = "root-position" | "first-inversion" | "second-inversion" | "third-inversion";

const INVERSION_BY_ROLE: Record<ChordRole, Inversion> = {
  root: "root-position",
  third: "first-inversion",
  fifth: "second-inversion",
  seventh: "third-inversion",
};

export const INVERSION_NAMES: Record<Inversion, string> = {
  "root-position": "root position",
  "first-inversion": "first inversion",
  "second-inversion": "second inversion",
  "third-inversion": "third inversion",
};

export const INVERSION_BASS_ROLE: Record<Inversion, ChordRole> = {
  "root-position": "root",
  "first-inversion": "third",
  "second-inversion": "fifth",
  "third-inversion": "seventh",
};

/** Which inversion a chord is in, given the pitch class of its lowest sounding note. */
export function inversionForBass(chord: Chord, bassPc: PitchClass): Inversion | undefined {
  const tone = chordToneForPitchClass(chord, bassPc);
  return tone ? INVERSION_BY_ROLE[tone.role] : undefined;
}

// ---------------------------------------------------------------------------------------------
// Identification
// ---------------------------------------------------------------------------------------------

export interface ChordMatch {
  readonly rootPc: PitchClass;
  readonly quality: ChordQualityId;
  readonly inversion?: Inversion;
}

/**
 * Identify chords whose tones are exactly the given pitch classes (doublings allowed).
 * When `bassPc` is supplied the inversion is reported and root-position matches sort first.
 */
export function identifyChord(pitchClasses: Iterable<PitchClass>, bassPc?: PitchClass): ChordMatch[] {
  const pcs = new Set([...pitchClasses].map((pc) => mod(pc, 12)));
  const matches: ChordMatch[] = [];
  for (const rootPc of pcs) {
    for (const [id, quality] of Object.entries(CHORD_QUALITIES) as [ChordQualityId, ChordQualityDefinition][]) {
      const expected = new Set(
        quality.formula.map(({ interval }) => mod(rootPc + semitonesOf(interval), 12)),
      );
      if (expected.size === pcs.size && [...pcs].every((pc) => expected.has(pc))) {
        let inversion: Inversion | undefined;
        if (bassPc !== undefined) {
          const role = quality.formula.find(
            ({ interval }) => mod(rootPc + semitonesOf(interval), 12) === mod(bassPc, 12),
          )?.role;
          inversion = role ? INVERSION_BY_ROLE[role] : undefined;
        }
        matches.push({ rootPc, quality: id, inversion });
      }
    }
  }
  return matches.sort((a, b) => Number(b.rootPc === bassPc) - Number(a.rootPc === bassPc));
}

function semitonesOf(code: IntervalCode): number {
  return semitones(parseInterval(code));
}
