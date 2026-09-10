import { expect, test } from "@playwright/test";

test.describe("Academic Cinematic Closure & Runtime Evidence Suite", () => {
  test("Command Palette: full keyboard navigation, search, and focus restoration", async ({ page }) => {
    await page.goto("/");
    // Search button exists and has Ctrl+K hint
    const searchBtn = page.getByRole("button", { name: /Tìm kiếm toàn hệ thống/i });
    await expect(searchBtn).toBeVisible();

    // Trigger via click
    await searchBtn.click();
    const searchDialog = page.getByRole("dialog");
    await expect(searchDialog).toBeVisible();

    // Focus is trapped in input
    const searchInput = page.getByPlaceholder("Tìm kiếm tình huống, bằng chứng, chuyên gia...");
    await expect(searchInput).toBeFocused();

    // Search the current canonical product index.
    await searchInput.fill("Trust");
    await expect(searchDialog.locator("a[href='/trust']").first()).toBeVisible();

    // Close via Escape and verify focus restoration
    await page.keyboard.press("Escape");
    await expect(searchDialog).not.toBeVisible();
    await expect(searchBtn).toBeFocused();
  });

  test("Evidence matrix: semantic relationship states remain readable", async ({ page }) => {
    await page.goto("/");
    const evidenceChapter = page.locator("#evidence-chapter");
    await evidenceChapter.scrollIntoViewIfNeeded();
    await expect(evidenceChapter).toBeVisible();
    await expect(evidenceChapter.getByRole("heading", { level: 2, name: /Bằng chứng có quan hệ đa chiều/i })).toBeVisible();
    await expect(evidenceChapter.getByRole("region", { name: "Minh họa quan hệ bằng chứng" })).toBeVisible();
    await expect(evidenceChapter.getByText("Hỗ trợ", { exact: true })).toBeVisible();
    await expect(evidenceChapter.getByText("Mâu thuẫn", { exact: true })).toBeVisible();
    await expect(evidenceChapter.getByText("Chưa rõ", { exact: true })).toBeVisible();
  });

  test("Retired learning URLs resolve to the canonical public product", async ({ page }) => {
    await page.goto("/learn/cs101/fullstack-intro");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: /Hiểu đúng\.\s*Đi xa\./i })).toBeVisible();

    // The retired route must not reintroduce a hidden interactive runtime.
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBe(0);
  });

  test("Console cleanliness and runtime stability across all primary surfaces", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(`[PageError] ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[ConsoleError] ${msg.text()}`);
      }
    });

    const routes = [
      "/",
      "/learn",
      "/learn/cs101/fullstack-intro",
      "/roadmap",
      "/practice",
      "/projects",
      "/trust",
      "/community",
      "/expert",
      "/dashboard",
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await page.waitForLoadState("domcontentloaded");
    }

    // Filter out expected environment notices like React dev eval warning
    const uncaughtErrors = consoleErrors.filter(
      (err) =>
        !err.includes("eval() is not supported") &&
        !err.includes("THREE.Clock: This module has been deprecated") &&
        !err.includes("status of 401")
    );
    expect(uncaughtErrors).toEqual([]);
  });

  test("Public surface navigation remains stable across repeated cycles", async ({ page }) => {
    const routes = ["/", "/trust", "/community", "/expert"];
    for (let i = 0; i < 4; i++) {
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState("domcontentloaded");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    }

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify page is fully operational and responsive
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Real Performance & CWV Navigation Timing Measurement", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");
      const fcp = paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadEvent: Math.round(nav.loadEventEnd - nav.startTime),
        fcp: Math.round(fcp),
      };
    });

    console.log(`[PERF_TIMING] / domContentLoaded: ${timing.domContentLoaded}ms, loadEvent: ${timing.loadEvent}ms, FCP: ${timing.fcp}ms`);
    expect(timing.domContentLoaded).toBeGreaterThan(0);
    expect(timing.domContentLoaded).toBeLessThan(5000);
  });
});
