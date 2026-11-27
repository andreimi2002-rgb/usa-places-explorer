import { expect, test } from "@playwright/test";

test.describe("America 360 smoke", () => {
  test("Home → Florida → Duval → Jacksonville → entity, with back/forward", async ({ page }, info) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("America");
    await expect(page.getByTestId("stat-counties")).toContainText("67");
    await page.screenshot({ path: `test-results/screens/${info.project.name}-home.png`, fullPage: true });

    await page.getByRole("link", { name: /Explore Florida/ }).click();
    await expect(page).toHaveURL(/\/places\/florida$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Florida");
    await expect(page.getByTestId("child-areas").getByRole("link")).toHaveCount(67);
    await page.screenshot({ path: `test-results/screens/${info.project.name}-florida.png`, fullPage: true });

    await page.getByTestId("child-areas").getByRole("link", { name: /Duval County/ }).click();
    await expect(page).toHaveURL(/\/places\/duval-county-fl$/);
    await expect(page.getByTestId("county-municipalities").getByRole("link")).toHaveCount(5);

    await page.getByTestId("county-municipalities").getByRole("link", { name: /^Jacksonville\b(?! Beach)/ }).click();
    await expect(page).toHaveURL(/\/places\/jacksonville-fl$/);
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Duval County");
    await expect(page.getByTestId("key-facts")).toContainText("2025");
    await expect(page.getByText("CC BY-SA 4.0")).toBeVisible();
    await page.screenshot({ path: `test-results/screens/${info.project.name}-jacksonville.png`, fullPage: true });

    await page.getByRole("link", { name: /Directory \(/ }).click();
    await expect(page).toHaveURL(/\/places\/jacksonville-fl\/directory$/);
    await page.getByTestId("entity-card").first().click();
    await expect(page).toHaveURL(/\/entities\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/directory$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/places\/jacksonville-fl$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/directory$/);
  });

  test("directory filters produce shareable URLs and honest empty states", async ({ page }) => {
    await page.goto("/places/jacksonville-fl/directory?topic=sports");
    await expect(page.getByTestId("result-count")).toContainText(/of \d+/);
    const cards = page.getByTestId("entity-card");
    await expect(cards.getByRole("heading", { name: "Jacksonville Jaguars", exact: true })).toHaveCount(1);
    await expect(cards.getByRole("heading", { name: /IKEA/ })).toHaveCount(0);

    await page.goto("/places/jacksonville-fl/directory?topic=automotive");
    await expect(page.getByText("No documented entries match these filters.")).toBeVisible();
    await expect(page.getByText(/not yet documented, not that none exist/)).toBeVisible();

    await page.goto("/places/jacksonville-fl/directory");
    await page.locator("main form[aria-label=Directory]").getByLabel("Search", { exact: true }).fill("museum");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/q=museum/);
    await expect(page.getByTestId("entity-card").filter({ hasText: "Cummer Museum" })).toHaveCount(1);
  });

  test("search page and autocomplete", async ({ page, isMobile }) => {
    await page.goto("/search?q=jaguars");
    await expect(page.getByTestId("search-results").getByRole("link").first()).toContainText("Jacksonville Jaguars");
    await page.goto("/search?q=zzqqxx");
    await expect(page.getByText("No matching records in the current dataset.")).toBeVisible();

    if (!isMobile) {
      await page.goto("/");
      const box = page.getByRole("combobox");
      await box.fill("everbank");
      await expect(page.getByRole("option").first()).toContainText("EverBank Stadium");
      await box.press("ArrowDown");
      await box.press("Enter");
      await expect(page).toHaveURL(/\/entities\/everbank-stadium$/);
    }
  });

  test("entity page separates verified facts from pending items and cites sources", async ({ page }, info) => {
    await page.goto("/entities/ikea-jacksonville");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("IKEA Jacksonville");
    await expect(page.getByTestId("fact-table")).toContainText("7801 Gate Parkway");
    await expect(page.getByTestId("entity-relations")).toContainText("IKEA");
    await expect(page.getByTestId("pending-review")).toContainText("Southside");
    await expect(page.getByTestId("source-list")).toContainText("official website");
    await page.screenshot({ path: `test-results/screens/${info.project.name}-entity.png`, fullPage: true });

    await page.goto("/entities/american-alligator");
    await expect(page.getByText("Precise locations are intentionally not published")).toBeVisible();
  });

  test("coverage, topics and sources render real counts", async ({ page }) => {
    await page.goto("/coverage?area=florida");
    await expect(page.getByTestId("universe-table")).toContainText("67");
    await expect(page.getByTestId("coverage-matrix").locator("tbody tr")).toHaveCount(24);
    await page.goto("/topics");
    await expect(page.getByTestId("domain-list").locator(":scope > li")).toHaveCount(24);
    await page.goto("/sources");
    await expect(page.getByTestId("sources-dataset")).toContainText("Gazetteer");
  });

  test("unknown pages return 404", async ({ page }) => {
    const r1 = await page.goto("/entities/does-not-exist");
    expect(r1?.status()).toBe(404);
    const r2 = await page.goto("/places/does-not-exist");
    expect(r2?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Not found");
  });

  test("no horizontal overflow on key pages", async ({ page }) => {
    for (const path of ["/", "/places/florida", "/places/jacksonville-fl", "/places/jacksonville-fl/directory", "/entities/jacksonville-jaguars", "/coverage"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
