import { expect, test } from "@playwright/test";

test.describe("explicit competition demo mode", () => {
  test.skip(process.env.NEXT_PUBLIC_COMPETITION_DEMO !== "true", "Requires explicit NEXT_PUBLIC_COMPETITION_DEMO=true");

  for (const demoCase of [
    { button: "Case 1 · Rủi ro rõ", verdict: "Nghi vấn rủi ro cao" },
    { button: "Case 2 · Chưa đủ bằng chứng", verdict: "Chưa đủ bằng chứng để kết luận" },
    { button: "Case 3 · Nguồn suy giảm", verdict: "Có dấu hiệu cần chú ý" },
  ]) {
    test(`${demoCase.button} is visibly labeled and does not call Trust APIs`, async ({ page }) => {
      let trustRequests = 0;
      page.on("request", (request) => {
        if (request.url().includes("/api/ai-trust/")) trustRequests += 1;
      });

      await page.goto("/trust");
      await expect(page.getByText("CHẾ ĐỘ TRÌNH DIỄN")).toBeVisible();
      await page.getByRole("button", { name: demoCase.button }).click();
      await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();

      await expect(page.getByRole("heading", { name: demoCase.verdict })).toBeVisible();
      await expect(page.getByText("DEMO DATA")).toBeVisible();
      expect(trustRequests).toBe(0);
    });
  }
});
