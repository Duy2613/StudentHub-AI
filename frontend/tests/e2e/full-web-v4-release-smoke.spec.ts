import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("landing presents the three-core boundaries at 390px without fabricated live claims", async ({ page, browserName }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("h1")).toContainText("HIỂU");
  await expect(page.getByRole("link", { name: /Kiểm chứng tin đồn ngay/ })).toHaveAttribute("href", "/trust");
  await expect(page.getByRole("link", { name: /Tham gia không gian thảo luận cộng đồng/ })).toHaveAttribute("href", "/community");
  await expect(page.getByRole("link", { name: /Mở không gian Expert/ })).toHaveAttribute("href", "/expert");
  await expect(page.locator("body")).toContainText("Omni hiện trả lời dạng văn bản");
  await expect(page.locator("body")).toContainText("KHÔNG PHẢI TRẠNG THÁI HỒ SƠ");
  await expect(page.locator("body")).not.toContainText(/94%|1,240|28,500|CASE-2026-089|LIVE FEED|BLIND REVIEW ACTIVE/);

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
  expect(pageErrors).toEqual([]);

  if (browserName === "chromium" && process.env.FULL_WEB_V4_ARTIFACTS) {
    mkdirSync(process.env.FULL_WEB_V4_ARTIFACTS, { recursive: true });
    await page.screenshot({ path: join(process.env.FULL_WEB_V4_ARTIFACTS, "landing-390.png"), fullPage: true });
  }
});

test("retired professor-rating path returns not found instead of redirecting to an unknown workspace", async ({ page }) => {
  const response = await page.goto("/prof-rating", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  expect(new URL(page.url()).pathname).toBe("/prof-rating");
});

test("removed first-class product routes return 404", async ({ page }) => {
  for (const path of ["/dashboard", "/learn", "/learn/fixture-course/fixture-lesson", "/roadmap", "/quests", "/practice", "/scholarships", "/tuition-radar", "/safety-map", "/sos", "/intelligence/knowledge"]) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} must stay removed`).toBe(404);
    expect(new URL(page.url()).pathname, `${path} must not silently redirect`).toBe(path);
  }
});

test("active landing, auth and three-core routes render once with one main landmark and fail closed", async ({ browser }) => {
  const origin = "http://127.0.0.1:3114";
  const pageErrors: string[] = [];
  const blockedWrites: string[] = [];
  const blockedExternalRequests: string[] = [];
  const visited: Array<{ path: string; finalPath: string; status: number; mainCount: number; anonymousSessionStatus: number }> = [];
  const openIsolatedRoute = async (path: string) => {
    const context = await browser.newContext({
      baseURL: origin,
      locale: "vi-VN",
      timezoneId: "Asia/Ho_Chi_Minh",
      serviceWorkers: "block",
      viewport: { width: 1440, height: 1000 },
    });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1:3114\/).*/, async (route) => {
      const url = new URL(route.request().url());
      blockedExternalRequests.push(url.origin);
      await route.abort();
    });
    const routePage = await context.newPage();
    const routeErrors: string[] = [];
    routePage.on("pageerror", (error) => routeErrors.push(`${new URL(routePage.url()).pathname}: ${error.message}`));
    routePage.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin === origin && url.pathname.startsWith("/api/") && !new Set(["GET", "HEAD", "OPTIONS"]).has(request.method())) {
        blockedWrites.push(`${request.method()} ${url.pathname}`);
      }
    });
    try {
      const sessionRead = routePage.waitForResponse((candidate) => new URL(candidate.url()).pathname === "/api/auth/session", { timeout: 10_000 });
      const response = await routePage.goto(path, { waitUntil: "domcontentloaded" });
      const sessionResponse = await sessionRead;
      expect(sessionResponse.status(), `${path} anonymous session read`).toBe(401);
      expect(response?.status(), `${path} HTTP status`).toBe(200);
      if (path === "/verify") await expect(routePage).toHaveURL(/\/register$/);
      if (path.startsWith("/callback?error=")) await expect(routePage).toHaveURL(/\/login\?error=oauth_failed(?:&|$)/);
      if (path.startsWith("/login?error=session_unavailable")) {
        await expect(routePage.locator('[role="alert"]').filter({ hasText: "Dịch vụ phiên đăng nhập an toàn" })).toBeVisible();
      }
      const mainCount = await routePage.getByRole("main").count();
      expect(mainCount, `${path} must expose exactly one main landmark`).toBe(1);
      await expect(routePage.getByRole("main")).toBeVisible();
      expect(routeErrors, `${path} uncaught browser errors before isolated context teardown`).toEqual([]);
      pageErrors.push(...routeErrors);
      visited.push({ path, finalPath: new URL(routePage.url()).pathname, status: response!.status(), mainCount, anonymousSessionStatus: sessionResponse.status() });
    } finally {
      await context.close();
    }
  };

  const paths = ["/", "/login?error=session_unavailable", "/register", "/verify", "/trust", "/community", "/expert", "/profile", "/settings", "/settings/privacy"];
  for (const path of paths) {
    await openIsolatedRoute(path);
  }

  await openIsolatedRoute("/callback?error=access_denied");

  expect(pageErrors, "active route failures must stay in honest UI states").toEqual([]);
  expect(blockedWrites, "route inventory must not make API writes").toEqual([]);
  expect(blockedExternalRequests, "route inventory must not contact external providers").toEqual([]);
  if (process.env.FULL_WEB_V4_ARTIFACTS) {
    mkdirSync(process.env.FULL_WEB_V4_ARTIFACTS, { recursive: true });
    writeFileSync(join(process.env.FULL_WEB_V4_ARTIFACTS, "active-route-inventory.json"), JSON.stringify({ classification: "LOCAL_ISOLATED; same-origin APIs served by the credential-free app; request-only audit observed no writes; external origins blocked", visited, pageErrors }, null, 2));
  }
});
