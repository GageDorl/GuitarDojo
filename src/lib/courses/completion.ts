import type { Exercise } from "@/lib/exercises";
import type { LessonProgress } from "@/lib/progress";
import type { Course, Lesson } from "./types";

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

export function evaluateCompletion(lesson: Lesson, progress: LessonProgress | undefined): CompletionSummary {
  const exercises = lessonExercises(lesson);
  const records = exercises.map((e) => progress?.exercises[e.id]);
  const total = exercises.length;
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

export function allLessons(course: Course): Lesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

export function findLesson(course: Course, lessonId: string): Lesson | undefined {
  return allLessons(course).find((l) => l.id === lessonId);
}

export function adjacentLessons(course: Course, lessonId: string): { previous?: Lesson; next?: Lesson } {
  const lessons = allLessons(course);
  const i = lessons.findIndex((l) => l.id === lessonId);
  return { previous: i > 0 ? lessons[i - 1] : undefined, next: i >= 0 ? lessons[i + 1] : undefined };
}
