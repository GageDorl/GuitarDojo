import "server-only";
import { z } from "zod";

/**
 * Server configuration, validated once on first use (not at import time, so `next build` works
 * without production secrets). Every secret comes from the environment; see .env.example.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /**
     * postgres://user:pass@host:5432/db in production.
     * pglite://<dir> (or pglite://memory) for local development and tests without Docker.
     */
    DATABASE_URL: z.string().min(1).default("pglite://.data/pglite"),
    /** Public origin, e.g. https://dojo.gagedorl.com. Used for links in emails and CSRF checks. */
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    /** At least 32 random characters. Generate with: openssl rand -base64 48 */
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    /** "smtp" sends real email. "log" writes emails to .data/mail and the console (development only). */
    EMAIL_TRANSPORT: z.enum(["smtp", "log"]).default("log"),
    EMAIL_FROM: z.string().default("Guitar Dojo <no-reply@localhost>"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    /** true for implicit TLS (port 465); false uses STARTTLS when the server offers it. */
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    /** "open" allows sign-up (only if email delivery works); "closed" disables it. */
    AUTH_REGISTRATION: z.enum(["open", "closed"]).default("open"),
    /** Rate limiting is always on in production; tests may turn it off. */
    AUTH_RATE_LIMIT: z.enum(["on", "off"]).default("on"),
    MAIL_LOG_DIR: z.string().default(".data/mail"),
    /**
     * ONLY for automated tests of a production build on a developer machine (Playwright): allows
     * PGlite and logged emails under NODE_ENV=production. Never set this on a server.
     */
    UNSAFE_LOCAL_TEST_MODE: z.enum(["0", "1"]).default("0"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production" || env.UNSAFE_LOCAL_TEST_MODE === "1") return;
    if (!env.BETTER_AUTH_SECRET) {
      ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "is required in production" });
    }
    if (env.DATABASE_URL.startsWith("pglite:")) {
      ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must be a postgres:// URL in production" });
    }
    if (!env.BETTER_AUTH_URL.startsWith("https://") && !env.BETTER_AUTH_URL.startsWith("http://localhost")) {
      ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "must use https in production" });
    }
    if (env.EMAIL_TRANSPORT === "smtp" && !env.SMTP_HOST) {
      ctx.addIssue({ code: "custom", path: ["SMTP_HOST"], message: "is required when EMAIL_TRANSPORT=smtp" });
    }
  });

export type ServerEnv = z.infer<typeof schema> & {
  /** Sign-up is only possible when email verification and password recovery can actually be delivered. */
  readonly registrationOpen: boolean;
  readonly secret: string;
};

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server configuration: ${details}`);
  }
  const env = parsed.data;
  const testMode = env.UNSAFE_LOCAL_TEST_MODE === "1";
  if (testMode && env.NODE_ENV === "production") {
    console.warn("[env] UNSAFE_LOCAL_TEST_MODE=1: production safety checks are OFF. Never use this on a server.");
  }
  const emailWorks = env.EMAIL_TRANSPORT === "smtp" || env.NODE_ENV !== "production" || testMode;
  if (env.NODE_ENV === "production" && env.AUTH_REGISTRATION === "open" && !emailWorks) {
    console.warn("[auth] Registration is closed: EMAIL_TRANSPORT must be smtp in production.");
  }
  cached = {
    ...env,
    registrationOpen: env.AUTH_REGISTRATION === "open" && emailWorks,
    // Development-only fallback secret. Production refuses to start without a real one (see superRefine).
    secret: env.BETTER_AUTH_SECRET ?? "development-only-secret-do-not-use-in-production-0123456789",
  };
  return cached;
}

/** For tests: forget the cached configuration after changing process.env. */
export function resetEnvForTests() {
  cached = undefined;
}
