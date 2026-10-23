/**
 * Answer validation. Each rule type has a validator that returns structured, musical feedback.
 * Validators are pure functions of (rule, context) so they are trivially testable and could run
 * on a server for graded assessments later.
 */
import {
  type Chord,
  type FretPosition,
  type FretRange,
  type Note,
  type Pitch,
  type Tuning,
  INVERSION_BASS_ROLE,
  INVERSION_NAMES,
  buildScale,
  chordFromSpec,
  chordName,
  chordToneForPitchClass,
  findMidi,
  findPitchClass,
  identifyChord,
  intervalFromSemitones,
  intervalName,
  inversionForBass,
  midi,
  midiAt,
  mod,
  noteName,
  parseInterval,
  parseNote,
  parsePitch,
  pitchClass,
  pitchName,
  positionKey,
  samePosition,
  semitones,
  spellInContext,
  spelledPitchAt,
  transpose,
  transposePitch,
  CHORD_QUALITIES,
} from "@/lib/theory";
import type {
  ChordRule,
  ExactPositionsRule,
  FeedbackIssue,
  IntervalRule,
  MultipleChoiceExercise,
  PitchClassRule,
  PitchRule,
  PositionMark,
  Region,
  ScaleRule,
  ValidationResult,
  ValidationRule,
} from "./types";

export interface ValidationContext {
  readonly tuning: Tuning;
  readonly selection: readonly FretPosition[];
  /** The visible board range; used where a rule has no explicit region. */
  readonly range: FretRange;
}

type Validator<R extends ValidationRule> = (rule: R, ctx: ValidationContext) => ValidationResult;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const article = (word: string) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`);
const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

function emptyResult(): ValidationResult {
  return {
    correct: false,
    message: "Select some notes on the fretboard first.",
    issues: [{ code: "empty", message: "Nothing is selected yet." }],
    marks: [],
  };
}

function inRegion(pos: FretPosition, region: Region): boolean {
  return (
    pos.fret >= region.range.start &&
    pos.fret <= region.range.end &&
    (!region.strings || region.strings.includes(pos.string))
  );
}

function regionDescription(region: Region): string {
  const frets =
    region.range.start === region.range.end
      ? `fret ${region.range.start}`
      : `frets ${region.range.start}–${region.range.end}`;
  if (!region.strings) return frets;
  return `${frets} on ${region.strings.length === 1 ? "string" : "strings"} ${list(region.strings.map(String))}`;
}

/** Spell a pitch class relative to a root, the way a musician would name it in that key. */
function spellRelativeTo(root: Note, pc: number): Note {
  return transpose(root, intervalFromSemitones(mod(pc - pitchClass(root), 12)));
}

// ---------------------------------------------------------------------------------------------
// Chords: any voicing
// ---------------------------------------------------------------------------------------------

function explainWrongChordNote(chord: Chord, pc: number): FeedbackIssue {
  const root = chord.root;
  const semis = mod(pc - pitchClass(root), 12);
  const wrongInterval = intervalFromSemitones(semis);
  const wrong = transpose(root, wrongInterval);
  const name = chordName(chord);
  const third = chord.tones.find((t) => t.role === "third");
  const fifth = chord.tones.find((t) => t.role === "fifth");

  if (third && (semis === 3 || semis === 4) && Math.abs(semis - semitones(third.interval)) === 1) {
    return {
      code: "wrong-third",
      message: `${noteName(wrong)} is ${article(intervalName(wrongInterval))} above ${noteName(root)}. ${name} needs ${article(
        intervalName(third.interval),
      )}: ${noteName(third.note)}.`,
    };
  }
  if (fifth && (semis === 6 || semis === 8)) {
    return {
      code: "wrong-fifth",
      message: `${noteName(wrong)} is ${semis === 6 ? "a semitone below" : "a semitone above"} the fifth. The fifth of ${name} is ${noteName(
        fifth.note,
      )}, ${article(intervalName(fifth.interval))} above the root.`,
    };
  }
  return {
    code: "wrong-note",
    message: `${noteName(wrong)} isn't in ${name}, which contains only ${list(chord.tones.map((t) => noteName(t.note)))}.`,
  };
}

const validateChord: Validator<ChordRule> = (rule, { tuning, selection }) => {
  if (selection.length === 0) return emptyResult();
  const chord = chordFromSpec(rule.chord);
  const name = chordName(chord);
  const issues: FeedbackIssue[] = [];
  const incorrect = new Map<string, FretPosition>();
  const minNotes = rule.minNotes ?? 3;

  // A chord is played with one note per string.
  const strings = new Map<number, FretPosition[]>();
  for (const pos of selection) strings.set(pos.string, [...(strings.get(pos.string) ?? []), pos]);
  for (const [string, positions] of strings) {
    if (positions.length > 1) {
      issues.push({
        code: "same-string",
        message: `String ${string} has ${positions.length} notes selected, but a string can only sound one note at a time.`,
        positions,
      });
      positions.slice(1).forEach((p) => incorrect.set(positionKey(p), p));
    }
  }

  if (rule.strings) {
    const outside = selection.filter((p) => !rule.strings!.includes(p.string));
    if (outside.length) {
      issues.push({
        code: "wrong-string",
        message: `Use only strings ${list(rule.strings.map(String))} for this exercise.`,
        positions: outside,
      });
      outside.forEach((p) => incorrect.set(positionKey(p), p));
    }
  }

  const reported = new Set<number>();
  for (const pos of selection) {
    const pc = mod(midiAt(tuning, pos), 12);
    if (!chordToneForPitchClass(chord, pc)) {
      incorrect.set(positionKey(pos), pos);
      if (!reported.has(pc)) {
        reported.add(pc);
        const wrongAt = selection.filter((p) => mod(midiAt(tuning, p), 12) === pc);
        issues.push({ ...explainWrongChordNote(chord, pc), positions: wrongAt });
      }
    }
  }

  const selectedPcs = new Set(selection.map((p) => mod(midiAt(tuning, p), 12)));
  for (const tone of chord.tones) {
    if (!selectedPcs.has(pitchClass(tone.note))) {
      issues.push({ code: "missing-tone", message: `Your chord is missing the ${tone.role} (${noteName(tone.note)}).` });
    }
  }

  if (selection.length < minNotes && !issues.some((i) => i.code === "missing-tone")) {
    issues.push({ code: "too-few-notes", message: `Play at least ${plural(minNotes, "note")} for a full-sounding chord.` });
  }

  const sorted = [...selection].sort((a, b) => midiAt(tuning, a) - midiAt(tuning, b));
  const bass = sorted[0]!;
  const bassPc = mod(midiAt(tuning, bass), 12);

  if (issues.length === 0 && rule.inversion) {
    const actual = inversionForBass(chord, bassPc);
    if (actual !== rule.inversion) {
      const bassTone = chordToneForPitchClass(chord, bassPc)!;
      const wantedRole = INVERSION_BASS_ROLE[rule.inversion];
      const wanted = chord.tones.find((t) => t.role === wantedRole)!;
      issues.push({
        code: "wrong-inversion",
        message: `These notes form ${name}, but the lowest note is ${noteName(bassTone.note)} (the ${bassTone.role}), which makes it ${
          INVERSION_NAMES[actual!]
        }. This exercise asks for ${INVERSION_NAMES[rule.inversion]}: put the ${wantedRole} (${noteName(wanted.note)}) in the bass.`,
        positions: [bass],
      });
      incorrect.set(positionKey(bass), bass);
    }
  }

  const marks: PositionMark[] = selection.map((position) => ({
    position,
    state: incorrect.has(positionKey(position)) ? "incorrect" : "correct",
  }));

  if (issues.length === 0) {
    const inversion = inversionForBass(chord, bassPc);
    const suffix = inversion && inversion !== "root-position" ? ` in ${INVERSION_NAMES[inversion]}` : "";
    return { correct: true, message: `That's ${name}${suffix}.`, issues: [], marks };
  }

  // If the notes form a different recognisable chord, lead with that.
  const other = identifyChord(selectedPcs, bassPc)[0];
  let message = `Not quite ${name} yet.`;
  if (other && !(other.rootPc === pitchClass(chord.root) && other.quality === rule.chord.quality)) {
    const otherRoot = spellRelativeTo(chord.root, other.rootPc);
    message = `Those notes form ${noteName(otherRoot)} ${CHORD_QUALITIES[other.quality].name}, not ${name}.`;
    issues.unshift({ code: "different-chord", message });
  } else if (issues[0]?.code === "wrong-inversion") {
    message = "Right chord, wrong inversion.";
  }
  return { correct: false, message, issues, marks };
};

// ---------------------------------------------------------------------------------------------
// Pitch-class sets in a region (find every G; build a scale shape)
// ---------------------------------------------------------------------------------------------

function validatePitchClassSet(
  targets: readonly Note[],
  region: Region,
  match: "all" | "any",
  { tuning, selection }: ValidationContext,
  noun: string,
): ValidationResult {
  if (selection.length === 0) return emptyResult();
  const targetPcs = new Set(targets.map(pitchClass));
  const expected = [...targetPcs].flatMap((pc) => findPitchClass(tuning, pc, region.range, region.strings));
  const issues: FeedbackIssue[] = [];
  const marks: PositionMark[] = [];
  const targetNames = list(targets.map((n) => noteName(n)));

  const outside = selection.filter((p) => !inRegion(p, region));
  if (outside.length) {
    issues.push({
      code: "wrong-string",
      message: `Stay within ${regionDescription(region)} for this exercise.`,
      positions: outside,
    });
  }

  for (const pos of selection) {
    const pc = mod(midiAt(tuning, pos), 12);
    const ok = targetPcs.has(pc) && inRegion(pos, region);
    marks.push({ position: pos, state: ok ? "correct" : "incorrect" });
    if (!targetPcs.has(pc)) {
      const actual = spellInContext(pc, targets);
      // Point to the nearest target on the same string, which turns most errors into a fret count.
      const sameString = expected
        .filter((p) => p.string === pos.string)
        .sort((a, b) => Math.abs(a.fret - pos.fret) - Math.abs(b.fret - pos.fret))[0];
      let detail = "";
      if (sameString) {
        const diff = sameString.fret - pos.fret;
        const nearest = noteName(spelledPitchAt(tuning, sameString, targets));
        detail = ` ${nearest} is ${plural(Math.abs(diff), "fret")} ${diff > 0 ? "higher" : "lower"} on this string.`;
      }
      issues.push({
        code: "wrong-note",
        message: `That's ${noteName(actual)} (string ${pos.string}, ${pos.fret === 0 ? "open" : `fret ${pos.fret}`}), not ${targetNames}.${detail}`,
        positions: [pos],
      });
    }
  }

  const found = expected.filter((e) => selection.some((s) => samePosition(s, e)));
  const missed = expected.filter((e) => !selection.some((s) => samePosition(s, e)));
  if (match === "all" && missed.length) {
    issues.push({
      code: "missing-note",
      message: `You've found ${found.length} of ${expected.length} ${noun} in ${regionDescription(region)}. ${missed.length} more to find.`,
      positions: missed,
    });
    missed.forEach((position) => marks.push({ position, state: "missed" }));
  }
  if (match === "any" && found.length === 0 && issues.length === 0) {
    issues.push({ code: "missing-note", message: `Find at least one ${targetNames}.` });
  }

  const correct = issues.length === 0;
  return {
    correct,
    message: correct
      ? match === "all"
        ? `You found all ${expected.length} ${noun}.`
        : `Yes, that's ${targetNames}.`
      : found.length && issues.every((i) => i.code === "missing-note")
        ? "Good so far, but there are more to find."
        : "Not quite.",
    issues,
    marks,
  };
}

const validatePitchClasses: Validator<PitchClassRule> = (rule, ctx) => {
  const notes = rule.notes.map(parseNote);
  const noun = `${list(notes.map((n) => noteName(n)))} notes`;
  return validatePitchClassSet(notes, rule.region, rule.match, ctx, noun);
};

const validateScale: Validator<ScaleRule> = (rule, ctx) => {
  const scale = buildScale(rule.scale.root, rule.scale.type);
  const result = validatePitchClassSet(
    scale.degrees.map((d) => d.note),
    rule.region,
    "all",
    ctx,
    `notes of ${noteName(scale.tonic)} ${scale.type.name}`,
  );
  return result;
};

// ---------------------------------------------------------------------------------------------
// Octave-specific pitches
// ---------------------------------------------------------------------------------------------

function octaveRelation(actual: number, target: number): string {
  const octaves = Math.round((actual - target) / 12);
  const n = Math.abs(octaves);
  const amount = n === 1 ? "an octave" : `${n} octaves`;
  return `${amount} ${octaves > 0 ? "higher" : "lower"} than`;
}

const validatePitches: Validator<PitchRule> = (rule, ctx) => {
  const { tuning, selection } = ctx;
  if (selection.length === 0) return emptyResult();
  const region: Region = rule.region ?? { range: ctx.range };
  const targets: Pitch[] = rule.pitches.map(parsePitch);
  const targetMidis = new Set(targets.map(midi));
  const issues: FeedbackIssue[] = [];
  const marks: PositionMark[] = [];

  for (const pos of selection) {
    const m = midiAt(tuning, pos);
    if (targetMidis.has(m)) {
      marks.push({ position: pos, state: "correct" });
      continue;
    }
    marks.push({ position: pos, state: "incorrect" });
    const samePc = targets.find((t) => mod(midi(t), 12) === mod(m, 12));
    const actual = spelledPitchAt(tuning, pos, targets);
    if (samePc) {
      issues.push({
        code: "wrong-octave",
        message: `You found the right note name, but this ${noteName(actual)} is ${pitchName(actual)}: ${octaveRelation(
          m,
          midi(samePc),
        )} the ${pitchName(samePc)} this exercise asks for.`,
        positions: [pos],
      });
    } else {
      issues.push({
        code: "wrong-note",
        message: `That's ${pitchName(actual)}, not ${list(targets.map((t) => pitchName(t)))}.`,
        positions: [pos],
      });
    }
  }

  const selectedMidis = new Set(selection.map((p) => midiAt(tuning, p)));
  for (const target of targets) {
    if (!selectedMidis.has(midi(target))) {
      const where = findMidi(tuning, midi(target), region.range, region.strings);
      issues.push({ code: "missing-note", message: `You still need ${pitchName(target)}.`, positions: where });
      where.slice(0, 1).forEach((position) => marks.push({ position, state: "missed" }));
    }
  }

  const correct = issues.length === 0;
  return {
    correct,
    message: correct ? `Yes: ${list(targets.map((t) => pitchName(t)))}.` : issues.some((i) => i.code === "wrong-octave") ? "Right note, wrong octave." : "Not quite.",
    issues,
    marks,
  };
};

// ---------------------------------------------------------------------------------------------
// Intervals from a given note
// ---------------------------------------------------------------------------------------------

const validateInterval: Validator<IntervalRule> = (rule, ctx) => {
  const { tuning } = ctx;
  const selection = ctx.selection.filter((p) => !samePosition(p, rule.from));
  const tappedRoot = ctx.selection.some((p) => samePosition(p, rule.from));
  const interval = parseInterval(rule.interval);
  const direction = rule.direction ?? "up";
  const sign = direction === "up" ? 1 : -1;
  const rootPitch = spelledPitchAt(tuning, rule.from);
  const targetPitch = transposePitch(rootPitch, interval, direction);
  const expected = sign * semitones(interval);
  const rootMidi = midiAt(tuning, rule.from);
  const name = intervalName(interval);
  const dirWord = direction === "up" ? "above" : "below";

  if (selection.length === 0) {
    if (tappedRoot) {
      return {
        correct: false,
        message: "That's the starting note itself.",
        issues: [{ code: "wrong-interval", message: `Find the note ${article(name)} ${dirWord} ${noteName(rootPitch)}, not the root.` }],
        marks: [{ position: rule.from, state: "incorrect" }],
      };
    }
    return emptyResult();
  }

  const pos = selection[selection.length - 1]!;
  const m = midiAt(tuning, pos);
  const diff = m - rootMidi;
  const anyOctave = rule.octave === "any-octave";
  const pcMatches = mod(diff - expected, 12) === 0;
  const where = (anyOctave
    ? findPitchClass(tuning, pitchClass(targetPitch), ctx.range)
    : findMidi(tuning, midi(targetPitch), ctx.range)
  ).filter((p) => !samePosition(p, rule.from));

  if (diff === expected || (anyOctave && pcMatches)) {
    return {
      correct: true,
      message: `Yes: ${noteName(targetPitch)} is ${article(name)} ${dirWord} ${noteName(rootPitch)}.`,
      issues: [],
      marks: [{ position: pos, state: "correct" }],
    };
  }

  const actual = spelledPitchAt(tuning, pos, [targetPitch]);
  let issue: FeedbackIssue;
  if (pcMatches) {
    issue = {
      code: "wrong-octave",
      message: `${noteName(actual)} is the right note name, but this one is ${octaveRelation(m, rootMidi + expected)} the ${name} ${dirWord} ${noteName(
        rootPitch,
      )}. Look for ${pitchName(targetPitch)}.`,
      positions: [pos],
    };
  } else {
    const actualInterval = intervalFromSemitones(Math.abs(diff));
    const relation = diff === 0 ? "the same pitch as" : `${article(intervalName(actualInterval))} ${diff > 0 ? "above" : "below"}`;
    const off = expected - diff;
    issue = {
      code: "wrong-interval",
      message: `${pitchName(actual)} is ${relation} ${noteName(rootPitch)}. You need ${article(name)} (${semitonesText(
        semitones(interval),
      )}), so the answer is ${plural(Math.abs(off), "semitone")} ${off > 0 ? "higher" : "lower"} than your choice.`,
      positions: [pos],
    };
  }
  return {
    correct: false,
    message: issue.code === "wrong-octave" ? "Right note, wrong octave." : "That's a different interval.",
    issues: [issue],
    marks: [{ position: pos, state: "incorrect" }, ...where.slice(0, 1).map((position) => ({ position, state: "missed" as const }))],
  };
};

function semitonesText(n: number): string {
  return plural(n, "semitone");
}

// ---------------------------------------------------------------------------------------------
// Exact positions
// ---------------------------------------------------------------------------------------------

const validateExactPositions: Validator<ExactPositionsRule> = (rule, { tuning, selection }) => {
  if (selection.length === 0) return emptyResult();
  const chord = rule.context?.chord ? chordFromSpec(rule.context.chord) : undefined;
  const spelling = chord?.tones.map((t) => t.note);
  const issues: FeedbackIssue[] = [];
  const marks: PositionMark[] = [];

  for (const pos of selection) {
    const ok = rule.positions.some((p) => samePosition(p, pos));
    marks.push({ position: pos, state: ok ? "correct" : "incorrect" });
    if (!ok) {
      const pitch = spelledPitchAt(tuning, pos, spelling);
      const tone = chord ? chordToneForPitchClass(chord, midiAt(tuning, pos)) : undefined;
      issues.push({
        code: "wrong-note",
        message: tone
          ? `That's ${noteName(pitch)}, the ${tone.role} of ${chordName(chord!)}.`
          : `That's ${pitchName(pitch)} (string ${pos.string}, ${pos.fret === 0 ? "open" : `fret ${pos.fret}`}).`,
        positions: [pos],
      });
    }
  }
  const missed = rule.positions.filter((p) => !selection.some((s) => samePosition(s, p)));
  const anyMode = rule.match === "any";
  if (missed.length && (!anyMode || missed.length === rule.positions.length)) {
    issues.push({
      code: "missing-note",
      message:
        rule.positions.length === 1 || anyMode
          ? "That isn't the note we're looking for yet."
          : `${plural(missed.length, "required note")} still missing.`,
      positions: missed,
    });
    (anyMode ? missed.slice(0, 1) : missed).forEach((position) => marks.push({ position, state: "missed" }));
  }
  const correct = issues.length === 0;
  return { correct, message: correct ? "Correct." : "Not quite.", issues, marks };
};

// ---------------------------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------------------------

type ValidatorMap = { [K in ValidationRule["type"]]: Validator<Extract<ValidationRule, { type: K }>> };

export const VALIDATORS: ValidatorMap = {
  "exact-positions": validateExactPositions,
  chord: validateChord,
  "pitch-classes": validatePitchClasses,
  pitches: validatePitches,
  interval: validateInterval,
  scale: validateScale,
};

export function validate(rule: ValidationRule, ctx: ValidationContext): ValidationResult {
  const validator = VALIDATORS[rule.type] as Validator<ValidationRule>;
  return validator(rule, ctx);
}

export function validateChoice(exercise: MultipleChoiceExercise, choiceId: string): ValidationResult {
  const choice = exercise.choices.find((c) => c.id === choiceId);
  const correct = choiceId === exercise.answer;
  return {
    correct,
    message: correct ? "Correct." : "Not quite.",
    issues: correct
      ? []
      : [{ code: "wrong-choice", message: choice?.feedback ?? `“${choice?.label ?? choiceId}” isn't the answer. Try again.` }],
    marks: [],
  };
}
