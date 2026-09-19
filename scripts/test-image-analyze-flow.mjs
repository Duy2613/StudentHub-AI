import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import path from "node:path";

async function test() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  p.on("console", (msg) => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  p.on("pageerror", (err) => console.log(`[PAGEERROR] ${err.message}`));

  await p.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await p.fill("input#email", "demo-user@gmail.com");
  await p.fill("input#password", "StudentHubQA2026!");
  await p.click('button[type="submit"]');
  await p.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });

  await p.goto("http://localhost:3000/trust?mode=image", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1000);

  const fileInput = p.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.resolve("fixtures/trust-multimodal/screenshot-text.png"));
  await p.waitForSelector('[data-testid="trust-image-preview"]', { timeout: 8000 });
  await p.waitForSelector('[data-testid="trust-ocr-note"], .master-ultra-ocr-note', { timeout: 15000 });

  const btn = p.locator(".master-ultra-submit").first();
  const disabled = await btn.getAttribute("disabled");
  console.log("Button disabled:", disabled);
  await btn.click();
  console.log("Clicked! Waiting for pipeline completion...");
  await p.waitForSelector('button[data-testid="rail-layer5"], [data-layer-id="l5"], .master-ultra-overview', { timeout: 45000 });
  console.log("Pipeline reached terminal stage!");
  await p.waitForTimeout(2000);

  const errors = await p.locator('.master-ultra-error').allTextContents();
  console.log("Visible errors on page:", errors);

  const railItems = await p.locator('.master-ultra-rail-item, button[data-testid^="rail-layer"]').allTextContents();
  console.log("Rail items count:", railItems.length, "items:", railItems);

  await b.close();
}

test().catch(console.error);
