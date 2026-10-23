"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type CourseOutline,
  type Lesson,
  type LessonOutline,
  adjacentLessons,
  evaluateCompletion,
  findLesson,
  lessonExercises,
} from "@/lib/courses";
import { getLessonProgress, lessonStatus } from "@/lib/progress";
import { useHydrated } from "@/hooks/useMediaQuery";
import { useProgress } from "@/components/progress/ProgressProvider";
import { SyncNudge } from "@/components/account/SyncNudge";
import { Button, ButtonLink, ProgressBar } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, CheckIcon, ResetIcon } from "@/components/ui/Icons";
import { BlockRenderer, type BlockContext } from "./BlockRenderer";

/**
 * `lesson` is full content, sent by the server only after it authorized access. `course` is the
 * content-free outline used for navigation.
 */
export function LessonPlayer({ course, lesson }: { course: CourseOutline; lesson: Lesson }) {
  const hydrated = useHydrated();
  if (!hydrated) return <LessonSkeleton lesson={lesson} />;
  return <LessonPlayerInner course={course} lesson={lesson} />;
}

function LessonSkeleton({ lesson }: { lesson: Lesson }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8" aria-busy="true">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <p className="mt-2 text-muted">Loading lesson…</p>
    </div>
  );
}

function LessonPlayerInner({ course, lesson }: { course: CourseOutline; lesson: Lesson }) {
  const courseId = course.id;
  const { progress, dispatch } = useProgress();
  const lessonProgress = getLessonProgress(progress, courseId, lesson.id);
  const [step, setStep] = useState(() => Math.min(lessonProgress?.currentStep ?? 0, lesson.steps.length - 1));
  const [showSummary, setShowSummary] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const summary = evaluateCompletion(lesson, lessonProgress);
  const { next } = adjacentLessons(course, lesson.id);
  const isAssessment = lesson.kind === "assessment";
  const completed = lessonProgress?.status === "completed";

  // Record the resume point.
  useEffect(() => {
    dispatch({ type: "lesson-visited", courseId, lessonId: lesson.id, step });
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, courseId, lesson.id, dispatch]);

  // Mark the lesson complete as soon as its completion rule is satisfied.
  const bestScore = lessonProgress?.bestScore ?? 0;
  useEffect(() => {
    if (summary.complete && (!completed || summary.score > bestScore)) {
      dispatch({ type: "lesson-completed", courseId, lessonId: lesson.id, score: summary.score });
    }
  }, [summary.complete, summary.score, completed, bestScore, courseId, lesson.id, dispatch]);

  const ctx: BlockContext = useMemo(
    () => ({
      records: lessonProgress?.exercises ?? {},
      onAttempt: (exerciseId, correct) =>
        dispatch({ type: "exercise-attempted", courseId, lessonId: lesson.id, exerciseId, correct }),
    }),
    [lessonProgress?.exercises, dispatch, courseId, lesson.id],
  );

  const exerciseStep = useMemo(() => {
    const map = new Map<string, number>();
    lesson.steps.forEach((s, i) => s.blocks.forEach((b) => b.type === "exercise" && map.set(b.exercise.id, i)));
    return map;
  }, [lesson]);

  const retake = () => {
    dispatch({ type: "lesson-reset", courseId, lessonId: lesson.id });
    setAttemptKey((k) => k + 1);
    setShowSummary(false);
    setStep(0);
  };

  const goTo = (i: number) => {
    setShowSummary(false);
    setStep(i);
  };

  const current = lesson.steps[step]!;
  const lastStep = step === lesson.steps.length - 1;
  const incompletePrereqs = lesson.prerequisites.filter((p) => lessonStatus(progress, courseId, p) !== "completed");

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16" ref={topRef}>
      {/* Lesson header + step progress */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-bg/90 px-4 pt-3 pb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href={`/learn/${courseId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
            aria-label={`Back to ${course.title}`}
          >
            <ArrowLeft />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{lesson.title}</p>
            <p className="text-xs text-muted">
              {showSummary ? "Summary" : `Step ${step + 1} of ${lesson.steps.length}`}
              {summary.total > 0 && ` · ${summary.solved}/${summary.total} exercises`}
            </p>
          </div>
          {completed && (
            <span className="flex items-center gap-1 rounded-full bg-correct-soft px-2.5 py-1 text-xs font-semibold text-correct">
              <CheckIcon size={14} /> Complete
            </span>
          )}
        </div>
        <nav aria-label="Lesson steps" className="mt-2.5 flex gap-1.5">
          {lesson.steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={i === step && !showSummary ? "step" : undefined}
              className="group flex h-6 flex-1 items-center"
            >
              <span
                className={`h-1.5 w-full rounded-full transition-colors ${
                  i === step && !showSummary ? "bg-accent" : i < step || showSummary ? "bg-accent/45" : "bg-border group-hover:bg-muted/40"
                }`}
              />
            </button>
          ))}
        </nav>
      </div>

      {showSummary ? (
        <LessonSummary
          lesson={lesson}
          courseId={courseId}
          summary={summary}
          nextLesson={next}
          onRetake={retake}
          onGoToExercise={(id) => goTo(exerciseStep.get(id) ?? 0)}
          unsolved={lessonExercises(lesson).filter((e) => !lessonProgress?.exercises[e.id]?.solved)}
          unattempted={lessonExercises(lesson).filter((e) => !lessonProgress?.exercises[e.id])}
        />
      ) : (
        <article key={`${step}-${attemptKey}`} className="fade-in pt-6">
          {step === 0 && (
            <header className="mb-8">
              <p className="text-sm font-semibold text-accent">
                {isAssessment ? "Assessment" : "Lesson"} · {lesson.estimatedMinutes} min
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>
              <p className="mt-2 text-lg text-muted">{lesson.summary}</p>
              {incompletePrereqs.length > 0 && (
                <p className="mt-4 rounded-xl border border-border bg-surface-2 p-3 text-sm">
                  Recommended first:{" "}
                  {incompletePrereqs.map((id, i) => (
                    <span key={id}>
                      {i > 0 && ", "}
                      <Link className="font-semibold text-accent underline-offset-2 hover:underline" href={`/learn/${courseId}/${id}`}>
                        {findLesson(course, id)?.title ?? id}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold">You&apos;ll be able to:</p>
                <ul className="mt-2 space-y-1.5 text-[0.95rem]">
                  {lesson.objectives.map((o) => (
                    <li key={o} className="flex gap-2">
                      <span className="mt-0.5 text-correct">
                        <CheckIcon size={16} />
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </header>
          )}
          <h2 className="mb-5 text-2xl font-bold tracking-tight">{current.title}</h2>
          <div className="space-y-6">
            {current.blocks.map((block, i) => (
              <BlockRenderer key={`${current.id}-${i}`} block={block} ctx={ctx} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Button>
            {lastStep ? (
              <Button onClick={() => setShowSummary(true)} data-testid="finish-lesson">
                {isAssessment ? "See results" : "Finish lesson"} <ArrowRight />
              </Button>
            ) : (
              <Button onClick={() => goTo(step + 1)} data-testid="next-step">
                Continue <ArrowRight />
              </Button>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

function LessonSummary({
  lesson,
  courseId,
  summary,
  nextLesson,
  onRetake,
  onGoToExercise,
  unsolved,
  unattempted,
}: {
  lesson: Lesson;
  courseId: string;
  summary: ReturnType<typeof evaluateCompletion>;
  nextLesson?: LessonOutline;
  onRetake: () => void;
  onGoToExercise: (id: string) => void;
  unsolved: { id: string; prompt: string }[];
  unattempted: { id: string; prompt: string }[];
}) {
  const isAssessment = lesson.completion.type === "min-score";
  const threshold = lesson.completion.type === "min-score" ? lesson.completion.score : 1;
  const remaining = isAssessment ? unattempted : unsolved;

  return (
    <section className="fade-in pt-8" aria-labelledby="summary-title" data-testid="lesson-summary">
      <div className="rounded-3xl border border-border bg-surface p-6 text-center sm:p-10">
        {summary.complete ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-correct text-white">
              <CheckIcon size={34} />
            </div>
            <h1 id="summary-title" className="mt-4 text-3xl font-bold tracking-tight">
              {isAssessment ? "Checkpoint passed!" : "Lesson complete!"}
            </h1>
          </>
        ) : summary.failed ? (
          <h1 id="summary-title" className="text-3xl font-bold tracking-tight">
            Not quite there yet
          </h1>
        ) : (
          <h1 id="summary-title" className="text-3xl font-bold tracking-tight">
            Almost there
          </h1>
        )}

        {isAssessment && remaining.length === 0 && (
          <div className="mx-auto mt-5 max-w-xs">
            <p className="text-4xl font-bold tabular-nums" data-testid="assessment-score">
              {summary.firstTryCorrect}/{summary.total}
            </p>
            <p className="mt-1 text-sm text-muted">
              correct on the first try · {Math.ceil(threshold * summary.total)} needed to pass
            </p>
            <ProgressBar className="mt-3" value={summary.score} label="Assessment score" />
          </div>
        )}

        {!isAssessment && summary.complete && (
          <p className="mt-2 text-muted">
            You solved all {summary.total} exercises, {summary.firstTryCorrect} of them on the first try.
          </p>
        )}

        {remaining.length > 0 && (
          <div className="mx-auto mt-5 max-w-md text-left">
            <p className="text-center text-muted">
              {remaining.length} {remaining.length === 1 ? "exercise" : "exercises"} still to {isAssessment ? "answer" : "solve"}:
            </p>
            <ul className="mt-3 space-y-2">
              {remaining.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onGoToExercise(e.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-left text-sm hover:border-accent"
                  >
                    <span>{e.prompt}</span>
                    <ArrowRight />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.complete && <SyncNudge className="mx-auto mt-6 max-w-md text-left" />}

        <div className="mt-8 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ButtonLink href={`/learn/${courseId}`} variant="secondary">
            Back to course
          </ButtonLink>
          {isAssessment && (summary.failed || summary.complete) && (
            <Button variant={summary.failed ? "primary" : "secondary"} onClick={onRetake}>
              <ResetIcon /> Retake
            </Button>
          )}
          {summary.complete && nextLesson && (
            <ButtonLink href={`/learn/${courseId}/${nextLesson.id}`} data-testid="next-lesson">
              Next: {nextLesson.title} <ArrowRight />
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
