import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/trust?mode=image', { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/screenshot_scholarship_scam.png'));
  await page.waitForSelector('[data-testid="trust-image-preview"]', { timeout: 10000 });
  const previewStatus = await page.$eval('[data-testid="trust-image-preview"]', (img) => ({
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    srcPrefix: img.src.slice(0, 30),
  }));
  console.log('Image Preview Hard Gate Status:', previewStatus);
  const pass = previewStatus.complete && previewStatus.naturalWidth > 0 && previewStatus.naturalHeight > 0;
  console.log('IMAGE_PREVIEW_HARD_GATE:', pass ? 'PASS' : 'FAIL');
  await browser.close();
}

test().catch(console.error);
