import type { Metadata } from "next";
import { CourseCard } from "@/components/course/CourseCard";
import { CURRICULUM } from "@/content";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Learning path</h1>
      <p className="mt-2 text-lg text-muted">
        Courses are ordered as a path from first notes to fluent musicianship. Experienced players can start anywhere:
        recommended prerequisites are suggestions, never locks.
      </p>
      {CURRICULUM.map((stage) => {
        const available = stage.courses.filter((c) => c.courseId);
        const planned = stage.courses.filter((c) => !c.courseId);
        return (
          <section key={stage.id} className="mt-10" aria-labelledby={`stage-${stage.id}`}>
            <h2 id={`stage-${stage.id}`} className="text-xl font-bold tracking-tight">
              {stage.title}
            </h2>
            <p className="mt-1 text-muted">{stage.description}</p>
            {available.length > 0 && (
              <div className="mt-5 grid gap-4">
                {available.map((c) => (
                  <CourseCard key={c.courseId} courseId={c.courseId!} />
                ))}
              </div>
            )}
            {planned.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-muted">Coming later</p>
                <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Planned ${stage.title} courses`}>
                  {planned.map((c) => (
                    <li key={c.title} className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted">
                      {c.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
