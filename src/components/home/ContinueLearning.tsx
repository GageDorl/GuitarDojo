"use client";

import { COURSES, getCourse } from "@/content";
import { findLesson } from "@/lib/courses";
import { useHydrated } from "@/hooks/useMediaQuery";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/Icons";
import { resumeTarget } from "@/components/course/CourseOverview";

/** Primary call to action: start, or resume where the student left off. */
export function ContinueLearning() {
  const hydrated = useHydrated();
  const { progress } = useProgress();
  const course = COURSES[0]!;

  const last = hydrated ? progress.lastVisited : undefined;
  const lastCourse = last ? getCourse(last.courseId) : undefined;
  const lastLesson = lastCourse && last ? findLesson(lastCourse, last.lessonId) : undefined;
  const lastDone = lastLesson && progress.lessons[`${last!.courseId}/${lastLesson.id}`]?.status === "completed";
  const target = lastLesson && !lastDone ? lastLesson : resumeTarget(course, progress);
  const resuming = hydrated && Object.keys(progress.lessons).length > 0;

  return (
    <ButtonLink href={`/learn/${lastCourse && !lastDone ? lastCourse.id : course.id}/${target.id}`} size="lg" data-testid="cta">
      {resuming ? `Continue: ${target.title}` : "Start the first lesson"} <ArrowRight />
    </ButtonLink>
  );
}
