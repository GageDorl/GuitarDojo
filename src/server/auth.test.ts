import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, resetDbForTests } from "@/server/db";
import { user } from "@/server/db/schema";
import { authCall, cookiesFrom, latestMail, linkIn, signUpVerified, uniqueEmail } from "@/test/auth";
import { getSessionUser } from "./auth";

afterAll(() => resetDbForTests());

const sessionOf = async (cookie: string) => getSessionUser(new Headers({ cookie }));

describe("registration and email verification", () => {
  it("does not sign in until the email is verified", async () => {
    const email = uniqueEmail("verify");
    const signUp = await authCall("/sign-up/email", { body: { email, password: "correct horse battery", name: "Ada" } });
    expect(signUp.status).toBe(200);
    expect(cookiesFrom(signUp)).not.toContain("session_token");

    const early = await authCall("/sign-in/email", { body: { email, password: "correct horse battery" }, ip: "203.0.113.31" });
    expect(early.status).toBe(403);

    const mail = await latestMail(email, "Confirm your email");
    expect(mail.text).toContain("/api/auth/verify-email?token=");
    const verified = await authCall(linkIn(mail));
    const cookie = cookiesFrom(verified);
    const session = await sessionOf(cookie);
    expect(session).toMatchObject({ email, emailVerified: true, role: "user" });
  });

  it("rejects short passwords", async () => {
    const res = await authCall("/sign-up/email", { body: { email: uniqueEmail("short"), password: "short", name: "X" }, ip: "203.0.113.32" });
    expect(res.status).toBe(400);
  });

  it("never lets a client choose its own role", async () => {
    const email = uniqueEmail("role");
    await authCall("/sign-up/email", { body: { email, password: "correct horse battery", name: "Mallory", role: "admin" }, ip: "203.0.113.33" });
    const db = await getDb();
    const [row] = await db.select().from(user).where(eq(user.email, email));
    expect(row?.role ?? "user").toBe("user");
  });
});

describe("sign in and sign out", () => {
  it("signs in with the right password only, and signs out", async () => {
    const email = uniqueEmail("signin");
    await signUpVerified(email);
    const wrong = await authCall("/sign-in/email", { body: { email, password: "wrong password!!" }, ip: "203.0.113.40" });
    expect(wrong.status).toBe(401);

    const ok = await authCall("/sign-in/email", { body: { email, password: "correct horse battery" }, ip: "203.0.113.40" });
    expect(ok.status).toBe(200);
    const cookie = cookiesFrom(ok);
    expect((await sessionOf(cookie))?.email).toBe(email);

    const out = await authCall("/sign-out", { body: {}, cookie, ip: "203.0.113.40" });
    expect(out.status).toBe(200);
    expect(await sessionOf(cookie)).toBeNull();
  });

  it("rejects a forged session cookie", async () => {
    expect(await sessionOf("better-auth.session_token=forged.value")).toBeNull();
  });
});

describe("password recovery", () => {
  it("resets the password via the emailed link and revokes old sessions", async () => {
    const email = uniqueEmail("reset");
    const oldCookie = await signUpVerified(email);

    const request = await authCall("/request-password-reset", { body: { email, redirectTo: "/reset-password" }, ip: "203.0.113.50" });
    expect(request.status).toBe(200);
    const link = linkIn(await latestMail(email, "Reset your Guitar Dojo password"));
    const redirect = await authCall(link, { ip: "203.0.113.50" });
    expect(redirect.status).toBe(302);
    const token = new URL(redirect.headers.get("location")!, "http://localhost:3000").searchParams.get("token");
    expect(token).toBeTruthy();

    const reset = await authCall("/reset-password", { body: { newPassword: "a brand new passphrase", token }, ip: "203.0.113.50" });
    expect(reset.status).toBe(200);
    expect(await sessionOf(oldCookie)).toBeNull();

    const oldPw = await authCall("/sign-in/email", { body: { email, password: "correct horse battery" }, ip: "203.0.113.51" });
    expect(oldPw.status).toBe(401);
    const newPw = await authCall("/sign-in/email", { body: { email, password: "a brand new passphrase" }, ip: "203.0.113.51" });
    expect(newPw.status).toBe(200);

    // Tokens are single-use.
    const replay = await authCall("/reset-password", { body: { newPassword: "yet another passphrase", token }, ip: "203.0.113.52" });
    expect(replay.status).toBe(400);
  });

  it("does not reveal whether an email is registered", async () => {
    const res = await authCall("/request-password-reset", { body: { email: uniqueEmail("nobody"), redirectTo: "/reset-password" }, ip: "203.0.113.53" });
    expect(res.status).toBe(200);
  });
});

describe("rate limiting", () => {
  it("throttles repeated sign-in attempts from one address", async () => {
    const email = uniqueEmail("ratelimit");
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await authCall("/sign-in/email", { body: { email, password: "wrong password!!" }, ip: "198.51.100.77" });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(5)).toEqual([429, 429]);
    // A different address is unaffected.
    const other = await authCall("/sign-in/email", { body: { email, password: "wrong password!!" }, ip: "198.51.100.78" });
    expect(other.status).toBe(401);
  });
});
