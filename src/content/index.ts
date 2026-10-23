/**
 * Content registry. Today content is TypeScript modules (type-checked, versioned with the code);
 * the same shapes could be loaded from a CMS or database later by replacing these functions.
 */
import { type Course, allLessons, findLesson } from "@/lib/courses";
import { fretboardFoundations } from "./courses/triads";

export const COURSES: readonly Course[] = [fretboardFoundations];

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
