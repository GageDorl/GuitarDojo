/**
 * Content registry. Today content is TypeScript modules (type-checked, versioned with the code);
 * the same shapes could be loaded from a CMS or database later by replacing these functions.
 *
 * COURSES is in recommended pathway order. Course ids are progress keys: never rename one.
 */
import { type Course, allLessons, findLesson } from "@/lib/courses";
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
