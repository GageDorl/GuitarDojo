import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Database-backed tests start an in-memory PostgreSQL (PGlite) per file; give them room.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "pglite://memory",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-secret-0123456789-0123456789-0123456789",
      EMAIL_TRANSPORT: "log",
      MAIL_LOG_DIR: ".data/test-mail",
    },
  },
});
