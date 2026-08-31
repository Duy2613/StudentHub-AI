import { expect, test } from "@playwright/test";

test.describe("Trust Engine V5 sequential experience", () => {
  test("renders all seven stages and their epistemic boundaries through the live local route", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Thông báo học bổng yêu cầu đóng phí ngay để giữ suất.");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();

    await expect(page.locator("[data-v5-pipeline-status='COMPLETED'], [data-v5-pipeline-status='PARTIAL']")).toBeVisible({ timeout: 45_000 });
    const timeline = page.locator(".trust-v5-stage-list");
    await expect(timeline).toBeVisible();
    await expect(timeline.locator(".trust-v5-stage-item")).toHaveCount(7);
    await expect(timeline.locator(".trust-v5-stage-item").evaluateAll((items) => items.map((item) => item.getAttribute("data-stage-id")))).resolves.toEqual(["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"]);
    for (const label of ["Đang kiểm tra", "Finding của stage", "Finding này nghĩa là", "Finding này KHÔNG chứng minh", "Tín hiệu / evidence", "Giới hạn", "Stage kế tiếp"]) {
      await expect(timeline.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(timeline).toContainText("BASELINE RULE MODEL");
    await expect(timeline).toContainText(/không phải probability/i);
    await expect(page.locator(".trust-v5-timeline")).toContainText(/không đồng nghĩa nội dung an toàn/i);
  });
});
