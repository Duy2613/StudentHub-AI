import { expect, test } from "@playwright/test";
import { completeTextScan, mockTrustPipeline } from "./fixtures/trust";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Focused visual baseline is intentionally Chromium-only");
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Trust input desktop visual baseline", async ({ page }) => {
  await page.goto("/trust");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("trust-input-desktop.png", { animations: "disabled", fullPage: true, maxDiffPixelRatio: 0.05 });
});

test("Trust result, graph and mobile visual baselines", async ({ page }) => {
  await mockTrustPipeline(page);
  await completeTextScan(page);
  await expect(page).toHaveScreenshot("trust-result-desktop.png", { animations: "disabled", fullPage: true, mask: [page.locator("time")], maxDiffPixelRatio: 0.05 });
  const graph = page.locator("section", { has: page.getByRole("heading", { name: "StudentHub TrustGraph" }) });
  await expect(graph).toHaveScreenshot("trustgraph-desktop.png", { animations: "disabled", maxDiffPixelRatio: 0.05 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page).toHaveScreenshot("trust-result-mobile.png", { animations: "disabled", fullPage: true, mask: [page.locator("time")], maxDiffPixelRatio: 0.05 });
});

test("Community and Expert visual baselines", async ({ page }) => {
  await page.goto("/community");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("community-desktop.png", { animations: "disabled", fullPage: true, maxDiffPixelRatio: 0.05 });
  await page.goto("/expert");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("expert-desktop.png", { animations: "disabled", fullPage: true, maxDiffPixelRatio: 0.05 });
});
