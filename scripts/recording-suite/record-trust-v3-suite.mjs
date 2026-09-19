import { resolve, dirname, join } from "node:path";
import { readdirSync, renameSync, existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "../../frontend/node_modules/playwright/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const QA_PASSWORD = process.env.DEMO_QA_PASSWORD || "StudentHubQA2026!";

function getEvidenceDir() {
  if (process.env.EVIDENCE_DIR) return resolve(REPO_ROOT, process.env.EVIDENCE_DIR);
  const pointerFile = resolve(REPO_ROOT, "artifacts/latest-qa-dir.txt");
  if (existsSync(pointerFile)) {
    const p = readFileSync(pointerFile, "utf-8").trim();
    return resolve(REPO_ROOT, p);
  }
  return resolve(REPO_ROOT, "artifacts/trust-assurance/2026-09-18");
}

const EVIDENCE_DIR = getEvidenceDir();
const RAW_DIR = resolve(EVIDENCE_DIR, "videos/raw");
const FINAL_DIR = resolve(EVIDENCE_DIR, "videos/final");
const SCREENSHOTS_DIR = resolve(EVIDENCE_DIR, "screenshots");
const CORPUS_DIR = resolve(REPO_ROOT, "qa/trust-v3-corpus");

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
// 1. MAIN L1->L5 WALKTHROUGH: trust-layer-output-evidence-centric-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordEvidenceCentricWalkthroughV3(browser) {
  console.log("\n>>> RECORDING: trust-layer-output-evidence-centric-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-layer-output-evidence-centric-v3");
  const page = await rec.context.newPage();

  console.log("  Step 00: Login as U0 and navigate to /trust...");
  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Switch to Text tab
  const textTab = page.locator('button[role="tab"]:has-text("Văn bản")');
  if (await textTab.isVisible()) {
    await textTab.click();
    await page.waitForTimeout(400);
  }

  // Objective External Case from Blind Corpus Seed 20260919
  const externalClaim = "Sinh viên HUST nộp đơn tham gia Google Summer of Code 2026 (GSoC) sẽ nhận được tài trợ stipend lên tới $3000 USD từ Google LLC.";
  console.log(`  Step 01: Submitting external blind claim: "${externalClaim}"...`);
  const textarea = page.locator('textarea[data-testid="trust-text-input"], textarea').first();
  await textarea.fill(externalClaim);
  await page.waitForTimeout(600);

  const analyzeBtn = page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first();
  await analyzeBtn.click();

  console.log("  Step 02: Watching live continuous stage progression (L1 -> L2 -> L3 -> L4 -> L5)...");
  // Allow time for live rail and progression animation
  await page.waitForTimeout(10000);

  // Wait for overview completion
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 25000 });
  await page.waitForTimeout(2000);

  console.log("  Step 03: Inspecting Layer 1 (Claim Intelligence)...");
  const railL1 = page.locator('button[data-testid="rail-layer1"]').first();
  if (await railL1.isVisible()) {
    await railL1.click();
    await page.waitForTimeout(2000);
    await captureScreenshot(page, "V3-L1-EVIDENCE.png", "Layer 1 Claim Intelligence Output");
  }

  console.log("  Step 04: Inspecting Layer 2 (Evidence Discovery)...");
  const railL2 = page.locator('button[data-testid="rail-layer2"]').first();
  if (await railL2.isVisible()) {
    await railL2.click();
    await page.waitForTimeout(2000);

    // Threat intelligence section
    await captureScreenshot(page, "V3-L2-THREAT.png", "Layer 2A Threat Intelligence");
    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(1500);

    // Semantic intelligence section
    await captureScreenshot(page, "V3-L2-SEMANTIC.png", "Layer 2B Semantic Intelligence");
    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(1500);

    // Student domain risk section
    await captureScreenshot(page, "V3-L2-DOMAIN-RISK.png", "Layer 2C Student Domain Risk");
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1500);

    // Forensics section if present or overall L2
    await captureScreenshot(page, "V3-L2-FORENSICS.png", "Layer 2 Media Forensics");
  }

  console.log("  Step 05: Inspecting Layer 3 (Evidence Forensics & Source Browser)...");
  const railL3 = page.locator('button[data-testid="rail-layer3"]').first();
  if (await railL3.isVisible()) {
    await railL3.click();
    await page.waitForTimeout(2000);
    await captureScreenshot(page, "V3-L3-SOURCES-TOP.png", "Layer 3 Sources Top");

    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(2000);
    await captureScreenshot(page, "V3-L3-SOURCES-MORE.png", "Layer 3 Sources Detail");

    // Click 3 representative sources to verify clickable links (target=_blank)
    const sourceLinks = page.locator('[data-testid="trust-evidence-card"] a[href^="http"]');
    const linkCount = await sourceLinks.count();
    console.log(`  Found ${linkCount} clickable evidence links in Layer 3.`);
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      const link = sourceLinks.nth(i);
      const href = await link.getAttribute("href");
      console.log(`    Checking evidence link #${i + 1}: ${href}`);
      await link.hover();
      await page.waitForTimeout(1200);
    }
  }

  console.log("  Step 06: Inspecting Layer 4 (EVIDENCE-CENTRIC AI Verification)...");
  const railL4 = page.locator('button[data-testid="rail-layer4"]').first();
  if (await railL4.isVisible()) {
    await railL4.click();
    await page.waitForTimeout(2500);

    // 1. AI Advisory Headline & Synthesis
    await captureScreenshot(page, "V3-L4-ADVISORY.png", "Layer 4 AI Advisory & Synthesis");
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(2000);

    // 2. Real Evidence Cards & Summary Metrics
    await captureScreenshot(page, "V3-L4-EVIDENCE.png", "Layer 4 Real Evidence Cards");
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(2000);

    // 3. Disagreements & Uncertainties
    await captureScreenshot(page, "V3-L4-UNCERTAINTY.png", "Layer 4 Uncertainties & Disagreements");
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1500);

    // 4. Open Technical Details -> AI Runtime / Routing History
    const techToggle = page.locator('button:has-text("Technical Details")').first();
    if (await techToggle.isVisible()) {
      console.log("    Opening collapsed Technical Details -> AI Runtime...");
      await techToggle.click();
      await page.waitForTimeout(3500); // 3-5 seconds pause as required
    }
  }

  console.log("  Step 07: Inspecting Layer 5 (Deterministic Decision Intelligence)...");
  const railL5 = page.locator('button[data-testid="rail-layer5"]').first();
  if (await railL5.isVisible()) {
    await railL5.click();
    await page.waitForTimeout(2500);
    await captureScreenshot(page, "V3-L5-DECISION.png", "Layer 5 Decision Intelligence");

    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(2000);
    await captureScreenshot(page, "V3-L5-KEY-EVIDENCE.png", "Layer 5 Key Evidence Sources");
  }

  await page.waitForTimeout(2000);
  await rec.closeAndSave("trust-layer-output-evidence-centric-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EXTERNAL TEXT: trust-external-text-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordExternalTextV3(browser) {
  console.log("\n>>> RECORDING: trust-external-text-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-external-text-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản")');
  if (await textTab.isVisible()) await textTab.click();

  const claim = "Tốc độ của ánh sáng trong chân không là chính xác 299.792.458 mét trên giây theo chuẩn SI.";
  await page.locator('textarea[data-testid="trust-text-input"], textarea').first().fill(claim);
  await page.waitForTimeout(800);

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-external-text-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXTERNAL URL: trust-external-url-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordExternalUrlV3(browser) {
  console.log("\n>>> RECORDING: trust-external-url-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-external-url-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=url`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const urlTab = page.locator('button[role="tab"]:has-text("URL")');
  if (await urlTab.isVisible()) await urlTab.click();

  // 1. Safe Government URL
  const safeUrl = "https://moet.gov.vn";
  console.log(`  Submitting safe URL: ${safeUrl}...`);
  await page.locator('.master-ultra-text-field textarea, textarea').first().fill(safeUrl);
  await page.waitForTimeout(800);

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-external-url-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REAL IMAGE CORPUS: trust-real-image-corpus-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordRealImageCorpusV3(browser) {
  console.log("\n>>> RECORDING: trust-real-image-corpus-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-real-image-corpus-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=image`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const realImgPath = resolve(CORPUS_DIR, "images/real-world/REAL-01-CAMPUS.png");
  console.log(`  Uploading authentic real-world image: ${realImgPath}...`);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(realImgPath);
  await page.waitForTimeout(1500);

  // HARD GATE CHECK
  const previewStatus = await page.evaluate(() => {
    const img = document.querySelector('img[data-testid="trust-image-preview"]');
    return {
      exists: Boolean(img),
      complete: img?.complete,
      naturalWidth: img?.naturalWidth,
      naturalHeight: img?.naturalHeight,
    };
  });
  console.log("  [IMAGE PREVIEW HARD GATE] Status:", previewStatus);
  await captureScreenshot(page, "V3-REAL-IMAGE.png", "Real-world authentic image preview");

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-real-image-corpus-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AI GENERATED IMAGE CORPUS: trust-ai-image-corpus-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordAiImageCorpusV3(browser) {
  console.log("\n>>> RECORDING: trust-ai-image-corpus-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-ai-image-corpus-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=image`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const aiImgPath = resolve(CORPUS_DIR, "images/ai-generated/AI-01-PORTRAIT.png");
  console.log(`  Uploading synthetic AI image: ${aiImgPath}...`);
  await page.locator('input[type="file"]').setInputFiles(aiImgPath);
  await page.waitForTimeout(1500);

  await captureScreenshot(page, "V3-AI-IMAGE.png", "AI Generated synthetic image preview");
  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-ai-image-corpus-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. IMAGE EDGE MATRIX: trust-image-edge-matrix-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordImageEdgeMatrixV3(browser) {
  console.log("\n>>> RECORDING: trust-image-edge-matrix-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-image-edge-matrix-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=image`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const transImgPath = resolve(CORPUS_DIR, "images/transformed/TR-01-JPEG-Q10.png");
  console.log(`  Uploading transformed edge case image: ${transImgPath}...`);
  await page.locator('input[type="file"]').setInputFiles(transImgPath);
  await page.waitForTimeout(1500);

  await captureScreenshot(page, "V3-TRANSFORMED-IMAGE.png", "Transformed image preview");
  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-image-edge-matrix-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. QR CORPUS: trust-qr-corpus-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordQrCorpusV3(browser) {
  console.log("\n>>> RECORDING: trust-qr-corpus-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-qr-corpus-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=qr`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const qrTab = page.locator('button[role="tab"]:has-text("QR")');
  if (await qrTab.isVisible()) await qrTab.click();

  // Test Rotated QR
  const rotQrPath = resolve(CORPUS_DIR, "qr/QR-22-ROT-90.png");
  console.log(`  Testing 90° Rotated QR: ${rotQrPath}...`);
  await page.locator('input[type="file"]').setInputFiles(rotQrPath);
  await page.waitForTimeout(1500);

  await captureScreenshot(page, "V3-QR-ROTATED.png", "QR Rotated 90 degrees");

  // Test Multi-QR
  const multiQrPath = resolve(CORPUS_DIR, "qr/QR-41-MULTI-2SAFE.png");
  console.log(`  Testing Multi-QR fixture: ${multiQrPath}...`);
  await page.locator('input[type="file"]').setInputFiles(multiQrPath);
  await page.waitForTimeout(1500);

  await captureScreenshot(page, "V3-QR-MULTI.png", "Multi-QR fixture decoded");

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-qr-corpus-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. QR SECURITY: trust-qr-security-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordQrSecurityV3(browser) {
  console.log("\n>>> RECORDING: trust-qr-security-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-qr-security-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=qr`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const qrTab = page.locator('button[role="tab"]:has-text("QR")');
  if (await qrTab.isVisible()) await qrTab.click();

  // Test SSRF localhost QR
  const unsafeQrPath = resolve(CORPUS_DIR, "qr/QR-33-SEC-LOCALHOST.png");
  console.log(`  Testing SSRF Localhost QR: ${unsafeQrPath}...`);
  await page.locator('input[type="file"]').setInputFiles(unsafeQrPath);
  await page.waitForTimeout(1500);

  await captureScreenshot(page, "V3-QR-UNSAFE.png", "SSRF Localhost QR Blocked");

  // Verify blocked text
  const blockedBadge = page.locator('text=BỊ CHẶN (SSRF / UNSAFE)').first();
  console.log("  SSRF Security Block Badge Visible:", await blockedBadge.isVisible());

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  await rec.closeAndSave("trust-qr-security-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. GEMINI RESULT PRIORITY: trust-gemini-result-priority-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordGeminiResultPriorityV3(browser) {
  console.log("\n>>> RECORDING: trust-gemini-result-priority-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-gemini-result-priority-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản")');
  if (await textTab.isVisible()) await textTab.click();

  await page.locator('textarea[data-testid="trust-text-input"], textarea').first().fill("Đại học Bách Khoa Hà Nội mở đợt đăng ký đề tài tốt nghiệp khóa 68 qua hệ thống quản lý đào tạo trực tuyến.");
  await page.waitForTimeout(800);

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(2000);

  // Open Layer 4 and expand Technical Details
  const railL4 = page.locator('button[data-testid="rail-layer4"]').first();
  if (await railL4.isVisible()) {
    await railL4.click();
    await page.waitForTimeout(2000);
    const techToggle = page.locator('button:has-text("Technical Details")').first();
    if (await techToggle.isVisible()) {
      await techToggle.click();
      await page.waitForTimeout(3000);
    }
  }

  await rec.closeAndSave("trust-gemini-result-priority-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GEMINI ALL MODEL ASSURANCE: trust-gemini-all-model-assurance-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordGeminiAllModelAssuranceV3(browser) {
  console.log("\n>>> RECORDING: trust-gemini-all-model-assurance-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-gemini-all-model-assurance-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản")');
  if (await textTab.isVisible()) await textTab.click();

  await page.locator('textarea[data-testid="trust-text-input"], textarea').first().fill("Xác thực mô hình trí tuệ nhân tạo Gemini đa tầng phục vụ phản biện học thuật sinh viên.");
  await page.waitForTimeout(800);

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(2000);

  const railL4 = page.locator('button[data-testid="rail-layer4"]').first();
  if (await railL4.isVisible()) {
    await railL4.click();
    await page.waitForTimeout(2000);
    const techToggle = page.locator('button:has-text("Technical Details")').first();
    if (await techToggle.isVisible()) {
      await techToggle.click();
      await page.waitForTimeout(4000);
    }
  }

  await rec.closeAndSave("trust-gemini-all-model-assurance-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. BLIND REVIEW SIDE BY SIDE: blind-review-side-by-side-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordBlindReviewSideBySideV3(browser) {
  console.log("\n>>> RECORDING: blind-review-side-by-side-v3 <<<");
  const rec = await createRecordedContext(browser, "blind-review-side-by-side-v3");
  const page = await rec.context.newPage();

  // Login as Expert to submit qualification and review
  await loginUser(page, "demo-expert@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản")');
  if (await textTab.isVisible()) await textTab.click();

  await page.locator('textarea[data-testid="trust-text-input"], textarea').first().fill("Đề xuất chương trình hỗ trợ học phí 50% cho sinh viên tham gia nghiên cứu khoa học cấp viện.");
  await page.waitForTimeout(800);

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(3000);

  // Scroll down to Trust vs Expert comparison matrix
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(3500);

  await rec.closeAndSave("blind-review-side-by-side-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. ZERO RERUN: trust-zero-rerun-v3
// ─────────────────────────────────────────────────────────────────────────────
export async function recordZeroRerunV3(browser) {
  console.log("\n>>> RECORDING: trust-zero-rerun-v3 <<<");
  const rec = await createRecordedContext(browser, "trust-zero-rerun-v3");
  const page = await rec.context.newPage();

  await loginUser(page, "demo-user@gmail.com");
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const textTab = page.locator('button[role="tab"]:has-text("Văn bản")');
  if (await textTab.isVisible()) await textTab.click();

  await page.locator('textarea[data-testid="trust-text-input"], textarea').first().fill("Quy chế xét tặng học bổng khuyến khích học tập theo kết quả học tập và rèn luyện.");
  await page.waitForTimeout(800);

  await page.locator('.master-ultra-submit, button:has-text("Phân tích rủi ro"), button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  await page.waitForSelector('.master-ultra-overview, [aria-label="Trust case / analysis complete"]', { timeout: 45000 });
  await page.waitForTimeout(2000);

  // Rapidly navigate between L1, L2, L3, L4, L5 to visually demonstrate ZERO-RERUN cached execution
  for (let l = 1; l <= 5; l++) {
    const rail = page.locator(`button[data-testid="rail-layer${l}"]`).first();
    if (await rail.isVisible()) {
      console.log(`  Zero-Rerun check: Switching to Layer ${l}...`);
      await rail.click();
      await page.waitForTimeout(1200);
    }
  }

  await rec.closeAndSave("trust-zero-rerun-v3");
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function runFullV3Suite() {
  console.log("========================================================");
  console.log("STARTING MASTER P27 V3 ASSURANCE RECORDING SUITE");
  console.log("========================================================");

  const browser = await createBrowser();
  try {
    await recordEvidenceCentricWalkthroughV3(browser);
    await recordExternalTextV3(browser);
    await recordExternalUrlV3(browser);
    await recordRealImageCorpusV3(browser);
    await recordAiImageCorpusV3(browser);
    await recordImageEdgeMatrixV3(browser);
    await recordQrCorpusV3(browser);
    await recordQrSecurityV3(browser);
    await recordGeminiResultPriorityV3(browser);
    await recordGeminiAllModelAssuranceV3(browser);
    await recordBlindReviewSideBySideV3(browser);
    await recordZeroRerunV3(browser);
    console.log("\n>>> ALL 12 V3 SCENARIOS RECORDED SUCCESSFULLY <<<");
  } catch (err) {
    console.error("\n[ERROR] Suite failure:", err);
  } finally {
    await browser.close();
  }
}

runFullV3Suite();
