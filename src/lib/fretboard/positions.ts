/**
 * Guitar-navigation helpers that sit above the theory engine: they depend on the instrument's
 * layout (standard tuning box shapes, diagram windows), not on music theory alone.
 */
import {
  type FretRange,
  type Note,
  type Tuning,
  type Voicing,
  STANDARD_TUNING,
  mod,
  openStringPitch,
  midi,
  pitchClass,
  stringCount,
  toNote,
} from "@/lib/theory";

/**
 * The five common pentatonic positions in standard tuning, as fret windows relative to the
 * *minor* root on the low E string. Position 1 is the familiar "box" that starts on the root.
 * Each window contains exactly two scale tones per string (verified in tests for all 12 keys).
 * Major pentatonic uses the same shapes: position n of C major = position n of A minor.
 */
export const PENTATONIC_POSITION_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 3],
  [2, 5],
  [4, 8],
  [7, 10],
  [9, 12],
];

export type PentatonicPosition = 1 | 2 | 3 | 4 | 5;

/** Fret (0–11) of a note on the lowest string. */
export function lowStringFret(note: Note | string, tuning: Tuning = STANDARD_TUNING): number {
  const open = openStringPitch(tuning, stringCount(tuning));
  return mod(pitchClass(toNote(note)) - mod(midi(open), 12), 12);
}

/**
 * Fret window for pentatonic position `n` of a minor key whose root sits at `minorRootFret` on the
 * low E string. Windows are kept below fret 12 where possible, since shapes repeat every octave.
 */
export function pentatonicPositionRange(minorRootFret: number, position: PentatonicPosition): FretRange {
  const [a, b] = PENTATONIC_POSITION_OFFSETS[position - 1]!;
  let start = minorRootFret + a;
  let end = minorRootFret + b;
  while (start >= 12) {
    start -= 12;
    end -= 12;
  }
  return { start, end };
}

/** A diagram window that fits a voicing: from the nut for open shapes, otherwise from the lowest fret. */
export function rangeForVoicing(v: Voicing): FretRange {
  const sounding = v.frets.filter((f): f is number => f !== null);
  const fretted = sounding.filter((f) => f > 0);
  const max = fretted.length ? Math.max(...fretted) : 0;
  const min = fretted.length ? Math.min(...fretted) : 0;
  const hasOpen = sounding.some((f) => f === 0);
  if (hasOpen || max <= 4) return { start: 0, end: Math.max(4, max) };
  return { start: min, end: Math.max(min + 3, max) };
}
