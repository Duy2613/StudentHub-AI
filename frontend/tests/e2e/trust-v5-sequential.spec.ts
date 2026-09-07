import { expect, test } from "@playwright/test";

test.describe("Trust Engine V5 sequential experience", () => {
  test("renders all seven stages and their epistemic boundaries through the live local route", async ({ page }) => {
    test.setTimeout(60_000);
    let trustRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/trust")) trustRequests += 1;
    });
    await page.goto("/trust");
    await page.getByRole("tab", { name: "Văn bản" }).click();
    await page.getByLabel("Nội dung tin nhắn hoặc thông báo").fill("Thông báo học bổng yêu cầu đóng phí ngay để giữ suất.");
    await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();

    await expect(page.locator("[data-v5-pipeline-status='COMPLETED'], [data-v5-pipeline-status='PARTIAL']")).toBeVisible({ timeout: 45_000 });
    const timeline = page.locator(".trust-v5-timeline");
    await expect(timeline).toBeVisible();
    const tabs = timeline.getByRole("tab");
    await expect(tabs).toHaveCount(7);
    await expect(tabs.evaluateAll((items) => items.map((item) => item.querySelector(".trust-v5-stage-tab-code")?.textContent?.trim().toLowerCase()))).resolves.toEqual(["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"]);
    await expect(timeline.getByRole("tabpanel")).toHaveCount(1);
    for (const label of ["Đang kiểm tra", "Finding của stage", "Finding này nghĩa là", "Finding này KHÔNG chứng minh", "Tín hiệu / evidence", "Giới hạn", "Stage kế tiếp"]) {
      await expect(timeline.getByText(label, { exact: true })).toBeVisible();
    }
    const requestsBeforeStageNavigation = trustRequests;
    await timeline.getByRole("tab", { name: /L3/i }).click();
    await expect(timeline.getByRole("tabpanel")).toHaveAttribute("data-stage-id", "l3");
    await expect.poll(() => trustRequests).toBe(requestsBeforeStageNavigation);
    await timeline.getByRole("tab", { name: /L3/i }).press("End");
    await expect(timeline.getByRole("tabpanel")).toHaveAttribute("data-stage-id", "l5");
    await expect(timeline).toContainText(/không nâng safety/i);
    await expect(timeline).toContainText(/không tự cuộn/i);
  });
});
