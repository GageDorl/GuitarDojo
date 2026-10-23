import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getLessonProgress } from "@/lib/progress";
import { noEntitlements, setAccessRulesForTests, setEntitlementProviderForTests } from "@/server/access";
import { getDb, resetDbForTests } from "@/server/db";
import { progressEvent, user } from "@/server/db/schema";
import { signUpVerified, uniqueEmail } from "@/test/auth";
import { handleGetProgress, handleImport, handlePostEvents } from "./handlers";

afterAll(() => resetDbForTests());

const C = "notes-and-fretboard";
const L = "strings-and-tuning";

function req(path: string, options: { cookie?: string; body?: unknown; origin?: string } = {}) {
  const headers = new Headers({ origin: options.origin ?? "http://localhost:3000" });
  if (options.cookie) headers.set("cookie", options.cookie);
  if (options.body !== undefined) headers.set("content-type", "application/json");
  return new Request(`http://localhost:3000${path}`, {
    method: options.body === undefined ? "GET" : "POST",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

const attempt = (id: string, correct = true, extra: Record<string, unknown> = {}) => ({
  id,
  type: "exercise-attempted",
  courseId: C,
  lessonId: L,
  exerciseId: "tap-open-a",
  correct,
  at: "2026-02-01T12:00:00.000Z",
  ...extra,
});

let n = 0;
const ip = () => `192.0.2.${++n}`;

describe("progress API", () => {
  it("requires a session", async () => {
    expect((await handleGetProgress(req("/api/progress"))).status).toBe(401);
    expect((await handlePostEvents(req("/api/progress/events", { body: { events: [attempt("evt-0000001")] } }))).status).toBe(401);
  });

  it("stores events for the session user and is idempotent", async () => {
    const cookie = await signUpVerified(uniqueEmail("api"), undefined, ip());
    const body = { events: [attempt("evt-api-0001", false), attempt("evt-api-0002", true, { at: "2026-02-01T12:01:00.000Z" })] };
    const first = await (await handlePostEvents(req("/api/progress/events", { cookie, body }))).json();
    const again = await (await handlePostEvents(req("/api/progress/events", { cookie, body }))).json();
    expect(first.accepted).toEqual(["evt-api-0001", "evt-api-0002"]);
    expect(again.eventCount).toBe(2);
    expect(getLessonProgress(again.state, C, L)!.exercises["tap-open-a"]).toMatchObject({ attempts: 2, solved: true });

    const fetched = await (await handleGetProgress(req("/api/progress", { cookie }))).json();
    expect(fetched.state).toEqual(again.state);
  });

  it("never trusts a client-supplied user id", async () => {
    const victimEmail = uniqueEmail("victim");
    await signUpVerified(victimEmail, undefined, ip());
    const attacker = await signUpVerified(uniqueEmail("attacker"), undefined, ip());
    const db = await getDb();
    const [victim] = await db.select().from(user).where(eq(user.email, victimEmail));

    const res = await handlePostEvents(req("/api/progress/events", { cookie: attacker, body: { events: [attempt("evt-forged-01", true, { userId: victim!.id })] } }));
    const out = await res.json();
    expect(out.accepted).toEqual([]);
    expect(out.rejected).toEqual([{ id: "evt-forged-01", reason: "invalid event" }]);

    const wrapper = await handlePostEvents(req("/api/progress/events", { cookie: attacker, body: { userId: victim!.id, events: [attempt("evt-forged-02")] } }));
    expect(wrapper.status).toBe(400);

    const victimRows = await db.select().from(progressEvent).where(eq(progressEvent.userId, victim!.id));
    expect(victimRows).toHaveLength(0);
  });

  it("rejects events for content that doesn't exist", async () => {
    const cookie = await signUpVerified(uniqueEmail("content"), undefined, ip());
    const res = await handlePostEvents(
      req("/api/progress/events", {
        cookie,
        body: {
          events: [
            attempt("evt-bad-course", true, { courseId: "no-such-course" }),
            attempt("evt-bad-exercise", true, { exerciseId: "no-such-exercise" }),
            { id: "evt-bad-step01", type: "lesson-visited", courseId: C, lessonId: L, step: 99, at: "2026-02-01T12:00:00.000Z" },
            { id: "evt-cleared01", type: "progress-cleared", at: "2026-02-01T12:00:00.000Z" },
            attempt("evt-good-00001"),
          ],
        },
      }),
    );
    const out = await res.json();
    expect(out.accepted).toEqual(["evt-good-00001"]);
    expect(out.rejected.map((r: { reason: string }) => r.reason)).toEqual(["unknown course", "unknown exercise", "unknown step", "invalid event"]);
  });

  it("rejects cross-origin writes and oversized batches", async () => {
    const cookie = await signUpVerified(uniqueEmail("csrf"), undefined, ip());
    const cross = await handlePostEvents(req("/api/progress/events", { cookie, origin: "https://evil.example", body: { events: [attempt("evt-0000099")] } }));
    expect(cross.status).toBe(403);
    const many = Array.from({ length: 201 }, (_, i) => attempt(`evt-many-${String(i).padStart(4, "0")}`));
    expect((await handlePostEvents(req("/api/progress/events", { cookie, body: { events: many } }))).status).toBe(400);
  });

  it("imports anonymous progress once, dropping unknown content", async () => {
    const cookie = await signUpVerified(uniqueEmail("import"), undefined, ip());
    const snapshot = {
      schemaVersion: 1,
      lessons: {
        [`${C}/${L}`]: {
          status: "completed",
          currentStep: 1,
          startedAt: "2025-12-01T00:00:00.000Z",
          completedAt: "2025-12-01T00:10:00.000Z",
          exercises: {
            "tap-open-a": { attempts: 1, correct: 1, incorrect: 0, firstAttemptCorrect: true, solved: true, lastAttemptAt: "2025-12-01T00:05:00.000Z" },
            "removed-exercise": { attempts: 1, correct: 1, incorrect: 0, firstAttemptCorrect: true, solved: true, lastAttemptAt: "2025-12-01T00:05:00.000Z" },
          },
        },
        "no-such-course/whatever": { status: "completed", currentStep: 0, startedAt: "2025-12-01T00:00:00.000Z", exercises: {} },
      },
    };
    const body = { deviceId: "device-0001-abcd", snapshot };
    const first = await (await handleImport(req("/api/progress/import", { cookie, body }))).json();
    const retry = await (await handleImport(req("/api/progress/import", { cookie, body }))).json();
    expect(first.imported).toBe(true);
    expect(retry.imported).toBe(false);
    expect(Object.keys(retry.state.lessons)).toEqual([`${C}/${L}`]);
    expect(Object.keys(retry.state.lessons[`${C}/${L}`].exercises)).toEqual(["tap-open-a"]);
  });

  it("enforces content access server-side when a lesson isn't free", async () => {
    const cookie = await signUpVerified(uniqueEmail("premium"), undefined, ip());
    const post = async (id: string) =>
      (await handlePostEvents(req("/api/progress/events", { cookie, body: { events: [attempt(id)] } }))).json();

    // During the beta everything is public.
    expect((await post("evt-free-0001")).accepted).toEqual(["evt-free-0001"]);

    // Simulate making this course premium.
    setAccessRulesForTests({ [C]: { course: { kind: "entitlement", products: ["premium"] } } });
    try {
      expect((await post("evt-paid-0001")).rejected).toEqual([{ id: "evt-paid-0001", reason: "forbidden" }]);
      setEntitlementProviderForTests({
        getEntitlements: async () => [{ scope: { kind: "product", productId: "premium" }, source: "subscription" }],
      });
      expect((await post("evt-paid-0002")).accepted).toEqual(["evt-paid-0002"]);
    } finally {
      setAccessRulesForTests();
      setEntitlementProviderForTests(noEntitlements);
    }
  });
});
