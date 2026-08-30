import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Evidence Case Lab", () => {
  test("connects all seven product capabilities with clearly labeled demo provenance", async ({ page }) => {
    await page.goto("/cases");
    await expect(page.getByRole("heading", { name: "Một case. Toàn bộ mạng lưới bằng chứng." })).toBeVisible();
    await expect(page.getByText("COMPETITION DEMO · DEMO FIXTURE")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence Triangle" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Living Evidence Passport" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Student Decision Twin" })).toBeVisible();
    await expect(page.getByText("Bước rõ ràng tiếp theo")).toBeVisible();

    await page.getByRole("tab", { name: /Thực tập giả/ }).click();
    await expect(page.getByRole("heading", { name: "Nhà tuyển dụng yêu cầu phí thiết bị" })).toBeVisible();
    await expect(page.getByText("SCOPED REVIEW AVAILABLE")).toHaveCount(0);
    await expect(page.getByText("REQUEST AVAILABLE")).toBeVisible();

    await page.getByRole("tab", { name: /Xung đột học vụ/ }).click();
    await expect(page.getByRole("heading", { name: "Tin đồn thay đổi điều kiện tiên quyết" })).toBeVisible();
    await expect(page.getByText("REALITY GAP", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Xác minh theo hồ sơ", exact: true }).first()).toBeVisible();
  });

  test("keeps the evidence narrative readable without horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/cases");
    await expect(page.getByRole("heading", { name: "Một case. Toàn bộ mạng lưới bằng chứng." })).toBeVisible();
    await page.getByRole("tab", { name: /Xung đột học vụ/ }).click();
    await expect(page.getByRole("heading", { name: "Student Decision Twin" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("serves labeled demo fixtures while live cross-system APIs remain authenticated", async ({ request }) => {
    const demoResponse = await request.get("/api/v1/demo/superflows?id=fake-scholarship");
    expect(demoResponse.status()).toBe(200);
    const demoBody = await demoResponse.json();
    expect(demoBody.demo).toBe(true);
    expect(demoBody.provenance).toBe("DEMO_FIXTURE");
    expect(demoBody.data.id).toBe("fake-scholarship");

    const passportResponse = await request.get("/api/v1/passports");
    expect(passportResponse.status()).toBe(401);
    const decisionResponse = await request.post("/api/v1/decisions", { data: { demo: true } });
    expect(decisionResponse.status()).toBe(401);
  });

  test("passes the serious and critical accessibility gate", async ({ page }) => {
    await page.goto("/cases");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  });

  test("has no horizontal overflow at all competition breakpoints", async ({ page }) => {
    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/cases");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
    }
  });
});
