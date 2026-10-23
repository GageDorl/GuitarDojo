import { describe, expect, it } from "vitest";
import { allLessons, evaluateCompletion, lessonExercises, type LessonBlock } from "@/lib/courses";
import { validate } from "@/lib/exercises";
import { resolveFretboard } from "@/lib/fretboard";
import { buildChord, parseNote, samePosition } from "@/lib/theory";
import { COURSES } from ".";

const lessons = COURSES.flatMap((course) => allLessons(course).map((lesson) => ({ course, lesson })));

function boardsIn(block: LessonBlock) {
  switch (block.type) {
    case "fretboard":
      return [block.board];
    case "demo":
      return block.frames.map((f) => ({ ...block.board, ...f.board }));
    case "compare":
      return block.items.map((i) => i.board);
    case "exercise":
      return block.exercise.board ? [block.exercise.board] : [];
    default:
      return [];
  }
}

describe.each(lessons)("$course.id / $lesson.id", ({ course, lesson }) => {
  it("has unique step and exercise ids", () => {
    const steps = lesson.steps.map((s) => s.id);
    expect(new Set(steps).size).toBe(steps.length);
    const ids = lessonExercises(lesson).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("references existing prerequisites", () => {
    const known = allLessons(course).map((l) => l.id);
    for (const p of lesson.prerequisites) expect(known).toContain(p);
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

  it("has exercises whose canonical solutions validate", () => {
    for (const ex of lessonExercises(lesson)) {
      if (ex.kind === "multiple-choice") {
        expect(ex.choices.map((c) => c.id), ex.id).toContain(ex.answer);
        continue;
      }
      const model = resolveFretboard(ex.board);
      const result = validate(ex.rule, { tuning: model.tuning, selection: ex.solution, range: model.range });
      expect(result.correct, `${ex.id}: ${result.issues.map((i) => i.message).join(" | ")}`).toBe(true);
      for (const pos of ex.solution) {
        expect(pos.fret >= model.range.start && pos.fret <= model.range.end, `${ex.id} solution outside board`).toBe(true);
        if (ex.selectableOnlyMarkers) {
          expect(model.markers.some((m) => samePosition(m.position, pos)), `${ex.id} solution not on a marker`).toBe(true);
        }
      }
      if (ex.initialSelection) {
        const start = validate(ex.rule, { tuning: model.tuning, selection: ex.initialSelection, range: model.range });
        expect(start.correct, `${ex.id} starts already solved`).toBe(false);
      }
    }
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
