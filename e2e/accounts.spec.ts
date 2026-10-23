import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { type Page, expect as baseExpect, test } from "@playwright/test";

// Auth flows hash passwords (deliberately slow) on one shared in-process test database. When the
// whole suite runs in parallel that can take several seconds, so allow more time than lesson tests.
test.describe.configure({ timeout: 90_000 });
const expect = baseExpect.configure({ timeout: 20_000 });

const MAIL_DIR = ".data/e2e-mail";
const PASSWORD = "correct horse battery staple";

// Each test gets its own client address so auth rate limits (on in production builds) apply per test.
test.use({ extraHTTPHeaders: { "x-forwarded-for": `10.${rand()}.${rand()}.${rand()}` } });
function rand() {
  return Math.floor(Math.random() * 250) + 1;
}

const uniqueEmail = (label: string, project: string) =>
  `${label}-${project}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

async function mailLink(to: string, subject: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const files = readdirSync(MAIL_DIR, { withFileTypes: true })
      .filter((f) => f.isFile() && f.name.endsWith(".json"))
      .map((f) => f.name)
      .sort()
      .reverse();
    for (const file of files) {
      let mail: { to: string; subject: string; text: string };
      try {
        mail = JSON.parse(readFileSync(path.join(MAIL_DIR, file), "utf8"));
      } catch {
        continue; // still being written
      }
      if (mail.to === to && mail.subject.includes(subject)) return /https?:\/\/\S+/.exec(mail.text)![0];
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`no "${subject}" email for ${to}`);
}

const LESSON = "/learn/notes-and-fretboard/strings-and-tuning";

async function solveStringOne(page: Page) {
  await page.goto(LESSON);
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  const card = page.getByTestId("exercise-which-is-string-1");
  await card.getByRole("button", { name: "The thinnest string (high E)" }).click();
  await expect(card).toHaveAttribute("data-solved", "true");
}

async function signUpAndVerify(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E Student");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // Password hashing on a shared test database can be slow when many tests run in parallel.
  await expect(page).toHaveURL(/check-email/, { timeout: 20_000 });
  await page.goto(await mailLink(email, "Confirm your email"));
  await expect(page).toHaveURL(/\/account\?verified=1/);
  await expect(page.getByTestId("sync-status")).toHaveAttribute("data-status", "synced");
}

test("lessons work without an account", async ({ page }) => {
  await solveStringOne(page);
  await expect(page.getByTestId("header-sign-in")).toBeVisible();
});

test("sign-up imports anonymous progress and syncs across devices", async ({ page, browser }, info) => {
  const email = uniqueEmail("sync", info.project.name);
  await solveStringOne(page); // anonymous progress on "device 1"
  await signUpAndVerify(page, email);

  // Imported into the account.
  await page.goto(LESSON);
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  await expect(page.getByTestId("exercise-which-is-string-1")).toHaveAttribute("data-solved", "true");

  // "Device 2": a fresh browser with no local data.
  const device2 = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `10.200.${rand()}.${rand()}` } });
  const page2 = await device2.newPage();
  await page2.goto("/sign-in");
  await page2.getByLabel("Email").fill(email);
  await page2.getByLabel("Password").fill(PASSWORD);
  await page2.getByRole("button", { name: "Sign in" }).click();
  await expect(page2.getByTestId("header-account")).toBeVisible();
  await page2.goto(LESSON);
  await page2.getByRole("button", { name: /^Step 2:/ }).click();
  await expect(page2.getByTestId("exercise-which-is-string-1")).toHaveAttribute("data-solved", "true");

  // Progress made on device 2 shows up on device 1.
  const order = page2.getByTestId("exercise-open-string-order");
  await order.getByRole("button", { name: "E A D G B E" }).click();
  await expect(order).toHaveAttribute("data-solved", "true");
  await page2.goto("/account");
  await expect(page2.getByTestId("sync-status")).toHaveAttribute("data-status", "synced");
  await device2.close();

  await page.goto(LESSON);
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  await expect(page.getByTestId("exercise-open-string-order")).toHaveAttribute("data-solved", "true");

  // Signing out removes this account's progress from the device (shared computers).
  await page.goto("/account");
  await page.getByTestId("sign-out").click();
  await expect(page.getByTestId("header-sign-in")).toBeVisible();
  await page.goto(LESSON);
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  await expect(page.getByTestId("exercise-open-string-order")).toHaveAttribute("data-solved", "false");
});

test("unverified accounts can't sign in", async ({ page }, info) => {
  const email = uniqueEmail("unverified", info.project.name);
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  // Password hashing on a shared test database can be slow when many tests run in parallel.
  await expect(page).toHaveURL(/check-email/, { timeout: 20_000 });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Please confirm your email first")).toBeVisible();
  await expect(page.getByTestId("header-sign-in")).toBeVisible();
});

test("password recovery", async ({ page }, info) => {
  const email = uniqueEmail("recover", info.project.name);
  await signUpAndVerify(page, email);
  await page.getByTestId("sign-out").click();
  await expect(page.getByTestId("header-sign-in")).toBeVisible();

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");
  await page.goto(await mailLink(email, "Reset your Guitar Dojo password"));
  await expect(page).toHaveURL(/reset-password\?token=/);
  await page.getByLabel("New password", { exact: true }).fill("a completely new passphrase");
  await page.getByLabel("Confirm new password").fill("a completely new passphrase");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL(/sign-in\?reset=1/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("a completely new passphrase");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("header-account")).toBeVisible();
});

test("the health check reports the database", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
