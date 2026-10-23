import { describe, expect, it } from "vitest";
import { evaluateCompletion, type Lesson } from "@/lib/courses";
import {
  LocalProgressRepository,
  type ProgressEvent,
  STORAGE_KEY,
  emptyProgress,
  getLessonProgress,
  parseProgress,
  progressReducer,
} from ".";

const at = "2026-01-01T00:00:00.000Z";
const base = { courseId: "c", lessonId: "l", at };

function run(events: ProgressEvent[]) {
  return events.reduce(progressReducer, emptyProgress());
}

describe("progress reducer", () => {
  it("tracks attempts, first-attempt correctness and solved state", () => {
    const state = run([
      { type: "lesson-visited", ...base, step: 1 },
      { type: "exercise-attempted", ...base, exerciseId: "e1", correct: false },
      { type: "exercise-attempted", ...base, exerciseId: "e1", correct: true },
      { type: "exercise-attempted", ...base, exerciseId: "e2", correct: true },
    ]);
    const lesson = getLessonProgress(state, "c", "l")!;
    expect(lesson.status).toBe("in-progress");
    expect(lesson.currentStep).toBe(1);
    expect(lesson.exercises.e1).toMatchObject({ attempts: 2, correct: 1, incorrect: 1, firstAttemptCorrect: false, solved: true });
    expect(lesson.exercises.e2).toMatchObject({ attempts: 1, firstAttemptCorrect: true });
    expect(state.lastVisited).toEqual({ courseId: "c", lessonId: "l" });
  });

  it("keeps completion and best score across resets", () => {
    const state = run([
      { type: "lesson-completed", ...base, score: 0.5 },
      { type: "lesson-reset", ...base },
      { type: "lesson-completed", ...base, score: 0.875 },
      { type: "lesson-completed", ...base, score: 0.75 },
    ]);
    const lesson = getLessonProgress(state, "c", "l")!;
    expect(lesson.status).toBe("completed");
    expect(lesson.bestScore).toBe(0.875);
  });

  it("parses persisted data defensively", () => {
    expect(parseProgress(null).lessons).toEqual({});
    expect(parseProgress({ schemaVersion: 999 }).lessons).toEqual({});
    const state = run([{ type: "lesson-visited", ...base, step: 2 }]);
    expect(parseProgress(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("round-trips through the local repository", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const repo = new LocalProgressRepository(storage);
    const state = run([{ type: "exercise-attempted", ...base, exerciseId: "x", correct: true }]);
    repo.save(state);
    expect(store.has(STORAGE_KEY)).toBe(true);
    expect(repo.load()).toEqual(state);
    store.set(STORAGE_KEY, "{not json");
    expect(repo.load().lessons).toEqual({});
  });
});

describe("completion rules", () => {
  const lesson = (completion: Lesson["completion"]): Lesson => ({
    id: "l",
    title: "",
    summary: "",
    kind: "assessment",
    estimatedMinutes: 1,
    objectives: [],
    prerequisites: [],
    completion,
    steps: [
      {
        id: "s",
        title: "",
        blocks: ["a", "b", "c", "d"].map((id) => ({
          type: "exercise" as const,
          exercise: { id, kind: "multiple-choice" as const, prompt: "", choices: [{ id: "x", label: "x" }], answer: "x" },
        })),
      },
    ],
  });

  const progressWith = (results: Record<string, [first: boolean, solved: boolean]>) => ({
    status: "in-progress" as const,
    currentStep: 0,
    startedAt: at,
    exercises: Object.fromEntries(
      Object.entries(results).map(([id, [first, solved]]) => [
        id,
        { attempts: 1, correct: 1, incorrect: 0, firstAttemptCorrect: first, solved, lastAttemptAt: at },
      ]),
    ),
  });

  it("requires every exercise solved for lessons", () => {
    const l = lesson({ type: "all-exercises-solved" });
    expect(evaluateCompletion(l, progressWith({ a: [true, true], b: [false, true], c: [true, true] })).complete).toBe(false);
    expect(
      evaluateCompletion(l, progressWith({ a: [true, true], b: [false, true], c: [true, true], d: [false, true] })).complete,
    ).toBe(true);
  });

  it("scores first attempts for assessments", () => {
    const l = lesson({ type: "min-score", score: 0.75 });
    const pass = evaluateCompletion(l, progressWith({ a: [true, true], b: [true, true], c: [true, true], d: [false, true] }));
    expect(pass).toMatchObject({ complete: true, score: 0.75, failed: false });
    const fail = evaluateCompletion(l, progressWith({ a: [true, true], b: [false, true], c: [true, true], d: [false, true] }));
    expect(fail).toMatchObject({ complete: false, score: 0.5, failed: true });
  });
});
