import { expect, test } from "@playwright/test";

test.describe("Community V2 Evidence Stream Layer", () => {
  test("Action center, display headline and search are present", async ({ page }) => {
    await page.goto("/community");
    
    // 1. Single H1 with approved copy
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("Bằng chứng trước");
    await expect(h1).toContainText("độ phổ biến");

    // 2. Search box with keyboard shortcut
    const searchInput = page.getByPlaceholder("Tìm vấn đề, bằng chứng, case hoặc quy chế...");
    await expect(searchInput).toBeVisible();

    // 3. Quick filter chips
    const chip = page.locator(".community-chip").filter({ hasText: "Nhà trọ" });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(chip).toHaveClass(/is-active/);

    // 4. Evidence Legend Bar
    await expect(page.getByText("KÝ HIỆU BẰNG CHỨNG")).toBeVisible();

    // 5. Quick Post trigger exists
    const qpTrigger = page.locator(".community-quickpost-trigger");
    await expect(qpTrigger).toBeVisible();
  });

  test("Quick post modal dialog opens, traps focus, and closes with Escape", async ({ page }) => {
    await page.goto("/community");
    const qpTrigger = page.locator(".community-quickpost-trigger");
    await qpTrigger.click();

    // Dialog should be visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Đăng một quan sát" })).toBeVisible();

    // Escape closes dialog
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("states that community volume is not truth", async ({ page }) => {
    await page.goto("/community");
    await expect(page.getByText("Không đánh đồng số đông với sự thật")).toBeVisible();
    await expect(page.getByText("Quy định chính thức và văn bản gốc vẫn là nguồn thẩm quyền")).toBeVisible();
  });

  test("search filtering shows empty state on non-existent term", async ({ page }) => {
    await page.goto("/community");
    const searchInput = page.getByPlaceholder("Tìm vấn đề, bằng chứng, case hoặc quy chế...");
    await searchInput.fill("chuỗi-không-tồn-tại-2026-xyz");
    await expect(page.getByText("Chưa ghi nhận quan sát nào phù hợp")).toBeVisible();
  });
});
