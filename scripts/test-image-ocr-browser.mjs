import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/trust?mode=image', { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]').first();

  console.log('Testing Image Preview and OCR in Real Browser...');
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/screenshot-text.png'));
  await page.waitForSelector('[data-testid="trust-image-preview"]', { timeout: 10000 });
  const imgData = await page.$eval('[data-testid="trust-image-preview"]', (el) => ({
    complete: el.complete,
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
  }));
  console.log('Image preview status:', imgData);

  // Wait for OCR note to appear
  await page.waitForSelector('[data-testid="trust-ocr-note"]', { timeout: 15000 });
  const ocrText = await page.$eval('[data-testid="trust-ocr-note"] p', (el) => el.textContent.trim());
  console.log('Extracted OCR text length:', ocrText.length, 'snippet:', ocrText.slice(0, 100));

  const pass = imgData.complete && imgData.naturalWidth > 0 && ocrText.length > 0;
  console.log('REAL_IMAGE_OCR_GATE:', pass ? 'PASS' : 'FAIL');
  await browser.close();
  if (!pass) process.exit(1);
}

test().catch((err) => {
  console.error('REAL_IMAGE_OCR_GATE: FAIL', err);
  process.exit(1);
});
