import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Ultra Experience Lab", () => {
  test("loads one isolated 3D scene and opens the keyboard-accessible command palette", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/ultra");
    await expect(page.getByRole("heading", { name: /Trải nghiệm đẳng cấp tối đa/i })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.getByRole("button", { name: /Mở Command Palette/i }).click();
    await expect(page.getByRole("dialog", { name: "Ultra Command Palette" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Ultra Command Palette" })).toHaveCount(0);
    await page.waitForTimeout(4500);
    expect(pageErrors).toEqual([]);
  });

  test("uses the static fallback when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ultra");
    await expect(page.getByRole("heading", { name: /Trải nghiệm đẳng cấp tối đa/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-ultra-motion", "still");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("keeps the lab usable on a compact touch viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ultra");
    await expect(page.getByRole("heading", { name: /Trải nghiệm đẳng cấp tối đa/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-ultra-motion", "performance");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("passes the serious and critical accessibility gate", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ultra");
    // The provider applies the reduced-motion preference in a client effect;
    // wait for that state and the initial card reveal to settle before taking
    // the accessibility snapshot (otherwise Axe can sample a mid-fade color).
    await expect(page.locator("html")).toHaveAttribute("data-ultra-motion", "still");
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  });
});
