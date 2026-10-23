import { type Page, expect, test } from "@playwright/test";

const COURSE = "/learn/fretboard-foundations";

async function openStep(page: Page, lesson: string, step: number) {
  await page.goto(`${COURSE}/${lesson}`);
  await page.getByRole("button", { name: new RegExp(`^Step ${step}:`) }).click();
}

/** Tap positions written as [string, fret], paging the fret window like a user would on small screens. */
async function tap(page: Page, exerciseId: string, positions: [number, number][]) {
  const card = page.getByTestId(`exercise-${exerciseId}`);
  for (const [s, f] of positions) {
    const cell = card.getByTestId(`fret-${s}-${f}`);
    for (let i = 0; i < 6 && (await cell.count()) === 0; i++) {
      const label = (await card.getByText(/^Frets \d+–\d+/).textContent()) ?? "";
      const [lo] = label.match(/\d+/g)!.map(Number);
      await card.getByRole("button", { name: f < lo! ? "Show lower frets" : "Show higher frets" }).click();
    }
    await cell.click();
  }
  return card;
}

test("home page leads into the first lesson", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("cta").click();
  await expect(page).toHaveURL(/notes-and-semitones/);
  await expect(page.getByRole("heading", { level: 1, name: "Notes and Semitones" })).toBeVisible();
});

test("a student can build a chord and get it validated", async ({ page }) => {
  await openStep(page, "major-triads", 4);
  // Open C: A3 C, D2 E, G open, B1 C, high E open.
  const card = await tap(page, "build-c-major", [
    [5, 3],
    [4, 2],
    [3, 0],
    [2, 1],
    [1, 0],
  ]);
  await card.getByRole("button", { name: "Check" }).click();
  const feedback = card.getByTestId("feedback");
  await expect(feedback).toHaveAttribute("data-correct", "true");
  await expect(feedback).toContainText("That's C major.");
  await expect(card).toHaveAttribute("data-solved", "true");
});

test("an alternate voicing is accepted", async ({ page }) => {
  await openStep(page, "major-triads", 4);
  // Just three notes: C (A3), E (D2), G (G0).
  const card = await tap(page, "build-c-major", [
    [5, 3],
    [4, 2],
    [3, 0],
  ]);
  await card.getByRole("button", { name: "Check" }).click();
  await expect(card.getByTestId("feedback")).toHaveAttribute("data-correct", "true");
});

test("wrong answers get a musical explanation and can be corrected", async ({ page }) => {
  await openStep(page, "major-triads", 4);
  // A minor shape when A major is asked.
  const card = await tap(page, "build-a-major", [
    [5, 0],
    [4, 2],
    [3, 2],
    [2, 1],
    [1, 0],
  ]);
  await card.getByRole("button", { name: "Check" }).click();
  const feedback = card.getByTestId("feedback");
  await expect(feedback).toHaveAttribute("data-correct", "false");
  await expect(feedback).toContainText("Those notes form A minor, not A major.");
  await expect(feedback).toContainText("C is a minor third above A. A major needs a major third: C♯.");
  await expect(card.getByTestId("marker-2-1")).toHaveAttribute("data-state", "incorrect");

  // Move the B-string finger up one fret (per-string selection replaces it) and re-check.
  await card.getByTestId("fret-2-2").click();
  await card.getByRole("button", { name: "Check" }).click();
  await expect(card.getByTestId("feedback")).toHaveAttribute("data-correct", "true");
});

test("progress persists across reloads", async ({ page }) => {
  await openStep(page, "major-triads", 4);
  const card = page.getByTestId("exercise-identify-d");
  await card.getByRole("button", { name: "D major" }).click();
  await expect(card).toHaveAttribute("data-solved", "true");

  await page.reload();
  // The lesson resumes on the step the student was on, with the exercise still solved.
  await expect(page.getByTestId("exercise-identify-d")).toHaveAttribute("data-solved", "true");

  await page.goto(COURSE);
  await expect(page.getByTestId("lesson-link-major-triads")).toHaveAttribute("data-status", "in-progress");
});

test("completing every exercise completes the lesson", async ({ page }) => {
  await openStep(page, "notes-and-semitones", 2);
  await page.getByTestId("exercise-semitones-e-f").getByRole("button", { name: "1 semitone" }).click();
  await page.getByTestId("exercise-semitone-above-b").getByRole("button", { name: "C", exact: true }).click();
  await page.getByTestId("next-step").click();

  const f = await tap(page, "find-f-low-e", [[6, 1]]);
  await f.getByRole("button", { name: "Check" }).click();
  const g = await tap(page, "every-g-0-5", [
    [6, 3],
    [4, 5],
    [3, 0],
  ]);
  await g.getByRole("button", { name: "Check" }).click();
  await expect(g.getByTestId("feedback")).toContainText("You've found 3 of 4 G notes");
  await g.getByTestId("fret-1-3").click();
  await g.getByRole("button", { name: "Check" }).click();
  await expect(g.getByTestId("feedback")).toHaveAttribute("data-correct", "true");
  await page.getByTestId("exercise-enharmonic-a-string").getByRole("button", { name: "B♭" }).click();

  await page.getByTestId("finish-lesson").click();
  await expect(page.getByTestId("lesson-summary")).toContainText("Lesson complete!");
  await page.goto(COURSE);
  await expect(page.getByTestId("lesson-link-notes-and-semitones")).toHaveAttribute("data-status", "completed");
  await expect(page.getByTestId("course-progress")).toHaveText("1 of 7 lessons");
});

test("the fretboard is keyboard operable", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard interaction is a desktop concern");
  await openStep(page, "notes-and-semitones", 3);
  const card = page.getByTestId("exercise-find-f-low-e");
  const first = card.locator('[role="button"][tabindex="0"]');
  await first.focus();
  await page.keyboard.press("ArrowRight"); // open string -> fret 1
  await page.keyboard.press("Enter");
  await card.getByRole("button", { name: "Check" }).click();
  await expect(card.getByTestId("feedback")).toHaveAttribute("data-correct", "true");
});

test("lesson pages never scroll sideways", async ({ page }) => {
  for (const lesson of ["notes-and-semitones", "intervals", "minor-triads", "triads-on-the-fretboard"]) {
    await page.goto(`${COURSE}/${lesson}`);
    for (let step = 1; step <= 3; step++) {
      await page.getByRole("button", { name: new RegExp(`^Step ${step}:`) }).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${lesson} step ${step}`).toBeLessThanOrEqual(0);
    }
  }
});

test("mobile chord exercises use a vertical diagram; necks page through frets", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile presentation only");
  await openStep(page, "major-triads", 4);
  await expect(page.getByTestId("exercise-build-c-major").locator("svg[data-presentation]")).toHaveAttribute(
    "data-presentation",
    "chord",
  );
  await openStep(page, "triads-on-the-fretboard", 3);
  const card = page.getByTestId("exercise-find-a3");
  const windowLabel = card.getByText(/^Frets \d+–\d+/);
  const before = await windowLabel.textContent();
  await card.getByRole("button", { name: "Show lower frets" }).click();
  await expect(windowLabel).not.toHaveText(before!);
  // The 12-fret neck must never shrink to fit the phone: only a window of it is shown.
  expect(before).not.toBe("Frets 0–12");
});
