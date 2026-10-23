"use client";

import { type ReactNode, createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { type EventInput, ProgressSync, type ProgressState, STORAGE_KEY, type SyncSnapshot, emptyProgress } from "@/lib/progress";
import { useSession } from "@/lib/auth-client";

/** Kept for existing callers: an event without its timestamp. */
export type ProgressEventInput = EventInput;

const SERVER_SNAPSHOT: SyncSnapshot = { state: emptyProgress(), status: "local", pending: 0, userId: null };

interface ProgressContextValue {
  readonly sync: ProgressSync | null;
}

const ProgressContext = createContext<ProgressContextValue>({ sync: null });

export function ProgressProvider({ children }: { children: ReactNode }) {
  // Created on the client only; the server renders with empty progress.
  const [sync] = useState(() =>
    typeof window === "undefined" ? null : new ProgressSync(window.localStorage, (input, init) => fetch(input, { ...init, credentials: "same-origin" })),
  );
  const { data: session, isPending } = useSession();
  const userId = session?.user.id ?? null;

  // Follow the session: sign-in switches to the account (importing anonymous progress once).
  useEffect(() => {
    if (!sync || isPending) return;
    void sync.setAccount(userId);
  }, [sync, userId, isPending]);

  // Pick up progress from other devices when the tab comes back, and retry when back online.
  useEffect(() => {
    if (!sync) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync.refresh().then(() => sync.flush());
    };
    const onOnline = () => void sync.flush();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync.reloadAnonymous();
    };
    window.addEventListener("storage", onStorage);
    const onHide = () => {
      if (document.visibilityState === "hidden") void sync.flush();
    };
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("storage", onStorage);
    };
  }, [sync]);

  return <ProgressContext.Provider value={{ sync }}>{children}</ProgressContext.Provider>;
}

const noopSubscribe = () => () => {};

export function useProgress(): {
  progress: ProgressState;
  dispatch: (event: ProgressEventInput) => void;
} {
  const { sync } = useContext(ProgressContext);
  const snapshot = useSyncExternalStore(sync?.subscribe ?? noopSubscribe, sync?.getSnapshot ?? (() => SERVER_SNAPSHOT), () => SERVER_SNAPSHOT);
  return { progress: snapshot.state, dispatch: sync?.dispatch ?? (() => {}) };
}

/** Sync status for UI ("Saved to your account", "Offline: will sync"). */
export function useSyncStatus(): SyncSnapshot & { readonly signOutCleanup: () => Promise<void> } {
  const { sync } = useContext(ProgressContext);
  const snapshot = useSyncExternalStore(sync?.subscribe ?? noopSubscribe, sync?.getSnapshot ?? (() => SERVER_SNAPSHOT), () => SERVER_SNAPSHOT);
  return { ...snapshot, signOutCleanup: () => sync?.signOutCleanup() ?? Promise.resolve() };
}
