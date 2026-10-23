"use client";

import { type ReactNode, createContext, useContext, useState, useSyncExternalStore } from "react";
import {
  LocalProgressRepository,
  type ProgressEvent,
  type ProgressRepository,
  type ProgressState,
  STORAGE_KEY,
  emptyProgress,
  progressReducer,
} from "@/lib/progress";

/** Distributive Omit so each event variant keeps its own fields. */
type WithoutTimestamp<T> = T extends unknown ? Omit<T, "at"> : never;
export type ProgressEventInput = WithoutTimestamp<ProgressEvent>;

class ProgressStore {
  private state: ProgressState;
  private listeners = new Set<() => void>();

  constructor(private readonly repo: ProgressRepository) {
    this.state = repo.load();
  }

  getSnapshot = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    // Keep tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        this.state = this.repo.load();
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  dispatch = (input: ProgressEventInput) => {
    const event = { ...input, at: new Date().toISOString() } as ProgressEvent;
    this.state = progressReducer(this.state, event);
    this.repo.save(this.state);
    this.repo.record?.(event);
    this.listeners.forEach((l) => l());
  };
}

const SERVER_STATE = emptyProgress();

interface ProgressContextValue {
  readonly store: ProgressStore | null;
}

const ProgressContext = createContext<ProgressContextValue>({ store: null });

export function ProgressProvider({ children }: { children: ReactNode }) {
  // Created lazily on the client only; the server renders with empty progress.
  const [store] = useState(() => (typeof window === "undefined" ? null : new ProgressStore(new LocalProgressRepository())));
  return <ProgressContext.Provider value={{ store }}>{children}</ProgressContext.Provider>;
}

const noopSubscribe = () => () => {};

export function useProgress(): {
  progress: ProgressState;
  dispatch: (event: ProgressEventInput) => void;
} {
  const { store } = useContext(ProgressContext);
  const progress = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getSnapshot ?? (() => SERVER_STATE),
    () => SERVER_STATE,
  );
  return { progress, dispatch: store?.dispatch ?? (() => {}) };
}
