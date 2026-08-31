import { expect, test } from "@playwright/test";

test.describe("Expert authority boundaries", () => {
  test("shows domain-scoped evidence and authority warning", async ({ page }) => {
    await page.goto("/expert");
    await expect(page.getByText(/chứng chỉ\/bằng cấp/).first()).toBeVisible();
    await expect(page.getByText(/công trình/).first()).toBeVisible();
    await expect(page.getByText("Expertise không đồng nghĩa với authority")).toBeVisible();
    await expect(page.getByText(/không được trình bày như nguồn ban hành quy chế|cờ thẩm quyền hành chính/)).toBeVisible();
  });

  test("assessment is disabled for empty claims", async ({ page }) => {
    await page.goto("/expert");
    await expect(page.getByRole("button", { name: "Thẩm định phạm vi" })).toBeDisabled();
  });

  test("typed API failure is recoverable", async ({ page }) => {
    await page.route("**/api/expert/evaluate", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { message: "offline" } }) }));
    await page.goto("/expert");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Nội dung cần thẩm định").fill("Một phát ngôn cần kiểm tra");
    await expect(page.getByRole("button", { name: "Thẩm định phạm vi" })).toBeEnabled();
    await page.getByRole("button", { name: "Thẩm định phạm vi" }).click();
    await expect(page.locator(".error-callout")).toContainText("tạm thời không khả dụng");
  });
});
