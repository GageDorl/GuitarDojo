/**
 * Content registry (SERVER ONLY). Full lesson content must never be imported by client
 * components: they receive CourseOutlines, and the lesson page sends a lesson's content only
 * after the server has authorized access. `server-only` turns a violation into a build error.
 *
 * Today content is TypeScript modules (type-checked, versioned with the code); the same shapes
 * could be loaded from a CMS or database later by replacing these functions.
 * COURSES is in recommended pathway order. Course ids are progress keys: never rename one.
 */
import "server-only";
import { type Course, type CourseOutline, allLessons, findLesson, toCourseOutline } from "@/lib/courses";
import { lessonPolicy } from "./access";
import { understandingIntervals } from "./courses/intervals";
import { notesAndTheFretboard } from "./courses/notes-fretboard";
import { pentatonicScales } from "./courses/pentatonic";
import { majorMinorScales } from "./courses/scales";
import { majorMinorTriads } from "./courses/triads";
import { chordVoicings } from "./courses/voicings";

export const COURSES: readonly Course[] = [
  notesAndTheFretboard,
  understandingIntervals,
  majorMinorTriads,
  majorMinorScales,
  pentatonicScales,
  chordVoicings,
];

export { CURRICULUM } from "./curriculum";
export { COURSE_ACCESS, coursePolicy, lessonPolicy } from "./access";

export function getCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId);
}

export function getLesson(courseId: string, lessonId: string) {
  const course = getCourse(courseId);
  return course ? findLesson(course, lessonId) : undefined;
}

export function allLessonParams(): { courseId: string; lessonId: string }[] {
  return COURSES.flatMap((course) => allLessons(course).map((lesson) => ({ courseId: course.id, lessonId: lesson.id })));
}

const outlines = new Map<string, CourseOutline>();

/** Content-free outline of a course, safe to send to the browser. */
export function getCourseOutline(courseId: string): CourseOutline | undefined {
  const cached = outlines.get(courseId);
  if (cached) return cached;
  const course = getCourse(courseId);
  if (!course) return undefined;
  const outline = toCourseOutline(course, (c, l) => lessonPolicy(c, l).kind);
  outlines.set(courseId, outline);
  return outline;
}

export function getCourseOutlines(): CourseOutline[] {
  return COURSES.map((c) => getCourseOutline(c.id)!);
}
