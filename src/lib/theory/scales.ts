/**
 * Scales built from interval patterns. Like chords, scale types are data: modes, harmonic minor,
 * blues scales etc. can be added to SCALE_TYPES without changing the construction logic.
 */
import { type Interval, type IntervalCode, parseInterval, transpose } from "./intervals";
import { type Note, type PitchClass, mod, pitchClass, toNote } from "./notes";

export interface ScaleTypeDefinition {
  readonly id: string;
  readonly name: string;
  /** Intervals above the tonic, ascending. Each scale degree uses a distinct letter where the
   * scale is heptatonic; pentatonic scales skip degrees, and the interval numbers show which. */
  readonly intervals: readonly IntervalCode[];
}

export const SCALE_TYPES = {
  major: { id: "major", name: "major", intervals: ["P1", "M2", "M3", "P4", "P5", "M6", "M7"] },
  "natural-minor": {
    id: "natural-minor",
    name: "natural minor",
    intervals: ["P1", "M2", "m3", "P4", "P5", "m6", "m7"],
  },
  "major-pentatonic": {
    id: "major-pentatonic",
    name: "major pentatonic",
    intervals: ["P1", "M2", "M3", "P5", "M6"],
  },
  "minor-pentatonic": {
    id: "minor-pentatonic",
    name: "minor pentatonic",
    intervals: ["P1", "m3", "P4", "P5", "m7"],
  },
} as const satisfies Record<string, ScaleTypeDefinition>;

export type ScaleTypeId = keyof typeof SCALE_TYPES;

export interface ScaleDegree {
  readonly note: Note;
  readonly interval: Interval;
  /** 1-based diatonic degree number (pentatonic degrees keep their diatonic numbers: 1 ♭3 4 5 ♭7). */
  readonly degree: number;
}

export interface Scale {
  readonly tonic: Note;
  readonly type: ScaleTypeDefinition;
  readonly degrees: readonly ScaleDegree[];
}

export interface ScaleSpec {
  readonly root: string;
  readonly type: ScaleTypeId;
}

export function buildScale(tonic: Note | string, typeId: ScaleTypeId): Scale {
  const t = toNote(tonic);
  const type: ScaleTypeDefinition = SCALE_TYPES[typeId];
  const degrees = type.intervals.map((code) => {
    const interval = parseInterval(code);
    return { note: transpose(t, interval), interval, degree: interval.number };
  });
  return { tonic: t, type, degrees };
}

export function scaleFromSpec(spec: ScaleSpec): Scale {
  return buildScale(spec.root, spec.type);
}

export function scalePitchClasses(scale: Scale): Set<PitchClass> {
  return new Set(scale.degrees.map((d) => pitchClass(d.note)));
}

export function scaleDegreeForPitchClass(scale: Scale, pc: PitchClass): ScaleDegree | undefined {
  return scale.degrees.find((d) => pitchClass(d.note) === mod(pc, 12));
}

/** Semitone steps between consecutive degrees, wrapping to the octave (major: 2 2 1 2 2 2 1). */
export function stepPattern(scale: Scale): number[] {
  const pcs = scale.degrees.map((d) => pitchClass(d.note));
  return pcs.map((pc, i) => mod((pcs[i + 1] ?? pcs[0]!) - pc, 12) || 12);
}
