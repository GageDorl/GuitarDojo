"use client";

import Link from "next/link";
import { getCourse } from "@/content";
import { type Course, allLessons, evaluateCompletion } from "@/lib/courses";
import { type ProgressState, getLessonProgress, lessonStatus } from "@/lib/progress";
import { useHydrated } from "@/hooks/useMediaQuery";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ButtonLink, ProgressBar } from "@/components/ui/Button";
import { ArrowRight, CheckIcon } from "@/components/ui/Icons";

/** The lesson a student should do next: the first incomplete one, or the last visited if in progress. */
export function resumeTarget(course: Course, progress: ProgressState) {
  const lessons = allLessons(course);
  const firstIncomplete = lessons.find((l) => lessonStatus(progress, course.id, l.id) !== "completed");
  return firstIncomplete ?? lessons[lessons.length - 1]!;
}

export function courseCompletion(course: Course, progress: ProgressState) {
  const lessons = allLessons(course);
  const done = lessons.filter((l) => lessonStatus(progress, course.id, l.id) === "completed").length;
  return { done, total: lessons.length };
}

/** Recommended prerequisite courses the student hasn't completed yet. */
export function incompletePrerequisites(course: Course, progress: ProgressState): Course[] {
  return course.prerequisites
    .map((id) => getCourse(id))
    .filter((c): c is Course => Boolean(c))
    .filter((c) => {
      const { done, total } = courseCompletion(c, progress);
      return done < total;
    });
}

export function CourseOverview({ courseId }: { courseId: string }) {
  const course = getCourse(courseId)!;
  const { progress } = useProgress();
  const hydrated = useHydrated();
  const { done, total } = courseCompletion(course, progress);
  const target = resumeTarget(course, progress);
  const started = hydrated && Object.keys(progress.lessons).some((k) => k.startsWith(`${course.id}/`));
  const missing = hydrated ? incompletePrerequisites(course, progress) : [];
  let lessonNumber = 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/learn" className="text-sm font-medium text-muted hover:text-text">
        ← All courses
      </Link>
      <p className="mt-4 text-sm font-semibold tracking-wide text-accent uppercase">{course.level} course</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
      <p className="mt-3 text-lg text-muted">{course.description}</p>

      {course.outcomes.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">By the end you&apos;ll be able to:</p>
          <ul className="mt-2 space-y-1.5 text-[0.95rem]">
            {course.outcomes.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="mt-0.5 text-correct">
                  <CheckIcon size={16} />
                </span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <p className="mt-5 rounded-xl border border-border bg-surface-2 p-3 text-sm" data-testid="course-prerequisites">
          Recommended first:{" "}
          {missing.map((c, i) => (
            <span key={c.id}>
              {i > 0 && ", "}
              <Link className="font-semibold text-accent underline-offset-2 hover:underline" href={`/learn/${c.id}`}>
                {c.title}
              </Link>
            </span>
          ))}
          . Already comfortable with it? Go ahead and start here.
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Your progress</span>
          <span className="text-muted tabular-nums" data-testid="course-progress">
            {hydrated ? `${done} of ${total} lessons` : `${total} lessons`}
          </span>
        </div>
        <ProgressBar className="mt-2" value={hydrated ? done / total : 0} label="Course progress" />
        <ButtonLink href={`/learn/${course.id}/${target.id}`} className="mt-4 w-full sm:w-auto" data-testid="resume">
          {done === total && hydrated ? "Review" : started ? "Continue" : "Start"}: {target.title} <ArrowRight />
        </ButtonLink>
      </div>

      {course.modules.map((module) => (
        <section key={module.id} className="mt-10" aria-labelledby={`mod-${module.id}`}>
          <h2 id={`mod-${module.id}`} className="text-xl font-bold tracking-tight">
            {module.title}
          </h2>
          <p className="mt-1 text-muted">{module.description}</p>
          <ol className="mt-5 space-y-3">
            {module.lessons.map((lesson) => {
              lessonNumber += 1;
              const status = hydrated ? lessonStatus(progress, course.id, lesson.id) : "not-started";
              const lp = getLessonProgress(progress, course.id, lesson.id);
              const summary = evaluateCompletion(lesson, lp);
              const isNext = hydrated && lesson.id === target.id && status !== "completed";
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/learn/${course.id}/${lesson.id}`}
                    className={`group flex items-center gap-4 rounded-2xl border bg-surface p-4 transition-colors hover:border-accent ${
                      isNext ? "border-accent/60 ring-2 ring-accent/15" : "border-border"
                    }`}
                    data-testid={`lesson-link-${lesson.id}`}
                    data-status={status}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        status === "completed"
                          ? "bg-correct text-white"
                          : status === "in-progress"
                            ? "border-2 border-accent text-accent"
                            : "border border-border text-muted"
                      }`}
                      aria-hidden
                    >
                      {status === "completed" ? <CheckIcon /> : lessonNumber}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2">
                        <span className="font-semibold">{lesson.title}</span>
                        {lesson.kind === "assessment" && (
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Checkpoint</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{lesson.summary}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {lesson.estimatedMinutes} min · {summary.total} exercises
                        {status === "in-progress" && ` · ${summary.solved}/${summary.total} solved`}
                        {status === "completed" && lp?.bestScore !== undefined && lesson.kind === "assessment" &&
                          ` · best ${Math.round(lp.bestScore * 100)}%`}
                        <span className="sr-only">
                          {status === "completed" ? " (completed)" : status === "in-progress" ? " (in progress)" : ""}
                        </span>
                      </span>
                    </span>
                    <span className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden>
                      <ArrowRight />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
