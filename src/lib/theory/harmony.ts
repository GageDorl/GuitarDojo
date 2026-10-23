/**
 * Diatonic harmony: the chords that belong to a key, Roman numerals, and key signatures.
 *
 * Chords are built by stacking every other note of the scale from each degree (1-3-5, or
 * 1-3-5-7 for seventh chords), then identifying the quality from the resulting intervals. Nothing
 * here is a lookup table of keys, so every key (and future scale types) works the same way.
 */
import { type Chord, type ChordQualityDefinition, type ChordQualityId, CHORD_QUALITIES, buildChord } from "./chords";
import { intervalBetween, intervalCode } from "./intervals";
import { type Note, noteName, toNote } from "./notes";
import { type ScaleTypeId, buildScale } from "./scales";

export interface DiatonicChord {
  /** 1-based scale degree. */
  readonly degree: number;
  readonly chord: Chord;
  readonly numeral: string;
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** Roman numeral for a degree and quality: I, ii, vii°, V7, ii7, Imaj7, viiø7 … */
export function romanNumeral(degree: number, quality: ChordQualityId): string {
  const base = NUMERALS[degree - 1];
  if (!base) throw new Error(`No numeral for degree ${degree}`);
  switch (quality) {
    case "major":
      return base;
    case "minor":
      return base.toLowerCase();
    case "diminished":
      return `${base.toLowerCase()}°`;
    case "augmented":
      return `${base}+`;
    case "major7":
      return `${base}maj7`;
    case "dominant7":
      return `${base}7`;
    case "minor7":
      return `${base.toLowerCase()}7`;
    case "halfDiminished7":
      return `${base.toLowerCase()}ø7`;
    case "diminished7":
      return `${base.toLowerCase()}°7`;
  }
}

function qualityFromNotes(notes: readonly Note[]): ChordQualityId {
  const codes = notes.map((n) => intervalCode(intervalBetween(notes[0]!, n)));
  codes[0] = "P1";
  const match = (Object.entries(CHORD_QUALITIES) as [ChordQualityId, ChordQualityDefinition][]).find(
    ([, q]) => q.formula.length === codes.length && q.formula.every((f, i) => f.interval === codes[i]),
  );
  if (!match) throw new Error(`Unrecognised chord ${notes.map((n) => noteName(n)).join(" ")}`);
  return match[0];
}

/** The seven chords of a key (triads, or seventh chords with `sevenths: true`). */
export function diatonicChords(
  tonic: Note | string,
  scaleType: Extract<ScaleTypeId, "major" | "natural-minor"> = "major",
  options: { sevenths?: boolean } = {},
): DiatonicChord[] {
  const scale = buildScale(toNote(tonic), scaleType);
  const notes = scale.degrees.map((d) => d.note);
  const size = options.sevenths ? 4 : 3;
  return notes.map((root, i) => {
    const stack = Array.from({ length: size }, (_, k) => notes[(i + 2 * k) % notes.length]!);
    const quality = qualityFromNotes(stack);
    return { degree: i + 1, chord: buildChord(root, quality), numeral: romanNumeral(i + 1, quality) };
  });
}

export interface KeySignature {
  readonly sharps: readonly Note[];
  readonly flats: readonly Note[];
}

/** The accidentals of a major or natural-minor key, in scale order. */
export function keySignature(tonic: Note | string, scaleType: Extract<ScaleTypeId, "major" | "natural-minor"> = "major"): KeySignature {
  const notes = buildScale(toNote(tonic), scaleType).degrees.map((d) => d.note);
  return { sharps: notes.filter((n) => n.accidental > 0), flats: notes.filter((n) => n.accidental < 0) };
}
