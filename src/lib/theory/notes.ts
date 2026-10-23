/**
 * Notes, pitch classes and pitches.
 *
 * The engine distinguishes three levels of identity:
 *  - PitchClass: an integer 0–11 (C = 0). Enharmonic equivalents share a pitch class.
 *  - Note: a *spelled* pitch class (letter + accidental). C♯ and D♭ are different Notes.
 *  - Pitch: a spelled note in a specific octave (scientific pitch notation, C4 = middle C = MIDI 60).
 *
 * Educational contexts care about spelling (the third of A major is C♯, never D♭), so most APIs
 * work with spelled Notes and only drop to pitch classes when comparing sounds.
 */

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Letter = (typeof LETTERS)[number];

/** Natural pitch class of each letter. */
export const LETTER_PITCH_CLASS: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export type PitchClass = number;

/** A spelled note. `accidental` is semitones of alteration: -2 = 𝄫, -1 = ♭, 0 = ♮, 1 = ♯, 2 = 𝄪. */
export interface Note {
  readonly letter: Letter;
  readonly accidental: number;
}

/** A spelled note in a specific octave. */
export interface Pitch extends Note {
  readonly octave: number;
}

export type AccidentalPreference = "sharp" | "flat";

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export function note(letter: Letter, accidental = 0): Note {
  return { letter, accidental };
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

export function pitchClass(n: Note): PitchClass {
  return mod(LETTER_PITCH_CLASS[n.letter] + n.accidental, 12);
}

const NOTE_PATTERN = /^([A-Ga-g])(##|#|x|bb|b|♯♯|♯|𝄪|♭♭|♭|𝄫|n|♮)?$/;
const PITCH_PATTERN = /^([A-Ga-g])(##|#|x|bb|b|♯♯|♯|𝄪|♭♭|♭|𝄫|n|♮)?(-?\d+)$/;

function parseAccidental(token: string | undefined): number {
  switch (token) {
    case undefined:
    case "":
    case "n":
    case "♮":
      return 0;
    case "#":
    case "♯":
      return 1;
    case "##":
    case "x":
    case "♯♯":
    case "𝄪":
      return 2;
    case "b":
    case "♭":
      return -1;
    case "bb":
    case "♭♭":
    case "𝄫":
      return -2;
    default:
      throw new Error(`Unknown accidental "${token}"`);
  }
}

/** Parse "C", "F#", "Bb", "E♭", "Gx" … into a Note. Throws on invalid input. */
export function parseNote(text: string): Note {
  const match = NOTE_PATTERN.exec(text.trim());
  if (!match) throw new Error(`Invalid note name "${text}"`);
  return note(match[1]!.toUpperCase() as Letter, parseAccidental(match[2]));
}

/** Parse "C4", "F#3", "Bb2" into a Pitch. */
export function parsePitch(text: string): Pitch {
  const match = PITCH_PATTERN.exec(text.trim());
  if (!match) throw new Error(`Invalid pitch "${text}"`);
  return {
    letter: match[1]!.toUpperCase() as Letter,
    accidental: parseAccidental(match[2]),
    octave: Number.parseInt(match[3]!, 10),
  };
}

/** Accept either a Note or note text. Convenience for content definitions. */
export function toNote(input: Note | string): Note {
  return typeof input === "string" ? parseNote(input) : input;
}

export function toPitch(input: Pitch | string): Pitch {
  return typeof input === "string" ? parsePitch(input) : input;
}

export function accidentalSymbol(accidental: number, ascii = false): string {
  if (accidental === 0) return "";
  if (ascii) return accidental > 0 ? "#".repeat(accidental) : "b".repeat(-accidental);
  switch (accidental) {
    case 1:
      return "♯";
    case 2:
      return "𝄪";
    case -1:
      return "♭";
    case -2:
      return "𝄫";
    default:
      return accidental > 0 ? "♯".repeat(accidental) : "♭".repeat(-accidental);
  }
}

/** Display name, e.g. "C♯". Pass `ascii` for "C#" (useful in ids and tests). */
export function noteName(n: Note, options: { ascii?: boolean } = {}): string {
  return n.letter + accidentalSymbol(n.accidental, options.ascii);
}

export function pitchName(p: Pitch, options: { ascii?: boolean } = {}): string {
  return noteName(p, options) + p.octave;
}

/** MIDI number of a pitch. B♯3 and C4 both map to 60. */
export function midi(p: Pitch): number {
  return (p.octave + 1) * 12 + LETTER_PITCH_CLASS[p.letter] + p.accidental;
}

export function sameNote(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.accidental === b.accidental;
}

export function enharmonic(a: Note, b: Note): boolean {
  return pitchClass(a) === pitchClass(b);
}

const SHARP_SPELLINGS: readonly Note[] = [
  note("C"),
  note("C", 1),
  note("D"),
  note("D", 1),
  note("E"),
  note("F"),
  note("F", 1),
  note("G"),
  note("G", 1),
  note("A"),
  note("A", 1),
  note("B"),
];

const FLAT_SPELLINGS: readonly Note[] = [
  note("C"),
  note("D", -1),
  note("D"),
  note("E", -1),
  note("E"),
  note("F"),
  note("G", -1),
  note("G"),
  note("A", -1),
  note("A"),
  note("B", -1),
  note("B"),
];

/**
 * Default spelling for a bare pitch class when no musical context is available
 * (e.g. labelling an arbitrary fret). Prefer contextual spelling via `spellInContext`.
 */
export function spellPitchClass(pc: PitchClass, prefer: AccidentalPreference = "sharp"): Note {
  const table = prefer === "flat" ? FLAT_SPELLINGS : SHARP_SPELLINGS;
  return table[mod(pc, 12)]!;
}

/**
 * Spell a pitch class using the notes of a musical context (a chord or scale) when one of them
 * matches; otherwise fall back to the default spelling.
 */
export function spellInContext(
  pc: PitchClass,
  context: readonly Note[] | undefined,
  prefer: AccidentalPreference = "sharp",
): Note {
  const match = context?.find((n) => pitchClass(n) === mod(pc, 12));
  return match ?? spellPitchClass(pc, prefer);
}

/** Both common names for a pitch class, e.g. "C♯/D♭"; naturals return a single name. */
export function pitchClassLabel(pc: PitchClass): string {
  const sharp = spellPitchClass(pc, "sharp");
  const flat = spellPitchClass(pc, "flat");
  return sameNote(sharp, flat) ? noteName(sharp) : `${noteName(sharp)}/${noteName(flat)}`;
}

/** Build a Pitch from a MIDI number using a spelling (defaults to sharps). */
export function pitchFromMidi(midiNumber: number, spelling?: Note): Pitch {
  const n = spelling ?? spellPitchClass(mod(midiNumber, 12));
  if (pitchClass(n) !== mod(midiNumber, 12)) {
    throw new Error(`Spelling ${noteName(n)} does not match MIDI ${midiNumber}`);
  }
  // Solve midi = (octave + 1) * 12 + letterPc + accidental for octave.
  const octave = Math.round((midiNumber - LETTER_PITCH_CLASS[n.letter] - n.accidental) / 12) - 1;
  return { ...n, octave };
}

/** The twelve chromatic pitch classes starting from `start`. */
export function chromaticFrom(start: PitchClass): PitchClass[] {
  return Array.from({ length: 12 }, (_, i) => mod(start + i, 12));
}

/** Ascending semitone distance between two pitch classes (0–11). */
export function semitonesUp(from: PitchClass, to: PitchClass): number {
  return mod(to - from, 12);
}
