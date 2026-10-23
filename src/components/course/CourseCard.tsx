"use client";

import Link from "next/link";
import { getCourse } from "@/content";
import { allLessons } from "@/lib/courses";
import { useHydrated } from "@/hooks/useMediaQuery";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressBar } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/Icons";
import { courseCompletion } from "./CourseOverview";

export function CourseCard({ courseId }: { courseId: string }) {
  const course = getCourse(courseId)!;
  const { progress } = useProgress();
  const hydrated = useHydrated();
  const { done, total } = courseCompletion(course, progress);
  const minutes = allLessons(course).reduce((sum, l) => sum + l.estimatedMinutes, 0);

  return (
    <Link
      href={`/learn/${course.id}`}
      className="group block rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-accent sm:p-6"
    >
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">
        {course.level} · {total} lessons · ~{minutes} min
      </p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight">{course.title}</h2>
      <p className="mt-2 text-muted">{course.description}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {course.modules.map((m) => (
          <li key={m.id} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
            {m.title}
          </li>
        ))}
      </ul>
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
