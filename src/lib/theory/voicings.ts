/**
 * Chord voicings: concrete ways to play a chord on a fretted instrument.
 *
 * A voicing is written low-to-high like guitarists do: "x32010" is an open C major
 * (low E muted, A string fret 3 …). Frets ≥ 10 use a dotted form: "8.10.10.9.8.8".
 */
import {
  type Chord,
  type ChordQualityId,
  type ChordSpec,
  type Inversion,
  chordPitchClasses,
  chordToneForPitchClass,
  inversionForBass,
} from "./chords";
import { type Note, mod, pitchClass, toNote } from "./notes";
import { type FretPosition, type FretRange, type Tuning, midiAt, stringCount } from "./tuning";

export interface Voicing {
  /** Fret per string from lowest to highest string; null means muted / not played. */
  readonly frets: readonly (number | null)[];
}

export function parseVoicing(shape: string): Voicing {
  const tokens = shape.includes(".") ? shape.split(".") : shape.split("");
  return {
    frets: tokens.map((t) => {
      if (t === "x" || t === "X") return null;
      const fret = Number.parseInt(t, 10);
      if (Number.isNaN(fret)) throw new Error(`Invalid voicing "${shape}"`);
      return fret;
    }),
  };
}

export function voicingShape(v: Voicing): string {
  const big = v.frets.some((f) => f !== null && f > 9);
  const tokens = v.frets.map((f) => (f === null ? "x" : String(f)));
  return tokens.join(big ? "." : "");
}

/**
 * Move a shape up the neck. Open strings become fretted (the barre), so the open E shape moved
 * up one fret is the F barre chord: shiftVoicing("022100", 1) → "133211".
 */
export function shiftVoicing(v: Voicing, frets: number): Voicing {
  return { frets: v.frets.map((f) => (f === null ? null : f + frets)) };
}

/** Positions sounded by a voicing, using guitarist string numbering. */
export function voicingPositions(v: Voicing): FretPosition[] {
  const count = v.frets.length;
  return v.frets.flatMap((fret, i) => (fret === null ? [] : [{ string: count - i, fret }]));
}

export function voicingFromPositions(tuning: Tuning, positions: readonly FretPosition[]): Voicing {
  const count = stringCount(tuning);
  const frets: (number | null)[] = Array.from({ length: count }, () => null);
  for (const pos of positions) frets[count - pos.string] = pos.fret;
  return { frets };
}

/** Sounding positions sorted from lowest pitch to highest. */
export function sortByPitch(tuning: Tuning, positions: readonly FretPosition[]): FretPosition[] {
  return [...positions].sort((a, b) => midiAt(tuning, a) - midiAt(tuning, b));
}

export function bassPosition(tuning: Tuning, positions: readonly FretPosition[]): FretPosition | undefined {
  return sortByPitch(tuning, positions)[0];
}

export interface VoicingSearchOptions {
  /** Frets that may be used (open strings are allowed when start is 0). */
  readonly range?: FretRange;
  /** Maximum distance between the lowest and highest fretted (non-open) note. Default 3 (a four-fret span). */
  readonly maxSpan?: number;
  /** Minimum number of sounding strings. Default 3. */
  readonly minStrings?: number;
  /** Restrict to these strings (guitarist numbering). */
  readonly strings?: readonly number[];
  /** Require a particular inversion (based on the lowest sounding note). */
  readonly inversion?: Inversion;
  /** Allow muted strings between sounding strings. Default false. */
  readonly allowInteriorMutes?: boolean;
  readonly limit?: number;
}

/**
 * Enumerate playable voicings that contain every chord tone and nothing else.
 * Results are ordered roughly from simplest (lower position, more open strings) to hardest.
 */
export function findVoicings(tuning: Tuning, chord: Chord, options: VoicingSearchOptions = {}): Voicing[] {
  const range = options.range ?? { start: 0, end: 12 };
  const maxSpan = options.maxSpan ?? 3;
  const minStrings = options.minStrings ?? 3;
  const pcs = chordPitchClasses(chord);
  const count = stringCount(tuning);

  const optionsPerString: (number | null)[][] = [];
  for (let i = 0; i < count; i++) {
    const string = count - i;
    const choices: (number | null)[] = [null];
    if (!options.strings || options.strings.includes(string)) {
      for (let fret = range.start; fret <= range.end; fret++) {
        if (pcs.has(mod(midiAt(tuning, { string, fret }), 12))) choices.push(fret);
      }
    }
    optionsPerString.push(choices);
  }

  const results: Voicing[] = [];
  const current: (number | null)[] = [];

  const visit = (index: number) => {
    if (index === count) {
      const voicing = { frets: [...current] };
      if (isPlayable(voicing, maxSpan, minStrings, options.allowInteriorMutes ?? false)) {
        const positions = voicingPositions(voicing);
        const covered = new Set(positions.map((p) => mod(midiAt(tuning, p), 12)));
        if (covered.size === pcs.size) {
          if (!options.inversion || voicingInversion(tuning, chord, voicing) === options.inversion) {
            results.push(voicing);
          }
        }
      }
      return;
    }
    for (const choice of optionsPerString[index]!) {
      current.push(choice);
      // Prune early when fretted notes already exceed the span.
      const fretted = current.filter((f): f is number => f !== null && f > 0);
      if (fretted.length === 0 || Math.max(...fretted) - Math.min(...fretted) <= maxSpan) visit(index + 1);
      current.pop();
    }
  };
  visit(0);

  const score = (v: Voicing) => {
    const fretted = v.frets.filter((f): f is number => f !== null && f > 0);
    const lowest = fretted.length ? Math.min(...fretted) : 0;
    const sounding = v.frets.filter((f) => f !== null).length;
    return lowest * 10 - sounding * 3 + fretted.length;
  };
  results.sort((a, b) => score(a) - score(b));
  return options.limit ? results.slice(0, options.limit) : results;
}

function isPlayable(v: Voicing, maxSpan: number, minStrings: number, allowInteriorMutes: boolean): boolean {
  const sounding = v.frets.map((f, i) => (f === null ? -1 : i)).filter((i) => i >= 0);
  if (sounding.length < minStrings) return false;
  if (!allowInteriorMutes) {
    const first = sounding[0]!;
    const last = sounding[sounding.length - 1]!;
    if (last - first + 1 !== sounding.length) return false;
  }
  const fretted = v.frets.filter((f): f is number => f !== null && f > 0);
  if (fretted.length === 0) return true;
  const min = Math.min(...fretted);
  if (Math.max(...fretted) - min > maxSpan) return false;
  // Four fingers, but notes on the lowest fret can be barred with one finger.
  const atMin = fretted.filter((f) => f === min).length;
  const fingers = fretted.length - (atMin > 1 ? atMin - 1 : 0);
  return fingers <= 4;
}

export function voicingInversion(tuning: Tuning, chord: Chord, v: Voicing): Inversion | undefined {
  const bass = bassPosition(tuning, voicingPositions(v));
  return bass ? inversionForBass(chord, midiAt(tuning, bass)) : undefined;
}

/** True when every sounding note belongs to the chord and every chord tone is present. */
export function voicingMatchesChord(tuning: Tuning, chord: Chord, v: Voicing): boolean {
  const positions = voicingPositions(v);
  const pcs = positions.map((p) => mod(midiAt(tuning, p), 12));
  return (
    pcs.every((pc) => chordToneForPitchClass(chord, pc) !== undefined) &&
    chord.tones.every((t) => pcs.includes(pitchClass(t.note)))
  );
}

export interface CommonVoicing {
  readonly name: string;
  readonly chord: ChordSpec;
  /** Low string to high. Every shape contains every chord tone (tested). */
  readonly shapes: readonly string[];
}

const cv = (name: string, root: string, quality: ChordQualityId, shapes: string[]): CommonVoicing => ({
  name,
  chord: { root, quality },
  shapes,
});

/** Commonly taught voicings, keyed by chord symbol. Shapes are written low string to high. */
export const COMMON_VOICINGS: Record<string, CommonVoicing> = {
  C: cv("C major", "C", "major", ["x32010", "x35553", "8.10.10.9.8.8"]),
  D: cv("D major", "D", "major", ["xx0232", "x57775"]),
  E: cv("E major", "E", "major", ["022100", "x79997"]),
  F: cv("F major", "F", "major", ["133211", "xx3211"]),
  G: cv("G major", "G", "major", ["320003", "355433"]),
  A: cv("A major", "A", "major", ["x02220", "577655"]),
  Am: cv("A minor", "A", "minor", ["x02210", "577555"]),
  Dm: cv("D minor", "D", "minor", ["xx0231", "x57765"]),
  Em: cv("E minor", "E", "minor", ["022000", "x79987"]),
  Bm: cv("B minor", "B", "minor", ["x24432"]),
  // Seventh chords (open shapes first, then moveable E- and A-shape barres).
  E7: cv("E dominant seventh", "E", "dominant7", ["020100"]),
  A7: cv("A dominant seventh", "A", "dominant7", ["x02020"]),
  D7: cv("D dominant seventh", "D", "dominant7", ["xx0212"]),
  G7: cv("G dominant seventh", "G", "dominant7", ["320001"]),
  B7: cv("B dominant seventh", "B", "dominant7", ["x21202"]),
  C7: cv("C dominant seventh", "C", "dominant7", ["x35353"]),
  F7: cv("F dominant seventh", "F", "dominant7", ["131211"]),
  Bb7: cv("B♭ dominant seventh", "Bb", "dominant7", ["x13131"]),
  Cmaj7: cv("C major seventh", "C", "major7", ["x32000"]),
  Fmaj7: cv("F major seventh", "F", "major7", ["xx3210", "1x221x"]),
  Amaj7: cv("A major seventh", "A", "major7", ["x02120"]),
  Dmaj7: cv("D major seventh", "D", "major7", ["xx0222"]),
  Bbmaj7: cv("B♭ major seventh", "Bb", "major7", ["x13231"]),
  Am7: cv("A minor seventh", "A", "minor7", ["x02010"]),
  Em7: cv("E minor seventh", "E", "minor7", ["022030"]),
  Dm7: cv("D minor seventh", "D", "minor7", ["xx0211"]),
  Fm7: cv("F minor seventh", "F", "minor7", ["131111"]),
  Bbm7: cv("B♭ minor seventh", "Bb", "minor7", ["x13121"]),
  Bm7b5: cv("B half-diminished seventh", "B", "halfDiminished7", ["x2323x"]),
};

// ---------------------------------------------------------------------------------------------
// CAGED: five open major shapes (and three minor ones) that move anywhere on the neck.
// ---------------------------------------------------------------------------------------------

export type CagedShape = "C" | "A" | "G" | "E" | "D";

export interface CagedShapeDefinition {
  /** The open chord the shape comes from. */
  readonly open: ChordSpec;
  /** Open-position voicing, low string to high. */
  readonly voicing: string;
  /** String that carries the lowest root (guitarist numbering). */
  readonly rootString: number;
}

/** Major shapes, in CAGED order (each one sits just above the previous up the neck). */
export const CAGED_SHAPES: Record<CagedShape, CagedShapeDefinition> = {
  C: { open: { root: "C", quality: "major" }, voicing: "x32010", rootString: 5 },
  A: { open: { root: "A", quality: "major" }, voicing: "x02220", rootString: 5 },
  G: { open: { root: "G", quality: "major" }, voicing: "320003", rootString: 6 },
  E: { open: { root: "E", quality: "major" }, voicing: "022100", rootString: 6 },
  D: { open: { root: "D", quality: "major" }, voicing: "xx0232", rootString: 4 },
};

export const CAGED_ORDER: readonly CagedShape[] = ["C", "A", "G", "E", "D"];

/** Minor shapes that are practical as moveable barre chords. */
export const CAGED_MINOR_SHAPES: Partial<Record<CagedShape, CagedShapeDefinition>> = {
  A: { open: { root: "A", quality: "minor" }, voicing: "x02210", rootString: 5 },
  E: { open: { root: "E", quality: "minor" }, voicing: "022000", rootString: 6 },
  D: { open: { root: "D", quality: "minor" }, voicing: "xx0231", rootString: 4 },
};

/**
 * A CAGED shape moved to play `root`: the open shape slid up until its root lands on the right
 * note (0–11 frets; open strings become the barre). `octaveUp` adds 12 frets.
 */
export function cagedVoicing(shape: CagedShape, root: Note | string, quality: "major" | "minor" = "major", octaveUp = false): Voicing {
  const def = quality === "major" ? CAGED_SHAPES[shape] : CAGED_MINOR_SHAPES[shape];
  if (!def) throw new Error(`No moveable ${quality} ${shape} shape`);
  const offset = mod(pitchClass(toNote(root)) - pitchClass(toNote(def.open.root)), 12) + (octaveUp ? 12 : 0);
  return shiftVoicing(parseVoicing(def.voicing), offset);
}
