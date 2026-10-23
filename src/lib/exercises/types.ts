/**
 * Exercise definitions. These are plain serializable data: content authors describe *what* is
 * asked and *how* answers are judged; the UI and validators interpret them.
 */
import type { FretboardSpec, SelectionMode } from "@/lib/fretboard";
import type {
  ChordQualityId,
  ChordSpec,
  FretPosition,
  FretRange,
  IntervalCode,
  Inversion,
  ScaleSpec,
  ScaleTypeId,
} from "@/lib/theory";

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

// ---------------------------------------------------------------------------------------------
// Drills: randomized, repeated practice for recall and transfer
// ---------------------------------------------------------------------------------------------

/**
 * A drill generator is data describing a *family* of questions. Each round draws fresh
 * parameters (note, string, key, position, inversion …) and produces an ordinary multiple-choice
 * or fretboard exercise, graded by the normal validators. Add a generator by extending this union
 * and implementing it in drills.ts.
 */
export type DrillGenerator =
  /** "Find G on the A string." */
  | { readonly type: "note-location"; readonly strings: readonly number[]; readonly notes?: readonly string[]; readonly range?: FretRange }
  /** "What note is this?" for a highlighted position. */
  | {
      readonly type: "note-naming";
      readonly strings: readonly number[];
      readonly range: FretRange;
      readonly naturalsOnly?: boolean;
    }
  /** "Find the major third above this C." */
  | {
      readonly type: "interval-construction";
      readonly intervals: readonly IntervalCode[];
      readonly rootStrings: readonly number[];
      readonly rootRange: FretRange;
      readonly boardRange: FretRange;
    }
  /** "What interval is this?" for a root and a second note. */
  | {
      readonly type: "interval-recognition";
      readonly intervals: readonly IntervalCode[];
      readonly rootStrings: readonly number[];
      readonly rootRange: FretRange;
      readonly boardRange: FretRange;
      /** Show note names on the markers (easier) or only the shape (harder). */
      readonly showNames?: boolean;
    }
  /** "Build D minor in first inversion on strings 4, 3, 2." */
  | {
      readonly type: "chord-construction";
      readonly roots: readonly string[];
      readonly qualities: readonly ChordQualityId[];
      readonly range: FretRange;
      readonly stringGroups?: readonly (readonly number[])[];
      readonly inversions?: readonly Inversion[];
    }
  /** "Name this chord" for a generated voicing. */
  | {
      readonly type: "chord-recognition";
      readonly roots: readonly string[];
      readonly qualities: readonly ChordQualityId[];
      readonly range: FretRange;
      readonly stringGroups?: readonly (readonly number[])[];
    }
  /** "This is G major. Which inversion?" */
  | {
      readonly type: "inversion-recognition";
      readonly roots: readonly string[];
      readonly qualities: readonly ChordQualityId[];
      readonly stringGroups: readonly (readonly number[])[];
      readonly range: FretRange;
    }
  /** "Tap every root in this pentatonic position." */
  | {
      readonly type: "scale-roots";
      readonly scale: "minor-pentatonic" | "major-pentatonic";
      readonly roots: readonly string[];
      readonly positions: readonly (1 | 2 | 3 | 4 | 5)[];
    }
  /** "Which key is this pentatonic position in?" (roots are shown as squares). */
  | {
      readonly type: "scale-identification";
      readonly scale: "minor-pentatonic" | "major-pentatonic";
      readonly roots: readonly string[];
      readonly positions: readonly (1 | 2 | 3 | 4 | 5)[];
    }
  /** "Build E♭ major along the A string." */
  | {
      readonly type: "scale-on-string";
      readonly scales: readonly ScaleTypeId[];
      readonly roots: readonly string[];
      readonly strings: readonly number[];
    }
  /** "What is the 6th degree of D major?" */
  | {
      readonly type: "scale-degree";
      readonly scale: ScaleTypeId;
      readonly roots: readonly string[];
      readonly degrees?: readonly number[];
    };

export interface DrillExercise extends ExerciseBase {
  readonly kind: "drill";
  readonly generator: DrillGenerator;
  /** Rounds per run. */
  readonly rounds: number;
  /** Fraction of rounds that must be right on the first try for the drill to count as passed. */
  readonly passScore: number;
}

/** A single question produced by a drill round. */
export type DrillItem = MultipleChoiceExercise | FretboardExercise;

export type Exercise = MultipleChoiceExercise | FretboardExercise | DrillExercise;

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
