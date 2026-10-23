/**
 * Helpers for exercising Better Auth through its real HTTP handler, as a browser would.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getAuth } from "@/server/auth";

const ORIGIN = "http://localhost:3000";

export interface CallOptions {
  readonly method?: "GET" | "POST";
  readonly body?: unknown;
  readonly cookie?: string;
  readonly ip?: string;
}

export async function authCall(pathOrUrl: string, options: CallOptions = {}): Promise<Response> {
  const auth = await getAuth();
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${ORIGIN}/api/auth${pathOrUrl}`;
  const headers = new Headers({ origin: ORIGIN, "x-forwarded-for": options.ip ?? "203.0.113.10" });
  if (options.body !== undefined) headers.set("content-type", "application/json");
  if (options.cookie) headers.set("cookie", options.cookie);
  return auth.handler(
    new Request(url, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }),
  );
}

/** Turn Set-Cookie headers into a Cookie request header. */
export function cookiesFrom(response: Response, previous = ""): string {
  const jar = new Map(previous.split("; ").filter(Boolean).map((c) => c.split("=") as [string, string]));
  for (const set of response.headers.getSetCookie()) {
    const [pair] = set.split(";");
    const eq = pair!.indexOf("=");
    const name = pair!.slice(0, eq);
    const value = pair!.slice(eq + 1);
    if (value === "" || /max-age=0/i.test(set)) jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

interface LoggedMail {
  to: string;
  subject: string;
  text: string;
}

/** Most recent logged email to `to` whose subject contains `subject`. */
export async function latestMail(to: string, subject: string): Promise<LoggedMail> {
  const dir = process.env.MAIL_LOG_DIR ?? ".data/test-mail";
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort().reverse();
  for (const file of files) {
    const mail = JSON.parse(await readFile(path.join(dir, file), "utf8")) as LoggedMail;
    if (mail.to === to && mail.subject.includes(subject)) return mail;
  }
  throw new Error(`No email to ${to} with subject containing "${subject}"`);
}

export function linkIn(mail: LoggedMail): string {
  const match = /https?:\/\/\S+/.exec(mail.text);
  if (!match) throw new Error("No link in email");
  return match[0];
}

export const uniqueEmail = (label: string) => `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

/** Register and verify an account, returning a signed-in Cookie header. */
export async function signUpVerified(email: string, password = "correct horse battery", ip = "203.0.113.20"): Promise<string> {
  const signUp = await authCall("/sign-up/email", { body: { email, password, name: "Test Student" }, ip });
  if (!signUp.ok) throw new Error(`sign-up failed: ${signUp.status} ${await signUp.text()}`);
  const verify = await authCall(linkIn(await latestMail(email, "Confirm")), { ip });
  const cookie = cookiesFrom(verify);
  if (!cookie.includes("session_token")) throw new Error(`verification did not sign in (${verify.status})`);
  return cookie;
}
