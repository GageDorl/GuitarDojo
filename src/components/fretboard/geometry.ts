/**
 * Fretboard geometry, shared by every orientation.
 *
 * Layout is computed in two logical axes, *along* the neck (frets) and *across* it (strings),
 * then mapped to SVG x/y by orientation:
 *  - "neck":  horizontal; along = x, across = y, string 1 (high E) at the top, like tab.
 *  - "chord": vertical chord diagram; along = y (nut at top), across = x, string 6 at the left.
 * One code path draws both, so features added to one presentation work in the other.
 */
import type { Presentation } from "@/lib/fretboard";
import type { FretPosition, FretRange } from "@/lib/theory";

export interface Point {
  readonly x: number;
  readonly y: number;
}

interface Metrics {
  /** Size of one fret slot along the neck. */
  readonly fret: number;
  /** Distance between strings. */
  readonly string: number;
  /** Zone before the first fret wire for open-string markers and ×/○ indicators. */
  readonly openZone: number;
  /** Padding before the open zone (string names on the neck). */
  readonly leadIn: number;
  /** Padding after the last fret. */
  readonly tail: number;
  /** Padding beside the outer strings. */
  readonly sideIn: number;
  /** Space for fret numbers (neck: below; chord: left). */
  readonly gutter: number;
  readonly markerRadius: number;
}

const METRICS: Record<Presentation, Metrics> = {
  neck: { fret: 72, string: 40, openZone: 44, leadIn: 26, tail: 10, sideIn: 22, gutter: 24, markerRadius: 15 },
  chord: { fret: 64, string: 52, openZone: 44, leadIn: 4, tail: 18, sideIn: 30, gutter: 34, markerRadius: 18 },
};

export interface FretboardGeometry {
  readonly presentation: Presentation;
  readonly width: number;
  readonly height: number;
  readonly markerRadius: number;
  /** First fretted slot shown (≥ 1). */
  readonly firstFret: number;
  readonly lastFret: number;
  readonly showsOpen: boolean;
  readonly strings: readonly number[];
  /** Board rectangle (wood). */
  readonly board: { x: number; y: number; width: number; height: number };
  point(along: number, across: number): Point;
  /** Centre of a note position (fret 0 sits in the open zone). */
  noteCenter(pos: FretPosition): Point;
  /** Logical along-coordinate of the wire *after* fret slot f (f = 0 is the nut). */
  wireAlong(f: number): number;
  stringAcross(string: number): number;
  /** Hit-target rectangle for a position. */
  cell(pos: FretPosition): { x: number; y: number; width: number; height: number };
  /** Fret-number label position. */
  fretLabel(fret: number): Point;
  /** String-name label position. */
  stringLabel(string: number): Point;
  /** Rectangle covering a span of frets across all strings, or null when it's outside the view. */
  span(from: number, to: number): { x: number; y: number; width: number; height: number } | null;
}

export function createGeometry(presentation: Presentation, range: FretRange, stringCount = 6): FretboardGeometry {
  const m = METRICS[presentation];
  const showsOpen = range.start === 0;
  const firstFret = Math.max(1, range.start);
  const lastFret = Math.max(firstFret, range.end);
  const slots = lastFret - firstFret + 1;
  const strings = Array.from({ length: stringCount }, (_, i) => i + 1);

  const alongStart = m.leadIn + (presentation === "chord" ? 0 : 0);
  const openZone = showsOpen || presentation === "chord" ? m.openZone : 12;
  const boardAlongStart = alongStart + openZone;
  const alongLength = boardAlongStart + slots * m.fret + m.tail;
  const acrossStart = m.sideIn + (presentation === "chord" ? m.gutter : 0);
  const acrossLength = acrossStart + (stringCount - 1) * m.string + m.sideIn + (presentation === "neck" ? m.gutter : 18);

  const point = (along: number, across: number): Point =>
    presentation === "neck" ? { x: along, y: across } : { x: across, y: along };

  const wireAlong = (f: number) => boardAlongStart + (f - (firstFret - 1)) * m.fret;
  const slotCenter = (fret: number) =>
    fret === 0 ? alongStart + openZone / 2 : boardAlongStart + (fret - firstFret) * m.fret + m.fret / 2;
  const stringAcross = (string: number) =>
    presentation === "neck" ? acrossStart + (string - 1) * m.string : acrossStart + (stringCount - string) * m.string;

  const rect = (along: number, across: number, alongSize: number, acrossSize: number) =>
    presentation === "neck"
      ? { x: along, y: across, width: alongSize, height: acrossSize }
      : { x: across, y: along, width: acrossSize, height: alongSize };

  const boardAcrossStart = acrossStart - m.string * 0.42;
  const boardAcrossSize = (stringCount - 1) * m.string + m.string * 0.84;

  return {
    presentation,
    width: presentation === "neck" ? alongLength : acrossLength,
    height: presentation === "neck" ? acrossLength : alongLength,
    markerRadius: m.markerRadius,
    firstFret,
    lastFret,
    showsOpen,
    strings,
    board: rect(boardAlongStart, boardAcrossStart, slots * m.fret, boardAcrossSize),
    point,
    noteCenter: (pos) => point(slotCenter(pos.fret), stringAcross(pos.string)),
    wireAlong,
    stringAcross,
    cell: (pos) => {
      const size = pos.fret === 0 ? openZone : m.fret;
      const start = pos.fret === 0 ? alongStart : boardAlongStart + (pos.fret - firstFret) * m.fret;
      return rect(start, stringAcross(pos.string) - m.string / 2, size, m.string);
    },
    fretLabel: (fret) =>
      presentation === "neck"
        ? point(slotCenter(fret), acrossStart + (stringCount - 1) * m.string + m.sideIn + 8)
        : point(slotCenter(fret), m.gutter / 2 + 2),
    stringLabel: (string) =>
      presentation === "neck"
        ? point(m.leadIn / 2, stringAcross(string))
        : point(alongLength - 4, stringAcross(string)),
    span: (from, to) => {
      const a = Math.max(from, firstFret);
      const b = Math.min(to, lastFret);
      // Region entirely outside the visible window (e.g. a paged neck on a phone).
      if (b < a && !(from === 0 && showsOpen)) return null;
      const start = from === 0 && showsOpen ? alongStart : boardAlongStart + (a - firstFret) * m.fret;
      const end = boardAlongStart + (b - firstFret + 1) * m.fret;
      return rect(start, boardAcrossStart, end - start, boardAcrossSize);
    },
  };
}

/** Frets that get inlay dots; 12 and 24 get double dots. */
export const INLAY_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
export const DOUBLE_INLAY_FRETS = new Set([12, 24]);

/** Relative string thickness (string 6 thickest). */
export function stringWidth(string: number, presentation: Presentation): number {
  const base = presentation === "chord" ? 1.4 : 1.1;
  return base + (string - 1) * 0.38;
}
