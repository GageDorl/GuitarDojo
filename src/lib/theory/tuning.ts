/**
 * Tunings and the mapping between guitar positions and pitches.
 *
 * Strings use guitarist numbering: string 1 is the highest-pitched string (high E in standard
 * tuning) and string 6 the lowest. Fret 0 is the open string.
 */
import {
  type AccidentalPreference,
  type Note,
  type Pitch,
  type PitchClass,
  midi,
  mod,
  parsePitch,
  pitchFromMidi,
  spellInContext,
} from "./notes";

export interface Tuning {
  readonly id: string;
  readonly name: string;
  /** Open-string pitches ordered from the lowest string to the highest (E2 A2 D3 G3 B3 E4). */
  readonly openStrings: readonly Pitch[];
}

export const STANDARD_TUNING: Tuning = {
  id: "standard",
  name: "Standard (E A D G B E)",
  openStrings: ["E2", "A2", "D3", "G3", "B3", "E4"].map(parsePitch),
};

export const TUNINGS: Record<string, Tuning> = {
  standard: STANDARD_TUNING,
  "drop-d": {
    id: "drop-d",
    name: "Drop D (D A D G B E)",
    openStrings: ["D2", "A2", "D3", "G3", "B3", "E4"].map(parsePitch),
  },
};

/** A guitar position. `string` uses guitarist numbering (1 = highest string). */
export interface FretPosition {
  readonly string: number;
  readonly fret: number;
}

export interface FretRange {
  /** First fret shown (0 includes open strings). */
  readonly start: number;
  /** Last fret shown, inclusive. */
  readonly end: number;
}

export function stringCount(tuning: Tuning): number {
  return tuning.openStrings.length;
}

/** String numbers from lowest-pitched to highest: [6, 5, 4, 3, 2, 1] for a six-string. */
export function stringsLowToHigh(tuning: Tuning): number[] {
  const count = stringCount(tuning);
  return Array.from({ length: count }, (_, i) => count - i);
}

export function openStringPitch(tuning: Tuning, string: number): Pitch {
  const pitch = tuning.openStrings[stringCount(tuning) - string];
  if (!pitch) throw new Error(`String ${string} does not exist in ${tuning.name}`);
  return pitch;
}

export function midiAt(tuning: Tuning, pos: FretPosition): number {
  return midi(openStringPitch(tuning, pos.string)) + pos.fret;
}

export function pitchClassAt(tuning: Tuning, pos: FretPosition): PitchClass {
  return mod(midiAt(tuning, pos), 12);
}

export function positionKey(pos: FretPosition): string {
  return `${pos.string}:${pos.fret}`;
}

export function samePosition(a: FretPosition, b: FretPosition): boolean {
  return a.string === b.string && a.fret === b.fret;
}

export function inRange(pos: FretPosition, range: FretRange, strings?: readonly number[]): boolean {
  return pos.fret >= range.start && pos.fret <= range.end && (!strings || strings.includes(pos.string));
}

/** Every position within a fret range (and optional string subset). */
export function positionsInRange(tuning: Tuning, range: FretRange, strings?: readonly number[]): FretPosition[] {
  const result: FretPosition[] = [];
  for (const string of strings ?? stringsLowToHigh(tuning)) {
    for (let fret = range.start; fret <= range.end; fret++) result.push({ string, fret });
  }
  return result;
}

/** Every position sounding a pitch class within a region. */
export function findPitchClass(
  tuning: Tuning,
  pc: PitchClass,
  range: FretRange,
  strings?: readonly number[],
): FretPosition[] {
  return positionsInRange(tuning, range, strings).filter((pos) => pitchClassAt(tuning, pos) === mod(pc, 12));
}

/** Every position sounding an exact MIDI pitch within a region (the same pitch can occur on several strings). */
export function findMidi(tuning: Tuning, midiNumber: number, range: FretRange, strings?: readonly number[]): FretPosition[] {
  return positionsInRange(tuning, range, strings).filter((pos) => midiAt(tuning, pos) === midiNumber);
}

/** Spelled pitch at a position, preferring the spelling of a musical context (chord or scale tones). */
export function spelledPitchAt(
  tuning: Tuning,
  pos: FretPosition,
  context?: readonly Note[],
  prefer: AccidentalPreference = "sharp",
): Pitch {
  const m = midiAt(tuning, pos);
  return pitchFromMidi(m, spellInContext(mod(m, 12), context, prefer));
}
