/**
 * Client-side progress store with optional account sync. Framework-free (React wraps it in
 * ProgressProvider), with storage and fetch injected so it can be unit-tested.
 *
 * Anonymous visitors: events update a snapshot kept in localStorage, exactly as before accounts.
 *
 * Signed-in students:
 *  1. Every event gets a random id and goes into a persisted OUTBOX, and is applied locally at
 *     once (the UI never waits for the network).
 *  2. The outbox is flushed to POST /api/progress/events in batches. The server stores events
 *     idempotently by id, so retries after timeouts can't double-count.
 *  3. The server answers with its canonical snapshot (all devices' events replayed in time
 *     order). Local state = server snapshot + events still in the outbox.
 *  4. On sign-in, progress made anonymously on this device is imported once (idempotent on the
 *     server by device id + content hash), then the anonymous copy is cleared.
 *  5. When the tab regains focus, the latest snapshot is fetched, which picks up other devices.
 */
import {
  type IdentifiedEvent,
  type ProgressEvent,
  type ProgressState,
  emptyProgress,
  hasProgress,
  parseProgress,
  progressReducer,
} from "./model";
import { STORAGE_KEY } from "./repository";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export type SyncStatus =
  /** Anonymous: saved on this device only. */
  | "local"
  /** Signed in, everything saved to the account. */
  | "synced"
  | "syncing"
  /** Signed in, but the server couldn't be reached; changes are queued. */
  | "offline"
  /** The session ended; changes are queued until the same account signs in again. */
  | "signed-out";

export interface SyncSnapshot {
  readonly state: ProgressState;
  readonly status: SyncStatus;
  readonly pending: number;
  readonly userId: string | null;
}

export type EventInput = ProgressEvent extends infer E ? (E extends unknown ? Omit<E, "at"> : never) : never;

export const DEVICE_KEY = "guitar-dojo:device-id";
const accountKey = (userId: string) => `guitar-dojo:progress:account:${userId}`;
const BATCH = 100;

function randomId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

interface AccountCache {
  readonly state: ProgressState;
  readonly outbox: readonly IdentifiedEvent[];
}

export class ProgressSync {
  private state: ProgressState;
  private outbox: IdentifiedEvent[] = [];
  private userId: string | null = null;
  private status: SyncStatus = "local";
  private listeners = new Set<() => void>();
  private snapshot: SyncSnapshot;
  private flushing: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = 2000;

  constructor(
    private readonly storage: KeyValueStorage | undefined,
    private readonly fetcher: Fetch,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.state = this.readAnonymous();
    this.snapshot = this.makeSnapshot();
  }

  // ----- subscription (useSyncExternalStore) ----------------------------------------------

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  private emit() {
    this.snapshot = this.makeSnapshot();
    this.listeners.forEach((l) => l());
  }

  private makeSnapshot(): SyncSnapshot {
    return { state: this.state, status: this.status, pending: this.outbox.length, userId: this.userId };
  }

  // ----- storage -----------------------------------------------------------------------------

  private read(key: string): unknown {
    try {
      const raw = this.storage?.getItem(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }

  private write(key: string, value: unknown) {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: progress stays in memory (and on the server when signed in).
    }
  }

  private readAnonymous(): ProgressState {
    return parseProgress(this.read(STORAGE_KEY));
  }

  private deviceId(): string {
    const existing = this.read(DEVICE_KEY);
    if (typeof existing === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const id = randomId().replace(/[^A-Za-z0-9_-]/g, "");
    this.write(DEVICE_KEY, id);
    return id;
  }

  private persist() {
    if (this.userId) this.write(accountKey(this.userId), { state: this.state, outbox: this.outbox } satisfies AccountCache);
    else this.write(STORAGE_KEY, this.state);
  }

  // ----- dispatch -----------------------------------------------------------------------------

  dispatch = (input: EventInput) => {
    const event = { ...input, at: this.now().toISOString() } as ProgressEvent;
    this.state = progressReducer(this.state, event);
    if (this.userId && event.type !== "progress-cleared" && event.type !== "snapshot-imported") {
      this.outbox.push({ ...event, id: randomId() } as IdentifiedEvent);
      this.scheduleFlush(400);
    }
    this.persist();
    this.emit();
  };

  // ----- account lifecycle ----------------------------------------------------------------

  /** Called whenever the session changes. `null` = signed out (or session expired). */
  async setAccount(userId: string | null): Promise<void> {
    if (userId === this.userId) return;
    if (!userId) {
      // Keep the account cache (and its outbox) so queued changes sync on the next sign-in.
      this.userId = null;
      this.outbox = [];
      this.state = this.readAnonymous();
      this.status = "local";
      this.emit();
      return;
    }
    this.userId = userId;
    const cache = this.read(accountKey(userId)) as AccountCache | undefined;
    this.outbox = Array.isArray(cache?.outbox) ? [...cache.outbox] : [];
    this.state = cache?.state ? parseProgress(cache.state) : emptyProgress();
    this.status = "syncing";
    this.emit();
    await this.importAnonymous();
    await this.refresh();
    if (this.outbox.length) await this.flush();
  }

  /** Before an explicit sign-out: push queued changes, then forget this account's local copy. */
  async signOutCleanup(): Promise<void> {
    if (!this.userId) return;
    try {
      await this.flush();
    } catch {
      // Best effort; anything unsent stays in the cache only if we keep it, which we don't on
      // shared computers. The server already has everything that was acknowledged.
    }
    try {
      this.storage?.removeItem(accountKey(this.userId));
    } catch {
      // ignore
    }
  }

  private async importAnonymous() {
    const anonymous = this.readAnonymous();
    if (!hasProgress(anonymous)) return;
    try {
      const res = await this.fetcher("/api/progress/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId: this.deviceId(), snapshot: { schemaVersion: anonymous.schemaVersion, lessons: anonymous.lessons } }),
      });
      if (res.status === 401) return this.markSignedOut();
      if (!res.ok) throw new Error(`import failed: ${res.status}`);
      const body = (await res.json()) as { state: ProgressState };
      this.applyServer(body.state);
      // Imported (or already imported earlier): this device's anonymous copy is now in the account.
      try {
        this.storage?.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch {
      this.status = "offline";
      this.emit();
    }
  }

  /** Another tab changed anonymous progress in localStorage: adopt it. */
  reloadAnonymous() {
    if (this.userId) return;
    this.state = this.readAnonymous();
    this.emit();
  }

  /** Fetch the canonical snapshot (picks up progress from other devices). */
  async refresh(): Promise<void> {
    if (!this.userId) return;
    try {
      const res = await this.fetcher("/api/progress", { headers: { accept: "application/json" } });
      if (res.status === 401) return this.markSignedOut();
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
      const body = (await res.json()) as { state: ProgressState };
      this.applyServer(body.state);
      if (!this.outbox.length) this.status = "synced";
    } catch {
      this.status = "offline";
    }
    this.persist();
    this.emit();
  }

  private applyServer(server: ProgressState) {
    // Local view = server truth + whatever hasn't been acknowledged yet.
    this.state = this.outbox.reduce<ProgressState>(progressReducer, parseProgress(server));
  }

  private markSignedOut() {
    this.status = "signed-out";
    this.emit();
  }

  private scheduleFlush(delay: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delay);
  }

  /** Send queued events. Safe to call any time; concurrent calls share one in-flight request. */
  flush(): Promise<void> {
    if (!this.flushing) {
      this.flushing = this.doFlush().finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  private async doFlush(): Promise<void> {
    while (this.userId && this.outbox.length) {
      const batch = this.outbox.slice(0, BATCH);
      this.status = "syncing";
      this.emit();
      let res: Response;
      try {
        res = await this.fetcher("/api/progress/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ events: batch }),
        });
      } catch {
        return this.retryLater();
      }
      if (res.status === 401) return this.markSignedOut();
      if (res.status >= 500 || res.status === 429) return this.retryLater();
      if (!res.ok) {
        // A 4xx for the batch means it can never succeed as sent; drop it rather than loop forever.
        this.outbox = this.outbox.slice(batch.length);
        continue;
      }
      const body = (await res.json()) as { state: ProgressState };
      const sent = new Set(batch.map((e) => e.id));
      this.outbox = this.outbox.filter((e) => !sent.has(e.id));
      this.applyServer(body.state);
      this.retryDelay = 2000;
      this.persist();
    }
    if (this.userId) this.status = "synced";
    this.emit();
  }

  private retryLater() {
    this.status = "offline";
    this.emit();
    this.scheduleFlush(this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 60_000);
  }
}
