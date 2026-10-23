"use client";

/**
 * Runs a drill: N randomized rounds produced by a generator, each rendered with the ordinary
 * exercise views and graded by the ordinary validators. Only the first try in each round counts
 * toward the score, so a drill measures recall rather than eventual success. A run that reaches
 * the pass score is recorded as a correct attempt; anything else as an incorrect one.
 */
import { useEffect, useRef, useState } from "react";
import { type DrillExercise, type DrillItem, generateDrillItem } from "@/lib/exercises";
import { Button, ProgressBar } from "@/components/ui/Button";
import { ArrowRight, CheckIcon, ResetIcon } from "@/components/ui/Icons";
import { inline } from "@/components/lesson/RichText";
import type { ExerciseViewProps } from "./ExerciseCard";
import { FretboardExerciseView } from "./FretboardExerciseView";
import { MultipleChoiceView } from "./MultipleChoiceView";

interface Run {
  readonly nonce: number;
  readonly round: number;
  readonly item: DrillItem;
  /** First-try result per completed round. */
  readonly results: readonly boolean[];
  /** First-try result for the current round, once attempted. */
  readonly current: boolean | null;
  /** Solved (possibly after retries) — enables auto-advance. */
  readonly solved: boolean;
}

const ADVANCE_MS = 900;

export function DrillView({ exercise, record, onAttempt }: ExerciseViewProps<DrillExercise>) {
  const [run, setRun] = useState<Run | null>(null);
  const [finished, setFinished] = useState<{ score: number; correct: number; passed: boolean } | null>(null);
  const nonce = useRef(0);
  const needed = Math.ceil(exercise.passScore * exercise.rounds);
  const passedBefore = Boolean(record?.solved);

  const start = () => {
    nonce.current += 1;
    setFinished(null);
    setRun({ nonce: nonce.current, round: 0, item: generateDrillItem(exercise, 0, Math.random), results: [], current: null, solved: false });
  };

  const advance = () => {
    const r = run;
    if (!r) return;
    const results = [...r.results, r.current ?? false];
    if (results.length >= exercise.rounds) {
      const correct = results.filter(Boolean).length;
      const passed = correct >= needed;
      setRun(null);
      setFinished({ score: correct / exercise.rounds, correct, passed });
      onAttempt(passed);
      return;
    }
    const round = r.round + 1;
    setRun({ ...r, round, results, current: null, solved: false, item: generateDrillItem(exercise, round, Math.random, r.item) });
  };

  // Correct answers move on automatically; wrong ones wait so the feedback can be read.
  useEffect(() => {
    if (!run?.solved) return;
    const t = window.setTimeout(advance, ADVANCE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.solved, run?.round, run?.nonce]);

  const onInnerAttempt = (correct: boolean) =>
    setRun((r) => (r ? { ...r, current: r.current ?? correct, solved: r.solved || correct } : r));

  return (
    <section
      className={`rounded-2xl border bg-surface shadow-sm ${passedBefore || finished?.passed ? "border-correct/40" : "border-border"}`}
      aria-labelledby={`drill-${exercise.id}`}
      data-testid={`exercise-${exercise.id}`}
      data-solved={passedBefore || Boolean(finished?.passed)}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Recall drill</p>
          <h3 id={`drill-${exercise.id}`} className="mt-1 text-lg leading-snug font-semibold">
            {inline(exercise.prompt)}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {exercise.rounds} random questions · pass with {needed} right on the first try
          </p>
        </div>
        {(passedBefore || finished?.passed) && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-correct-soft px-2.5 py-1 text-xs font-semibold text-correct">
            <CheckIcon size={14} /> Passed
          </span>
        )}
      </header>

      <div className="p-4 pt-3 sm:p-5 sm:pt-3">
        {run ? (
          <>
            <div className="mb-3 flex items-center gap-3">
              <span className="shrink-0 text-sm font-semibold tabular-nums" data-testid="drill-round">
                Round {run.round + 1} of {exercise.rounds}
              </span>
              <ol className="flex flex-1 flex-wrap gap-1" aria-label="Results so far">
                {Array.from({ length: exercise.rounds }, (_, i) => {
                  const result = i < run.results.length ? run.results[i] : i === run.round ? run.current : null;
                  return (
                    <li
                      key={i}
                      aria-label={`Round ${i + 1}: ${result === null || result === undefined ? "not answered" : result ? "correct" : "incorrect"}`}
                      className={`h-2 min-w-2 flex-1 rounded-full ${
                        result === true ? "bg-correct" : result === false ? "bg-incorrect" : i === run.round ? "bg-accent/40" : "bg-border"
                      }`}
                    />
                  );
                })}
              </ol>
            </div>
            {run.item.kind === "multiple-choice" ? (
              <MultipleChoiceView key={`${run.nonce}-${run.round}`} exercise={run.item} onAttempt={onInnerAttempt} />
            ) : (
              <FretboardExerciseView key={`${run.nonce}-${run.round}`} exercise={run.item} onAttempt={onInnerAttempt} />
            )}
            <div className="mt-3 flex justify-end">
              <Button
                variant={run.current === null ? "ghost" : "primary"}
                onClick={advance}
                disabled={run.current === null}
                data-testid="drill-next"
              >
                {run.round + 1 >= exercise.rounds ? "Finish" : "Next"} <ArrowRight />
              </Button>
            </div>
          </>
        ) : finished ? (
          <div className="fade-in text-center" role="status" data-testid="drill-result" data-passed={finished.passed}>
            <p className="text-3xl font-bold tabular-nums">
              {finished.correct}/{exercise.rounds}
            </p>
            <p className={`mt-1 font-semibold ${finished.passed ? "text-correct" : "text-incorrect"}`}>
              {finished.passed ? "Passed. Nice recall!" : `Not yet. You need ${needed} to pass.`}
            </p>
            <ProgressBar className="mx-auto mt-3 max-w-xs" value={finished.score} label="Drill score" />
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              {finished.passed
                ? "Recall gets faster with repetition. Run it again in a day or two to keep it fresh."
                : "Each run uses new questions, so there's nothing to memorise except the skill itself."}
            </p>
            <Button className="mt-4" variant={finished.passed ? "secondary" : "primary"} onClick={start}>
              <ResetIcon /> Run again
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {passedBefore ? "You've passed this drill. Run it again any time to keep it sharp." : "Questions change every run."}
            </p>
            <Button onClick={start} data-testid="drill-start">
              {passedBefore ? "Practise again" : "Start drill"} <ArrowRight />
            </Button>
          </div>
        )}
        {exercise.hint && !run && <p className="mt-3 text-sm text-muted">{inline(exercise.hint)}</p>}
      </div>
    </section>
  );
}
