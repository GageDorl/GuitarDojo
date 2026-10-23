import {
  type Chord,
  type FretPosition,
  type FretRange,
  type Note,
  type Scale,
  type Tuning,
  STANDARD_TUNING,
  TUNINGS,
  buildChord,
  buildScale,
  chordToneForPitchClass,
  findPitchClass,
  formulaLabel,
  intervalBetween,
  midiAt,
  noteName,
  parseNote,
  parseVoicing,
  pitchClass,
  pitchClassAt,
  pitchName,
  positionKey,
  scaleDegreeForPitchClass,
  spelledPitchAt,
  stringsLowToHigh,
  voicingPositions,
} from "@/lib/theory";
import type { FretMarker, FretboardModel, FretboardSpec, LabelMode, MarkerRole, StringIndicator } from "./types";

export const DEFAULT_RANGE: FretRange = { start: 0, end: 12 };

export interface LabelContext {
  readonly tuning: Tuning;
  /** Spelling context: chord or scale tones. */
  readonly spelling?: readonly Note[];
  /** Root for interval labels. */
  readonly root?: Note;
}

export function labelFor(pos: FretPosition, mode: LabelMode, ctx: LabelContext): string | undefined {
  if (mode === "none") return undefined;
  const pitch = spelledPitchAt(ctx.tuning, pos, ctx.spelling);
  if (mode === "note") return noteName(pitch);
  if (mode === "pitch") return pitchName(pitch);
  if (!ctx.root) return noteName(pitch);
  return formulaLabel(intervalBetween(ctx.root, pitch));
}

export function describePosition(tuning: Tuning, pos: FretPosition, spelling?: readonly Note[]): string {
  const open = spelledPitchAt(tuning, { string: pos.string, fret: 0 });
  const where = pos.fret === 0 ? "open" : `fret ${pos.fret}`;
  return `String ${pos.string} (${noteName(open)}), ${where}: ${pitchName(spelledPitchAt(tuning, pos, spelling))}`;
}

function roleForChord(chord: Chord, pc: number): MarkerRole {
  return chordToneForPitchClass(chord, pc)?.role ?? "neutral";
}

function roleForScale(scale: Scale, pc: number): MarkerRole {
  const degree = scaleDegreeForPitchClass(scale, pc);
  if (!degree) return "neutral";
  return degree.degree === 1 ? "root" : "tone";
}

export function tuningFor(id: string | undefined): Tuning {
  return (id && TUNINGS[id]) || STANDARD_TUNING;
}

/** Turn declarative content into a renderable model. Pure and deterministic. */
export function resolveFretboard(spec: FretboardSpec): FretboardModel {
  const tuning = tuningFor(spec.tuning);
  const range = spec.range ?? DEFAULT_RANGE;
  const searchRange = spec.region ?? range;
  const labels = spec.labels ?? "note";
  const chord = spec.chord ? buildChord(spec.chord.root, spec.chord.quality) : undefined;
  const scale = spec.scale ? buildScale(spec.scale.root, spec.scale.type) : undefined;
  const spelling: Note[] | undefined = chord
    ? chord.tones.map((t) => t.note)
    : scale
      ? scale.degrees.map((d) => d.note)
      : spec.notes?.map(parseNote);
  const root = chord?.root ?? scale?.tonic ?? (spec.root ? parseNote(spec.root) : undefined);
  const ctx: LabelContext = { tuning, spelling: spelling ?? (root ? [root] : undefined), root };

  const markers = new Map<string, FretMarker>();
  const add = (marker: FretMarker) => markers.set(positionKey(marker.position), marker);
  const stringIndicators: Partial<Record<number, StringIndicator>> = {};

  if (chord) {
    if (spec.chord?.voicing) {
      const voicing = parseVoicing(spec.chord.voicing);
      const count = voicing.frets.length;
      voicing.frets.forEach((fret, i) => {
        const string = count - i;
        stringIndicators[string] = fret === null ? "muted" : fret === 0 ? "open" : undefined;
      });
      for (const position of voicingPositions(voicing)) {
        add({ position, role: roleForChord(chord, pitchClassAt(tuning, position)), label: labelFor(position, labels, ctx) });
      }
    } else {
      for (const tone of chord.tones) {
        for (const position of findPitchClass(tuning, pitchClass(tone.note), searchRange, spec.strings)) {
          add({ position, role: tone.role, label: labelFor(position, labels, ctx) });
        }
      }
    }
  }

  if (scale) {
    for (const degree of scale.degrees) {
      for (const position of findPitchClass(tuning, pitchClass(degree.note), searchRange, spec.strings)) {
        add({ position, role: roleForScale(scale, pitchClass(degree.note)), label: labelFor(position, labels, ctx) });
      }
    }
  }

  if (spec.notes) {
    for (const text of spec.notes) {
      const n = parseNote(text);
      for (const position of findPitchClass(tuning, pitchClass(n), searchRange, spec.strings)) {
        const isRoot = root !== undefined && pitchClass(root) === pitchClass(n);
        add({ position, role: isRoot ? "root" : "tone", label: labelFor(position, labels, ctx) });
      }
    }
  }

  for (const p of spec.positions ?? []) {
    const position = { string: p.string, fret: p.fret };
    const pc = pitchClassAt(tuning, position);
    const role: MarkerRole =
      p.role ?? (chord ? roleForChord(chord, pc) : root && pitchClass(root) === pc ? "root" : "neutral");
    add({ position, role, state: p.state, label: p.label ?? labelFor(position, labels, ctx) });
  }

  const sorted = [...markers.values()].sort(
    (a, b) => midiAt(tuning, a.position) - midiAt(tuning, b.position),
  );
  const withDescriptions = sorted.map((m) => ({
    ...m,
    role: spec.roles === false ? ("neutral" as const) : m.role,
    description: m.description ?? describePosition(tuning, m.position, ctx.spelling),
  }));

  return {
    tuning,
    range,
    markers: withDescriptions,
    stringIndicators: Object.keys(stringIndicators).length ? stringIndicators : undefined,
    activeStrings: spec.strings,
    region: spec.region,
  };
}

/** All strings of a tuning, high to low, as renderers usually draw them top-to-bottom. */
export function stringsHighToLow(tuning: Tuning): number[] {
  return stringsLowToHigh(tuning).reverse();
}
