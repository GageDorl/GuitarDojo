/**
 * Small authoring helpers that keep lesson files readable. They only build plain data.
 */
import type {
  CalloutBlock,
  ExerciseBlock,
  FretboardBlock,
  LessonBlock,
  LessonStep,
  TextBlock,
} from "@/lib/courses";
import type { Choice, Exercise, MultipleChoiceExercise } from "@/lib/exercises";
import type { FretboardSpec } from "@/lib/fretboard";
import { type FretPosition, parseVoicing, voicingPositions } from "@/lib/theory";

export const text = (body: string): TextBlock => ({ type: "text", body: dedent(body) });

export const callout = (tone: CalloutBlock["tone"], body: string, title?: string): CalloutBlock => ({
  type: "callout",
  tone,
  title,
  body: dedent(body),
});

export const board = (spec: FretboardSpec, caption?: string): FretboardBlock => ({ type: "fretboard", board: spec, caption });

export const exercise = (ex: Exercise): ExerciseBlock => ({ type: "exercise", exercise: ex });

export const step = (id: string, title: string, blocks: LessonBlock[]): LessonStep => ({ id, title, blocks });

/** Multiple choice with choices written as [id, label, feedback?]. */
export function choice(
  id: string,
  prompt: string,
  choices: [id: string, label: string, feedback?: string][],
  answer: string,
  extra: Partial<Pick<MultipleChoiceExercise, "board" | "hint" | "explanation">> = {},
): ExerciseBlock {
  return exercise({
    id,
    kind: "multiple-choice",
    prompt,
    choices: choices.map(([cid, label, feedback]): Choice => ({ id: cid, label, feedback })),
    answer,
    ...extra,
  });
}

/** Positions of a voicing shape such as "x32010". */
export const shape = (s: string): FretPosition[] => voicingPositions(parseVoicing(s));

/** Allow indented template literals in content files. */
function dedent(s: string): string {
  const lines = s.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}
