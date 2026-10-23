"use client";

import { useMemo, useState } from "react";
import { type MultipleChoiceExercise, type ValidationResult, displayChoices, validateChoice } from "@/lib/exercises";
import { resolveFretboard } from "@/lib/fretboard";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";
import { CheckIcon, XIcon } from "@/components/ui/Icons";
import { ExerciseCard, type ExerciseViewProps, FeedbackPanel } from "./ExerciseCard";

export function MultipleChoiceView({ exercise, record, onAttempt }: ExerciseViewProps<MultipleChoiceExercise>) {
  const model = useMemo(() => (exercise.board ? resolveFretboard(exercise.board) : null), [exercise.board]);
  // Shuffled once per mount (lessons render client-side only, so no hydration mismatch).
  const [choices] = useState(() => displayChoices(exercise));
  const [wrong, setWrong] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const solved = Boolean(record?.solved) || result?.correct === true;

  const pick = (id: string) => {
    if (solved || wrong.includes(id)) return;
    const r = validateChoice(exercise, id);
    setResult(r);
    if (!r.correct) setWrong((w) => [...w, id]);
    onAttempt(r.correct);
  };

  const short = exercise.choices.every((c) => c.label.length <= 14);

  return (
    <ExerciseCard exercise={exercise} solved={solved}>
      {model && (
        <div className="mb-4">
          <ResponsiveFretboard model={model} layout={exercise.board?.layout} label={`Diagram for: ${exercise.prompt}`} />
        </div>
      )}
      <div className={`grid gap-2 ${short ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`} role="group" aria-label="Answer choices">
        {choices.map((choice) => {
          const isWrong = wrong.includes(choice.id);
          const isAnswer = solved && choice.id === exercise.answer;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => pick(choice.id)}
              disabled={isWrong || (solved && !isAnswer)}
              aria-pressed={isAnswer || isWrong}
              className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left font-medium transition-colors ${
                isAnswer
                  ? "border-correct bg-correct-soft text-correct"
                  : isWrong
                    ? "border-incorrect/50 bg-incorrect-soft text-incorrect line-through decoration-2 opacity-80"
                    : "border-border bg-surface-2/60 hover:border-accent hover:bg-accent-soft disabled:opacity-50"
              }`}
            >
              <span>{choice.label}</span>
              {isAnswer && <CheckIcon />}
              {isWrong && <XIcon />}
            </button>
          );
        })}
      </div>
      <FeedbackPanel result={result} explanation={exercise.explanation} />
      {!result && solved && exercise.explanation && <p className="mt-3 text-sm text-muted">{exercise.explanation}</p>}
    </ExerciseCard>
  );
}
