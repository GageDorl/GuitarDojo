/**
 * Student progress.
 *
 * Progress is derived by folding *events* (exercise attempted, lesson completed …) into a
 * snapshot. Today the snapshot lives in localStorage. Later the same events can be POSTed to an
 * API and the server can run the identical reducer, which makes cloud sync and conflict
 * resolution (replaying events) straightforward.
 */

export const PROGRESS_SCHEMA_VERSION = 1;

export type LessonStatus = "not-started" | "in-progress" | "completed";

export interface ExerciseRecord {
  readonly attempts: number;
  readonly correct: number;
  readonly incorrect: number;
  /** Whether the first attempt was correct; used for assessment scoring. */
  readonly firstAttemptCorrect: boolean;
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
  /** null for anonymous local progress; set once accounts exist. */
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
  | { type: "progress-cleared"; at: string };

export function lessonKey(courseId: string, lessonId: string): string {
  return `${courseId}/${lessonId}`;
}

export function emptyProgress(now = new Date(0).toISOString()): ProgressState {
  return { schemaVersion: PROGRESS_SCHEMA_VERSION, userId: null, lessons: {}, updatedAt: now };
}

function emptyLesson(at: string): LessonProgress {
  return { status: "in-progress", currentStep: 0, startedAt: at, exercises: {} };
}

export function progressReducer(state: ProgressState, event: ProgressEvent): ProgressState {
  if (event.type === "progress-cleared") return emptyProgress(event.at);

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

export function getLessonProgress(state: ProgressState, courseId: string, lessonId: string): LessonProgress | undefined {
  return state.lessons[lessonKey(courseId, lessonId)];
}

export function lessonStatus(state: ProgressState, courseId: string, lessonId: string): LessonStatus {
  return getLessonProgress(state, courseId, lessonId)?.status ?? "not-started";
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
