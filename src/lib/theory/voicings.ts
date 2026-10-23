/**
 * Chord voicings: concrete ways to play a chord on a fretted instrument.
 *
 * A voicing is written low-to-high like guitarists do: "x32010" is an open C major
 * (low E muted, A string fret 3 …). Frets ≥ 10 use a dotted form: "8.10.10.9.8.8".
 */
import { type Chord, type Inversion, chordPitchClasses, chordToneForPitchClass, inversionForBass } from "./chords";
import { mod, pitchClass } from "./notes";
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

/** Commonly taught voicings, keyed by chord symbol. Shapes are written low string to high. */
export const COMMON_VOICINGS: Record<string, { readonly name: string; readonly shapes: readonly string[] }> = {
  C: { name: "C major", shapes: ["x32010", "x35553", "8.10.10.9.8.8"] },
  D: { name: "D major", shapes: ["xx0232", "x57775"] },
  E: { name: "E major", shapes: ["022100", "x79997"] },
  F: { name: "F major", shapes: ["133211", "xx3211"] },
  G: { name: "G major", shapes: ["320003", "355433"] },
  A: { name: "A major", shapes: ["x02220", "577655"] },
  Am: { name: "A minor", shapes: ["x02210", "577555"] },
  Dm: { name: "D minor", shapes: ["xx0231", "x57765"] },
  Em: { name: "E minor", shapes: ["022000", "x79987"] },
  Bm: { name: "B minor", shapes: ["x24432"] },
};
