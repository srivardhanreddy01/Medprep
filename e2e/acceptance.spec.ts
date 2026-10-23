import { expect, test, type Page } from "@playwright/test";

/**
 * Walks the Phase 1 acceptance criteria end to end: sign up, onboard, paste a question,
 * record an attempt, read the explanation, review flashcards, add a note, see progress,
 * sign out and back in.
 */
const email = `student+${Date.now()}@example.com`;
const password = "correct-horse-42";

const QUESTION = `A 58-year-old woman comes to the clinic because of fatigue, constipation, and "aching bones" for 6 months. Two months ago she passed a kidney stone. She takes no medications or supplements. Laboratory studies show:

Serum calcium 11.6 mg/dL (reference 8.5–10.2)
Serum phosphorus 2.2 mg/dL (reference 2.5–4.5)
Intact PTH 98 pg/mL (reference 10–65)
24-hour urine calcium 340 mg (elevated)

Which of the following is the most likely diagnosis?
A. Humoral hypercalcemia of malignancy
B. Primary hyperparathyroidism
C. Familial hypocalciuric hypercalcemia
D. Vitamin D intoxication
E. Sarcoidosis`;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

test.describe.serial("Phase 1 acceptance", () => {
  test("sign up and onboard", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Test Student");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/onboarding");
    await page.getByLabel("Target exam").selectOption("usmle-step2ck");
    await page.getByLabel("Exam date").fill("2027-03-15");
    await page.getByRole("button", { name: "Start studying" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Preparing for USMLE Step 2 CK")).toBeVisible();
  });

  test("identifier screen blocks patient identifiers", async ({ page }) => {
    await signIn(page);
    await page.goto("/analyze");
    await page.getByLabel("Question stem").fill(`${QUESTION}\nMRN: 12345678`);
    await expect(page.getByText("Remove patient identifiers")).toBeVisible();
    await expect(page.getByRole("button", { name: "Analyze Question" })).toBeDisabled();
  });

  test("paste, attempt, analyze, and read every section", async ({ page }) => {
    await signIn(page);
    await page.goto("/analyze");
    const stem = page.getByLabel("Question stem");
    await stem.click();
    // Simulate a paste of the whole question so it is auto-split.
    await page.evaluate((text) => {
      const el = document.getElementById("stem")!;
      const dt = new DataTransfer();
      dt.setData("text", text);
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }, QUESTION);
    await expect(page.getByRole("textbox", { name: "Choice E" })).toHaveValue("Sarcoidosis");
    await expect(stem).not.toHaveValue(/A\. Humoral/);

    // Independent attempt: choose the tempting distractor with high confidence.
    await page.getByRole("radiogroup", { name: "Your answer" }).getByText("Familial hypocalciuric hypercalcemia").click();
    await page.getByText("high", { exact: true }).click();
    await page.getByRole("button", { name: "Analyze Question" }).click();
    await page.waitForURL(/\/questions\/[0-9a-f-]+$/);

    // Answer tab with integrity labeling
    await expect(page.getByText("AI-inferred answer, not officially verified.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "B. Primary hyperparathyroidism" })).toBeVisible();
    // Attempt graded against AI answer, marked unverified
    await expect(page.getByText("Incorrect", { exact: true })).toBeVisible();
    await expect(page.getByText("Graded against the AI-inferred answer")).toBeVisible();

    await page.getByRole("tab", { name: "Clinical Reasoning" }).click();
    await expect(page.getByRole("heading", { name: "Generalize the learning" })).toBeVisible();
    await expect(page.getByText("decisive").first()).toBeVisible();

    await page.getByRole("tab", { name: "Wrong Options" }).click();
    await expect(page.getByRole("table", { name: "Comparison of answer options" })).toBeVisible();
    // The student's wrong choice is expanded by default.
    await expect(page.getByText("FHH causes low urine calcium")).toBeVisible();
    for (const label of ["A", "B", "C", "D", "E"]) {
      await expect(page.locator("summary").filter({ hasText: new RegExp(`^${label}\\.`) })).toBeVisible();
    }

    await page.getByRole("tab", { name: "Exam Strategy" }).click();
    await expect(page.getByText("Memory aid, not a diagnostic rule.")).toBeVisible();

    await page.getByRole("tab", { name: /Flashcards/ }).click();
    await expect(page.getByLabel("Flashcard", { exact: true })).toHaveCount(5);

    // Notes: AI summary is distinct; add a student note.
    await page.getByRole("tab", { name: /Notes/ }).click();
    await expect(page.getByText("AI-generated")).toBeVisible();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("PTH first");
    await page.getByRole("textbox", { name: "Note", exact: true }).fill("Hypercalcemia: check PTH, then urine calcium for FHH.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("My note")).toBeVisible();
  });

  test("duplicate question is detected", async ({ page }) => {
    await signIn(page);
    await page.goto("/analyze");
    await page.getByLabel("Load a sample question").selectOption("hypercalcemia");
    await page.getByRole("button", { name: "Analyze Question" }).click();
    // Not an exact duplicate (stem differs) but highly similar
    await expect(page.getByText(/looks similar to a question already in your library|already saved this exact question/)).toBeVisible();
  });

  test("review flashcards and see next review date", async ({ page }) => {
    await signIn(page);
    await page.goto("/flashcards/review");
    await expect(page.getByText("5 remaining")).toBeVisible();
    await page.getByRole("button", { name: "Show answer" }).click();
    await page.getByRole("button", { name: /^Good/ }).click();
    await expect(page.getByText("1 done")).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Space");
      await page.keyboard.press("4");
      await expect(page.getByText(`${i + 2} done`)).toBeVisible();
    }
    await page.goto("/flashcards");
    await expect(page.getByText(/· due /).first()).toBeVisible();
  });

  test("dashboard reflects saved activity; notebook retrieves notes; data persists across sign-in", async ({ page }) => {
    await signIn(page);
    const overview = page.getByRole("region", { name: "Overview" });
    await expect(overview.getByText("Questions analyzed").locator("..").locator("..")).toContainText("1");
    await expect(overview).toContainText("0%"); // the one graded attempt was incorrect
    await expect(overview).toContainText("1 day");

    await page.goto("/notebook?q=urine");
    await expect(page.getByRole("heading", { name: "PTH first" })).toBeVisible();

    await page.goto("/questions?result=incorrect");
    await expect(page.getByText(/58-year-old woman/)).toBeVisible();

    // Practice again and get it right
    await page.getByText(/58-year-old woman/).click();
    await page.waitForURL(/\/questions\/[0-9a-f-]+$/);
    await page.getByRole("link", { name: "Practice again" }).click();
    await page.waitForURL(/\/practice$/);
    await page.getByRole("radio", { name: /Primary hyperparathyroidism/ }).check();
    await page.getByRole("button", { name: "Submit answer" }).click();
    await expect(page.getByText("Correct. You chose B.")).toBeVisible();

    await page.goto("/calendar");
    await expect(page.getByText(/done/).first()).toBeVisible();
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Performance Analytics" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).first().click({ force: true });
    await page.waitForURL("**/login");
    await signIn(page);
    await expect(page.getByRole("region", { name: "Overview" })).toContainText("50%");
  });
});
