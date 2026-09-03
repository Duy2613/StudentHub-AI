import { expect, test } from "@playwright/test";

test.describe("Community evidence layer", () => {
  test("search, topic filters and provenance remain explicit", async ({ page }) => {
    await page.goto("/community");
    await expect(page.getByText("Nguồn: cộng đồng").first()).toBeVisible();
    const topicButton = page.locator(".filter-chip").filter({ hasNotText: "Tất cả" }).first();
    if (await topicButton.count()) {
      await topicButton.click();
      await expect(topicButton).toHaveClass(/is-active/);
    }
    await page.getByPlaceholder("Tìm vấn đề, quy trình hoặc bằng chứng...").fill("chuỗi-không-tồn-tại-2026");
    await expect(page.getByText("Không có báo cáo phù hợp với bộ lọc hiện tại.")).toBeVisible();
  });

  test("states that community volume is not truth", async ({ page }) => {
    await page.goto("/community");
    await expect(page.getByRole("heading", { name: "Không đánh đồng số đông với sự thật" })).toBeVisible();
    await expect(page.getByText("Quy định chính thức vẫn là nguồn thẩm quyền.")).toBeVisible();
  });
});
