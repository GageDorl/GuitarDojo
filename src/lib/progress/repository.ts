/**
 * Persistence boundary for progress. Swap LocalProgressRepository for an API-backed
 * implementation once accounts exist; nothing else in the app needs to change.
 */
import { type ProgressEvent, type ProgressState, emptyProgress, parseProgress } from "./model";

export interface ProgressRepository {
  load(): ProgressState;
  save(state: ProgressState): void;
  /** Hook for remote sync: receives every event after it has been applied locally. */
  record?(event: ProgressEvent): void;
}

export const STORAGE_KEY = "guitar-dojo:progress";

export class LocalProgressRepository implements ProgressRepository {
  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem"> | undefined = globalThis.localStorage) {}

  load(): ProgressState {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return raw ? parseProgress(JSON.parse(raw)) : emptyProgress();
    } catch {
      return emptyProgress();
    }
  }

  save(state: ProgressState): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private mode): progress stays in memory for this session.
    }
  }
}
