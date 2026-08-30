import { expect, test } from "@playwright/test";

test.describe("canonical product navigation", () => {
  for (const [path, heading] of [
    ["/trust", "Kiểm tra trước khi bạn tin."],
    ["/community", "Trải nghiệm thật, được đặt trong ngữ cảnh."],
    ["/expert", "Đúng người, đúng phạm vi, đúng bằng chứng."],
  ] as const) {
    test(`${path} renders its product`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }

  test("legacy scam-check redirects to Trust", async ({ page }) => {
    await page.goto("/scam-check");
    await expect(page).toHaveURL(/\/trust$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kiểm tra trước khi bạn tin");
  });

  test("unknown route has a real 404", async ({ page }) => {
    const response = await page.goto("/this-route-must-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("mobile navigation does not create horizontal overflow", async ({ page }) => {
    await page.goto("/trust");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
