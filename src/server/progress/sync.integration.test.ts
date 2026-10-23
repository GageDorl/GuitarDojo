/**
 * Client sync engine (ProgressSync) against the real server handlers, database and sessions.
 * Simulates page reloads (new instances sharing storage), lost responses, offline periods and
 * two devices on one account.
 */
import { afterAll, describe, expect, it } from "vitest";
import { type ProgressState, ProgressSync, STORAGE_KEY, getLessonProgress } from "@/lib/progress";
import { resetDbForTests } from "@/server/db";
import { signUpVerified, uniqueEmail } from "@/test/auth";
import { handleGetProgress, handleImport, handlePostEvents } from "./handlers";

afterAll(() => resetDbForTests());

const C = "notes-and-fretboard";
const L = "strings-and-tuning";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem = (k: string) => this.map.get(k) ?? null;
  setItem = (k: string, v: string) => void this.map.set(k, v);
  removeItem = (k: string) => void this.map.delete(k);
}

type Mode = "online" | "offline" | "lose-response";

/** A fetch that routes to the real handlers with this browser's session cookie. */
function browser(cookie: string, storage = new MemoryStorage()) {
  const net = { mode: "online" as Mode, calls: 0 };
  const fetcher = async (path: string, init: RequestInit = {}) => {
    net.calls++;
    if (net.mode === "offline") throw new TypeError("Failed to fetch");
    const headers = new Headers(init.headers);
    headers.set("cookie", cookie);
    headers.set("origin", "http://localhost:3000");
    const request = new Request(`http://localhost:3000${path}`, { ...init, headers });
    const handler = path === "/api/progress" ? handleGetProgress : path === "/api/progress/import" ? handleImport : handlePostEvents;
    const response = await handler(request);
    if (net.mode === "lose-response") throw new TypeError("connection reset");
    return response;
  };
  return { storage, net, open: () => new ProgressSync(storage, fetcher) };
}

const attempts = (state: ProgressState) => getLessonProgress(state, C, L)?.exercises["tap-open-a"]?.attempts ?? 0;
const attemptEvent = (correct: boolean) =>
  ({ type: "exercise-attempted", courseId: C, lessonId: L, exerciseId: "tap-open-a", correct }) as const;

let ip = 0;
const newAccount = () => signUpVerified(uniqueEmail("sync"), undefined, `198.18.0.${++ip}`);

describe("progress sync", () => {
  it("keeps anonymous progress in the original localStorage format", () => {
    const { storage, open } = browser("");
    const sync = open();
    sync.dispatch(attemptEvent(true));
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).lessons[`${C}/${L}`]).toBeDefined();
    expect(sync.getSnapshot().status).toBe("local");
  });

  it("imports anonymous progress on sign-in exactly once, even across a failed attempt", async () => {
    const cookie = await newAccount();
    const device = browser(cookie);
    const anon = device.open();
    anon.dispatch(attemptEvent(true));

    device.net.mode = "offline";
    await anon.setAccount("user");
    expect(device.storage.getItem(STORAGE_KEY)).not.toBeNull(); // kept for retry

    device.net.mode = "online";
    const reloaded = device.open();
    await reloaded.setAccount("user");
    expect(device.storage.getItem(STORAGE_KEY)).toBeNull(); // now safely in the account
    expect(attempts(reloaded.getSnapshot().state)).toBe(1);
    expect(reloaded.getSnapshot().status).toBe("synced");
  });

  it("never double-counts when the server saved events but the response was lost", async () => {
    const cookie = await newAccount();
    const device = browser(cookie);
    const sync = device.open();
    await sync.setAccount("user");
    sync.dispatch(attemptEvent(false));
    sync.dispatch(attemptEvent(true));

    device.net.mode = "lose-response";
    await sync.flush();
    expect(sync.getSnapshot().pending).toBe(2); // still queued: we don't know it arrived

    device.net.mode = "online";
    await sync.flush();
    expect(sync.getSnapshot().pending).toBe(0);
    expect(attempts(sync.getSnapshot().state)).toBe(2);
  });

  it("queues changes while offline and survives a reload", async () => {
    const cookie = await newAccount();
    const device = browser(cookie);
    const first = device.open();
    await first.setAccount("user");
    device.net.mode = "offline";
    first.dispatch(attemptEvent(true));
    await first.flush();
    expect(first.getSnapshot().status).toBe("offline");
    expect(attempts(first.getSnapshot().state)).toBe(1); // applied locally immediately

    device.net.mode = "online";
    const reloaded = device.open();
    await reloaded.setAccount("user");
    expect(reloaded.getSnapshot().pending).toBe(0);
    expect(attempts(reloaded.getSnapshot().state)).toBe(1);
  });

  it("converges across two devices on one account", async () => {
    const cookie = await newAccount();
    const phone = browser(cookie).open();
    const laptop = browser(cookie).open();
    await phone.setAccount("user");
    await laptop.setAccount("user");

    phone.dispatch(attemptEvent(false));
    laptop.dispatch(attemptEvent(true));
    laptop.dispatch({ type: "lesson-completed", courseId: C, lessonId: L });
    await phone.flush();
    await laptop.flush();
    await phone.refresh();
    await laptop.refresh();

    expect(phone.getSnapshot().state.lessons).toEqual(laptop.getSnapshot().state.lessons);
    expect(attempts(phone.getSnapshot().state)).toBe(2);
    expect(getLessonProgress(phone.getSnapshot().state, C, L)?.status).toBe("completed");
  });

  it("stops syncing when the session ends, keeping queued changes for the next sign-in", async () => {
    const device = browser("better-auth.session_token=expired");
    const sync = device.open();
    await sync.setAccount("user");
    sync.dispatch(attemptEvent(true));
    await sync.flush();
    expect(sync.getSnapshot().status).toBe("signed-out");
    expect(sync.getSnapshot().pending).toBe(1);
  });
});
