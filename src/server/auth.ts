import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type Database, getDb, schema } from "@/server/db";
import { actionEmail, sendEmail } from "@/server/email";
import { getEnv } from "@/server/env";

/**
 * Authentication (Better Auth): email + password, required email verification, password
 * recovery, database-backed rate limiting, server-side sessions in HTTP-only cookies.
 */
export function createAuth(db: Database) {
  const env = getEnv();
  const rateLimited = env.NODE_ENV === "production" || env.AUTH_RATE_LIMIT === "on";
  return betterAuth({
    appName: "Guitar Dojo",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.secret,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      transaction: true,
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
    }),
    user: {
      additionalFields: {
        // Permission role. `input: false` means clients can never set it during sign-up/update.
        role: { type: "string", required: false, defaultValue: "user", input: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !env.registrationOpen,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(
          actionEmail({
            to: user.email,
            subject: "Reset your Guitar Dojo password",
            heading: "Reset your password",
            body: "Someone (hopefully you) asked to reset the password for your Guitar Dojo account. The link expires in one hour.",
            action: "Choose a new password",
            url,
            footer: "If you didn't ask for this, you can ignore this email: your password won't change.",
          }),
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(
          actionEmail({
            to: user.email,
            subject: "Confirm your email for Guitar Dojo",
            heading: "Confirm your email",
            body: "Confirm this address to finish creating your Guitar Dojo account and start syncing your progress. The link expires in 24 hours.",
            action: "Confirm email",
            url,
            footer: "If you didn't create an account, you can ignore this email.",
          }),
        );
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // No cookie cache: every check hits the session table, so sign-out and password resets
      // revoke access immediately (a cache would keep revoked sessions alive for minutes).
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: rateLimited,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-up/email": { window: 60 * 60, max: 5 },
        "/sign-in/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60 * 60, max: 3 },
        "/reset-password": { window: 60 * 15, max: 5 },
        "/send-verification-email": { window: 60 * 60, max: 3 },
        "/change-password": { window: 60 * 15, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
      // Behind Caddy, which replaces (not appends) X-Forwarded-For with the real client address.
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    telemetry: { enabled: false },
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { __guitarDojoAuth?: Promise<Auth> };

export function getAuth(): Promise<Auth> {
  globalForAuth.__guitarDojoAuth ??= getDb().then(createAuth);
  return globalForAuth.__guitarDojoAuth;
}

export function resetAuthForTests() {
  globalForAuth.__guitarDojoAuth = undefined;
}

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: "user" | "admin";
  readonly emailVerified: boolean;
}

/** Validate the session from request headers. The user id comes ONLY from here, never from the client. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string };
  return { id: u.id, email: u.email, name: u.name, role: u.role === "admin" ? "admin" : "user", emailVerified: u.emailVerified };
}
