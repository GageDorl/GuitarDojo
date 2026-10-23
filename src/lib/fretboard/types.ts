/**
 * Presentation-independent fretboard model.
 *
 * Renderers (horizontal neck, vertical chord diagram, future canvas/3D views) all consume a
 * FretboardModel. Lessons and exercises never talk to renderers directly; they describe *what*
 * to show with a FretboardSpec, which `resolveFretboard` turns into a model.
 */
import type { ChordSpec, FretPosition, FretRange, ScaleSpec, Tuning } from "@/lib/theory";

/** Colour family of a marker. Chord roles map to their own colours; scale tones use "tone". */
export type MarkerRole = "root" | "third" | "fifth" | "seventh" | "tone" | "neutral";

/** Interaction / evaluation state, independent of role. */
export type MarkerState =
  | "default"
  | "selected"
  | "correct"
  | "incorrect"
  /** A required position the student did not select (revealed after answering). */
  | "missed"
  /** Instructional hint: shown faintly to guide the student. */
  | "hint"
  /** De-emphasised context (e.g. the rest of a scale while one note is discussed). */
  | "ghost";

export interface FretMarker {
  readonly position: FretPosition;
  readonly role?: MarkerRole;
  readonly state?: MarkerState;
  /** Text inside the marker (note name, interval, finger number …). */
  readonly label?: string;
  /** Accessible description; defaults to label + position. */
  readonly description?: string;
}

export type StringIndicator = "open" | "muted";

export type LabelMode = "none" | "note" | "pitch" | "interval";

export type Presentation = "neck" | "chord";

export interface FretboardModel {
  readonly tuning: Tuning;
  /** Frets available to the view. Renderers may show a window of this range. */
  readonly range: FretRange;
  readonly markers: readonly FretMarker[];
  /** Indicators drawn beyond the nut (chord-diagram style "o" and "x"). */
  readonly stringIndicators?: Readonly<Partial<Record<number, StringIndicator>>>;
  /** Restrict interaction / emphasis to these strings. */
  readonly activeStrings?: readonly number[];
  /** Highlight a sub-region (e.g. "find every C in frets 0–5"). */
  readonly region?: FretRange;
}

/**
 * Declarative board description used by lesson content and exercises. Everything is plain data
 * so lessons can later live in a CMS or database.
 */
export interface FretboardSpec {
  readonly range?: FretRange;
  /** Presentation per breakpoint. Defaults: neck on both. */
  readonly layout?: { readonly mobile?: Presentation; readonly desktop?: Presentation };
  readonly labels?: LabelMode;
  /** Show a chord: a voicing shape ("x32010") or every chord tone in range when omitted. */
  readonly chord?: ChordSpec & { readonly voicing?: string };
  readonly scale?: ScaleSpec;
  /** Show every occurrence of these notes in range ("G", "C♯"). */
  readonly notes?: readonly string[];
  /** Explicit markers. `note` overrides the label spelling; role/state default to neutral/default. */
  readonly positions?: readonly (FretPosition & {
    readonly role?: MarkerRole;
    readonly state?: MarkerState;
    readonly label?: string;
  })[];
  /** Root used for interval labels when no chord or scale is given. */
  readonly root?: string;
  /** Limit chord tones / scales / notes to these strings and mark them as active. */
  readonly strings?: readonly number[];
  /** Highlight a region of the neck. */
  readonly region?: FretRange;
  /** Set false to draw every marker neutrally (e.g. "tap the root" must not colour-code the answer). */
  readonly roles?: boolean;
  readonly tuning?: string;
}
