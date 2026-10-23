/**
 * Intervals with proper diatonic naming.
 *
 * An interval has a *number* (generic size counted in letter names: third, fifth …) and a
 * *quality* (perfect, major, minor, augmented, diminished). The number comes from letters and the
 * quality from semitones. This is why A→C♯ is a major third while A→D♭ is a diminished fourth,
 * even though both span four semitones.
 */
import {
  LETTERS,
  LETTER_PITCH_CLASS,
  type Note,
  type Pitch,
  accidentalSymbol,
  letterIndex,
  midi,
  mod,
  pitchClass,
} from "./notes";

export type IntervalQuality = "dd" | "d" | "m" | "P" | "M" | "A" | "AA";

export interface Interval {
  /** Generic size: 1 = unison, 3 = third, 8 = octave, 10 = compound third … */
  readonly number: number;
  readonly quality: IntervalQuality;
}

/** Shorthand used across content: "P1", "m3", "M3", "P5", "A4", "d5", "P8", "M10" … */
export type IntervalCode = string;

const PERFECT_SIMPLE = new Set([1, 4, 5]);
/** Semitones of the perfect or major form of each simple interval number. */
const BASE_SEMITONES: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };

const ORDINALS = [
  "",
  "unison",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "octave",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "thirteenth",
  "fourteenth",
  "double octave",
];

const QUALITY_NAMES: Record<IntervalQuality, string> = {
  dd: "doubly diminished",
  d: "diminished",
  m: "minor",
  P: "perfect",
  M: "major",
  A: "augmented",
  AA: "doubly augmented",
};

export function simpleNumber(n: number): number {
  return ((n - 1) % 7) + 1;
}

export function isPerfectType(n: number): boolean {
  return PERFECT_SIMPLE.has(simpleNumber(n));
}

function baseSemitones(n: number): number {
  const octaves = Math.floor((n - 1) / 7);
  return BASE_SEMITONES[simpleNumber(n)]! + 12 * octaves;
}

function qualityOffset(quality: IntervalQuality, perfectType: boolean): number {
  if (perfectType) {
    switch (quality) {
      case "dd":
        return -2;
      case "d":
        return -1;
      case "P":
        return 0;
      case "A":
        return 1;
      case "AA":
        return 2;
      default:
        throw new Error(`Quality ${quality} is not valid for a perfect-type interval`);
    }
  }
  switch (quality) {
    case "dd":
      return -3;
    case "d":
      return -2;
    case "m":
      return -1;
    case "M":
      return 0;
    case "A":
      return 1;
    case "AA":
      return 2;
    default:
      throw new Error(`Quality ${quality} is not valid for a major/minor-type interval`);
  }
}

export function semitones(i: Interval): number {
  return baseSemitones(i.number) + qualityOffset(i.quality, isPerfectType(i.number));
}

/** Determine the quality of an interval from its number and semitone size. */
export function qualityFor(number: number, size: number): IntervalQuality {
  const offset = size - baseSemitones(number);
  const perfectType = isPerfectType(number);
  const table: Record<number, IntervalQuality> = perfectType
    ? { [-2]: "dd", [-1]: "d", 0: "P", 1: "A", 2: "AA" }
    : { [-3]: "dd", [-2]: "d", [-1]: "m", 0: "M", 1: "A", 2: "AA" };
  const quality = table[offset];
  if (!quality) throw new Error(`No interval quality for number ${number} spanning ${size} semitones`);
  return quality;
}

const INTERVAL_PATTERN = /^(dd|d|m|P|M|A|AA)(\d+)$/;

export function parseInterval(code: IntervalCode): Interval {
  const match = INTERVAL_PATTERN.exec(code.trim());
  if (!match) throw new Error(`Invalid interval "${code}"`);
  const interval: Interval = { quality: match[1] as IntervalQuality, number: Number.parseInt(match[2]!, 10) };
  if (interval.number < 1) throw new Error(`Invalid interval number in "${code}"`);
  // Validate quality/number combination.
  qualityOffset(interval.quality, isPerfectType(interval.number));
  return interval;
}

export function toInterval(input: Interval | IntervalCode): Interval {
  return typeof input === "string" ? parseInterval(input) : input;
}

export function intervalCode(i: Interval): IntervalCode {
  return `${i.quality}${i.number}`;
}

export function sameInterval(a: Interval, b: Interval): boolean {
  return a.number === b.number && a.quality === b.quality;
}

/** "major third", "perfect fifth", "unison", "octave". */
export function intervalName(i: Interval): string {
  if (i.number === 1 && i.quality === "P") return "unison";
  if (i.number === 8 && i.quality === "P") return "octave";
  const ordinal = ORDINALS[i.number] ?? `${i.number}th`;
  return `${QUALITY_NAMES[i.quality]} ${ordinal}`;
}

/**
 * Chord-formula label relative to a major scale: R, ♭3, 3, 5, ♯5, ♭7 …
 * Used for interval labels on the fretboard.
 */
export function formulaLabel(i: Interval): string {
  const simple = simpleNumber(i.number);
  if (simple === 1 && i.quality === "P") return "R";
  const offset = qualityOffset(i.quality, isPerfectType(i.number));
  return accidentalSymbol(offset) + String(simple === 1 ? 8 : simple);
}

/** Ascending simple interval between two spelled notes (octave-agnostic). */
export function intervalBetween(from: Note, to: Note): Interval {
  const number = mod(letterIndex(to.letter) - letterIndex(from.letter), 7) + 1;
  let size = mod(pitchClass(to) - pitchClass(from), 12);
  // Diminished unisons and similar edge cases wrap around; keep the size consistent with the number.
  if (number === 1 && size > 6) size -= 12;
  if (number === 7 && size < 6) size += 12;
  return { number, quality: qualityFor(number, size) };
}

export interface DirectedInterval {
  readonly interval: Interval;
  readonly direction: "up" | "down" | "unison";
}

/** Octave-aware interval between two spelled pitches, including compound intervals. */
export function intervalBetweenPitches(a: Pitch, b: Pitch): DirectedInterval {
  const stepsA = a.octave * 7 + letterIndex(a.letter);
  const stepsB = b.octave * 7 + letterIndex(b.letter);
  const diff = midi(b) - midi(a);
  if (stepsA === stepsB && diff === 0) {
    return { interval: { number: 1, quality: "P" }, direction: "unison" };
  }
  const [low, high] = stepsB > stepsA || (stepsB === stepsA && diff > 0) ? [a, b] : [b, a];
  const number = Math.abs(stepsB - stepsA) + 1;
  const size = midi(high) - midi(low);
  return {
    interval: { number, quality: qualityFor(number, size) },
    direction: low === a ? "up" : "down",
  };
}

/** Transpose a spelled note up by an interval, keeping correct letter spelling. */
export function transpose(n: Note, by: Interval | IntervalCode): Note {
  const i = toInterval(by);
  const letter = LETTERS[mod(letterIndex(n.letter) + i.number - 1, 7)]!;
  const targetPc = pitchClass(n) + semitones(i);
  let accidental = mod(targetPc - LETTER_PITCH_CLASS[letter], 12);
  if (accidental > 6) accidental -= 12;
  return { letter, accidental };
}

/** Transpose a pitch up (or down with direction "down") by an interval, tracking octaves. */
export function transposePitch(p: Pitch, by: Interval | IntervalCode, direction: "up" | "down" = "up"): Pitch {
  const i = toInterval(by);
  const sign = direction === "up" ? 1 : -1;
  const steps = p.octave * 7 + letterIndex(p.letter) + sign * (i.number - 1);
  const octave = Math.floor(steps / 7);
  const letter = LETTERS[mod(steps, 7)]!;
  const targetMidi = midi(p) + sign * semitones(i);
  const naturalMidi = (octave + 1) * 12 + LETTER_PITCH_CLASS[letter];
  return { letter, accidental: targetMidi - naturalMidi, octave };
}

/**
 * Default interval name for a semitone count when no spelling is available (e.g. two arbitrary
 * frets). The tritone defaults to a diminished fifth; pass `tritone: "A4"` to override.
 */
export function intervalFromSemitones(size: number, options: { tritone?: "A4" | "d5" } = {}): Interval {
  const octaves = Math.floor(size / 12);
  const simple = mod(size, 12);
  const table: Record<number, Interval> = {
    0: { number: 1, quality: "P" },
    1: { number: 2, quality: "m" },
    2: { number: 2, quality: "M" },
    3: { number: 3, quality: "m" },
    4: { number: 3, quality: "M" },
    5: { number: 4, quality: "P" },
    6: options.tritone === "A4" ? { number: 4, quality: "A" } : { number: 5, quality: "d" },
    7: { number: 5, quality: "P" },
    8: { number: 6, quality: "m" },
    9: { number: 6, quality: "M" },
    10: { number: 7, quality: "m" },
    11: { number: 7, quality: "M" },
  };
  const base = table[simple]!;
  if (octaves === 0) return base;
  if (simple === 0) return { number: 1 + 7 * octaves, quality: "P" };
  return { number: base.number + 7 * octaves, quality: base.quality };
}
