import { expect, test, type Page } from "@playwright/test";
import { stagingCases, type StagingCase } from "./cases";

async function submit(page: Page, item: StagingCase) {
  await page.goto("/trust");
  await page.getByRole("tab", { name: item.type === "url" ? "URL" : "Văn bản" }).click();
  await page.getByLabel(item.type === "url" ? "Đường dẫn cần kiểm tra" : "Nội dung tin nhắn hoặc thông báo").fill(item.value);
  await page.getByRole("button", { name: /Phân tích rủi ro/ }).click();
}

test("CASE A — suspicious response satisfies and renders the live contract", async ({ page }) => {
  await submit(page, stagingCases.suspicious);
  await expect(page.locator(".verdict-panel")).toBeVisible();
  if (stagingCases.suspicious.expected) await expect(page.locator(".verdict-panel")).toContainText(stagingCases.suspicious.expected);
});

test("CASE B — benign response is not forced into high risk", async ({ page }) => {
  await submit(page, stagingCases.benign);
  await expect(page.locator(".verdict-panel")).toBeVisible();
  await expect(page.locator('.verdict-metrics dd[data-risk="HIGH"]')).toHaveCount(0);
  await expect(page.locator('.verdict-metrics dd[data-risk="CRITICAL"]')).toHaveCount(0);
});

test("CASE C — live partial providers remain distinct", async ({ page }) => {
  await submit(page, stagingCases.partial);
  await expect(page.getByRole("heading", { name: "Tình trạng nguồn đối soát" })).toBeVisible();
  for (const status of stagingCases.partial.expectedProviderStatuses || ["findings", "unknown", "unavailable"]) {
    await expect(page.locator(`[data-provider-status="${status}"]`).first()).toBeVisible();
  }
});

test("CASE D — insufficient evidence never renders safe", async ({ page }) => {
  await submit(page, stagingCases.insufficient);
  await expect(page.locator(".verdict-panel")).toContainText(stagingCases.insufficient.expected || "Chưa đủ bằng chứng");
  await expect(page.getByText("AN TOÀN", { exact: true })).toHaveCount(0);
});

test("CASE E — configured live failure remains recoverable", async ({ page }) => {
  await submit(page, stagingCases.failure);
  await expect(page.locator(".error-callout")).toContainText(stagingCases.failure.expectedErrorFragment || /quá nhiều|không khả dụng|quá lâu/i);
  await expect(page.getByRole("heading", { level: 1, name: "Kiểm tra trước khi bạn tin." })).toBeVisible();
});
