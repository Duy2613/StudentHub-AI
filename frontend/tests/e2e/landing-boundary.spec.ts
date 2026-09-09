import { expect, test } from "@playwright/test";

test.describe("landing product boundary", () => {
  test("keeps core intelligence navigation without promoting the learning extension", async ({ page }) => {
    await page.goto("/");

    const primaryNav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(primaryNav.getByRole("link", { name: "Kiểm chứng", exact: true })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Cộng đồng", exact: true })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Chuyên gia", exact: true })).toBeVisible();

    await expect(primaryNav.locator("details")).toHaveCount(0);
    await expect(primaryNav.getByRole("link", { name: /Học tập|Learn|Roadmap/i })).toHaveCount(0);
  });

  test("makes Trust the first landing action without fabricated verification metrics", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /HIỂU ĐÚNG\.\s*ĐI XA\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Kiểm tra trước khi tin", exact: true })).toHaveAttribute("href", "/trust");
    await expect(page.getByText("Verified Evidence", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Reality Alignment", { exact: true })).toHaveCount(0);
  });
});
