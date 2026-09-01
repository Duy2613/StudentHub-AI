import { expect, test } from "@playwright/test";

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const productHeadings = {
  "/trust": "Kiểm tra trước khi bạn tin.",
  "/community": "Trải nghiệm thật, được đặt trong ngữ cảnh.",
  "/expert": "Đúng người, đúng phạm vi, đúng bằng chứng.",
};

const extendedResponsiveRoutes = {
  "/profile": "Không tìm thấy thông tin hồ sơ.",
  "/trust": "Kiểm tra trước khi bạn tin.",
};

for (const viewport of viewports) {
  test(`core products fit ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    for (const [path, heading] of Object.entries(productHeadings)) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} horizontal overflow`).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: testInfo.outputPath(`expert-${viewport.width}x${viewport.height}.png`), fullPage: true });
  });
}

for (const viewport of [{ width: 320, height: 900 }, { width: 768, height: 900 }]) {
  test(`extended product surfaces fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const [path, heading] of Object.entries(extendedResponsiveRoutes)) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
}

test("reduced motion disables animated transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/trust");
  const duration = await page.getByRole("tab", { name: "Văn bản" }).evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);
});
