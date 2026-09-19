import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/trust?mode=qr', { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]').first();

  console.log('Testing QR Fixtures in Real Browser...');

  // Test 1: Safe HTTPS QR
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/01-https.png'));
  await page.waitForSelector('[data-testid="trust-qr-result"]', { timeout: 10000 });
  const res1 = await page.$eval('[data-testid="trust-qr-result"]', (el) => ({
    detected: el.getAttribute('data-qr-detected'),
    payload: el.getAttribute('data-qr-payload'),
    type: el.getAttribute('data-qr-type'),
    security: el.getAttribute('data-qr-security'),
  }));
  console.log('01-https.png result:', res1);

  // Test 2: Plain text QR
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/02-text.png'));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && el.getAttribute('data-qr-payload') === 'StudentHub Trust QR test';
  }, { timeout: 10000 });
  const res2 = await page.$eval('[data-testid="trust-qr-result"]', (el) => ({
    detected: el.getAttribute('data-qr-detected'),
    payload: el.getAttribute('data-qr-payload'),
    type: el.getAttribute('data-qr-type'),
    security: el.getAttribute('data-qr-security'),
  }));
  console.log('02-text.png result:', res2);

  // Test 3: Rotated 90
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/05-rotated-90.png'));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && el.getAttribute('data-qr-payload') === 'https://example.com/rotated-qr';
  }, { timeout: 10000 });
  const res3 = await page.$eval('[data-testid="trust-qr-result"]', (el) => ({
    detected: el.getAttribute('data-qr-detected'),
    payload: el.getAttribute('data-qr-payload'),
    type: el.getAttribute('data-qr-type'),
    security: el.getAttribute('data-qr-security'),
  }));
  console.log('05-rotated-90.png result:', res3);

  // Test 4: Multi-QR
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/11-multi-qr.png'));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && Number(el.getAttribute('data-qr-count')) >= 2;
  }, { timeout: 10000 });
  const res4 = await page.$eval('[data-testid="trust-qr-result"]', (el) => ({
    detected: el.getAttribute('data-qr-detected'),
    count: el.getAttribute('data-qr-count'),
    payload: el.getAttribute('data-qr-payload'),
  }));
  console.log('11-multi-qr.png result:', res4);

  // Test 5: Localhost SSRF block
  await fileInput.setInputFiles(path.resolve('fixtures/trust-multimodal/12-localhost.png'));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && el.getAttribute('data-qr-security') === 'BLOCKED';
  }, { timeout: 10000 });
  const res5 = await page.$eval('[data-testid="trust-qr-result"]', (el) => ({
    detected: el.getAttribute('data-qr-detected'),
    payload: el.getAttribute('data-qr-payload'),
    security: el.getAttribute('data-qr-security'),
  }));
  console.log('12-localhost.png result:', res5);

  console.log('BROWSER_QR_DECODE_GATE: PASS');
  await browser.close();
}

test().catch((err) => {
  console.error('BROWSER_QR_DECODE_GATE: FAIL', err);
  process.exit(1);
});
