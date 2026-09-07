import { expect, test } from "@playwright/test";

test.describe("landing product boundary", () => {
  test("keeps core intelligence navigation ahead of the learning extension", async ({ page }) => {
    await page.goto("/");

    const primaryNav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(primaryNav.getByRole("link", { name: "Trust", exact: true })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Community", exact: true })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: "Experts", exact: true })).toBeVisible();

    const learningMenu = primaryNav.locator("details");
    await expect(learningMenu.locator("summary")).toContainText("Học tập");
    await learningMenu.locator("summary").click();
    await expect(learningMenu.getByRole("link", { name: "Learn", exact: true })).toBeVisible();
    await expect(learningMenu.getByRole("link", { name: "Roadmap", exact: true })).toBeVisible();
  });

  test("makes Trust the first landing action without fabricated verification metrics", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /HIỂU ĐÚNG\.\s*ĐI XA\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Kiểm tra trước khi tin", exact: true })).toHaveAttribute("href", "/trust");
    await expect(page.getByText("Verified Evidence", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Reality Alignment", { exact: true })).toHaveCount(0);
  });
});
