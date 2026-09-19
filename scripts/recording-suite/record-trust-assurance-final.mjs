import { resolve, dirname, join } from "node:path";
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "../../frontend/node_modules/playwright/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");

export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
export const QA_PASSWORD = process.env.DEMO_QA_PASSWORD || "StudentHubQA2026!";

export const DEMO_ACCOUNTS = {
  U0: "demo-user@gmail.com",
  U1: "demo-user1@gmail.com",
  U2: "demo-user2@gmail.com",
  U3: "demo-user3@gmail.com",
  E0: "demo-expert@gmail.com",
  E1: "demo-expert1@gmail.com",
  E2: "demo-expert2@gmail.com",
  E3: "demo-expert3@gmail.com",
};

export const EVIDENCE_DIR = resolve(REPO_ROOT, "artifacts/trust-assurance/2026-09-18");
export const RAW_VIDEOS_DIR = resolve(EVIDENCE_DIR, "videos/raw");
export const FINAL_VIDEOS_DIR = resolve(EVIDENCE_DIR, "videos/final");
export const SCREENSHOTS_DIR = resolve(EVIDENCE_DIR, "screenshots");

mkdirSync(RAW_VIDEOS_DIR, { recursive: true });
mkdirSync(FINAL_VIDEOS_DIR, { recursive: true });
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

export async function createBrowser() {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}

export async function createRecordedContext(browser, videoName, options = {}) {
  const tempDir = resolve(RAW_VIDEOS_DIR, `temp_${videoName}_${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
    recordVideo: {
      dir: tempDir,
      size: options.videoSize || { width: 1440, height: 900 },
    },
    ...options,
  });

  return {
    context,
    tempDir,
    async closeAndSave(targetFilename) {
      await context.close();
      const files = readdirSync(tempDir).filter((f) => f.endsWith(".webm"));
      if (files.length > 0) {
        const sourcePath = join(tempDir, files[0]);
        const destPath = join(RAW_VIDEOS_DIR, `${targetFilename}.webm`);
        renameSync(sourcePath, destPath);
        return destPath;
      }
      return null;
    },
  };
}

export async function slowAction(ms = 800) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function loginUser(page, email, password = QA_PASSWORD) {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input#email", { timeout: 15000 });
  await page.fill("input#email", email);
  await slowAction(200);
  await page.waitForSelector("input#password", { timeout: 15000 });
  await page.fill("input#password", password);
  await slowAction(200);
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.waitFor({ state: "visible", timeout: 10000 });
  await submitBtn.click();
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });
  await slowAction(400);
}

export async function logoutUser(page) {
  try {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
    });
    await slowAction(300);
  } catch {}
}

export async function captureScreenshot(page, filename, description = "") {
  const target = resolve(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`  [SCREENSHOT] Saved: ${filename} ${description ? "(" + description + ")" : ""}`);
  return target;
}

export async function waitForTrustCompletion(page, timeoutMs = 45000) {
  await page.waitForFunction(() => {
    const l5 = document.querySelector('[data-layer-id="l5"], .master-ultra-overview, .master-ultra-verdict-banner');
    if (l5) return true;
    const bodyText = document.body.textContent || "";
    return bodyText.includes("Thông tin đã đi hết năm lớp") || bodyText.includes("FINAL RESULT") || bodyText.includes("SUPPORTED") || bodyText.includes("CONTRADICTED") || bodyText.includes("UNVERIFIED");
  }, { timeout: timeoutMs }).catch(() => {
    console.warn("  [WARN] Trust completion wait reached timeout; checking current page state.");
  });
}

export async function inspectLayer(page, layerId) {
  // Click overview card for layerId
  const cardSelector = `.master-ultra-overview-card:has(span:has-text("${layerId.toUpperCase()}")), [data-layer-id="${layerId}"], button:has-text("Inspect")`;
  const inspectBtn = page.locator(`.master-ultra-overview-card:has(span:has-text("${layerId.toUpperCase()}"))`).first();
  if (await inspectBtn.count()) {
    await inspectBtn.click();
    await slowAction(600);
  }
}

export async function backToOverview(page) {
  const backBtn = page.locator('button:has-text("All layers"), .master-ultra-back-button').first();
  if (await backBtn.count()) {
    await backBtn.click();
    await slowAction(400);
  }
}

console.log("Trust Assurance Master Suite initialized.");
