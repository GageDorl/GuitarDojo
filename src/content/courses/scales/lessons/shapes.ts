/**
 * One-octave scale shapes from a root on the low E string (frets relative to the root fret r).
 * Shared by several scale lessons. The content-integrity tests check that each shape spells the
 * right scale in every key.
 */
import type { FretPosition } from "@/lib/theory";

/** Major: 1 2 3 on low E (r, r+2, r+4), 4 5 6 on A (r, r+2, r+4), 7 8 on D (r+1, r+2). */
export function majorShape(r: number): FretPosition[] {
  return [
    { string: 6, fret: r },
    { string: 6, fret: r + 2 },
    { string: 6, fret: r + 4 },
    { string: 5, fret: r },
    { string: 5, fret: r + 2 },
    { string: 5, fret: r + 4 },
    { string: 4, fret: r + 1 },
    { string: 4, fret: r + 2 },
  ];
}

/** Natural minor: 1 2 ♭3 on low E (r, r+2, r+3), 4 5 ♭6 on A (r, r+2, r+3), ♭7 8 on D (r, r+2). */
export function minorShape(r: number): FretPosition[] {
  return [
    { string: 6, fret: r },
    { string: 6, fret: r + 2 },
    { string: 6, fret: r + 3 },
    { string: 5, fret: r },
    { string: 5, fret: r + 2 },
    { string: 5, fret: r + 3 },
    { string: 4, fret: r },
    { string: 4, fret: r + 2 },
  ];
}
