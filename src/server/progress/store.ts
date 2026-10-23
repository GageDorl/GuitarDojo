import "server-only";
import { createHash } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { type IdentifiedEvent, type LessonProgress, type ProgressState, emptyProgress, replay } from "@/lib/progress";
import type { Database } from "@/server/db";
import { progressEvent, progressSnapshot } from "@/server/db/schema";

/**
 * Server-side progress persistence.
 *
 * - The event log is the source of truth. Each event has a client-generated id and the
 *   (user_id, event_id) unique index makes every write idempotent: resending the same events
 *   (retries, flaky networks, two tabs) changes nothing.
 * - After new events arrive, the user's snapshot is rebuilt by replaying ALL their events in
 *   canonical order (time, then id). Devices that uploaded in any order converge to one state.
 * - Writes for one user are serialized by locking their snapshot row.
 */

export interface ProgressResult {
  readonly state: ProgressState;
  readonly eventCount: number;
  readonly inserted: number;
}

function rowToEvent(row: { eventId: string; payload: unknown }): IdentifiedEvent {
  return { ...(row.payload as Omit<IdentifiedEvent, "id">), id: row.eventId } as IdentifiedEvent;
}

export async function getProgress(db: Database, userId: string): Promise<{ state: ProgressState; eventCount: number }> {
  const [row] = await db.select().from(progressSnapshot).where(eq(progressSnapshot.userId, userId));
  if (!row) return { state: emptyProgress(), eventCount: 0 };
  return { state: row.state as ProgressState, eventCount: row.eventCount };
}

export async function appendEvents(db: Database, userId: string, events: readonly IdentifiedEvent[]): Promise<ProgressResult> {
  return db.transaction(async (tx) => {
    await tx
      .insert(progressSnapshot)
      .values({ userId, state: emptyProgress(), eventCount: 0 })
      .onConflictDoNothing({ target: progressSnapshot.userId });
    // Lock this user's snapshot row: concurrent requests for the same user run one at a time.
    const [locked] = await tx.select().from(progressSnapshot).where(eq(progressSnapshot.userId, userId)).for("update");

    let inserted = 0;
    if (events.length > 0) {
      const rows = events.map(({ id, ...payload }) => ({
        userId,
        eventId: id,
        type: payload.type,
        courseId: "courseId" in payload ? payload.courseId : null,
        lessonId: "lessonId" in payload ? payload.lessonId : null,
        payload,
        occurredAt: new Date(payload.at),
      }));
      const result = await tx
        .insert(progressEvent)
        .values(rows)
        .onConflictDoNothing({ target: [progressEvent.userId, progressEvent.eventId] })
        .returning({ eventId: progressEvent.eventId });
      inserted = result.length;
    }

    if (inserted === 0 && locked) {
      return { state: locked.state as ProgressState, eventCount: locked.eventCount, inserted };
    }

    const all = await tx
      .select({ eventId: progressEvent.eventId, payload: progressEvent.payload })
      .from(progressEvent)
      .where(eq(progressEvent.userId, userId))
      .orderBy(asc(progressEvent.occurredAt), asc(progressEvent.eventId));
    const state = replay(all.map(rowToEvent));
    await tx
      .update(progressSnapshot)
      .set({ state, eventCount: all.length, updatedAt: new Date() })
      .where(eq(progressSnapshot.userId, userId));
    return { state, eventCount: all.length, inserted };
  });
}

/** JSON with sorted keys, so equal snapshots always hash the same. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Deterministic id for an import: the same device importing the same progress twice is a no-op. */
export function importEventId(deviceId: string, lessons: Record<string, LessonProgress>): string {
  return `import-${createHash("sha256").update(`${deviceId}\n${canonicalJson(lessons)}`).digest("hex").slice(0, 48)}`;
}

/**
 * Merge progress a visitor made before signing in into their account. Idempotent: retrying with
 * the same device and snapshot inserts nothing. Merging never removes completed lessons or solved
 * exercises (see mergeLesson in src/lib/progress/model.ts).
 */
export async function importSnapshot(
  db: Database,
  userId: string,
  deviceId: string,
  lessons: Record<string, LessonProgress>,
  now = new Date(),
): Promise<ProgressResult> {
  if (Object.keys(lessons).length === 0) {
    const { state, eventCount } = await getProgress(db, userId);
    return { state, eventCount, inserted: 0 };
  }
  const event: IdentifiedEvent = { id: importEventId(deviceId, lessons), type: "snapshot-imported", lessons, at: now.toISOString() };
  return appendEvents(db, userId, [event]);
}
