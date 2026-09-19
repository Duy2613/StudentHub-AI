import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  
  await page.goto('http://localhost:3000/trust?mode=image', { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]').first();

  console.log('Uploading REAL-01-CAMPUS.png...');
  await fileInput.setInputFiles(path.resolve('qa/trust-v3-corpus/images/real-world/REAL-01-CAMPUS.png'));
  
  console.log('Waiting for OCR note or timeout...');
  try {
    await page.waitForSelector('[data-testid="trust-ocr-note"]', { timeout: 20000 });
    const text = await page.locator('[data-testid="trust-ocr-note"] p').innerText();
    console.log('OCR completed! Text:', text);
  } catch (e) {
    console.log('OCR note timed out after 20s:', e.message);
  }

  await browser.close();
}
test().catch(console.error);
