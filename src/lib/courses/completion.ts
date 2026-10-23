import type { Exercise } from "@/lib/exercises";
import type { LessonProgress } from "@/lib/progress";
import type { CompletionRule, Lesson } from "./types";

export function lessonExercises(lesson: Lesson): Exercise[] {
  return lesson.steps.flatMap((step) => step.blocks.flatMap((b) => (b.type === "exercise" ? [b.exercise] : [])));
}

export interface CompletionSummary {
  readonly complete: boolean;
  readonly total: number;
  readonly solved: number;
  /** Exercises answered on their first attempt. */
  readonly attempted: number;
  readonly firstTryCorrect: number;
  /** firstTryCorrect / total, 0–1. */
  readonly score: number;
  /** For score rules: every exercise attempted but the score is below the threshold. */
  readonly failed: boolean;
}

/** Anything that knows its exercise ids and completion rule: a full Lesson or a LessonOutline. */
type Completable = Lesson | { readonly exerciseIds: readonly string[]; readonly completion: CompletionRule };

function exerciseIdsOf(lesson: Completable): readonly string[] {
  return "exerciseIds" in lesson ? lesson.exerciseIds : lessonExercises(lesson).map((e) => e.id);
}

export function evaluateCompletion(lesson: Completable, progress: LessonProgress | undefined): CompletionSummary {
  const ids = exerciseIdsOf(lesson);
  const records = ids.map((id) => progress?.exercises[id]);
  const total = ids.length;
  const solved = records.filter((r) => r?.solved).length;
  const attempted = records.filter(Boolean).length;
  const firstTryCorrect = records.filter((r) => r?.firstAttemptCorrect).length;
  const score = total === 0 ? 1 : firstTryCorrect / total;

  if (lesson.completion.type === "all-exercises-solved") {
    return { complete: solved === total, total, solved, attempted, firstTryCorrect, score, failed: false };
  }
  const allAttempted = attempted === total;
  const passed = allAttempted && score >= lesson.completion.score;
  return { complete: passed, total, solved, attempted, firstTryCorrect, score, failed: allAttempted && !passed };
}

/** Works for full courses and for outlines. */
interface HasLessons<L extends { readonly id: string }> {
  readonly modules: readonly { readonly lessons: readonly L[] }[];
}

export function allLessons<L extends { readonly id: string }>(course: HasLessons<L>): L[] {
  return course.modules.flatMap((m) => m.lessons);
}

export function findLesson<L extends { readonly id: string }>(course: HasLessons<L>, lessonId: string): L | undefined {
  return allLessons(course).find((l) => l.id === lessonId);
}

export function adjacentLessons<L extends { readonly id: string }>(
  course: HasLessons<L>,
  lessonId: string,
): { previous?: L; next?: L } {
  const lessons = allLessons(course);
  const i = lessons.findIndex((l) => l.id === lessonId);
  return { previous: i > 0 ? lessons[i - 1] : undefined, next: i >= 0 ? lessons[i + 1] : undefined };
}
