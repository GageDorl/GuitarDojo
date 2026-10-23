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

test("home page leads into the first lesson of the pathway", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("cta").click();
  await expect(page).toHaveURL(/notes-and-fretboard\/strings-and-tuning/);
  await expect(page.getByRole("heading", { level: 1, name: "Your Six Strings" })).toBeVisible();
});

test("the catalog shows the learning path with recommended prerequisites", async ({ page }) => {
  await page.goto("/learn");
  for (const id of ["notes-and-fretboard", "intervals", "fretboard-foundations", "major-minor-scales", "pentatonic-scales", "chord-voicings"]) {
    await expect(page.getByTestId(`course-card-${id}`)).toBeVisible();
  }
  await expect(page.getByTestId("course-card-pentatonic-scales")).toContainText("Recommended first: Major and Minor Scales");
  await expect(page.getByText("Coming later").first()).toBeVisible();
  // Prerequisites recommend, never lock.
  await page.goto("/learn/pentatonic-scales");
  await expect(page.getByTestId("course-prerequisites")).toBeVisible();
  await page.getByTestId("resume").click();
  await expect(page.getByRole("heading", { level: 1, name: "Five-Note Scales" })).toBeVisible();
});

test("learn and home pages map all three learning paths", async ({ page }) => {
  await page.goto("/learn");
  await expect(page.getByTestId("path-card-theory")).toHaveAttribute("data-status", "available");
  await expect(page.getByTestId("path-card-technique")).toHaveAttribute("data-status", "coming-soon");
  await expect(page.getByTestId("path-card-luthiery")).toHaveAttribute("data-status", "coming-soon");
  await page.getByTestId("path-card-luthiery").click();
  await expect(page).toHaveURL(/#path-luthiery/);
  await expect(page.locator("#path-luthiery")).toContainText("Building Your First Electric Guitar");
  await expect(page.locator("#path-technique")).toContainText("Coming soon");
  for (const id of ["keys-and-progressions", "caged-system", "seventh-chords"]) {
    await expect(page.getByTestId(`course-card-${id}`)).toBeVisible();
  }
  await page.goto("/");
  await expect(page.getByTestId("path-card-technique")).toContainText("Coming soon");
});

test("new courses: build a chord from a Roman numeral and play a CAGED shape", async ({ page }) => {
  await page.goto("/learn/keys-and-progressions/roman-numerals");
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  const iv = await tap(page, "build-iv-in-g", [
    [5, 3],
    [4, 2],
    [3, 0],
    [2, 1],
    [1, 0],
  ]);
  await iv.getByRole("button", { name: "Check" }).click();
  await expect(iv.getByTestId("feedback")).toHaveAttribute("data-correct", "true");

  await page.goto("/learn/seventh-chords/major-and-minor-sevenths");
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  const am7 = await tap(page, "build-am7", [
    [5, 0],
    [4, 2],
    [3, 0],
    [2, 1],
    [1, 0],
  ]);
  await am7.getByRole("button", { name: "Check" }).click();
  await expect(am7.getByTestId("feedback")).toHaveAttribute("data-correct", "true");
});

test("a recall drill runs randomized rounds and records a pass", async ({ page }) => {
  await page.goto("/learn/notes-and-fretboard/strings-and-tuning");
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  const drill = page.getByTestId("exercise-name-open-strings");
  await drill.getByTestId("drill-start").click();
  const OPEN = ["E", "A", "D", "G", "B", "E"]; // strings 6..1
  for (let round = 0; round < 6; round++) {
    await expect(drill.getByTestId("drill-round")).toHaveText(`Round ${round + 1} of 6`);
    // The question marker sits on an open string; answer from its string number.
    const marker = drill.locator('[data-testid^="marker-"]').first();
    const string = Number((await marker.getAttribute("data-testid"))!.split("-")[1]);
    await drill.getByRole("button", { name: OPEN[6 - string]!, exact: true }).click();
    if (round < 5) await expect(drill.getByTestId("drill-round")).toHaveText(`Round ${round + 2} of 6`);
  }
  await expect(drill.getByTestId("drill-result")).toHaveAttribute("data-passed", "true");
  await expect(drill).toHaveAttribute("data-solved", "true");
  await page.reload();
  await expect(page.getByTestId("exercise-name-open-strings")).toHaveAttribute("data-solved", "true");
});

test("the note explorer names a tapped note and shows its unisons", async ({ page }) => {
  await page.goto("/learn/notes-and-fretboard/same-note-different-strings");
  await page.getByRole("button", { name: /^Step 2:/ }).click();
  const explorer = page.getByLabel("Note explorer", { exact: true });
  await explorer.getByTestId("fret-4-0").click();
  const info = explorer.getByTestId("note-explorer-info");
  await expect(info).toContainText("This is D3");
  // D3 is also A-string fret 5 and low-E fret 10 (may be outside the window on small phones).
  await expect(info).toContainText("2 other places");
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
  for (const lesson of [
    `${COURSE}/notes-and-semitones`,
    `${COURSE}/triads-on-the-fretboard`,
    "/learn/notes-and-fretboard/sharps-and-flats",
    "/learn/intervals/interval-shapes",
    "/learn/major-minor-scales/transposition",
    "/learn/pentatonic-scales/five-positions",
    "/learn/chord-voicings/barre-chords",
    "/learn/keys-and-progressions/progressions-on-the-neck",
    "/learn/caged-system/caged-sequence",
    "/learn/seventh-chords/moveable-and-extended",
  ]) {
    await page.goto(lesson);
    const steps = await page.getByRole("navigation", { name: "Lesson steps" }).getByRole("button").count();
    for (let step = 1; step <= steps; step++) {
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
