/**
 * Access rules for content, keyed by stable course (and optional lesson) ids.
 *
 * During the free public beta this table is EMPTY: every course is public. To make a course
 * premium later, add an entry, e.g.
 *
 *   "chord-voicings": {
 *     course: { kind: "entitlement", products: ["premium"] },
 *     lessons: { "what-is-a-voicing": PUBLIC },   // free preview lesson
 *   },
 *
 * Enforcement happens server-side (lesson page + progress API) via src/server/access.ts.
 */
import { type AccessPolicy, PUBLIC } from "@/lib/access";

export interface CourseAccessRule {
  readonly course: AccessPolicy;
  /** Per-lesson overrides, e.g. a free preview lesson inside a paid course. */
  readonly lessons?: Readonly<Record<string, AccessPolicy>>;
}

export const COURSE_ACCESS: Readonly<Record<string, CourseAccessRule>> = {};

export function lessonPolicy(courseId: string, lessonId: string, rules = COURSE_ACCESS): AccessPolicy {
  const rule = rules[courseId];
  if (!rule) return PUBLIC;
  return rule.lessons?.[lessonId] ?? rule.course;
}

export function coursePolicy(courseId: string, rules = COURSE_ACCESS): AccessPolicy {
  return rules[courseId]?.course ?? PUBLIC;
}
