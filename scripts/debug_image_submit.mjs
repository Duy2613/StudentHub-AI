import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/trust?mode=image', { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]').first();

  console.log('Uploading REAL-01-CAMPUS.png...');
  await fileInput.setInputFiles(path.resolve('qa/trust-v3-corpus/images/real-world/REAL-01-CAMPUS.png'));
  await page.waitForTimeout(4000);

  const note = await page.locator('[data-testid="trust-ocr-note"]').isVisible();
  console.log('OCR note visible:', note);
  if (note) {
    const text = await page.locator('[data-testid="trust-ocr-note"] p').innerText();
    console.log('OCR Text:', text);
  }

  const submitEnabled = await page.locator('.master-ultra-submit').isEnabled();
  console.log('Submit button enabled:', submitEnabled);

  // Click submit
  await page.locator('.master-ultra-submit').click();
  console.log('Clicked submit. Waiting 8s...');
  await page.waitForTimeout(8000);

  const state = await page.evaluate(() => {
    return {
      overview: Boolean(document.querySelector('.master-ultra-overview')),
      error: document.querySelector('.master-ultra-error')?.innerText,
      state: document.querySelector('.master-ultra-trust')?.getAttribute('data-master-ultra-state'),
      html_snippet: document.querySelector('.master-ultra-trust')?.innerHTML?.slice(0, 300)
    };
  });
  console.log('Trust State after submit:', state);

  await browser.close();
}
test().catch(console.error);
