/**
 * Student progress.
 *
 * Progress is derived by folding *events* (exercise attempted, lesson completed …) into a
 * snapshot. Anonymous visitors keep the snapshot in localStorage. Signed-in students also send
 * each event (with a unique id) to the server, which stores the event log and replays it with
 * this same reducer, so every device converges on the same state.
 */

export const PROGRESS_SCHEMA_VERSION = 1;

export type LessonStatus = "not-started" | "in-progress" | "completed";

export interface ExerciseRecord {
  readonly attempts: number;
  readonly correct: number;
  readonly incorrect: number;
  /** Whether the first attempt was correct; used for assessment scoring. */
  readonly firstAttemptCorrect: boolean;
  /** When the first attempt happened (absent in data saved before accounts existed). */
  readonly firstAttemptAt?: string;
  /** Solved at least once. */
  readonly solved: boolean;
  readonly lastAttemptAt: string;
}

export interface LessonProgress {
  readonly status: LessonStatus;
  /** Index of the step the student last viewed (resume point). */
  readonly currentStep: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly exercises: Readonly<Record<string, ExerciseRecord>>;
  /** Best assessment score (0–1), when the lesson has a score-based completion rule. */
  readonly bestScore?: number;
}

export interface ProgressState {
  readonly schemaVersion: number;
  /** Unused by the client (the server knows who you are from the session). Kept for compatibility. */
  readonly userId: string | null;
  /** Keyed by `${courseId}/${lessonId}`. */
  readonly lessons: Readonly<Record<string, LessonProgress>>;
  readonly lastVisited?: { readonly courseId: string; readonly lessonId: string };
  readonly updatedAt: string;
}

export type ProgressEvent =
  | { type: "lesson-visited"; courseId: string; lessonId: string; step: number; at: string }
  | {
      type: "exercise-attempted";
      courseId: string;
      lessonId: string;
      exerciseId: string;
      correct: boolean;
      at: string;
    }
  | { type: "lesson-completed"; courseId: string; lessonId: string; score?: number; at: string }
  /** Clears exercise records so an assessment can be retaken. Completion is kept. */
  | { type: "lesson-reset"; courseId: string; lessonId: string; at: string }
  /**
   * Merges progress recorded anonymously (before signing in) into an account. Produced by the
   * server from a validated local snapshot; see `mergeSnapshot` for the rules.
   */
  | { type: "snapshot-imported"; lessons: Record<string, LessonProgress>; at: string }
  /** Local-only reset. Never synced to the server. */
  | { type: "progress-cleared"; at: string };

/** An event as stored and synced: with a globally unique id (client-generated UUID). */
export type IdentifiedEvent = ProgressEvent & { readonly id: string };

export function lessonKey(courseId: string, lessonId: string): string {
  return `${courseId}/${lessonId}`;
}

export function emptyProgress(now = new Date(0).toISOString()): ProgressState {
  return { schemaVersion: PROGRESS_SCHEMA_VERSION, userId: null, lessons: {}, updatedAt: now };
}

function emptyLesson(at: string): LessonProgress {
  return { status: "in-progress", currentStep: 0, startedAt: at, exercises: {} };
}

const STATUS_RANK: Record<LessonStatus, number> = { "not-started": 0, "in-progress": 1, completed: 2 };
const minIso = (a?: string, b?: string) => (a && b ? (a < b ? a : b) : (a ?? b));
const maxIso = (a?: string, b?: string) => (a && b ? (a > b ? a : b) : (a ?? b));

/**
 * Combine two records of the same exercise made on different devices/sessions. Counts add up
 * (they are different attempts); the first-attempt result comes from whichever started first.
 */
export function mergeExerciseRecords(existing: ExerciseRecord, incoming: ExerciseRecord): ExerciseRecord {
  const incomingFirst =
    existing.firstAttemptAt && incoming.firstAttemptAt ? incoming.firstAttemptAt < existing.firstAttemptAt : false;
  return {
    attempts: existing.attempts + incoming.attempts,
    correct: existing.correct + incoming.correct,
    incorrect: existing.incorrect + incoming.incorrect,
    firstAttemptCorrect: incomingFirst ? incoming.firstAttemptCorrect : existing.firstAttemptCorrect,
    firstAttemptAt: minIso(existing.firstAttemptAt, incoming.firstAttemptAt),
    solved: existing.solved || incoming.solved,
    lastAttemptAt: maxIso(existing.lastAttemptAt, incoming.lastAttemptAt) ?? existing.lastAttemptAt,
  };
}

/** Merge an imported lesson into existing progress. Never loses completion or solved exercises. */
export function mergeLesson(existing: LessonProgress | undefined, incoming: LessonProgress): LessonProgress {
  if (!existing) return incoming;
  const exercises: Record<string, ExerciseRecord> = { ...existing.exercises };
  for (const [id, record] of Object.entries(incoming.exercises)) {
    exercises[id] = exercises[id] ? mergeExerciseRecords(exercises[id]!, record) : record;
  }
  const bestScore =
    existing.bestScore === undefined && incoming.bestScore === undefined
      ? undefined
      : Math.max(existing.bestScore ?? 0, incoming.bestScore ?? 0);
  return {
    status: STATUS_RANK[incoming.status] > STATUS_RANK[existing.status] ? incoming.status : existing.status,
    currentStep: existing.currentStep,
    startedAt: minIso(existing.startedAt, incoming.startedAt) ?? existing.startedAt,
    completedAt: minIso(existing.completedAt, incoming.completedAt),
    exercises,
    ...(bestScore === undefined ? {} : { bestScore }),
  };
}

export function progressReducer(state: ProgressState, event: ProgressEvent): ProgressState {
  if (event.type === "progress-cleared") return emptyProgress(event.at);

  if (event.type === "snapshot-imported") {
    const lessons: Record<string, LessonProgress> = { ...state.lessons };
    for (const [key, lesson] of Object.entries(event.lessons)) lessons[key] = mergeLesson(lessons[key], lesson);
    return { ...state, lessons, updatedAt: maxIso(state.updatedAt, event.at) ?? event.at };
  }

  const key = lessonKey(event.courseId, event.lessonId);
  const lesson = state.lessons[key] ?? emptyLesson(event.at);
  let next: LessonProgress = lesson;
  let lastVisited = state.lastVisited;

  switch (event.type) {
    case "lesson-visited":
      next = {
        ...lesson,
        currentStep: event.step,
        status: lesson.status === "not-started" ? "in-progress" : lesson.status,
      };
      lastVisited = { courseId: event.courseId, lessonId: event.lessonId };
      break;
    case "exercise-attempted": {
      const prev = lesson.exercises[event.exerciseId];
      const record: ExerciseRecord = {
        attempts: (prev?.attempts ?? 0) + 1,
        correct: (prev?.correct ?? 0) + (event.correct ? 1 : 0),
        incorrect: (prev?.incorrect ?? 0) + (event.correct ? 0 : 1),
        firstAttemptCorrect: prev ? prev.firstAttemptCorrect : event.correct,
        firstAttemptAt: prev ? prev.firstAttemptAt : event.at,
        solved: (prev?.solved ?? false) || event.correct,
        lastAttemptAt: event.at,
      };
      next = { ...lesson, exercises: { ...lesson.exercises, [event.exerciseId]: record } };
      break;
    }
    case "lesson-completed":
      next = {
        ...lesson,
        status: "completed",
        completedAt: lesson.completedAt ?? event.at,
        bestScore:
          event.score === undefined ? lesson.bestScore : Math.max(lesson.bestScore ?? 0, event.score),
      };
      break;
    case "lesson-reset":
      next = { ...lesson, exercises: {}, currentStep: 0 };
      break;
  }

  return { ...state, lessons: { ...state.lessons, [key]: next }, lastVisited, updatedAt: event.at };
}

/** Canonical replay order: by time, ties broken by id. The same events always give the same state. */
export function compareEvents(a: IdentifiedEvent, b: IdentifiedEvent): number {
  if (a.at !== b.at) return a.at < b.at ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Rebuild state from an event log, regardless of the order events arrived in. */
export function replay(events: readonly IdentifiedEvent[], base: ProgressState = emptyProgress()): ProgressState {
  return [...events].sort(compareEvents).reduce(progressReducer, base);
}

export function getLessonProgress(state: ProgressState, courseId: string, lessonId: string): LessonProgress | undefined {
  return state.lessons[lessonKey(courseId, lessonId)];
}

export function lessonStatus(state: ProgressState, courseId: string, lessonId: string): LessonStatus {
  return getLessonProgress(state, courseId, lessonId)?.status ?? "not-started";
}

/** True when there is anything worth importing into an account. */
export function hasProgress(state: ProgressState): boolean {
  return Object.keys(state.lessons).length > 0;
}

/** Defensive parsing of persisted data; unknown or corrupt data yields empty progress. */
export function parseProgress(raw: unknown): ProgressState {
  if (!raw || typeof raw !== "object") return emptyProgress();
  const candidate = raw as Partial<ProgressState>;
  if (candidate.schemaVersion !== PROGRESS_SCHEMA_VERSION || typeof candidate.lessons !== "object") {
    // Future: run migrations here when the schema version changes.
    return emptyProgress();
  }
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    userId: candidate.userId ?? null,
    lessons: candidate.lessons ?? {},
    lastVisited: candidate.lastVisited,
    updatedAt: candidate.updatedAt ?? new Date(0).toISOString(),
  };
}
