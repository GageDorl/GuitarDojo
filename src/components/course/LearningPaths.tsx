import Link from "next/link";
import type { ReactNode } from "react";
import { FretboardIcon, MetronomeIcon, WrenchIcon } from "@/components/ui/Icons";

/**
 * Learning-path (discipline) presentation. Receives plain summaries from server pages; it never
 * imports content itself.
 */
export interface PathSummary {
  readonly id: "theory" | "technique" | "luthiery";
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly status: "available" | "coming-soon";
  readonly liveCourses: number;
  readonly plannedCourses: number;
}

export interface PlannedCourse {
  readonly title: string;
  readonly summary?: string;
}

const ICONS: Record<PathSummary["id"], ReactNode> = {
  theory: <FretboardIcon />,
  technique: <MetronomeIcon />,
  luthiery: <WrenchIcon />,
};

export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs font-semibold text-muted ${className}`}>
      Coming soon
    </span>
  );
}

/** Three cards, one per discipline. `hrefFor` decides where each card links. */
export function PathCards({ paths, hrefFor }: { paths: readonly PathSummary[]; hrefFor: (id: PathSummary["id"]) => string }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3" aria-label="Learning paths">
      {paths.map((path) => {
        const live = path.status === "available";
        return (
          <li key={path.id}>
            <Link
              href={hrefFor(path.id)}
              className={`group flex h-full flex-col rounded-3xl border bg-surface p-5 transition-colors hover:border-accent ${
                live ? "border-border" : "border-dashed border-border"
              }`}
              data-testid={`path-card-${path.id}`}
              data-status={path.status}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${live ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>
                {ICONS[path.id]}
              </span>
              <span className="mt-4 text-lg leading-snug font-bold tracking-tight">{path.title}</span>
              <span className="mt-1 text-sm text-muted">{path.tagline}</span>
              <span className="mt-auto pt-4">
                {live ? (
                  <span className="text-sm font-semibold text-accent">
                    {path.liveCourses} courses available <span aria-hidden>→</span>
                  </span>
                ) : (
                  <ComingSoonBadge />
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** A coming-soon path: what it will cover, stage by stage, with no links. */
export function ComingSoonPath({
  path,
  stages,
}: {
  path: PathSummary;
  stages: readonly { readonly id: string; readonly title: string; readonly description: string; readonly courses: readonly PlannedCourse[] }[];
}) {
  return (
    <div>
      <p className="max-w-2xl text-muted">{path.description}</p>
      <div className="mt-6 space-y-6">
        {stages.map((stage) => (
          <div key={stage.id}>
            <h3 className="font-semibold">{stage.title}</h3>
            <p className="text-sm text-muted">{stage.description}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {stage.courses.map((course) => (
                <li key={course.title} className="rounded-2xl border border-dashed border-border bg-surface/60 p-4" aria-disabled="true">
                  <p className="flex flex-wrap items-center justify-between gap-2 font-semibold text-text/80">
                    {course.title}
                    <ComingSoonBadge />
                  </p>
                  {course.summary && <p className="mt-1 text-sm text-muted">{course.summary}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
