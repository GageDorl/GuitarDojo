import "server-only";
import { z } from "zod";
import { getCourseOutline } from "@/content";
import { findLesson } from "@/lib/courses";
import type { IdentifiedEvent, LessonProgress } from "@/lib/progress";

/**
 * Wire format for progress sync. Objects are strict: unknown keys (such as a client-supplied
 * `userId`) are rejected, and the user is always taken from the server session.
 */
const id = z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/);
const slug = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);
const iso = z.iso.datetime({ offset: true });

const base = { id, courseId: slug, lessonId: slug, at: iso };

export const wireEventSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("lesson-visited"), ...base, step: z.number().int().min(0).max(200) }),
  z.strictObject({ type: z.literal("exercise-attempted"), ...base, exerciseId: slug, correct: z.boolean() }),
  z.strictObject({ type: z.literal("lesson-completed"), ...base, score: z.number().min(0).max(1).optional() }),
  z.strictObject({ type: z.literal("lesson-reset"), ...base }),
]);

export type WireEvent = z.infer<typeof wireEventSchema>;

export const MAX_EVENTS_PER_REQUEST = 200;

export const eventsRequestSchema = z.strictObject({
  events: z.array(z.unknown()).min(1).max(MAX_EVENTS_PER_REQUEST),
});

const exerciseRecord = z.strictObject({
  attempts: z.number().int().min(0).max(100_000),
  correct: z.number().int().min(0).max(100_000),
  incorrect: z.number().int().min(0).max(100_000),
  firstAttemptCorrect: z.boolean(),
  firstAttemptAt: iso.optional(),
  solved: z.boolean(),
  lastAttemptAt: z.string().max(40),
});

const lessonProgress = z.strictObject({
  status: z.enum(["not-started", "in-progress", "completed"]),
  currentStep: z.number().int().min(0).max(200),
  startedAt: z.string().max(40),
  completedAt: z.string().max(40).optional(),
  exercises: z.record(slug, exerciseRecord),
  bestScore: z.number().min(0).max(1).optional(),
});

export const importRequestSchema = z.strictObject({
  /** Random per-browser id; makes the import idempotent together with the snapshot's hash. */
  deviceId: id,
  snapshot: z.object({
    schemaVersion: z.literal(1),
    lessons: z.record(z.string().max(210), lessonProgress),
  }),
});

export type Rejection = { readonly id: string; readonly reason: string };

/** Check that an event refers to real content: course, lesson, exercise and step must exist. */
export function contentError(event: WireEvent): string | null {
  const course = getCourseOutline(event.courseId);
  if (!course) return "unknown course";
  const lesson = findLesson(course, event.lessonId);
  if (!lesson) return "unknown lesson";
  if (event.type === "exercise-attempted" && !lesson.exerciseIds.includes(event.exerciseId)) return "unknown exercise";
  if (event.type === "lesson-visited" && event.step >= lesson.stepCount) return "unknown step";
  return null;
}

/**
 * Keep only lessons and exercises that exist in the current curriculum. Old or tampered entries
 * are dropped rather than failing the whole import.
 */
export function sanitizeImportedLessons(lessons: Record<string, z.infer<typeof lessonProgress>>): Record<string, LessonProgress> {
  const out: Record<string, LessonProgress> = {};
  for (const [key, lesson] of Object.entries(lessons)) {
    const [courseId, lessonId, extra] = key.split("/");
    if (!courseId || !lessonId || extra !== undefined) continue;
    const course = getCourseOutline(courseId);
    const outline = course && findLesson(course, lessonId);
    if (!outline) continue;
    const exercises = Object.fromEntries(Object.entries(lesson.exercises).filter(([eid]) => outline.exerciseIds.includes(eid)));
    out[key] = { ...lesson, currentStep: Math.min(lesson.currentStep, outline.stepCount - 1), exercises };
  }
  return out;
}

/** Events may not claim to come from the future (clock skew allowance: 5 minutes). */
export function clampTime(at: string, now = new Date()): string {
  const t = new Date(at).getTime();
  const max = now.getTime() + 5 * 60 * 1000;
  return new Date(Math.min(t, max)).toISOString();
}

export function toIdentified(event: WireEvent): IdentifiedEvent {
  return { ...event, at: clampTime(event.at) } as IdentifiedEvent;
}
