"use client";

import { type ReactNode, useState } from "react";
import type { Exercise, ValidationResult } from "@/lib/exercises";
import type { ExerciseRecord } from "@/lib/progress";
import { CheckIcon, LightbulbIcon, XIcon } from "@/components/ui/Icons";
import { inline } from "@/components/lesson/RichText";

export interface ExerciseViewProps<E extends Exercise = Exercise> {
  readonly exercise: E;
  readonly record?: ExerciseRecord;
  readonly onAttempt: (correct: boolean) => void;
}

const KIND_LABEL = {
  "multiple-choice": "Recognition",
  construct: "Construction",
  locate: "Location",
  identify: "Recognition",
} as const;

export function exerciseKindLabel(exercise: Exercise): string {
  return exercise.kind === "multiple-choice" ? KIND_LABEL["multiple-choice"] : KIND_LABEL[exercise.task];
}

export function ExerciseCard({
  exercise,
  solved,
  children,
}: {
  exercise: Exercise;
  solved: boolean;
  children: ReactNode;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  return (
    <section
      className={`rounded-2xl border bg-surface shadow-sm transition-colors ${solved ? "border-correct/40" : "border-border"}`}
      aria-labelledby={`ex-${exercise.id}`}
      data-testid={`exercise-${exercise.id}`}
      data-solved={solved}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">{exerciseKindLabel(exercise)}</p>
          <h3 id={`ex-${exercise.id}`} className="mt-1 text-lg leading-snug font-semibold">
            {inline(exercise.prompt)}
          </h3>
        </div>
        {solved && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-correct-soft px-2.5 py-1 text-xs font-semibold text-correct">
            <CheckIcon size={14} /> Done
          </span>
        )}
      </header>
      {exercise.hint && !solved && (
        <div className="px-4 pt-2 sm:px-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen((o) => !o)}
          >
            <LightbulbIcon /> {hintOpen ? "Hide hint" : "Show hint"}
          </button>
          {hintOpen && <p className="fade-in mt-1 text-sm text-muted">{inline(exercise.hint)}</p>}
        </div>
      )}
      <div className="p-4 pt-3 sm:p-5 sm:pt-3">{children}</div>
    </section>
  );
}

export function FeedbackPanel({ result, explanation }: { result: ValidationResult | null; explanation?: string }) {
  return (
    <div aria-live="polite" role="status">
      {result && (
        <div
          className={`fade-in mt-3 rounded-xl border p-3.5 ${
            result.correct ? "border-correct/40 bg-correct-soft" : "border-incorrect/40 bg-incorrect-soft"
          }`}
          data-testid="feedback"
          data-correct={result.correct}
        >
          <p className={`flex items-center gap-2 font-semibold ${result.correct ? "text-correct" : "text-incorrect"}`}>
            {result.correct ? <CheckIcon /> : <XIcon />}
            {result.message}
          </p>
          {result.issues.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-[0.95rem]">
              {result.issues
                .filter((i) => i.message !== result.message)
                .map((issue, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-incorrect" />
                    <span>{issue.message}</span>
                  </li>
                ))}
            </ul>
          )}
          {result.correct && explanation && <p className="mt-1.5 text-[0.95rem]">{inline(explanation)}</p>}
        </div>
      )}
    </div>
  );
}
