import { describe, expect, it } from "vitest";
import { allLessons, evaluateCompletion, lessonExercises, type LessonBlock } from "@/lib/courses";
import { type DrillItem, type Exercise, generateDrillItem, seededRng, validate } from "@/lib/exercises";
import { resolveFretboard } from "@/lib/fretboard";
import { buildChord, parseNote, samePosition } from "@/lib/theory";
import { COURSES, CURRICULUM } from ".";
import { majorShape, minorShape } from "./courses/scales/lessons/shapes";

const lessons = COURSES.flatMap((course) => allLessons(course).map((lesson) => ({ course, lesson })));

/** How many generated questions to check per drill. */
const DRILL_SAMPLES = 60;

function boardsIn(block: LessonBlock) {
  switch (block.type) {
    case "fretboard":
      return [block.board];
    case "demo":
      return block.frames.map((f) => ({ ...block.board, ...f.board }));
    case "compare":
      return block.items.map((i) => i.board);
    case "exercise":
      return block.exercise.kind !== "drill" && block.exercise.board ? [block.exercise.board] : [];
    default:
      return [];
  }
}

/** Checks shared by authored exercises and every generated drill question. */
function checkItem(ex: DrillItem, context: string) {
  if (ex.kind === "multiple-choice") {
    const ids = ex.choices.map((c) => c.id);
    expect(new Set(ids).size, `${context}: duplicate choice ids`).toBe(ids.length);
    expect(new Set(ex.choices.map((c) => c.label)).size, `${context}: duplicate choice labels`).toBe(ids.length);
    expect(ids.length, `${context}: needs at least two choices`).toBeGreaterThanOrEqual(2);
    expect(ids, `${context}: answer must be a choice`).toContain(ex.answer);
    if (ex.board) expect(() => resolveFretboard(ex.board!), context).not.toThrow();
    return;
  }
  const model = resolveFretboard(ex.board);
  const result = validate(ex.rule, { tuning: model.tuning, selection: ex.solution, range: model.range });
  expect(result.correct, `${context}: ${result.issues.map((i) => i.message).join(" | ")}`).toBe(true);
  expect(ex.solution.length, `${context}: empty solution`).toBeGreaterThan(0);
  for (const pos of ex.solution) {
    expect(pos.fret >= model.range.start && pos.fret <= model.range.end, `${context}: solution outside board`).toBe(true);
    if (model.activeStrings) expect(model.activeStrings, `${context}: solution on an inactive string`).toContain(pos.string);
    if (ex.selectableOnlyMarkers) {
      expect(model.markers.some((m) => samePosition(m.position, pos)), `${context}: solution not on a marker`).toBe(true);
    }
  }
  if (ex.selection === "single") expect(ex.solution.length, `${context}: single selection needs one answer`).toBe(1);
  if (ex.selection === "per-string") {
    const strings = ex.solution.map((p) => p.string);
    expect(new Set(strings).size, `${context}: two solution notes on one string`).toBe(strings.length);
  }
  if (ex.initialSelection) {
    const start = validate(ex.rule, { tuning: model.tuning, selection: ex.initialSelection, range: model.range });
    expect(start.correct, `${context}: starts already solved`).toBe(false);
  }
}

function checkExercise(ex: Exercise, context: string) {
  if (ex.kind !== "drill") return checkItem(ex, context);
  expect(ex.rounds).toBeGreaterThan(0);
  expect(ex.passScore).toBeGreaterThan(0);
  expect(ex.passScore).toBeLessThanOrEqual(1);
  const rng = seededRng(ex.id.length * 7919 + DRILL_SAMPLES);
  let previous: DrillItem | undefined;
  for (let i = 0; i < DRILL_SAMPLES; i++) {
    const item = generateDrillItem(ex, i, rng, previous);
    checkItem(item, `${context} round ${i} (${item.prompt})`);
    previous = item;
  }
}

describe("curriculum structure", () => {
  it("has unique course ids, all registered in the roadmap", () => {
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const roadmapIds = CURRICULUM.flatMap((s) => s.courses.flatMap((c) => (c.courseId ? [c.courseId] : [])));
    expect([...roadmapIds].sort()).toEqual([...ids].sort());
  });

  it("orders courses so recommended prerequisites come first (no cycles)", () => {
    COURSES.forEach((course, index) => {
      for (const p of course.prerequisites) {
        const at = COURSES.findIndex((c) => c.id === p);
        expect(at, `${course.id} → unknown prerequisite ${p}`).toBeGreaterThanOrEqual(0);
        expect(at, `${course.id} must come after ${p}`).toBeLessThan(index);
      }
    });
  });

  it("keeps the original triads course id so saved progress still works", () => {
    const triads = COURSES.find((c) => c.id === "fretboard-foundations");
    expect(triads).toBeDefined();
    expect(allLessons(triads!).map((l) => l.id)).toEqual([
      "notes-and-semitones",
      "intervals",
      "roots-thirds-fifths",
      "major-triads",
      "minor-triads",
      "triads-on-the-fretboard",
      "triads-checkpoint",
    ]);
  });

  it.each(COURSES.map((c) => [c.id, c] as const))("%s has 6–10 lessons ending in a checkpoint", (_, course) => {
    const list = allLessons(course);
    expect(list.length).toBeGreaterThanOrEqual(6);
    expect(list.length).toBeLessThanOrEqual(10);
    expect(list[list.length - 1]!.kind).toBe("assessment");
    const lessonIds = list.map((l) => l.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
  });
});

describe("independent check: one-octave scale shapes", () => {
  // Open-string MIDI numbers and semitone formulas written out by hand, not taken from the engine.
  const OPEN_MIDI: Record<number, number> = { 6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64 };
  const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];
  const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10, 12];
  it("spells major and natural minor from every low-E root", () => {
    for (let r = 0; r <= 12; r++) {
      const root = OPEN_MIDI[6]! + r;
      expect(majorShape(r).map((p) => OPEN_MIDI[p.string]! + p.fret - root)).toEqual(MAJOR);
      expect(minorShape(r).map((p) => OPEN_MIDI[p.string]! + p.fret - root)).toEqual(NATURAL_MINOR);
    }
  });
});

describe.each(lessons)("$course.id / $lesson.id", ({ course, lesson }) => {
  it("has unique step and exercise ids", () => {
    const steps = lesson.steps.map((s) => s.id);
    expect(new Set(steps).size).toBe(steps.length);
    const ids = lessonExercises(lesson).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("has objectives and existing, earlier prerequisites", () => {
    expect(lesson.objectives.length).toBeGreaterThan(0);
    const order = allLessons(course).map((l) => l.id);
    for (const p of lesson.prerequisites) {
      expect(order, `unknown prerequisite ${p}`).toContain(p);
      expect(order.indexOf(p)).toBeLessThan(order.indexOf(lesson.id));
    }
  });

  it("has at least one interactive demonstration or exploration", () => {
    const interactive = lesson.steps.flatMap((s) => s.blocks).some((b) =>
      ["fretboard", "demo", "compare", "chromatic", "triad-stack", "interval-explorer", "note-explorer", "exercise"].includes(b.type),
    );
    expect(interactive).toBe(true);
  });

  it("resolves every fretboard and diagram", () => {
    for (const s of lesson.steps) {
      for (const block of s.blocks) {
        for (const spec of boardsIn(block)) expect(() => resolveFretboard(spec)).not.toThrow();
        if (block.type === "chromatic") {
          for (const h of block.highlight ?? []) expect(() => parseNote(h.note)).not.toThrow();
        }
        if (block.type === "triad-stack") expect(() => buildChord(block.chord.root, block.chord.quality)).not.toThrow();
      }
    }
  });

  it("has exercises (and generated drill questions) with valid answers", () => {
    for (const ex of lessonExercises(lesson)) checkExercise(ex, `${lesson.id}/${ex.id}`);
  });

  it("can be completed", () => {
    const exercises = Object.fromEntries(
      lessonExercises(lesson).map((e) => [
        e.id,
        { attempts: 1, correct: 1, incorrect: 0, firstAttemptCorrect: true, solved: true, lastAttemptAt: "" },
      ]),
    );
    const summary = evaluateCompletion(lesson, { status: "in-progress", currentStep: 0, startedAt: "", exercises });
    expect(summary.complete).toBe(true);
  });
});
