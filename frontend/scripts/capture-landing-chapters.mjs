import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3100";
const OUTPUT_DIR = path.resolve(process.cwd(), "test-results", "landing-fusion-chapters");

async function captureChapters() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log("Capturing Landing Chapters...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // 1. Hero
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01_hero_1440.png") });
  console.log("✔ 01_hero_1440.png captured");

  // 2. Knowledge Core
  const coreEl = page.locator("#knowledge-core");
  if (await coreEl.count() > 0) {
    await coreEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "02_knowledge_core_1440.png") });
    console.log("✔ 02_knowledge_core_1440.png captured");
  }

  // 3. Trust Section
  const trustEl = page.locator("#trust");
  if (await trustEl.count() > 0) {
    await trustEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "03_trust_pipeline_1440.png") });
    console.log("✔ 03_trust_pipeline_1440.png captured");
  }

  // 4. Intelligence / Source Gallery
  const intelEl = page.locator("#intelligence");
  if (await intelEl.count() > 0) {
    await intelEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "04_source_gallery_1440.png") });
    console.log("✔ 04_source_gallery_1440.png captured");
  }

  // 5. Closing
  const closingEl = page.locator("#closing-title");
  if (await closingEl.count() > 0) {
    await closingEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "05_closing_threshold_1440.png") });
    console.log("✔ 05_closing_threshold_1440.png captured");
  }

  // Also capture on mobile 390
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2500);

  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "01_hero_mobile_390.png") });
  const mobileCoreEl = mobilePage.locator("#knowledge-core");
  if (await mobileCoreEl.count() > 0) {
    await mobileCoreEl.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "02_knowledge_core_mobile_390.png") });
  }

  console.log("✔ Mobile captures complete");

  await browser.close();
  console.log("All landing chapters captured successfully!");
}

captureChapters().catch(console.error);
