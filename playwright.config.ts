import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const ORIGIN = `http://localhost:${PORT}`;

/**
 * E2E runs a real production build against a throwaway PGlite database, with emails written to
 * .data/e2e-mail so tests can follow verification and reset links. Each run starts clean.
 */
export const E2E_MAIL_DIR = ".data/e2e-mail";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: ORIGIN,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Common phone widths: iPhone 13/14 class (390px) and small Android (360px).
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "small-mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: `node -e "require('fs').rmSync('.data/e2e',{recursive:true,force:true});require('fs').rmSync('${E2E_MAIL_DIR}',{recursive:true,force:true})" && npm run build && npx next start -p ${PORT}`,
    url: `${ORIGIN}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: "pglite://.data/e2e",
      BETTER_AUTH_URL: ORIGIN,
      BETTER_AUTH_SECRET: "e2e-only-secret-0123456789-0123456789-0123456789",
      EMAIL_TRANSPORT: "log",
      MAIL_LOG_DIR: E2E_MAIL_DIR,
      UNSAFE_LOCAL_TEST_MODE: "1",
    },
  },
});
