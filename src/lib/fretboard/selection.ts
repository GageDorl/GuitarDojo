/**
 * Selection state for interactive fretboards, as a pure reducer so it can be unit-tested and
 * reused by any renderer.
 */
import { type FretPosition, samePosition } from "@/lib/theory";

/**
 * - single:     at most one position (pick one note)
 * - per-string: at most one position per string, like a playable chord; tapping another fret on
 *               the same string moves the finger
 * - multi:      any number of positions (find every C …)
 */
export type SelectionMode = "single" | "per-string" | "multi";

export interface SelectionState {
  readonly positions: readonly FretPosition[];
}

export type SelectionAction =
  | { type: "toggle"; position: FretPosition }
  | { type: "clear-string"; string: number }
  | { type: "clear" }
  | { type: "set"; positions: readonly FretPosition[] };

export const EMPTY_SELECTION: SelectionState = { positions: [] };

export function selectionReducer(mode: SelectionMode, state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "clear":
      return EMPTY_SELECTION;
    case "set":
      return { positions: [...action.positions] };
    case "clear-string":
      return { positions: state.positions.filter((p) => p.string !== action.string) };
    case "toggle": {
      const exists = state.positions.some((p) => samePosition(p, action.position));
      if (exists) return { positions: state.positions.filter((p) => !samePosition(p, action.position)) };
      if (mode === "single") return { positions: [action.position] };
      if (mode === "per-string") {
        return { positions: [...state.positions.filter((p) => p.string !== action.position.string), action.position] };
      }
      return { positions: [...state.positions, action.position] };
    }
  }
}

export function isSelected(state: SelectionState, pos: FretPosition): boolean {
  return state.positions.some((p) => samePosition(p, pos));
}
