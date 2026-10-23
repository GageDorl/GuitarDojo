/**
 * Course content model. Lessons are data composed of reusable blocks; the renderer maps each
 * block type to a component. Adding a new kind of content means adding a block type and its
 * renderer, never a bespoke lesson component.
 */
import type { Exercise } from "@/lib/exercises";
import type { FretboardSpec } from "@/lib/fretboard";
import type { ChordSpec, FretPosition, FretRange } from "@/lib/theory";

/** Prose with light inline markup: blank lines split paragraphs, **bold**, *italic*. */
export interface TextBlock {
  readonly type: "text";
  readonly body: string;
}

export interface CalloutBlock {
  readonly type: "callout";
  readonly tone: "tip" | "note" | "guitar";
  readonly title?: string;
  readonly body: string;
}

export interface FretboardBlock {
  readonly type: "fretboard";
  readonly board: FretboardSpec;
  readonly caption?: string;
}

/** A step-through animation: each frame merges its overrides onto the base board. */
export interface DemoBlock {
  readonly type: "demo";
  readonly title: string;
  readonly board: FretboardSpec;
  readonly frames: readonly { readonly caption: string; readonly board: Partial<FretboardSpec> }[];
}

/** A one-octave chromatic strip for semitone and interval explanations. */
export interface ChromaticBlock {
  readonly type: "chromatic";
  /** Starting note (default C). */
  readonly start?: string;
  readonly highlight?: readonly { readonly note: string; readonly role?: "root" | "third" | "fifth" | "tone"; readonly label?: string }[];
  /** Draw arcs between consecutive highlighted notes with semitone counts. */
  readonly showDistances?: boolean;
  readonly caption?: string;
}

/** Visual "stack of thirds" for a triad. */
export interface TriadStackBlock {
  readonly type: "triad-stack";
  readonly chord: ChordSpec;
  readonly caption?: string;
}

/** Side-by-side boards, e.g. major vs minor. */
export interface CompareBlock {
  readonly type: "compare";
  readonly items: readonly { readonly title: string; readonly board: FretboardSpec; readonly note?: string }[];
  readonly caption?: string;
}

/** Free play: tap any note to hear its interval name relative to a root. Not graded. */
export interface IntervalExplorerBlock {
  readonly type: "interval-explorer";
  readonly root: FretPosition;
  readonly range: FretRange;
  readonly caption?: string;
}

/**
 * Free play: tap any position to see its note name, every other place the same pitch occurs
 * (unisons) and, optionally, its octaves. Not graded.
 */
export interface NoteExplorerBlock {
  readonly type: "note-explorer";
  readonly range: FretRange;
  /** Restrict tapping to these strings. */
  readonly strings?: readonly number[];
  /** Also highlight the same note name in other octaves. Default true. */
  readonly showOctaves?: boolean;
  readonly caption?: string;
}

export interface ExerciseBlock {
  readonly type: "exercise";
  readonly exercise: Exercise;
}

export type LessonBlock =
  | TextBlock
  | CalloutBlock
  | FretboardBlock
  | DemoBlock
  | ChromaticBlock
  | TriadStackBlock
  | CompareBlock
  | IntervalExplorerBlock
  | NoteExplorerBlock
  | ExerciseBlock;

export interface LessonStep {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly LessonBlock[];
}

export type CompletionRule =
  /** Every exercise must be solved at least once. */
  | { readonly type: "all-exercises-solved" }
  /** Fraction of exercises answered correctly on the first attempt. */
  | { readonly type: "min-score"; readonly score: number };

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly kind: "lesson" | "assessment";
  readonly estimatedMinutes: number;
  readonly objectives: readonly string[];
  /** Lesson ids within the same course. Soft requirement: the UI recommends, it doesn't lock. */
  readonly prerequisites: readonly string[];
  readonly steps: readonly LessonStep[];
  readonly completion: CompletionRule;
}

export interface CourseModule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly lessons: readonly Lesson[];
}

/** Stages of the long-term curriculum (see src/content/curriculum.ts). */
export type CurriculumStage = "foundation" | "intermediate" | "fluency" | "advanced";

export interface Course {
  /** Stable id: used in URLs and progress keys. Never rename a published course id. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly level: "beginner" | "intermediate" | "advanced";
  readonly stage: CurriculumStage;
  /**
   * Course ids recommended beforehand. Soft: the UI recommends, it never locks, so experienced
   * players can start anywhere.
   */
  readonly prerequisites: readonly string[];
  /** What a student can do after finishing, shown on the course page. */
  readonly outcomes: readonly string[];
  readonly modules: readonly CourseModule[];
}
