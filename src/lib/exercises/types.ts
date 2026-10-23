/**
 * Exercise definitions. These are plain serializable data: content authors describe *what* is
 * asked and *how* answers are judged; the UI and validators interpret them.
 */
import type { FretboardSpec, SelectionMode } from "@/lib/fretboard";
import type { ChordSpec, FretPosition, FretRange, IntervalCode, Inversion, ScaleSpec } from "@/lib/theory";

// ---------------------------------------------------------------------------------------------
// Validation rules (one per strategy). Add a new strategy by extending this union and
// registering a validator in validators.ts.
// ---------------------------------------------------------------------------------------------

export interface Region {
  readonly range: FretRange;
  readonly strings?: readonly number[];
}

/** Exactly these positions: a specific fingering or "tap the highlighted root". */
export interface ExactPositionsRule {
  readonly type: "exact-positions";
  readonly positions: readonly FretPosition[];
  /** "all" (default): every position is required. "any": selecting any one of them is enough. */
  readonly match?: "all" | "any";
  /** Musical context used to explain wrong answers (e.g. "that's the third of C major"). */
  readonly context?: { readonly chord?: ChordSpec };
}

/** Any playable voicing of a chord; optional inversion and string constraints. */
export interface ChordRule {
  readonly type: "chord";
  readonly chord: ChordSpec;
  readonly inversion?: Inversion;
  /** Only these strings may be used. */
  readonly strings?: readonly number[];
  /** Minimum number of sounding strings. Default 3. */
  readonly minNotes?: number;
}

/** Every occurrence of the given notes inside a region, octave-agnostic. */
export interface PitchClassRule {
  readonly type: "pitch-classes";
  readonly notes: readonly string[];
  readonly region: Region;
  /** "all": every occurrence in the region; "any": at least one, and nothing else. */
  readonly match: "all" | "any";
}

/** Octave-specific pitches ("C4"). Any string that produces the pitch is accepted. */
export interface PitchRule {
  readonly type: "pitches";
  readonly pitches: readonly string[];
  readonly region?: Region;
}

/** A note at an interval from a given position. */
export interface IntervalRule {
  readonly type: "interval";
  readonly from: FretPosition;
  readonly interval: IntervalCode;
  readonly direction?: "up" | "down";
  /** "exact": within the same octave as written; "any-octave": any matching pitch class. */
  readonly octave?: "exact" | "any-octave";
}

/** Every tone of a scale in a region (a scale "position" / shape). */
export interface ScaleRule {
  readonly type: "scale";
  readonly scale: ScaleSpec;
  readonly region: Region;
}

export type ValidationRule = ExactPositionsRule | ChordRule | PitchClassRule | PitchRule | IntervalRule | ScaleRule;

// ---------------------------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------------------------

interface ExerciseBase {
  /** Unique within a lesson; used as the progress key. */
  readonly id: string;
  readonly prompt: string;
  /** Extra guidance revealed on request. */
  readonly hint?: string;
  /** Shown after a correct answer to reinforce the idea. */
  readonly explanation?: string;
}

export interface Choice {
  readonly id: string;
  readonly label: string;
  /** Why this choice is wrong (or right). Shown after picking it. */
  readonly feedback?: string;
}

/** Recognition: look at something (optionally a fretboard) and pick an answer. */
export interface MultipleChoiceExercise extends ExerciseBase {
  readonly kind: "multiple-choice";
  readonly board?: FretboardSpec;
  readonly choices: readonly Choice[];
  readonly answer: string;
}

/** Construction / location: interact with the fretboard. */
export interface FretboardExercise extends ExerciseBase {
  readonly kind: "fretboard";
  readonly task: "construct" | "locate" | "identify";
  readonly board: FretboardSpec;
  readonly selection: SelectionMode;
  /** Restrict taps to the markers already shown on the board (identify tasks). */
  readonly selectableOnlyMarkers?: boolean;
  readonly rule: ValidationRule;
  /** Pre-placed notes the student modifies (e.g. "turn this E major into E minor"). */
  readonly initialSelection?: readonly FretPosition[];
  /** A canonical correct answer for "show me" and for content integrity tests. */
  readonly solution: readonly FretPosition[];
}

export type Exercise = MultipleChoiceExercise | FretboardExercise;

// ---------------------------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------------------------

export type FeedbackCode =
  | "correct"
  | "empty"
  | "wrong-note"
  | "wrong-third"
  | "wrong-fifth"
  | "missing-tone"
  | "missing-note"
  | "wrong-octave"
  | "wrong-inversion"
  | "wrong-string"
  | "too-few-notes"
  | "same-string"
  | "wrong-interval"
  | "wrong-choice"
  | "different-chord";

export interface FeedbackIssue {
  readonly code: FeedbackCode;
  readonly message: string;
  /** Positions this issue refers to, so the UI can point at them. */
  readonly positions?: readonly FretPosition[];
}

export interface PositionMark {
  readonly position: FretPosition;
  readonly state: "correct" | "incorrect" | "missed";
}

export interface ValidationResult {
  readonly correct: boolean;
  /** One-sentence headline. */
  readonly message: string;
  /** Detailed, musical explanations. Empty when correct. */
  readonly issues: readonly FeedbackIssue[];
  /** Per-position evaluation for the board. "missed" marks are only revealed on request. */
  readonly marks: readonly PositionMark[];
}
