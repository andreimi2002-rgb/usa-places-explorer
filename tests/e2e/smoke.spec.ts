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
    await page.goto("/places/jacksonville-fl/directory?topic=sports&q=jaguars");
    await expect(page.getByTestId("result-count")).toContainText(/of \d+/);
    const cards = page.getByTestId("entity-card");
    await expect(cards.getByRole("heading", { name: "Jacksonville Jaguars", exact: true })).toHaveCount(1);
    await expect(cards.getByRole("heading", { name: /IKEA/ })).toHaveCount(0);

    await page.goto("/places/jacksonville-fl/directory?topic=housing-lifestyle");
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
      await box.fill("everbank stadium");
      await expect(page.getByRole("option").first()).toContainText("EverBank Stadium");
      await box.press("ArrowDown");
      await box.press("Enter");
      await expect(page).toHaveURL(/\/entities\/everbank-stadium$/);
    }
  });

  test("entity page separates verified facts from pending items and cites sources", async ({ page }, info) => {
    await page.goto("/entities/ikea-jacksonville");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("IKEA Jacksonville");
    await expect(page.getByTestId("infobox")).toContainText("7801 Gate Parkway");
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

  test("county pages show seat, website, CDPs and place boundaries; GNIS places are listed", async ({ page }, info) => {
    await page.goto("/places/duval-county-fl");
    await expect(page.getByTestId("county-seat").getByRole("link", { name: "Jacksonville" })).toBeVisible();
    await expect(page.getByTestId("county-website")).toContainText("coj.net");
    await expect(page.getByTestId("area-map").locator("a[href='/places/atlantic-beach-fl'] path")).toHaveCount(1);
    await page.screenshot({ path: `test-results/screens/${info.project.name}-duval.png`, fullPage: true });

    await page.goto("/places/jacksonville-fl");
    await expect(page.getByTestId("related-geography")).toContainText("County seat of");
    await expect(page.getByTestId("named-places")).toContainText("inside the city limits");

    await page.goto("/places/jacksonville-fl/localities?type=community");
    await expect(page.getByTestId("locality-table").locator("tbody tr").first()).toBeVisible();

    await page.goto("/places/leon-county-fl");
    await expect(page.getByTestId("county-seat")).toContainText("Tallahassee");
  });

  test("rich entity pages: Wikipedia summary, photo, infobox, map, nearby; brands on the city page", async ({ page }, info) => {
    await page.goto("/entities/st-johns-town-center");
    await expect(page.getByTestId("wikipedia-summary")).toContainText("open-air mall");
    await expect(page.getByText(/CC BY-SA 4\.0/).first()).toBeVisible();
    await expect(page.getByTestId("infobox")).toContainText("2005");
    await expect(page.getByTestId("area-map")).toBeVisible();
    await expect(page.getByTestId("nearby").getByTestId("entity-card").first()).toBeVisible();
    await page.screenshot({ path: `test-results/screens/${info.project.name}-rich-entity.png`, fullPage: true });

    await page.goto("/entities/mcdonalds");
    await expect(page.getByTestId("brand-presence")).toContainText("Jacksonville");

    await page.goto("/places/jacksonville-fl");
    await expect(page.getByTestId("best-known-brands").getByRole("link", { name: /McDonald's/ })).toBeVisible();
    await page.screenshot({ path: `test-results/screens/${info.project.name}-jacksonville-rich.png`, fullPage: true });
  });

  test("best-known places and brands are highlighted on city and state pages", async ({ page }, info) => {
    await page.goto("/places/jacksonville-fl");
    await expect(page.getByTestId("highlights").getByTestId("entity-card")).toHaveCount(6);
    await expect(page.getByTestId("best-known-brands").getByRole("link").first()).toBeVisible();
    await page.goto("/places/florida");
    await expect(page.getByTestId("highlights").getByTestId("entity-card").first()).toBeVisible();
    await expect(page.getByTestId("best-known-brands").getByRole("link")).toHaveCount(10);
    await page.screenshot({ path: `test-results/screens/${info.project.name}-florida-highlights.png`, fullPage: false });
  });

  test("life sim preview: six cities with real wages, take-home pay and hurricane odds", async ({ page }, info) => {
    await page.goto("/play/cities?job=29-1141");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Registered Nurses");
    await expect(page.getByTestId("city-card")).toHaveCount(6);
    await expect(page.getByTestId("city-card").first()).toContainText("Take-home");
    await page.getByRole("link", { name: "Software Developers" }).click();
    await expect(page).toHaveURL(/job=15-1252/);
    await page.screenshot({ path: `test-results/screens/${info.project.name}-play-cities.png`, fullPage: true });
  });

  test("life sim: start a life, get a job, fish, age up, and the save survives a reload", async ({ page }, info) => {
    await page.goto("/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page.getByTestId("city-option")).toHaveCount(6);
    await page.getByTestId("name-input").fill("Test Player");
    await page.getByTestId("city-option").filter({ hasText: "Tallahassee" }).click();
    await page.getByTestId("start-life").click();
    await expect(page.getByTestId("life-name")).toHaveText("Test Player");
    await expect(page.getByTestId("life-status")).toContainText("Age 18");
    await page.screenshot({ path: `test-results/screens/${info.project.name}-play-start.png`, fullPage: true });

    await page.getByRole("button", { name: "Jobs", exact: true }).click();
    await expect(page.getByTestId("job-row").first()).toBeVisible();
    await page.getByTestId("job-row").first().getByRole("button", { name: /Apply/ }).click();
    await expect(page.getByTestId("toast")).toBeVisible();

    await page.getByRole("button", { name: "Outdoors", exact: true }).click();
    await page.getByRole("button", { name: /Buy fishing license/ }).click();
    await page.getByTestId("spot").filter({ hasText: "Lake Talquin" }).getByRole("button", { name: "Fish" }).click();
    await expect(page.getByTestId("toast")).toContainText("Lake Talquin");
    await page.screenshot({ path: `test-results/screens/${info.project.name}-play-outdoors.png`, fullPage: true });

    await page.getByTestId("age-up").click();
    await expect(page.getByTestId("life-status")).toContainText(/Age 19|died/);
    await page.reload();
    await expect(page.getByTestId("life-name").or(page.getByTestId("obituary"))).toBeVisible();
    await expect(page.getByTestId("life-status")).toContainText("Age 19");
  });

  test("unknown pages return 404", async ({ page }) => {
    const r1 = await page.goto("/entities/does-not-exist");
    expect(r1?.status()).toBe(404);
    const r2 = await page.goto("/places/does-not-exist");
    expect(r2?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Not found");
  });

  test("no horizontal overflow on key pages", async ({ page }) => {
    for (const path of ["/", "/play", "/places/florida", "/places/jacksonville-fl", "/places/jacksonville-fl/directory", "/entities/jacksonville-jaguars", "/coverage"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
