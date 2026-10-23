"use client";

import type { Exercise } from "@/lib/exercises";
import type { ExerciseViewProps } from "./ExerciseCard";
import { FretboardExerciseView } from "./FretboardExerciseView";
import { MultipleChoiceView } from "./MultipleChoiceView";

/** Dispatch an exercise to its view. New exercise kinds register here. */
export function ExerciseView(props: ExerciseViewProps<Exercise>) {
  const { exercise } = props;
  switch (exercise.kind) {
    case "multiple-choice":
      return <MultipleChoiceView {...props} exercise={exercise} />;
    case "fretboard":
      return <FretboardExerciseView {...props} exercise={exercise} />;
  }
}
