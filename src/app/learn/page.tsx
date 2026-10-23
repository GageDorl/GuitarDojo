import type { Metadata } from "next";
import { CourseCard } from "@/components/course/CourseCard";
import { ComingSoonBadge, ComingSoonPath, PathCards } from "@/components/course/LearningPaths";
import { LEARNING_PATHS, getCourseOutline, getPathSummaries } from "@/content";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  const summaries = getPathSummaries();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Learn</h1>
      <p className="mt-2 text-lg text-muted">
        Three learning paths, from your first notes to building your own guitar. Courses are ordered as a path, but
        experienced players can start anywhere: recommended prerequisites are suggestions, never locks.
      </p>

      <div className="mt-8">
        <PathCards paths={summaries} hrefFor={(id) => `#path-${id}`} />
      </div>

      {LEARNING_PATHS.map((path) => {
        const summary = summaries.find((s) => s.id === path.id)!;
        return (
          <section key={path.id} id={`path-${path.id}`} className="mt-14 scroll-mt-20" aria-labelledby={`path-title-${path.id}`}>
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
              <h2 id={`path-title-${path.id}`} className="text-2xl font-bold tracking-tight">
                {path.title}
              </h2>
              {path.status === "coming-soon" && <ComingSoonBadge />}
            </div>

            {path.status === "coming-soon" ? (
              <div className="mt-5">
                <ComingSoonPath path={summary} stages={path.stages} />
              </div>
            ) : (
              <>
                <p className="mt-4 max-w-2xl text-muted">{path.description}</p>
                {path.stages.map((stage) => {
                  const available = stage.courses.filter((c) => c.courseId);
                  const planned = stage.courses.filter((c) => !c.courseId);
                  return (
                    <section key={stage.id} className="mt-10" aria-labelledby={`stage-${stage.id}`}>
                      <h3 id={`stage-${stage.id}`} className="text-xl font-bold tracking-tight">
                        {stage.title}
                      </h3>
                      <p className="mt-1 text-muted">{stage.description}</p>
                      {available.length > 0 && (
                        <div className="mt-5 grid gap-4">
                          {available.map((c) => {
                            const course = getCourseOutline(c.courseId!)!;
                            const prerequisites = course.prerequisites.flatMap((id) => getCourseOutline(id) ?? []);
                            return <CourseCard key={c.courseId} course={course} prerequisites={prerequisites} />;
                          })}
                        </div>
                      )}
                      {planned.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-muted">Coming later</p>
                          <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Planned ${stage.title} courses`}>
                            {planned.map((c) => (
                              <li key={c.title} className="rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted" title={c.summary}>
                                {c.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  );
                })}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
