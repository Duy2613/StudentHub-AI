import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { completeTextScan, mockTrustPipeline } from "./fixtures/trust";

for (const path of ["/trust", "/community", "/expert", "/login", "/profile"]) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  });
}

test("completed Trust result has no serious or critical axe violations", async ({ page }) => {
  await mockTrustPipeline(page);
  await completeTextScan(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
});

test("core Trust controls are keyboard reachable", async ({ page }) => {
  await page.goto("/trust");
  await expect(page.getByRole("tab", { name: "Văn bản" })).toBeVisible();
  await page.keyboard.press("Tab");
  const first = page.locator(":focus");
  await expect(first).toBeVisible();
  await page.getByRole("tab", { name: "Văn bản" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab", { name: "Văn bản" })).toHaveAttribute("aria-selected", "true");
});
