/**
 * Drill generators: turn a DrillGenerator (data) plus a random source into ordinary exercises.
 *
 * Generators are pure functions of their RNG, so tests can seed them and validate thousands of
 * generated questions. Every generated fretboard item carries a `solution` computed from the
 * theory engine, and every multiple-choice item an `answer` that is one of its choices.
 */
import {
  type FretPosition,
  type Inversion,
  type Note,
  CHORD_QUALITIES,
  INVERSION_NAMES,
  STANDARD_TUNING,
  buildChord,
  buildScale,
  chordName,
  findMidi,
  findPitchClass,
  findVoicings,
  intervalName,
  midi,
  mod,
  noteName,
  openStringPitch,
  parseInterval,
  parseNote,
  parseVoicing,
  pitchClass,
  pitchClassLabel,
  pitchClassAt,
  relativeMinor,
  semitones,
  spelledPitchAt,
  transpose,
  transposePitch,
  voicingPositions,
  voicingShape,
} from "@/lib/theory";
import { type FretboardSpec, lowStringFret, pentatonicPositionRange, rangeForVoicing } from "@/lib/fretboard";
import type { Choice, DrillExercise, DrillGenerator, DrillItem, FretboardExercise, MultipleChoiceExercise } from "./types";

export type Rng = () => number;

/** Deterministic RNG (mulberry32) for tests and reproducible runs. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick from empty list");
  return items[Math.floor(rng() * items.length)]!;
}

function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const NATURALS = ["C", "D", "E", "F", "G", "A", "B"];
const NECK = { mobile: "neck", desktop: "neck" } as const;
const CHORD = { mobile: "chord", desktop: "chord" } as const;
const BUILD = { mobile: "chord", desktop: "neck" } as const;

const STRING_NAMES: Record<number, string> = { 1: "high E", 2: "B", 3: "G", 4: "D", 5: "A", 6: "low E" };
export function stringName(string: number): string {
  return `${STRING_NAMES[string] ?? noteName(openStringPitch(STANDARD_TUNING, string))} string`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

/** Build choices from labels, keeping the first `count` unique labels and shuffling. */
function choicesFrom(rng: Rng, answer: string, distractors: readonly string[], count = 4): Choice[] {
  const unique = [answer, ...distractors.filter((d, i) => d !== answer && distractors.indexOf(d) === i)].slice(0, count);
  return shuffle(rng, unique).map((label) => ({ id: label, label }));
}

function isNatural(pos: FretPosition): boolean {
  return spelledPitchAt(STANDARD_TUNING, pos).accidental === 0;
}

/** Retry a generator a few times when random parameters don't produce a playable question. */
function attempt<T>(fn: () => T | undefined, tries = 60): T {
  for (let i = 0; i < tries; i++) {
    const result = fn();
    if (result !== undefined) return result;
  }
  throw new Error("Drill generator could not produce a question; widen its ranges.");
}

type Gen<K extends DrillGenerator["type"]> = (g: Extract<DrillGenerator, { type: K }>, id: string, rng: Rng) => DrillItem;

// ---------------------------------------------------------------------------------------------

const noteLocation: Gen<"note-location"> = (g, id, rng) =>
  attempt(() => {
    const string = pick(rng, g.strings);
    const range = g.range ?? { start: 0, end: 11 };
    const n = pick(rng, g.notes ?? NATURALS);
    const solution = findPitchClass(STANDARD_TUNING, pitchClass(parseNote(n)), range, [string]);
    if (solution.length === 0) return undefined;
    const item: FretboardExercise = {
      id,
      kind: "fretboard",
      task: "locate",
      prompt: `Find **${noteName(parseNote(n))}** on the ${stringName(string)}.`,
      board: { range: { start: 0, end: Math.max(range.end, 5) }, labels: "none", strings: [string], layout: NECK },
      selection: solution.length === 1 ? "single" : "multi",
      rule: { type: "pitch-classes", notes: [n], region: { range, strings: [string] }, match: "all" },
      solution,
    };
    return item;
  });

const noteNaming: Gen<"note-naming"> = (g, id, rng) =>
  attempt(() => {
    const position = { string: pick(rng, g.strings), fret: int(rng, g.range.start, g.range.end) };
    if (g.naturalsOnly && !isNatural(position)) return undefined;
    const pc = pitchClassAt(STANDARD_TUNING, position);
    const offsets = shuffle(rng, [-2, -1, 1, 2, 3, -3]);
    const candidates = offsets.map((o) => mod(pc + o, 12)).filter((c) => !g.naturalsOnly || pitchClassLabel(c).length === 1);
    const item: MultipleChoiceExercise = {
      id,
      kind: "multiple-choice",
      prompt: "What note is this?",
      board: {
        range: { start: 0, end: Math.max(g.range.end, 5) },
        labels: "none",
        positions: [{ ...position, role: "tone", label: "?" }],
        layout: NECK,
      },
      choices: choicesFrom(rng, pitchClassLabel(pc), candidates.map(pitchClassLabel)),
      answer: pitchClassLabel(pc),
    };
    return item;
  });

function naturalRoot(rng: Rng, strings: readonly number[], range: { start: number; end: number }) {
  return attempt(() => {
    const pos = { string: pick(rng, strings), fret: int(rng, range.start, range.end) };
    return isNatural(pos) ? pos : undefined;
  });
}

const intervalConstruction: Gen<"interval-construction"> = (g, id, rng) =>
  attempt(() => {
    const root = naturalRoot(rng, g.rootStrings, g.rootRange);
    const rootPitch = spelledPitchAt(STANDARD_TUNING, root);
    const code = pick(rng, g.intervals);
    const target = transposePitch(rootPitch, code);
    const where = findMidi(STANDARD_TUNING, midi(target), g.boardRange).filter((p) => p.string !== root.string || p.fret !== root.fret);
    if (where.length === 0) return undefined;
    const item: FretboardExercise = {
      id,
      kind: "fretboard",
      task: "locate",
      prompt: `Find the **${intervalName(parseInterval(code))}** above this ${noteName(rootPitch)}.`,
      board: {
        range: g.boardRange,
        labels: "none",
        positions: [{ ...root, role: "root", label: noteName(rootPitch) }],
        layout: NECK,
      },
      selection: "single",
      rule: { type: "interval", from: root, interval: code },
      solution: [pick(rng, where)],
    };
    return item;
  });

const intervalRecognition: Gen<"interval-recognition"> = (g, id, rng) =>
  attempt(() => {
    const root = naturalRoot(rng, g.rootStrings, g.rootRange);
    const rootPitch = spelledPitchAt(STANDARD_TUNING, root);
    const code = pick(rng, g.intervals);
    const size = semitones(parseInterval(code));
    const target = transposePitch(rootPitch, code);
    const where = findMidi(STANDARD_TUNING, midi(target), g.boardRange).filter((p) => p.string !== root.string || p.fret !== root.fret);
    if (where.length === 0) return undefined;
    const other = pick(rng, where);
    // Distractors: the nearest intervals by size, never one that sounds identical (A4 vs d5).
    const distractors = [...g.intervals]
      .filter((c) => semitones(parseInterval(c)) !== size)
      .sort((a, b) => Math.abs(semitones(parseInterval(a)) - size) - Math.abs(semitones(parseInterval(b)) - size))
      .map((c) => capitalize(intervalName(parseInterval(c))));
    const answer = capitalize(intervalName(parseInterval(code)));
    const item: MultipleChoiceExercise = {
      id,
      kind: "multiple-choice",
      prompt: "What interval is shown? The square is the root.",
      board: {
        range: g.boardRange,
        labels: "none",
        positions: [
          { ...root, role: "root", label: g.showNames ? noteName(rootPitch) : "R" },
          { ...other, role: "tone", label: g.showNames ? noteName(spelledPitchAt(STANDARD_TUNING, other, [target])) : undefined },
        ],
        layout: NECK,
      },
      choices: choicesFrom(rng, answer, shuffle(rng, distractors.slice(0, 5))),
      answer,
    };
    return item;
  });

const chordConstruction: Gen<"chord-construction"> = (g, id, rng) =>
  attempt(() => {
    const root = pick(rng, g.roots);
    const quality = pick(rng, g.qualities);
    const inversion = g.inversions ? pick(rng, g.inversions) : undefined;
    const strings = g.stringGroups ? pick(rng, g.stringGroups) : undefined;
    const chord = buildChord(root, quality);
    const voicings = findVoicings(STANDARD_TUNING, chord, {
      range: g.range,
      strings,
      inversion,
      minStrings: strings?.length ?? 3,
      limit: 30,
    });
    if (voicings.length === 0) return undefined;
    const where = strings ? ` on strings ${strings.join(", ")}` : "";
    const inv = inversion ? ` in ${INVERSION_NAMES[inversion]}` : "";
    const item: FretboardExercise = {
      id,
      kind: "fretboard",
      task: "construct",
      prompt: `Build **${chordName(chord)}**${inv}${where}.`,
      board: { range: g.range, labels: "none", strings, layout: strings ? NECK : BUILD },
      selection: "per-string",
      rule: { type: "chord", chord: { root, quality }, inversion, strings, minNotes: strings?.length ?? 3 },
      solution: voicingPositions(pick(rng, voicings.slice(0, 8))),
    };
    return item;
  });

function chordBoard(root: string, quality: keyof typeof CHORD_QUALITIES, shape: string): FretboardSpec {
  const range = rangeForVoicing(parseVoicing(shape));
  return { chord: { root, quality, voicing: shape }, range, labels: "note", roles: false, layout: CHORD };
}

const chordRecognition: Gen<"chord-recognition"> = (g, id, rng) =>
  attempt(() => {
    const root = pick(rng, g.roots);
    const quality = pick(rng, g.qualities);
    const chord = buildChord(root, quality);
    const strings = g.stringGroups ? pick(rng, g.stringGroups) : undefined;
    const voicings = findVoicings(STANDARD_TUNING, chord, { range: g.range, strings, minStrings: strings?.length ?? 3, limit: 20 });
    if (voicings.length === 0) return undefined;
    const shape = voicingShape(pick(rng, voicings));
    const answer = chordName(chord);
    const parallel = chordName(buildChord(root, quality === "major" ? "minor" : "major"));
    const relativeRoot = quality === "major" ? relativeMinor(root) : transpose(parseNote(root), "m3");
    const relative = chordName(buildChord(relativeRoot, quality === "major" ? "minor" : "major"));
    const others = shuffle(rng, g.roots.filter((r) => r !== root)).map((r) => chordName(buildChord(r, pick(rng, g.qualities))));
    const item: MultipleChoiceExercise = {
      id,
      kind: "multiple-choice",
      prompt: "Name this chord.",
      board: chordBoard(root, quality, shape),
      choices: choicesFrom(rng, answer, [parallel, relative, ...others]),
      answer,
    };
    return item;
  });

const INVERSIONS: Inversion[] = ["root-position", "first-inversion", "second-inversion"];

const inversionRecognition: Gen<"inversion-recognition"> = (g, id, rng) =>
  attempt(() => {
    const root = pick(rng, g.roots);
    const quality = pick(rng, g.qualities);
    const chord = buildChord(root, quality);
    const strings = pick(rng, g.stringGroups);
    const inversion = pick(rng, INVERSIONS);
    const voicings = findVoicings(STANDARD_TUNING, chord, { range: g.range, strings, inversion, minStrings: strings.length, limit: 10 });
    if (voicings.length === 0) return undefined;
    const shape = voicingShape(pick(rng, voicings));
    const board = chordBoard(root, quality, shape);
    const item: MultipleChoiceExercise = {
      id,
      kind: "multiple-choice",
      prompt: `This is **${chordName(chord)}**. Which inversion is it?`,
      board: { ...board, layout: NECK, range: { start: Math.max(0, board.range!.start - 1), end: board.range!.start + 5 } },
      choices: INVERSIONS.map((inv) => ({ id: inv, label: capitalize(INVERSION_NAMES[inv]) })),
      answer: inversion,
    };
    return item;
  });

function pentatonicBoard(scale: "minor-pentatonic" | "major-pentatonic", root: string, position: 1 | 2 | 3 | 4 | 5, roles: boolean) {
  const minorRoot: Note = scale === "major-pentatonic" ? relativeMinor(root) : parseNote(root);
  const window = pentatonicPositionRange(lowStringFret(minorRoot), position);
  const board: FretboardSpec = {
    scale: { root, type: scale },
    region: window,
    range: { start: Math.max(0, window.start - 1), end: window.end + 1 },
    labels: "none",
    roles,
    layout: NECK,
  };
  return { window, board };
}

const scaleRoots: Gen<"scale-roots"> = (g, id, rng) => {
  const root = pick(rng, g.roots);
  const position = pick(rng, g.positions);
  const { window, board } = pentatonicBoard(g.scale, root, position, false);
  const name = buildScale(root, g.scale).type.name;
  return {
    id,
    kind: "fretboard",
    task: "identify",
    prompt: `This is position ${position} of **${noteName(parseNote(root))} ${name}**. Tap every root.`,
    board,
    selection: "multi",
    selectableOnlyMarkers: true,
    rule: { type: "pitch-classes", notes: [root], region: { range: window }, match: "all" },
    solution: findPitchClass(STANDARD_TUNING, pitchClass(parseNote(root)), window),
  };
};

const scaleIdentification: Gen<"scale-identification"> = (g, id, rng) => {
  const root = pick(rng, g.roots);
  const position = pick(rng, g.positions);
  const { board } = pentatonicBoard(g.scale, root, position, true);
  const name = buildScale(root, g.scale).type.name;
  const label = (r: string) => `${noteName(parseNote(r))} ${name}`;
  return {
    id,
    kind: "multiple-choice",
    prompt: `Which ${name} scale is this? The squares are its roots.`,
    board: { ...board, labels: "none" },
    choices: choicesFrom(rng, label(root), shuffle(rng, g.roots.filter((r) => r !== root)).map(label)),
    answer: label(root),
  };
};

const scaleOnString: Gen<"scale-on-string"> = (g, id, rng) => {
  const root = pick(rng, g.roots);
  const type = pick(rng, g.scales);
  const string = pick(rng, g.strings);
  const scale = buildScale(root, type);
  const range = { start: 0, end: 11 };
  const solution = scale.degrees.flatMap((d) => findPitchClass(STANDARD_TUNING, pitchClass(d.note), range, [string]));
  return {
    id,
    kind: "fretboard",
    task: "construct",
    prompt: `Play **${noteName(scale.tonic)} ${scale.type.name}** along the ${stringName(string)}: select every scale note from the open string to fret 11.`,
    hint: `The notes are ${scale.degrees.map((d) => noteName(d.note)).join(", ")}.`,
    board: { range, labels: "none", strings: [string], layout: NECK },
    selection: "multi",
    rule: { type: "scale", scale: { root, type }, region: { range, strings: [string] } },
    solution,
  };
};

const scaleDegree: Gen<"scale-degree"> = (g, id, rng) => {
  const root = pick(rng, g.roots);
  const scale = buildScale(root, g.scale);
  const available = scale.degrees.filter((d) => d.degree > 1 && (!g.degrees || g.degrees.includes(d.degree)));
  const target = pick(rng, available);
  const answer = noteName(target.note);
  const sameLetter = [-1, 1]
    .map((a) => ({ letter: target.note.letter, accidental: target.note.accidental + a }))
    .filter((n) => Math.abs(n.accidental) <= 1)
    .map((n) => noteName(n));
  const neighbours = scale.degrees.filter((d) => Math.abs(d.degree - target.degree) === 1).map((d) => noteName(d.note));
  return {
    id,
    kind: "multiple-choice",
    prompt: `What is the **${ordinal(target.degree)} degree** of ${noteName(scale.tonic)} ${scale.type.name}?`,
    choices: choicesFrom(rng, answer, shuffle(rng, [...sameLetter, ...neighbours])),
    answer,
  };
};

// ---------------------------------------------------------------------------------------------

type GeneratorMap = { [K in DrillGenerator["type"]]: Gen<K> };

export const DRILL_GENERATORS: GeneratorMap = {
  "note-location": noteLocation,
  "note-naming": noteNaming,
  "interval-construction": intervalConstruction,
  "interval-recognition": intervalRecognition,
  "chord-construction": chordConstruction,
  "chord-recognition": chordRecognition,
  "inversion-recognition": inversionRecognition,
  "scale-roots": scaleRoots,
  "scale-identification": scaleIdentification,
  "scale-on-string": scaleOnString,
  "scale-degree": scaleDegree,
};

/** Generate one round. Avoids repeating the previous round's prompt+answer where possible. */
export function generateDrillItem(drill: DrillExercise, round: number, rng: Rng, previous?: DrillItem): DrillItem {
  const generator = DRILL_GENERATORS[drill.generator.type] as Gen<DrillGenerator["type"]>;
  let item = generator(drill.generator, `${drill.id}-r${round}`, rng);
  for (let i = 0; i < 5 && previous && fingerprint(item) === fingerprint(previous); i++) {
    item = generator(drill.generator, `${drill.id}-r${round}`, rng);
  }
  return item;
}

function fingerprint(item: DrillItem): string {
  return item.kind === "multiple-choice"
    ? `${item.prompt}|${item.answer}|${JSON.stringify(item.board?.positions ?? item.board?.chord ?? "")}`
    : `${item.prompt}|${JSON.stringify(item.solution)}`;
}
