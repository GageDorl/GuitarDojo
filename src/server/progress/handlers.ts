import "server-only";
import { type SessionUser, getSessionUser } from "@/server/auth";
import { authorizeLesson } from "@/server/access";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { appendEvents, getProgress, importSnapshot } from "./store";
import {
  type Rejection,
  contentError,
  eventsRequestSchema,
  importRequestSchema,
  sanitizeImportedLessons,
  toIdentified,
  wireEventSchema,
} from "./validation";

/**
 * Progress API. Every handler derives the user from the session cookie; request bodies can't
 * name a user. Route files in src/app/api/progress/* just delegate here (and tests call these
 * directly with real Request objects).
 */

const MAX_BODY_BYTES = 512 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const error = (status: number, message: string) => json({ error: message }, status);

/** Defence in depth against cross-site requests (cookies are also SameSite=Lax). */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(getEnv().BETTER_AUTH_URL).origin;
}

async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return { ok: false, response: error(413, "Request too large") };
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { ok: false, response: error(413, "Request too large") };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: error(400, "Invalid JSON") };
  }
}

async function requireUser(request: Request): Promise<SessionUser | Response> {
  const user = await getSessionUser(request.headers);
  return user ?? error(401, "Sign in to sync progress");
}

/** GET /api/progress: the signed-in user's current progress snapshot. */
export async function handleGetProgress(request: Request): Promise<Response> {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { state, eventCount } = await getProgress(await getDb(), user.id);
  return json({ state, eventCount });
}

/** POST /api/progress/events: append events (idempotent by event id) and return the new snapshot. */
export async function handlePostEvents(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return error(403, "Cross-origin request rejected");
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = eventsRequestSchema.safeParse(body.value);
  if (!parsed.success) return error(400, "Expected { events: [...] } with 1–200 events");

  const accepted = [];
  const rejected: Rejection[] = [];
  for (const raw of parsed.data.events) {
    const event = wireEventSchema.safeParse(raw);
    const rawId = typeof raw === "object" && raw && "id" in raw && typeof raw.id === "string" ? raw.id : "unknown";
    if (!event.success) {
      rejected.push({ id: rawId, reason: "invalid event" });
      continue;
    }
    const problem = contentError(event.data);
    if (problem) {
      rejected.push({ id: event.data.id, reason: problem });
      continue;
    }
    const access = await authorizeLesson(event.data.courseId, event.data.lessonId, async () => user);
    if (!access.allowed) {
      rejected.push({ id: event.data.id, reason: "forbidden" });
      continue;
    }
    accepted.push(toIdentified(event.data));
  }

  const result = await appendEvents(await getDb(), user.id, accepted);
  return json({
    state: result.state,
    eventCount: result.eventCount,
    accepted: accepted.map((e) => e.id),
    rejected,
  });
}

/** POST /api/progress/import: merge anonymous local progress into the account (idempotent). */
export async function handleImport(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return error(403, "Cross-origin request rejected");
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = importRequestSchema.safeParse(body.value);
  if (!parsed.success) return error(400, "Invalid import");

  const lessons = sanitizeImportedLessons(parsed.data.snapshot.lessons);
  for (const key of Object.keys(lessons)) {
    const [courseId, lessonId] = key.split("/") as [string, string];
    const access = await authorizeLesson(courseId, lessonId, async () => user);
    if (!access.allowed) delete lessons[key];
  }
  const result = await importSnapshot(await getDb(), user.id, parsed.data.deviceId, lessons);
  return json({ state: result.state, eventCount: result.eventCount, imported: result.inserted > 0 });
}
