"use client";

import Link from "next/link";
import { getCourse } from "@/content";
import { allLessons } from "@/lib/courses";
import { useHydrated } from "@/hooks/useMediaQuery";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressBar } from "@/components/ui/Button";
import { ArrowRight, CheckIcon } from "@/components/ui/Icons";
import { courseCompletion, incompletePrerequisites } from "./CourseOverview";

export function CourseCard({ courseId }: { courseId: string }) {
  const course = getCourse(courseId)!;
  const { progress } = useProgress();
  const hydrated = useHydrated();
  const { done, total } = courseCompletion(course, progress);
  const minutes = allLessons(course).reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const missing = hydrated ? incompletePrerequisites(course, progress) : [];
  const complete = hydrated && done === total;

  return (
    <Link
      href={`/learn/${course.id}`}
      className="group block rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-accent sm:p-6"
      data-testid={`course-card-${course.id}`}
    >
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">
        {course.level} · {total} lessons · ~{minutes} min
      </p>
      <h3 className="mt-1.5 flex items-center gap-2 text-2xl font-bold tracking-tight">
        {course.title}
        {complete && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-correct text-white" aria-label="Completed">
            <CheckIcon size={14} />
          </span>
        )}
      </h3>
      <p className="mt-2 text-muted">{course.description}</p>
      {missing.length > 0 && (
        <p className="mt-3 text-sm text-muted">
          Recommended first: <span className="font-medium text-text">{missing.map((c) => c.title).join(", ")}</span>
        </p>
      )}
      <div className="mt-5 flex items-center gap-4">
        <ProgressBar value={hydrated ? done / total : 0} label={`${course.title} progress`} />
        <span className="shrink-0 text-sm text-muted tabular-nums">{hydrated ? `${done}/${total}` : `0/${total}`}</span>
        <span className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden>
          <ArrowRight />
        </span>
      </div>
    </Link>
  );
}
