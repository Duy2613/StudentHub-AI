import { expect, test, type Page } from "@playwright/test";

async function waitForExpertDirectory(page: Page) {
  const expertCards = page.locator(".expert-card");
  await expect.poll(async () => {
    if (await expertCards.count() > 0) return "cards";
    if (await page.getByText(/Không có hồ sơ phù hợp với tìm kiếm hiện tại|Chưa có hồ sơ chuyên gia khả dụng/).count() > 0) return "empty";
    return "loading";
  }, { timeout: 15_000 }).toMatch(/^(cards|empty)$/);
  return expertCards;
}

test.describe("Expert authority boundaries", () => {
  test("shows domain-scoped evidence and authority warning", async ({ page }) => {
    await page.goto("/expert");
    await expect(page.getByRole("heading", { name: /Đúng người/ })).toBeVisible();
    await expect(page.getByText("LIVE PROVIDER").first()).toBeVisible();
    await expect(page.getByText("Hồ sơ → quiz → review domain")).toBeVisible();
    const expertCards = await waitForExpertDirectory(page);
    if (await expertCards.count()) {
      await expertCards.first().click();
      await expect(page.getByText(/chứng chỉ\/bằng cấp/).first()).toBeVisible();
      await expect(page.getByText(/công trình/).first()).toBeVisible();
      await expect(page.getByText("Expertise không đồng nghĩa với authority")).toBeVisible();
      await expect(page.getByText(/không được trình bày như nguồn ban hành quy chế|cờ thẩm quyền hành chính/)).toBeVisible();
    } else {
      await expect(page.getByText(/Chưa có hồ sơ chuyên gia khả dụng|Không có hồ sơ phù hợp với tìm kiếm hiện tại/)).toBeVisible();
    }
  });

  test("assessment is disabled for empty claims", async ({ page }) => {
    await page.goto("/expert");
    const expertCards = await waitForExpertDirectory(page);
    if (await expertCards.count()) {
      await expertCards.first().click();
      await expect(page.getByRole("button", { name: "Kiểm tra phạm vi" })).toBeDisabled();
    } else {
      await expect(page.getByText(/Chưa có hồ sơ chuyên gia khả dụng|Không có hồ sơ phù hợp với tìm kiếm hiện tại/)).toBeVisible();
    }
  });

  test("empty expert directory never fabricates an assessment path", async ({ page }) => {
    await page.route("**/api/expert/evaluate", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { message: "offline" } }) }));
    await page.goto("/expert");
    const expertCards = await waitForExpertDirectory(page);
    if (await expertCards.count()) {
      await expertCards.first().click();
      await page.getByLabel("Nội dung cần kiểm tra").fill("Một phát ngôn cần kiểm tra");
      await expect(page.getByRole("button", { name: "Kiểm tra phạm vi" })).toBeEnabled();
      await page.getByRole("button", { name: "Kiểm tra phạm vi" }).click();
      await expect(page.locator(".error-callout")).toContainText("tạm thời không khả dụng");
    } else {
      await expect(page.getByText(/Chưa có hồ sơ chuyên gia khả dụng|Không có hồ sơ phù hợp với tìm kiếm hiện tại/)).toBeVisible();
    }
  });
});
