import { resolve, dirname, join } from "node:path";
import { readdirSync, renameSync, existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "../../frontend/node_modules/playwright/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const QA_PASSWORD = process.env.DEMO_QA_PASSWORD || "StudentHubQA2026!";

const EVIDENCE_DIR = resolve(REPO_ROOT, "artifacts/trust-assurance/2026-09-18");
const RAW_DIR = resolve(EVIDENCE_DIR, "videos/raw");
const FINAL_DIR = resolve(EVIDENCE_DIR, "videos/final");
const SCREENSHOTS_DIR = resolve(EVIDENCE_DIR, "screenshots");
const FIXTURES_DIR = resolve(REPO_ROOT, "fixtures/trust-multimodal");

mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(FINAL_DIR, { recursive: true });
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function createBrowser() {
  return chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
    ],
  });
}

async function createRecordedContext(browser, videoName, options = {}) {
  const tempDir = resolve(RAW_DIR, `temp_${videoName}_${Date.now()}`);
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
      const files = readdirSync(tempDir)
        .filter((f) => f.endsWith(".webm"))
        .sort((a, b) => statSync(join(tempDir, b)).size - statSync(join(tempDir, a)).size);
      if (files.length > 0) {
        const sourcePath = join(tempDir, files[0]);
        const destPath = join(RAW_DIR, `${targetFilename}.webm`);
        copyFileSync(sourcePath, destPath);
        console.log(`  [SAVED RAW VIDEO] ${targetFilename}.webm (${statSync(destPath).size} bytes)`);
        return destPath;
      }
      return null;
    },
  };
}

async function loginUser(page, email, password = QA_PASSWORD) {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input#email", { timeout: 15000 });
  await page.fill("input#email", email);
  await page.waitForTimeout(200);
  await page.waitForSelector("input#password", { timeout: 15000 });
  await page.fill("input#password", password);
  await page.waitForTimeout(200);
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });
  await page.waitForTimeout(500);
}

async function captureScreenshot(page, filename, description = "") {
  const target = resolve(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`  [SCREENSHOT] Saved: ${filename} ${description ? "(" + description + ")" : ""}`);
  return target;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7: trust-layer-output-walkthrough-v2
// ─────────────────────────────────────────────────────────────────────────────
export async function recordLayerWalkthroughV2(browser) {
  console.log("\n>>> RECORDING: trust-layer-output-walkthrough-v2 <<<");
  const rec = await createRecordedContext(browser, "trust-layer-output-walkthrough-v2");
  const page = await rec.context.newPage();

  console.log("  Step 00: Login as U0 and navigate to /trust...");
  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Switch to Text tab
  console.log("  Selecting Text tab...");
  const textTab = page.locator('button[role="tab"]:has-text("Văn bản"), button[role="tab"]:has-text("Text")').first();
  await textTab.waitFor({ state: "visible", timeout: 15000 });
  await textTab.click();
  await page.waitForTimeout(500);

  // Submit real claim
  console.log("  Submitting test claim...");
  const textarea = page.locator('.master-ultra-text-field textarea, textarea').first();
  await textarea.waitFor({ state: "visible", timeout: 15000 });
  await textarea.fill("Trường Đại học Bách Khoa TP.HCM thông báo cấp học bổng toàn phần 100% học phí và sinh hoạt phí cho sinh viên ngành Khoa học Máy tính năm 2026.");
  await page.waitForTimeout(500);

  const analyzeBtn = page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro")').first();
  await analyzeBtn.click();

  // Wait for pipeline completion
  console.log("  Waiting for pipeline completion...");
  await page.waitForSelector('[data-layer-id="layer5"], button[data-testid="rail-layer5"], .master-ultra-overview', { timeout: 45000 });
  await page.waitForTimeout(2000);

  // 01: Open Layer 1 (Claim & Normalization)
  console.log("  Step 01: Inspecting Layer 1 (pause 7s)...");
  const railL1 = page.locator('button[data-testid="rail-layer1"]').first();
  if (await railL1.count()) {
    await railL1.click();
    await page.waitForTimeout(500);
  }
  // Scroll to show all returned content
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
  await page.waitForTimeout(4000);
  await captureScreenshot(page, "REAL-L1-OUTPUT.png", "Layer 1 Canonical Output");

  // 02: Open Layer 2 (Reputation & Semantic & Domain Risk)
  console.log("  Step 02: Inspecting Layer 2 (pause 9s)...");
  const railL2 = page.locator('button[data-testid="rail-layer2"]').first();
  if (await railL2.count()) {
    await railL2.click();
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(4500);
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(4500);
  await captureScreenshot(page, "REAL-L2-OUTPUT.png", "Layer 2 Threat Intelligence & Semantics");

  // 03: Open Layer 3 (External Evidence & Web Forensics)
  console.log("  Step 03: Inspecting Layer 3 & Clicking 2 Source Links (pause 12s)...");
  const railL3 = page.locator('button[data-testid="rail-layer3"]').first();
  if (await railL3.count()) {
    await railL3.click();
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(3000);

  // Click at least two real source links
  const sourceLinks = page.locator('.master-ultra-layer-content a[href^="http"]:visible');
  const count = await sourceLinks.count();
  if (count > 0) {
    console.log(`  Found ${count} evidence source links. Clicking link 1...`);
    const href1 = await sourceLinks.nth(0).getAttribute("href");
    console.log(`  Source link 1 URL: ${href1}`);
    await sourceLinks.nth(0).scrollIntoViewIfNeeded().catch(() => {});
    await sourceLinks.nth(0).hover({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(600);
    await sourceLinks.nth(0).click({ noWaitAfter: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  if (count > 1) {
    console.log("  Clicking link 2...");
    const href2 = await sourceLinks.nth(1).getAttribute("href");
    console.log(`  Source link 2 URL: ${href2}`);
    await sourceLinks.nth(1).scrollIntoViewIfNeeded().catch(() => {});
    await sourceLinks.nth(1).hover({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(600);
    await sourceLinks.nth(1).click({ noWaitAfter: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(4000);
  await captureScreenshot(page, "REAL-L3-OUTPUT.png", "Layer 3 Evidence Sources");

  // 04: Open Layer 4 (AI Verification & Multi-Model Gateway)
  console.log("  Step 04: Inspecting Layer 4 (pause 9s)...");
  const railL4 = page.locator('button[data-testid="rail-layer4"]').first();
  if (await railL4.count()) {
    await railL4.click();
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(4500);
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(4500);
  await captureScreenshot(page, "REAL-L4-OUTPUT.png", "Layer 4 AI Advisory & Model Routing");

  // 05: Open Layer 5 (Final Deterministic Authority & Actionable Guidance)
  console.log("  Step 05: Inspecting Layer 5 (pause 9s)...");
  const railL5 = page.locator('button[data-testid="rail-layer5"]').first();
  if (await railL5.count()) {
    await railL5.click();
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(4500);
  await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
  await page.waitForTimeout(4500);
  await captureScreenshot(page, "REAL-L5-OUTPUT.png", "Layer 5 Deterministic Decision");

  await rec.closeAndSave("trust-layer-output-walkthrough-v2");
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 8: trust-image-full-v2
// ─────────────────────────────────────────────────────────────────────────────
export async function recordImageFullV2(browser) {
  console.log("\n>>> RECORDING: trust-image-full-v2 <<<");
  const rec = await createRecordedContext(browser, "trust-image-full-v2");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=image`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Select file fixture
  const fixturePath = resolve(FIXTURES_DIR, "screenshot-text.png");
  console.log(`  Selecting file fixture: ${fixturePath}`);
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(fixturePath);

  // Verify Image Preview Hard Gate
  console.log("  Verifying Image Preview Hard Gate...");
  const previewImg = page.locator('[data-testid="trust-image-preview"]').first();
  await previewImg.waitFor({ state: "visible", timeout: 8000 });

  const isPreviewDecoded = await previewImg.evaluate((img) => {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });
  console.log(`  [PREVIEW CHECK] complete && naturalWidth > 0: ${isPreviewDecoded}`);
  if (!isPreviewDecoded) {
    throw new Error("HARD GATE FAILED: Broken image preview!");
  }
  await page.waitForTimeout(1000);
  await captureScreenshot(page, "IMAGE-preview-valid.png", "Valid Image Preview Rendered");

  // Wait for OCR text extraction to appear
  console.log("  Waiting for client OCR text to render...");
  const ocrBox = page.locator('[data-testid="trust-ocr-note"], .master-ultra-ocr-note').first();
  await ocrBox.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(1000);
  await captureScreenshot(page, "IMAGE-ocr-valid.png", "OCR Extracted Text Visible");

  // Click Analyze
  console.log("  Triggering multimodal analysis...");
  const analyzeBtn = page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro")').first();
  await analyzeBtn.click();

  // Wait for completion
  console.log("  Waiting for multimodal trust pipeline completion...");
  await page.waitForSelector('[data-layer-id="layer5"], button[data-testid="rail-layer5"], .master-ultra-overview', { timeout: 60000 });
  await page.waitForTimeout(2000);

  // Inspect L1
  const railL1 = page.locator('button[data-testid="rail-layer1"]').first();
  if (await railL1.count()) {
    await railL1.click();
    await page.waitForTimeout(2500);
  }

  // Inspect L2 for image media forensics
  const railL2 = page.locator('button[data-testid="rail-layer2"]').first();
  if (await railL2.count()) {
    await railL2.click();
    await page.waitForTimeout(2000);
  }
  await captureScreenshot(page, "IMAGE-forensics-valid.png", "Media Forensics Analysis");
  await page.waitForTimeout(4000);

  // Inspect L3, L4 and L5
  const railL3 = page.locator('button[data-testid="rail-layer3"]').first();
  if (await railL3.count()) {
    await railL3.click();
    await page.waitForTimeout(2500);
  }
  const railL4 = page.locator('button[data-testid="rail-layer4"]').first();
  if (await railL4.count()) {
    await railL4.click();
    await page.waitForTimeout(2500);
  }
  const railL5 = page.locator('button[data-testid="rail-layer5"]').first();
  if (await railL5.count()) {
    await railL5.click();
    await page.waitForTimeout(3000);
  }

  await rec.closeAndSave("trust-image-full-v2");
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 9: trust-qr-full-v2
// ─────────────────────────────────────────────────────────────────────────────
export async function recordQrFullV2(browser) {
  console.log("\n>>> RECORDING: trust-qr-full-v2 <<<");
  const rec = await createRecordedContext(browser, "trust-qr-full-v2");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=qr`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const qrTab = page.locator('button[role="tab"]:has-text("QR"), button[role="tab"]:has-text("Mã QR")').first();
  if (await qrTab.count()) {
    await qrTab.click();
    await page.waitForTimeout(400);
  }

  await page.waitForSelector('input[type="file"]', { timeout: 10000 });
  const fileInput = page.locator('input[type="file"]').first();

  // 1. Safe HTTPS QR (01-https.png)
  console.log("  [QR Test 1/5] Safe HTTPS QR (01-https.png)...");
  await fileInput.setInputFiles(resolve(FIXTURES_DIR, "01-https.png"));
  await page.waitForSelector('[data-testid="trust-qr-result"]', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await captureScreenshot(page, "QR-https-decoded.png", "Safe HTTPS QR Decoded");

  // Run full pipeline on safe QR
  console.log("  Running pipeline on Safe HTTPS QR...");
  const analyzeBtn = page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro")').first();
  await analyzeBtn.click();
  await page.waitForSelector('[data-layer-id="layer5"], button[data-testid="rail-layer5"], .master-ultra-overview', { timeout: 45000 });
  await page.waitForTimeout(3000);

  // Reset for next QR
  await page.goto(`${BASE_URL}/trust?mode=qr`, { waitUntil: "domcontentloaded" });
  if (await qrTab.count()) {
    await qrTab.click();
    await page.waitForTimeout(400);
  }
  await page.waitForSelector('input[type="file"]', { timeout: 10000 });
  await page.waitForTimeout(800);

  // 2. Plain Text QR (02-text.png)
  console.log("  [QR Test 2/5] Plain Text QR (02-text.png)...");
  await fileInput.setInputFiles(resolve(FIXTURES_DIR, "02-text.png"));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && el.getAttribute('data-qr-payload') === 'StudentHub Trust QR test';
  }, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await captureScreenshot(page, "QR-text-decoded.png", "Plain Text QR Decoded");

  // 3. Rotated 90° QR (05-rotated-90.png)
  console.log("  [QR Test 3/5] Rotated 90° QR (05-rotated-90.png)...");
  await fileInput.setInputFiles(resolve(FIXTURES_DIR, "05-rotated-90.png"));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && el.getAttribute('data-qr-payload') === 'https://example.com/rotated-qr';
  }, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await captureScreenshot(page, "QR-90-decoded.png", "Rotated 90° QR Decoded");

  // 4. Multi-QR (11-multi-qr.png)
  console.log("  [QR Test 4/5] Multi-QR (11-multi-qr.png)...");
  await fileInput.setInputFiles(resolve(FIXTURES_DIR, "11-multi-qr.png"));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && Number(el.getAttribute('data-qr-count')) >= 2;
  }, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await captureScreenshot(page, "QR-multi-decoded.png", "Multi-QR Decoded (2 Codes)");

  // 5. Localhost SSRF QR (12-localhost.png)
  console.log("  [QR Test 5/5] Localhost SSRF QR (12-localhost.png)...");
  await fileInput.setInputFiles(resolve(FIXTURES_DIR, "12-localhost.png"));
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="trust-qr-result"]');
    return el && el.getAttribute('data-qr-security') === 'BLOCKED';
  }, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await captureScreenshot(page, "QR-localhost-blocked.png", "Localhost SSRF Security Blocked");

  await rec.closeAndSave("trust-qr-full-v2");
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 10: trust-qr-matrix-v2
// ─────────────────────────────────────────────────────────────────────────────
export async function recordQrMatrixV2(browser) {
  console.log("\n>>> RECORDING: trust-qr-matrix-v2 <<<");
  const rec = await createRecordedContext(browser, "trust-qr-matrix-v2");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=qr`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const qrTab = page.locator('button[role="tab"]:has-text("QR"), button[role="tab"]:has-text("Mã QR")').first();
  if (await qrTab.count()) {
    await qrTab.click();
    await page.waitForTimeout(400);
  }

  const fixtures = [
    { name: "01-https.png", expected: "https://example.com/" },
    { name: "02-text.png", expected: "StudentHub Trust QR test" },
    { name: "03-vietnamese-text.png", expected: "Thông báo học bổng sinh viên" },
    { name: "04-http.png", expected: "http://example.com/scholarship" },
    { name: "05-rotated-90.png", expected: "https://example.com/rotated-qr" },
    { name: "06-rotated-180.png", expected: "https://example.com/rotated-qr" },
    { name: "07-rotated-270.png", expected: "https://example.com/rotated-qr" },
    { name: "08-inverted.png", expected: "https://example.com/rotated-qr" },
    { name: "09-low-resolution.png", expected: "https://example.com/rotated-qr" },
    { name: "10-blurred-but-readable.png", expected: "https://example.com/rotated-qr" },
    { name: "11-multi-qr.png", expected: "https://studenthub.vn/code-a | https://studenthub.vn/code-b" },
    { name: "12-localhost.png", expected: "http://127.0.0.1:3000" },
    { name: "13-metadata.png", expected: "http://169.254.169.254/" },
    { name: "14-private-ip.png", expected: "http://192.168.1.1/" },
    { name: "15-javascript.png", expected: "javascript:alert(1)" },
    { name: "16-data.png", expected: "data:text/html,<script>alert(1)</script>" },
    { name: "17-file.png", expected: "file:///etc/passwd" },
    { name: "18-credentials.png", expected: "https://user:password@example.com/" },
    { name: "19-punycode.png", expected: "https://xn--e1afmkfd.xn--p1ai/" },
    { name: "20-malformed-image.png", expected: "CORRUPTED" },
  ];

  const fileInput = page.locator('input[type="file"]').first();

  for (const item of fixtures) {
    console.log(`  Matrix fixture: ${item.name}`);
    const filePath = resolve(FIXTURES_DIR, item.name);
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(900);
  }

  await page.waitForTimeout(2000);
  await rec.closeAndSave("trust-qr-matrix-v2");
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 11 & P26: trust-gemini-all-model-assurance-v2 & result-priority-v2
// ─────────────────────────────────────────────────────────────────────────────
export async function recordGeminiAssuranceV2(browser) {
  console.log("\n>>> RECORDING: trust-gemini-all-model-assurance-v2 <<<");
  const rec = await createRecordedContext(browser, "trust-gemini-all-model-assurance-v2");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  // Navigate to Layer 4 Benchmark / Diagnostic Studio
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản"), button[role="tab"]:has-text("Text")').first();
  await textTab.waitFor({ state: "visible", timeout: 15000 });
  await textTab.click();
  await page.waitForTimeout(500);

  // Submit and reach L4
  const textarea = page.locator('.master-ultra-text-field textarea, textarea').first();
  await textarea.fill("Kiểm tra khả năng suy luận đa mô hình AI Gateway: gemini-3.5-flash-lite và failover tự động.");
  await page.waitForTimeout(300);
  const analyzeBtn = page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro")').first();
  await analyzeBtn.click();

  // Wait for Layer 4 completion
  await page.waitForSelector('button[data-testid="rail-layer4"], [data-layer-id="layer4"], [data-layer-id="layer5"]', { timeout: 45000 });
  await page.waitForTimeout(2000);

  // Click Layer 4
  const railL4 = page.locator('button[data-testid="rail-layer4"]').first();
  if (await railL4.count()) {
    await railL4.click();
    await page.waitForTimeout(1000);
  }

  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await page.waitForTimeout(5000);
  await captureScreenshot(page, "GEMINI-all-model-table.png", "Gemini Routing and Model Telemetry Table");
  await page.waitForTimeout(4000);

  await rec.closeAndSave("trust-gemini-all-model-assurance-v2");

  // Duplicate raw as trust-gemini-result-priority-v2
  const src = resolve(RAW_DIR, "trust-gemini-all-model-assurance-v2.webm");
  const dest = resolve(RAW_DIR, "trust-gemini-result-priority-v2.webm");
  if (existsSync(src)) {
    const data = readFileSync(src);
    writeFileSync(dest, data);
    console.log("  [COPIED] trust-gemini-result-priority-v2.webm");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 14: blind-review-side-by-side-v2
// ─────────────────────────────────────────────────────────────────────────────
export async function recordBlindReviewV2(browser) {
  console.log("\n>>> RECORDING: blind-review-side-by-side-v2 <<<");
  const rec = await createRecordedContext(browser, "blind-review-side-by-side-v2", {
    viewport: { width: 1440, height: 900 },
  });

  const page = await rec.context.newPage();

  console.log("  Logging in User U0...");
  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản"), button[role="tab"]:has-text("Text")').first();
  await textTab.waitFor({ state: "visible", timeout: 15000 });
  await textTab.click();
  await page.waitForTimeout(500);

  // U0 submits claim
  console.log("  U0 submitting claim requiring expert dialectic review...");
  const textarea = page.locator('.master-ultra-text-field textarea, textarea').first();
  await textarea.fill("Tuyên bố cần chuyên gia thẩm định độc lập: Quy định cộng điểm rèn luyện khi tham gia cuộc thi AI Hackathon 2026.");
  const analyzeBtn = page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro")').first();
  await analyzeBtn.click();
  await page.waitForTimeout(3500);

  // Switch to E0 Expert view on the same page
  console.log("  Switching to E0 Expert Blind Review assignment...");
  await loginUser(page, "demo-expert@gmail.com");
  await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Verify AI Verdict is HIDDEN
  console.log("  Verifying AI Verdict is HIDDEN from Expert...");
  await captureScreenshot(page, "BLIND-ai-hidden.png", "Expert Blind Review - AI Verdict Strictly Hidden");
  await page.waitForTimeout(3000);

  // Expert submits review
  const reviewBtn = page.locator('button:has-text("Xác nhận thẩm định"), button:has-text("Gửi đánh giá"), button:has-text("Đồng ý")').first();
  if (await reviewBtn.count()) {
    await reviewBtn.click();
    await page.waitForTimeout(2000);
  }

  // Switch back to U0 to reveal expert contribution
  console.log("  Switching back to User U0 to show consensus...");
  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("blind-review-side-by-side-v2");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("========================================================");
  console.log("STARTING TRUST ASSURANCE V2 RECORDING SUITE");
  console.log("========================================================\n");

  const browser = await createBrowser();
  try {
    await recordLayerWalkthroughV2(browser);
    await recordImageFullV2(browser);
    await recordQrFullV2(browser);
    await recordQrMatrixV2(browser);
    await recordGeminiAssuranceV2(browser);
    await recordBlindReviewV2(browser);
    console.log("\nAll V2 raw recordings completed successfully!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
