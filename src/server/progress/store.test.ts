import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { type IdentifiedEvent, getLessonProgress } from "@/lib/progress";
import type { Database } from "@/server/db";
import { progressEvent, progressSnapshot } from "@/server/db/schema";
import { freshDb, insertUser } from "@/test/db";
import { appendEvents, getProgress, importEventId, importSnapshot } from "./store";

const C = "notes-and-fretboard";
const L = "strings-and-tuning";

let db: Database;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await freshDb());
  await insertUser(db, "alice");
  await insertUser(db, "bob");
});
afterEach(() => close());

const attempt = (id: string, at: string, correct: boolean, exerciseId = "tap-open-a"): IdentifiedEvent => ({
  id,
  type: "exercise-attempted",
  courseId: C,
  lessonId: L,
  exerciseId,
  correct,
  at,
});

describe("progress store", () => {
  it("applies the migrations and starts empty", async () => {
    const { state, eventCount } = await getProgress(db, "alice");
    expect(eventCount).toBe(0);
    expect(state.lessons).toEqual({});
  });

  it("is idempotent: resending the same events changes nothing", async () => {
    const events = [attempt("evt-0000001", "2026-01-01T10:00:00.000Z", false), attempt("evt-0000002", "2026-01-01T10:01:00.000Z", true)];
    const first = await appendEvents(db, "alice", events);
    const second = await appendEvents(db, "alice", events);
    expect(first.inserted).toBe(2);
    expect(second.inserted).toBe(0);
    expect(second.state).toEqual(first.state);
    expect(second.eventCount).toBe(2);
    const record = getLessonProgress(second.state, C, L)!.exercises["tap-open-a"]!;
    expect(record).toMatchObject({ attempts: 2, correct: 1, incorrect: 1, firstAttemptCorrect: false, solved: true });
    const rows = await db.select().from(progressEvent).where(eq(progressEvent.userId, "alice"));
    expect(rows).toHaveLength(2);
  });

  it("converges regardless of the order devices upload in", async () => {
    const phone = [attempt("phone-00001", "2026-01-01T10:00:00.000Z", false)];
    const laptop = [attempt("laptop-0001", "2026-01-01T09:00:00.000Z", true)];
    await appendEvents(db, "alice", phone);
    const a = await appendEvents(db, "alice", laptop);
    await appendEvents(db, "bob", laptop);
    const b = await appendEvents(db, "bob", phone);
    expect(a.state.lessons).toEqual(b.state.lessons);
    // The laptop attempt happened first, so the first attempt was correct, whatever the upload order.
    expect(getLessonProgress(a.state, C, L)!.exercises["tap-open-a"]!.firstAttemptCorrect).toBe(true);
  });

  it("keeps users' progress separate", async () => {
    await appendEvents(db, "alice", [attempt("evt-0000001", "2026-01-01T10:00:00.000Z", true)]);
    expect((await getProgress(db, "bob")).state.lessons).toEqual({});
    // The same event id from another user is a different event.
    const bob = await appendEvents(db, "bob", [attempt("evt-0000001", "2026-01-01T10:00:00.000Z", false)]);
    expect(bob.inserted).toBe(1);
  });

  it("serializes concurrent writes for one user without losing events", async () => {
    const batches = Array.from({ length: 8 }, (_, i) => [attempt(`evt-concur-${i}`, `2026-01-01T10:00:0${i}.000Z`, true)]);
    await Promise.all(batches.map((b) => appendEvents(db, "alice", b)));
    const { state, eventCount } = await getProgress(db, "alice");
    expect(eventCount).toBe(8);
    expect(getLessonProgress(state, C, L)!.exercises["tap-open-a"]!.attempts).toBe(8);
  });

  it("can rebuild the snapshot from the event log", async () => {
    await appendEvents(db, "alice", [attempt("evt-0000001", "2026-01-01T10:00:00.000Z", true)]);
    const before = await getProgress(db, "alice");
    await db.delete(progressSnapshot).where(eq(progressSnapshot.userId, "alice"));
    const rebuilt = await appendEvents(db, "alice", [attempt("evt-0000002", "2026-01-01T11:00:00.000Z", true)]);
    expect(rebuilt.eventCount).toBe(2);
    expect(getLessonProgress(rebuilt.state, C, L)!.exercises["tap-open-a"]!.attempts).toBe(2);
    expect(before.eventCount).toBe(1);
  });
});

describe("anonymous progress import", () => {
  const anonymous = {
    [`${C}/${L}`]: {
      status: "completed" as const,
      currentStep: 1,
      startedAt: "2025-12-01T00:00:00.000Z",
      completedAt: "2025-12-01T00:10:00.000Z",
      exercises: {
        "tap-open-a": { attempts: 1, correct: 1, incorrect: 0, firstAttemptCorrect: true, solved: true, lastAttemptAt: "2025-12-01T00:05:00.000Z" },
      },
    },
  };

  it("merges once per device and snapshot, even if retried", async () => {
    const first = await importSnapshot(db, "alice", "device-abc123", anonymous);
    const retry = await importSnapshot(db, "alice", "device-abc123", anonymous);
    expect(first.inserted).toBe(1);
    expect(retry.inserted).toBe(0);
    expect(getLessonProgress(retry.state, C, L)).toMatchObject({ status: "completed", completedAt: "2025-12-01T00:10:00.000Z" });
    expect(importEventId("device-abc123", anonymous)).toBe(importEventId("device-abc123", JSON.parse(JSON.stringify(anonymous))));
  });

  it("never loses account progress or completion when merging", async () => {
    await appendEvents(db, "alice", [attempt("evt-0000001", "2026-01-01T10:00:00.000Z", false, "which-is-string-1")]);
    const merged = await importSnapshot(db, "alice", "device-xyz789", anonymous);
    const lesson = getLessonProgress(merged.state, C, L)!;
    expect(lesson.status).toBe("completed");
    expect(Object.keys(lesson.exercises).sort()).toEqual(["tap-open-a", "which-is-string-1"]);
  });

  it("ignores empty imports", async () => {
    const result = await importSnapshot(db, "alice", "device-empty01", {});
    expect(result.inserted).toBe(0);
    expect(result.eventCount).toBe(0);
  });
});
