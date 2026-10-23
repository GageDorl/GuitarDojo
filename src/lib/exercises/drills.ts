/**
 * Drill generators: turn a DrillGenerator (data) plus a random source into ordinary exercises.
 *
 * Generators are pure functions of their RNG, so tests can seed them and validate thousands of
 * generated questions. Every generated fretboard item carries a `solution` computed from the
 * theory engine, and every multiple-choice item an `answer` that is one of its choices.
 */
import {
  type CagedShape,
  type ChordQualityId,
  type FretPosition,
  type Inversion,
  type Note,
  CAGED_MINOR_SHAPES,
  CAGED_ORDER,
  CAGED_SHAPES,
  CHORD_QUALITIES,
  cagedVoicing,
  diatonicChords,
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
    const voicings = findVoicings(STANDARD_TUNING, chord, {
      range: g.range,
      strings,
      minStrings: strings?.length ?? Math.max(3, chord.tones.length),
      limit: 20,
    });
    if (voicings.length === 0) return undefined;
    const shape = voicingShape(pick(rng, voicings));
    const answer = chordName(chord);
    // Closest confusions first: same root with another quality (C major vs C minor, Cmaj7 vs C7),
    // then the relative major/minor, then other roots.
    const sameRoot = shuffle(rng, g.qualities.filter((q) => q !== quality)).map((q) => chordName(buildChord(root, q)));
    const flip = quality === "major" ? "minor" : quality === "minor" ? "major" : undefined;
    const parallel = flip ? [chordName(buildChord(root, flip))] : [];
    const relative =
      quality === "major"
        ? [chordName(buildChord(relativeMinor(root), "minor"))]
        : quality === "minor"
          ? [chordName(buildChord(transpose(parseNote(root), "m3"), "major"))]
          : [];
    const others = shuffle(rng, g.roots.filter((r) => r !== root)).map((r) => chordName(buildChord(r, pick(rng, g.qualities))));
    const item: MultipleChoiceExercise = {
      id,
      kind: "multiple-choice",
      prompt: "Name this chord.",
      board: chordBoard(root, quality, shape),
      choices: choicesFrom(rng, answer, [...parallel, ...sameRoot.slice(0, 2), ...relative, ...others]),
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
      keepChoiceOrder: true,
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

// ----- diatonic harmony ----------------------------------------------------------------------

const keyName = (key: string, scale: "major" | "natural-minor") => `${noteName(parseNote(key))} ${scale === "major" ? "major" : "minor"}`;
const ascii = (n: Note) => noteName(n, { ascii: true });

const diatonicChord: Gen<"diatonic-chord"> = (g, id, rng) => {
  const key = pick(rng, g.keys);
  const chords = diatonicChords(key, g.scale, { sevenths: g.sevenths });
  const degrees = g.degrees ?? [1, 2, 3, 4, 5, 6, 7];
  const target = chords[pick(rng, degrees) - 1]!;
  const ask = g.ask === "mixed" ? pick(rng, ["chord", "numeral"] as const) : g.ask;
  const near = chords.filter((c) => Math.abs(c.degree - target.degree) === 1 || Math.abs(c.degree - target.degree) === 3);

  if (ask === "chord") {
    const answer = chordName(target.chord);
    const otherQualities = (g.sevenths ? (["major7", "dominant7", "minor7", "halfDiminished7"] as const) : (["major", "minor", "diminished"] as const))
      .filter((q) => q !== target.chord.quality.id)
      .map((q) => chordName(buildChord(target.chord.root, q)));
    return {
      id,
      kind: "multiple-choice",
      prompt: `What is the **${target.numeral}** chord in ${keyName(key, g.scale)}?`,
      choices: choicesFrom(rng, answer, [...shuffle(rng, otherQualities).slice(0, 1), ...shuffle(rng, near.map((c) => chordName(c.chord)))]),
      answer,
    };
  }
  const answer = target.numeral;
  const wrongCase = /[a-z]/.test(answer[0]!) ? answer.replace(/^[iv]+/, (m) => m.toUpperCase()) : answer.replace(/^[IV]+/, (m) => m.toLowerCase());
  return {
    id,
    kind: "multiple-choice",
    prompt: `In ${keyName(key, g.scale)}, **${chordName(target.chord)}** is which chord?`,
    choices: choicesFrom(rng, answer, [...(g.sevenths ? [] : [wrongCase.replace(/[°ø]/, "")]), ...shuffle(rng, near.map((c) => c.numeral))]),
    answer,
  };
};

const diatonicConstruction: Gen<"diatonic-construction"> = (g, id, rng) =>
  attempt(() => {
    const key = pick(rng, g.keys);
    const chords = diatonicChords(key, g.scale, { sevenths: g.sevenths });
    const target = chords[pick(rng, g.degrees ?? [1, 4, 5, 6]) - 1]!;
    const chord = target.chord;
    const voicings = findVoicings(STANDARD_TUNING, chord, { range: g.range, minStrings: Math.max(3, chord.tones.length), limit: 30 });
    if (voicings.length === 0) return undefined;
    const item: FretboardExercise = {
      id,
      kind: "fretboard",
      task: "construct",
      prompt: `Build the **${target.numeral}** chord in ${keyName(key, g.scale)}.`,
      hint: `Count up the ${keyName(key, g.scale)} scale to degree ${target.degree}: it's ${chordName(chord)}.`,
      board: { range: g.range, labels: "none", layout: BUILD },
      selection: "per-string",
      rule: { type: "chord", chord: { root: ascii(chord.root), quality: chord.quality.id as ChordQualityId } },
      solution: voicingPositions(pick(rng, voicings.slice(0, 8))),
    };
    return item;
  });

// ----- CAGED ---------------------------------------------------------------------------------

function cagedChoice(g: { roots: readonly string[]; shapes?: readonly CagedShape[]; quality?: "major" | "minor" }, rng: Rng) {
  const quality = g.quality ?? "major";
  const available = (g.shapes ?? CAGED_ORDER).filter((s) => quality === "major" || CAGED_MINOR_SHAPES[s]);
  const shapeName = pick(rng, available);
  const root = pick(rng, g.roots);
  const voicing = cagedVoicing(shapeName, root, quality);
  const chord = buildChord(root, quality);
  return { quality, available, shapeName, root, voicing, chord };
}

const cagedIdentification: Gen<"caged-identification"> = (g, id, rng) => {
  const { quality, available, shapeName, root, voicing, chord } = cagedChoice(g, rng);
  const shape = voicingShape(voicing);
  const board = chordBoard(root, quality, shape);
  return {
    id,
    kind: "multiple-choice",
    prompt: `This is **${chordName(chord)}**. Which CAGED shape is it? The squares are its roots.`,
    board: { ...board, labels: "none", roles: true },
    choices: available.map((s) => ({ id: `${s} shape`, label: `${s} shape` })),
    answer: `${shapeName} shape`,
  };
};

const cagedConstruction: Gen<"caged-construction"> = (g, id, rng) => {
  const { quality, shapeName, voicing, chord } = cagedChoice(g, rng);
  const positions = voicingPositions(voicing);
  const def = quality === "major" ? CAGED_SHAPES[shapeName] : CAGED_MINOR_SHAPES[shapeName]!;
  const top = Math.max(...positions.map((p) => p.fret));
  return {
    id,
    kind: "fretboard",
    task: "construct",
    prompt: `Play **${chordName(chord)}** with the **${shapeName}${quality === "minor" ? "m" : ""} shape**.`,
    hint: `Find ${noteName(chord.root)} on the ${stringName(def.rootString)} (the shape's root string), then build the open ${def.open.root}${quality === "minor" ? "m" : ""} shape around it.`,
    board: { range: { start: 0, end: Math.max(12, top + 1) }, labels: "none", layout: BUILD },
    selection: "per-string",
    rule: { type: "exact-positions", positions, context: { chord: { root: ascii(chord.root), quality } } },
    solution: positions,
  };
};

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
  "diatonic-chord": diatonicChord,
  "diatonic-construction": diatonicConstruction,
  "caged-identification": cagedIdentification,
  "caged-construction": cagedConstruction,
};

/**
 * The order to show a multiple-choice question's options in: shuffled (so the answer's position
 * gives nothing away), unless the exercise asks to keep its authored order.
 */
export function displayChoices(exercise: MultipleChoiceExercise, rng: Rng = Math.random): Choice[] {
  return exercise.keepChoiceOrder ? [...exercise.choices] : shuffle(rng, exercise.choices);
}

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
