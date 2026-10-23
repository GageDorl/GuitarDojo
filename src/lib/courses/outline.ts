/**
 * Course outlines: the public metadata about courses and lessons (titles, summaries, exercise
 * ids, completion rules, access requirement), WITHOUT lesson content.
 *
 * Client components receive outlines from server components. Full lesson content is only sent
 * by the lesson page after the server has authorized access, so premium content can never leak
 * through the JavaScript bundle.
 */
import type { AccessPolicy } from "@/lib/access";
import { lessonExercises } from "./completion";
import type { CompletionRule, Course, CurriculumStage, Lesson } from "./types";

export interface LessonOutline {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly kind: Lesson["kind"];
  readonly estimatedMinutes: number;
  readonly prerequisites: readonly string[];
  readonly stepCount: number;
  readonly exerciseIds: readonly string[];
  readonly completion: CompletionRule;
  readonly access: AccessPolicy["kind"];
}

export interface CourseOutline {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly level: Course["level"];
  readonly stage: CurriculumStage;
  readonly prerequisites: readonly string[];
  readonly outcomes: readonly string[];
  readonly modules: readonly {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly lessons: readonly LessonOutline[];
  }[];
}

export function toLessonOutline(lesson: Lesson, access: AccessPolicy["kind"] = "public"): LessonOutline {
  return {
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    kind: lesson.kind,
    estimatedMinutes: lesson.estimatedMinutes,
    prerequisites: lesson.prerequisites,
    stepCount: lesson.steps.length,
    exerciseIds: lessonExercises(lesson).map((e) => e.id),
    completion: lesson.completion,
    access,
  };
}

export function toCourseOutline(
  course: Course,
  accessFor: (courseId: string, lessonId: string) => AccessPolicy["kind"] = () => "public",
): CourseOutline {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    stage: course.stage,
    prerequisites: course.prerequisites,
    outcomes: course.outcomes,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l) => toLessonOutline(l, accessFor(course.id, l.id))),
    })),
  };
}
