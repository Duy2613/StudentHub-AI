import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('requestfailed', req => console.log(`[REQUEST FAILED] ${req.url()} - ${req.failure()?.errorText}`));
  page.on('response', res => {
    if (res.status() >= 400) console.log(`[HTTP ${res.status()}] ${res.url()}`);
  });

  await page.goto('http://localhost:3000/trust?mode=image', { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]').first();

  console.log('Uploading REAL-01-CAMPUS.png...');
  await fileInput.setInputFiles(path.resolve('qa/trust-v3-corpus/images/real-world/REAL-01-CAMPUS.png'));
  
  await page.waitForTimeout(12000);

  await browser.close();
}
test().catch(console.error);
