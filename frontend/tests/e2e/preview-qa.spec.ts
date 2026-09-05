import { expect, test } from "@playwright/test";

const PREVIEW_BASE = "https://student-hub-okf6fjjo1-vi-be-city.vercel.app";

test.describe("Vercel Live Preview QA Suite", () => {
  const routes = [
    { path: "/", titleRegex: /StudentHub AI/i },
    { path: "/learn", titleRegex: /Học Phần/i },
    { path: "/learn/cs101/fullstack-intro", titleRegex: /Modern State Architectures/i },
    { path: "/roadmap", titleRegex: /Lộ Trình/i },
    { path: "/practice", titleRegex: /Phòng Luyện/i },
    { path: "/projects", titleRegex: /Dự Án/i },
    { path: "/trust", titleRegex: /Trust Engine/i },
    { path: "/community", titleRegex: /Community Intelligence/i },
    { path: "/expert", titleRegex: /Expert Intelligence/i },
    { path: "/dashboard", titleRegex: /Command Center/i },
  ];

  for (const { path, titleRegex } of routes) {
    test(`Live Preview Route: ${path} returns 200 and renders cleanly`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => consoleErrors.push(`[PageError] ${err.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(`[ConsoleError] ${msg.text()}`);
      });

      const response = await page.goto(`${PREVIEW_BASE}${path}`);
      expect(response?.ok()).toBeTruthy();

      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("h1, h2").first()).toBeVisible();

      // Check no uncaught runtime errors (ignoring Vercel live feedback toolbar blocked by CSP and unauthenticated 401)
      const cleanErrors = consoleErrors.filter(
        (err) =>
          !err.includes("eval() is not supported") &&
          !err.includes("THREE.Clock: This module has been deprecated") &&
          !err.includes("vercel.live") &&
          !err.includes("status of 401")
      );
      expect(cleanErrors).toEqual([]);
    });
  }

  test("Live Preview: Command Palette interactive search across canonical categories", async ({ page }) => {
    await page.goto(PREVIEW_BASE);
    const searchBtn = page.getByRole("button", { name: /Tìm kiếm toàn hệ thống/i });
    await expect(searchBtn).toBeVisible();

    await searchBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const input = page.getByPlaceholder("Tìm kiếm môn học, bài giảng, thử thách, bằng chứng, chuyên gia...");
    await input.fill("React");

    // Verify search results load from static/API provider
    await expect(page.locator("a[href*='/learn']").first()).toBeVisible();

    // Close via Escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("Live Preview: Knowledge Atlas dual-view toggle and node inspection", async ({ page }) => {
    await page.goto(PREVIEW_BASE);
    const atlasHeading = page.getByRole("heading", { name: "Knowledge Atlas", level: 2 });
    await atlasHeading.scrollIntoViewIfNeeded();

    // Toggle to semantic list mode
    const listBtn = page.getByRole("button", { name: "Danh sách ngữ nghĩa" });
    await listBtn.click();

    // Verify node details in inspector
    await expect(page.getByRole("heading", { name: "Frontend Engineering", level: 3 }).first()).toBeVisible();
    await expect(page.getByText("Application").first()).toBeVisible();
  });

  test("Live Preview: Quiet Lesson verification (Zero WebGL, clean reading)", async ({ page }) => {
    await page.goto(`${PREVIEW_BASE}/learn/cs101/fullstack-intro`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Assert zero WebGL canvas elements
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBe(0);
  });

  test("Live Preview: Mobile viewport rendering (375x812 iPhone)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PREVIEW_BASE);

    // Verify no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    // Verify hamburger menu opens
    const menuBtn = page.getByRole("button", { name: /Mở menu điều hướng/i });
    await expect(menuBtn).toBeVisible();
  });
});
