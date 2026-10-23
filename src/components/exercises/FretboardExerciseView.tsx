"use client";

/**
 * Construction / location / identification exercises on the fretboard.
 *
 * Owns the selection state (via the pure selection reducer), asks the validator for a verdict,
 * and turns the result's per-position marks into overlay markers. It has no knowledge of
 * specific rule types, so new validation strategies need no UI changes.
 */
import { useCallback, useMemo, useReducer, useState } from "react";
import { type FretboardExercise, type ValidationResult, ruleSpelling, validate } from "@/lib/exercises";
import {
  EMPTY_SELECTION,
  type FretMarker,
  type SelectionAction,
  type SelectionState,
  labelFor,
  resolveFretboard,
  selectionReducer,
} from "@/lib/fretboard";
import { type FretPosition, positionKey, samePosition } from "@/lib/theory";
import { ResponsiveFretboard } from "@/components/fretboard/ResponsiveFretboard";
import { Button } from "@/components/ui/Button";
import { ResetIcon } from "@/components/ui/Icons";
import { ExerciseCard, type ExerciseViewProps, FeedbackPanel } from "./ExerciseCard";

type Phase = "editing" | "checked";

export function FretboardExerciseView({ exercise, record, onAttempt }: ExerciseViewProps<FretboardExercise>) {
  const model = useMemo(() => resolveFretboard(exercise.board), [exercise.board]);
  const spelling = useMemo(() => ruleSpelling(exercise.rule), [exercise.rule]);
  const previouslySolved = Boolean(record?.solved);

  const reducer = useCallback(
    (state: SelectionState, action: SelectionAction) => selectionReducer(exercise.selection, state, action),
    [exercise.selection],
  );
  const initial: SelectionState = previouslySolved
    ? { positions: exercise.solution }
    : exercise.initialSelection
      ? { positions: exercise.initialSelection }
      : EMPTY_SELECTION;
  const [selection, dispatch] = useReducer(reducer, initial);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [phase, setPhase] = useState<Phase>("editing");
  const [revealed, setRevealed] = useState(false);
  const [failedOnce, setFailedOnce] = useState(false);
  const [practising, setPractising] = useState(false);

  const solvedNow = result?.correct === true && phase === "checked";
  const locked = solvedNow || (previouslySolved && !practising);
  const solved = previouslySolved || solvedNow;

  const markerKeys = useMemo(() => new Set(model.markers.map((m) => positionKey(m.position))), [model.markers]);
  const isSelectable = useMemo(
    () => (exercise.selectableOnlyMarkers ? (pos: FretPosition) => markerKeys.has(positionKey(pos)) : undefined),
    [exercise.selectableOnlyMarkers, markerKeys],
  );

  const press = (position: FretPosition) => {
    if (locked) return;
    dispatch({ type: "toggle", position });
    setPhase("editing");
    setResult(null);
  };

  const check = () => {
    const r = validate(exercise.rule, { tuning: model.tuning, selection: selection.positions, range: model.range });
    setResult(r);
    setPhase("checked");
    if (r.issues[0]?.code === "empty") return; // Not a real attempt.
    if (!r.correct) setFailedOnce(true);
    onAttempt(r.correct);
  };

  const clear = () => {
    dispatch({ type: "clear" });
    setPhase("editing");
    setResult(null);
  };

  const practiseAgain = () => {
    setPractising(true);
    dispatch({ type: "set", positions: exercise.initialSelection ?? [] });
    setResult(null);
    setPhase("editing");
    setRevealed(false);
  };

  const overlay: FretMarker[] = useMemo(() => {
    const label = (position: FretPosition) => labelFor(position, "note", { tuning: model.tuning, spelling });
    const marks = phase === "checked" && result ? result.marks : [];
    const out: FretMarker[] = [];
    if (revealed) {
      for (const position of exercise.solution) out.push({ position, state: "hint", role: "tone", label: label(position) });
    }
    for (const position of selection.positions) {
      const mark = marks.find((m) => samePosition(m.position, position));
      if (mark) out.push({ position, state: mark.state, label: label(position) });
      else if (previouslySolved && !practising) out.push({ position, state: "correct", label: label(position) });
      else out.push({ position, state: "selected", role: "neutral" });
    }
    return out;
  }, [selection.positions, result, phase, revealed, exercise.solution, model.tuning, spelling, previouslySolved, practising]);

  const canCheck = selection.positions.length > 0 && phase === "editing" && !locked;
  const count = selection.positions.length;

  return (
    <ExerciseCard exercise={exercise} solved={solved}>
      <ResponsiveFretboard
        model={model}
        layout={exercise.board.layout}
        overlay={overlay}
        interactive={!locked}
        isSelectable={isSelectable}
        onPress={press}
        muteEmptyStrings={exercise.selection === "per-string"}
        focus={exercise.solution}
        label={`Interactive fretboard: ${exercise.prompt}`}
      />
      <p className="mt-2 text-center text-xs text-muted">
        {locked
          ? "Solved."
          : exercise.selection === "per-string"
            ? "Tap a fret to place a finger, or the space beside the nut for an open string. Tap again to remove. Unplayed strings are muted (×)."
            : exercise.selectableOnlyMarkers
              ? "Tap one of the highlighted notes."
              : "Tap to select, tap again to remove."}
      </p>

      <FeedbackPanel result={phase === "checked" ? result : null} explanation={exercise.explanation} />
      {revealed && !solvedNow && (
        <p className="mt-2 text-sm text-muted">The dashed outlines show one correct answer. Tap them, then check.</p>
      )}

      <div className="-mx-4 mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 pt-3 sm:-mx-5 sm:px-5">
        {locked ? (
          <Button variant="ghost" onClick={practiseAgain}>
            <ResetIcon /> Practise again
          </Button>
        ) : (
          <>
            <span className="mr-auto text-sm text-muted tabular-nums" aria-live="polite">
              {count} {count === 1 ? "note" : "notes"} selected
            </span>
            {failedOnce && !revealed && (
              <Button variant="ghost" onClick={() => setRevealed(true)}>
                Show answer
              </Button>
            )}
            <Button variant="secondary" onClick={clear} disabled={count === 0}>
              Clear
            </Button>
            <Button onClick={check} disabled={!canCheck}>
              Check
            </Button>
          </>
        )}
      </div>
    </ExerciseCard>
  );
}
