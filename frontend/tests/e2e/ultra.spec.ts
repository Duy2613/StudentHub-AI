import { expect, test } from "@playwright/test";

test.describe("removed route compatibility", () => {
  test("/ultra redirects to the canonical Evidence Case Lab", async ({ page }) => {
    await page.goto("/ultra");
    await expect(page).toHaveURL(/\/cases$/);
    await expect(page.getByRole("heading", { name: "Một case. Toàn bộ mạng lưới bằng chứng." })).toBeVisible();
  });

  test("removed route remains usable on a compact viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ultra");
    await expect(page).toHaveURL(/\/cases$/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("does not expose the removed visual experience after redirect", async ({ page }) => {
    await page.goto("/ultra");
    await expect(page).toHaveURL(/\/cases$/);
    await expect(page.getByRole("heading", { name: /Trải nghiệm đẳng cấp tối đa/i })).toHaveCount(0);
  });
});
