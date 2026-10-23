import { type CourseOutline, findLesson } from "@/lib/courses";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Shown instead of a lesson the visitor may not open. Contains only public outline data; the
 * lesson's content never reaches the browser. (Unused during the free beta: all content is public.)
 */
export function AccessGate({
  course,
  lessonId,
  reason,
}: {
  course: CourseOutline;
  lessonId: string;
  reason: "sign-in-required" | "entitlement-required";
}) {
  const lesson = findLesson(course, lessonId);
  const next = `/learn/${course.id}/${lessonId}`;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm font-semibold text-accent">{course.title}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{lesson?.title}</h1>
      <p className="mt-3 text-muted">
        {reason === "sign-in-required"
          ? "This lesson is free with an account. Sign in or create one to continue."
          : "This lesson is part of a course you don't have access to yet."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {reason === "sign-in-required" ? (
          <>
            <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</ButtonLink>
            <ButtonLink href={`/sign-up?next=${encodeURIComponent(next)}`} variant="secondary">
              Create account
            </ButtonLink>
          </>
        ) : (
          <ButtonLink href={`/learn/${course.id}`} variant="secondary">
            Back to course
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
