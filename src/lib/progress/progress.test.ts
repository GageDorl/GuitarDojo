import { describe, expect, it } from "vitest";
import { evaluateCompletion, type Lesson } from "@/lib/courses";
import {
  type IdentifiedEvent,
  LocalProgressRepository,
  mergeExerciseRecords,
  replay,
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

describe("event replay and merging", () => {
  const e = (id: string, minute: number, correct: boolean): IdentifiedEvent => ({
    id,
    type: "exercise-attempted",
    courseId: "c",
    lessonId: "l",
    exerciseId: "x",
    correct,
    at: `2026-01-01T00:${String(minute).padStart(2, "0")}:00.000Z`,
  });

  it("produces the same state whatever order events arrive in", () => {
    const events = [e("a", 1, false), e("b", 2, true), e("c", 3, true), { id: "d", type: "lesson-completed", courseId: "c", lessonId: "l", at: "2026-01-01T00:04:00.000Z" } as IdentifiedEvent];
    const expected = replay(events);
    for (const order of [[3, 2, 1, 0], [1, 3, 0, 2], [2, 0, 3, 1]]) {
      expect(replay(order.map((i) => events[i]!))).toEqual(expected);
    }
    expect(getLessonProgress(expected, "c", "l")!.exercises.x).toMatchObject({ attempts: 3, firstAttemptCorrect: false, firstAttemptAt: "2026-01-01T00:01:00.000Z" });
  });

  it("merges imported lessons without losing completion, solved exercises or best scores", () => {
    const existing = replay([e("a", 5, false)]);
    const merged = progressReducer(existing, {
      type: "snapshot-imported",
      at: "2026-01-02T00:00:00.000Z",
      lessons: {
        "c/l": {
          status: "completed",
          currentStep: 3,
          startedAt: "2025-12-31T00:00:00.000Z",
          completedAt: "2025-12-31T01:00:00.000Z",
          bestScore: 0.8,
          exercises: { x: { attempts: 2, correct: 1, incorrect: 1, firstAttemptCorrect: true, firstAttemptAt: "2025-12-31T00:10:00.000Z", solved: true, lastAttemptAt: "2025-12-31T00:20:00.000Z" } },
        },
      },
    });
    const lesson = getLessonProgress(merged, "c", "l")!;
    expect(lesson).toMatchObject({ status: "completed", startedAt: "2025-12-31T00:00:00.000Z", bestScore: 0.8, currentStep: 0 });
    // The imported first attempt happened earlier, so its result wins; counts add up.
    expect(lesson.exercises.x).toMatchObject({ attempts: 3, correct: 1, incorrect: 2, firstAttemptCorrect: true, solved: true });
  });

  it("treats records without firstAttemptAt (pre-account data) conservatively", () => {
    const a = { attempts: 1, correct: 0, incorrect: 1, firstAttemptCorrect: false, solved: false, lastAttemptAt: at };
    const b = { attempts: 1, correct: 1, incorrect: 0, firstAttemptCorrect: true, solved: true, lastAttemptAt: at };
    expect(mergeExerciseRecords(a, b)).toMatchObject({ firstAttemptCorrect: false, solved: true, attempts: 2 });
  });
});

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
