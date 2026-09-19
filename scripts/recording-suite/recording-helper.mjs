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

export function getEvidenceDir() {
  const pointerFile = resolve(REPO_ROOT, "artifacts/latest-qa-dir.txt");
  if (existsSync(pointerFile)) {
    const p = readFileSync(pointerFile, "utf-8").trim();
    return resolve(REPO_ROOT, p);
  }
  return resolve(REPO_ROOT, "artifacts/final-demo-qa-latest");
}

export const EVIDENCE_DIR = getEvidenceDir();
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

export async function slowAction(ms = 1000) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function pauseStateChange(page, ms = 2500) {
  if (page) await page.waitForTimeout(ms);
}

export async function pauseFinalResult(page, ms = 4500) {
  if (page) await page.waitForTimeout(ms);
}

export async function logoutUser(page) {
  try {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
    });
    await slowAction(400);
  } catch (e) {
    console.warn("Logout error:", e.message);
  }
}

export async function loginUser(page, email, password = QA_PASSWORD) {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input#email", { timeout: 15000 });
  await page.fill("input#email", email);
  await slowAction(300);
  await page.waitForSelector("input#password", { timeout: 15000 });
  await page.fill("input#password", password);
  await slowAction(300);
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.waitFor({ state: "visible", timeout: 10000 });
  await submitBtn.click();
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });
  await slowAction(500);
}

export async function captureScreenshot(page, filename, description = "") {
  const target = resolve(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`  [SCREENSHOT] Saved: ${filename} ${description ? "(" + description + ")" : ""}`);
  return target;
}
