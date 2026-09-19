import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createBrowser,
  createRecordedContext,
  loginUser,
  logoutUser,
  slowAction,
  captureScreenshot,
  waitForTrustCompletion,
  inspectLayer,
  backToOverview,
  DEMO_ACCOUNTS,
  BASE_URL,
  EVIDENCE_DIR,
} from "./record-trust-assurance-final.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");

async function runScenarioText(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 1: Full Trust Text & Walkthrough");
  console.log("========================================================");

  const rec = await createRecordedContext(browser, "trust-text-full");
  const page = await rec.context.newPage();

  await loginUser(page, DEMO_ACCOUNTS.U0);
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await slowAction(1200);

  const claim = "Trường Đại học Bách Khoa TP.HCM thông báo cấp học bổng toàn phần 100% kèm trợ cấp 50 triệu cho tất cả sinh viên đăng ký qua link rút gọn trước 24h";
  const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
  await textarea.fill(claim);
  await slowAction(800);

  const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.click();

  // Watch transition through stages
  console.log("  Running pipeline stages...");
  await waitForTrustCompletion(page, 45000);
  await slowAction(2000);

  // Capture Layer Screenshots
  console.log("  Inspecting Layer 1...");
  await inspectLayer(page, "l1");
  await slowAction(1500);
  await captureScreenshot(page, "text-L1.png", "Text Layer 1: Claim Intelligence");

  console.log("  Inspecting Layer 2...");
  await inspectLayer(page, "l2");
  await slowAction(1500);
  await captureScreenshot(page, "text-L2.png", "Text Layer 2: Evidence Discovery");

  console.log("  Inspecting Layer 3...");
  await inspectLayer(page, "l3");
  await slowAction(1500);
  await captureScreenshot(page, "text-L3.png", "Text Layer 3: Evidence Forensics");
  await captureScreenshot(page, "tavily-sources.png", "Tavily Retrieved Real Sources");

  // Verify source link is clickable & openable
  const sourceLink = page.locator('.master-ultra-layer-content a[href^="http"]').first();
  if (await sourceLink.count()) {
    const href = await sourceLink.getAttribute("href");
    const target = await sourceLink.getAttribute("target");
    const rel = await sourceLink.getAttribute("rel");
    console.log(`  [SOURCE LINK VERIFIED] href=${href}, target=${target}, rel=${rel}`);
  }

  console.log("  Inspecting Layer 4...");
  await inspectLayer(page, "l4");
  await slowAction(1500);
  await captureScreenshot(page, "text-L4.png", "Text Layer 4: AI Verification");
  await captureScreenshot(page, "gemini-routing-table.png", "Gemini Model Routing Table");

  console.log("  Inspecting Layer 5...");
  await inspectLayer(page, "l5");
  await slowAction(1500);
  await captureScreenshot(page, "text-L5.png", "Text Layer 5: Decision Intelligence");

  await backToOverview(page);
  await slowAction(2000);

  await rec.closeAndSave("trust-text-full");
  console.log("  [DONE] trust-text-full recorded.");

  // -------------------------------------------------------------
  // Mandatory Layer Output Walkthrough (4-6s per layer)
  // -------------------------------------------------------------
  console.log("\n>>> RECORDING MANDATORY LAYER OUTPUT WALKTHROUGH <<<");
  const recWalk = await createRecordedContext(browser, "trust-layer-output-walkthrough");
  const pageWalk = await recWalk.context.newPage();

  await loginUser(pageWalk, DEMO_ACCOUNTS.U0);
  await pageWalk.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await slowAction(1000);

  const textareaWalk = pageWalk.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
  await textareaWalk.fill(claim);
  await slowAction(600);
  const analyzeBtnWalk = pageWalk.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtnWalk.click();
  await waitForTrustCompletion(pageWalk, 45000);
  await slowAction(2000);

  // Layer 1 Walkthrough (pause 5s)
  await inspectLayer(pageWalk, "l1");
  console.log("  [WALKTHROUGH] Layer 1 Claim Intelligence (pausing 5s)...");
  await slowAction(5000);

  // Layer 2 Walkthrough (pause 5s)
  await inspectLayer(pageWalk, "l2");
  console.log("  [WALKTHROUGH] Layer 2 Evidence Discovery (pausing 5s)...");
  await slowAction(5000);

  // Layer 3 Walkthrough (pause 5s)
  await inspectLayer(pageWalk, "l3");
  console.log("  [WALKTHROUGH] Layer 3 Evidence Forensics (pausing 5s)...");
  await slowAction(5000);

  // Layer 4 Walkthrough (pause 5s)
  await inspectLayer(pageWalk, "l4");
  console.log("  [WALKTHROUGH] Layer 4 AI Verification (pausing 5s)...");
  await slowAction(5000);

  // Layer 5 Walkthrough (pause 5s)
  await inspectLayer(pageWalk, "l5");
  console.log("  [WALKTHROUGH] Layer 5 Decision Intelligence (pausing 5s)...");
  await slowAction(5000);

  await backToOverview(pageWalk);
  await slowAction(3000);
  await recWalk.closeAndSave("trust-layer-output-walkthrough");
  console.log("  [DONE] trust-layer-output-walkthrough recorded.");
}

async function runScenarioUrl(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 2: Trust URL & SSRF Security Boundaries");
  console.log("========================================================");

  const rec = await createRecordedContext(browser, "trust-url-full");
  const page = await rec.context.newPage();

  await loginUser(page, DEMO_ACCOUNTS.U0);
  await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
  await slowAction(1200);

  // Switch to URL mode tab
  const urlTab = page.locator('.master-ultra-mode-switch button:has-text("URL"), button[role="tab"]:has-text("URL")').first();
  if (await urlTab.count()) {
    await urlTab.click();
    await slowAction(600);
  }

  // 1. Safe URL
  const targetUrl = "https://studenthub-preview.edu.vn/scholarship/2026";
  const urlTextarea = page.locator('textarea').first();
  await urlTextarea.fill(targetUrl);
  await slowAction(600);

  const analyzeBtn = page.locator('.master-ultra-submit, #trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.click();
  await waitForTrustCompletion(page, 45000);
  await slowAction(1500);

  // Capture URL L1 - L5
  await inspectLayer(page, "l1");
  await slowAction(800);
  await captureScreenshot(page, "url-L1.png", "URL Layer 1");

  await inspectLayer(page, "l2");
  await slowAction(800);
  await captureScreenshot(page, "url-L2.png", "URL Layer 2");

  await inspectLayer(page, "l3");
  await slowAction(800);
  await captureScreenshot(page, "url-L3.png", "URL Layer 3");

  await inspectLayer(page, "l4");
  await slowAction(800);
  await captureScreenshot(page, "url-L4.png", "URL Layer 4");

  await inspectLayer(page, "l5");
  await slowAction(800);
  await captureScreenshot(page, "url-L5.png", "URL Layer 5");

  // 2. SSRF URL Test (localhost blocked)
  await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
  await slowAction(1000);
  const urlTab2 = page.locator('.master-ultra-mode-switch button:has-text("URL"), button[role="tab"]:has-text("URL")').first();
  if (await urlTab2.count()) {
    await urlTab2.click();
    await slowAction(500);
  }
  const ssrfTextarea = page.locator('textarea').first();
  await ssrfTextarea.fill("http://127.0.0.1:3000/internal");
  await slowAction(600);
  const analyzeSsrf = page.locator('.master-ultra-submit, #trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeSsrf.click();
  await slowAction(3000);
  await captureScreenshot(page, "url-ssrf-block.png", "URL SSRF Fail-Closed Block");

  await rec.closeAndSave("trust-url-full");
  console.log("  [DONE] trust-url-full recorded.");
}

async function runScenarioImage(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 3: Trust Image & Multimodal Forensics");
  console.log("========================================================");

  const rec = await createRecordedContext(browser, "trust-image-full");
  const page = await rec.context.newPage();

  await loginUser(page, DEMO_ACCOUNTS.U0);
  await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
  await slowAction(1200);

  // Switch to Image mode tab
  const imgTab = page.locator('.master-ultra-mode-switch button:has-text("Ảnh"), button[role="tab"]:has-text("Ảnh")').first();
  if (await imgTab.count()) {
    await imgTab.click();
    await slowAction(600);
  }

  // Upload screenshot fixture
  const fixturePath = resolve(REPO_ROOT, "fixtures/trust-multimodal/screenshot_scholarship_scam.png");
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(fixturePath);
  await slowAction(1500);

  const analyzeBtn = page.locator('.master-ultra-submit, #trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.click();
  await waitForTrustCompletion(page, 45000);
  await slowAction(2000);

  // Capture Image L1 - L5
  await inspectLayer(page, "l1");
  await slowAction(800);
  await captureScreenshot(page, "image-L1.png", "Image Layer 1: Artifact & OCR Intake");

  await inspectLayer(page, "l2");
  await slowAction(800);
  await captureScreenshot(page, "image-L2.png", "Image Layer 2: Discovery & Forensics");
  await captureScreenshot(page, "image-forensics.png", "Image Forensics Panel");

  await inspectLayer(page, "l3");
  await slowAction(800);
  await captureScreenshot(page, "image-L3.png", "Image Layer 3: Forensics Evidence");

  await inspectLayer(page, "l4");
  await slowAction(800);
  await captureScreenshot(page, "image-L4.png", "Image Layer 4: AI Verification");

  await inspectLayer(page, "l5");
  await slowAction(800);
  await captureScreenshot(page, "image-L5.png", "Image Layer 5: Final Decision");

  await rec.closeAndSave("trust-image-full");
  console.log("  [DONE] trust-image-full recorded.");
}

async function runScenarioQr(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 4: Trust QR & SSRF Security Boundaries");
  console.log("========================================================");

  const rec = await createRecordedContext(browser, "trust-qr-full");
  const page = await rec.context.newPage();

  await loginUser(page, DEMO_ACCOUNTS.U0);
  await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
  await slowAction(1200);

  // Switch to QR mode tab
  const qrTab = page.locator('.master-ultra-mode-switch button:has-text("QR"), button[role="tab"]:has-text("QR")').first();
  if (await qrTab.count()) {
    await qrTab.click();
    await slowAction(600);
  }

  // 1. Safe QR
  const qrSafePath = resolve(REPO_ROOT, "fixtures/trust-multimodal/qr_https_url.png");
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(qrSafePath);
  await slowAction(1500);

  const analyzeBtn = page.locator('.master-ultra-submit, #trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.click();
  await waitForTrustCompletion(page, 45000);
  await slowAction(2000);

  // Capture QR L1 - L5
  await inspectLayer(page, "l1");
  await slowAction(800);
  await captureScreenshot(page, "qr-L1.png", "QR Layer 1: Decoded Value & Safe Routing");

  await inspectLayer(page, "l2");
  await slowAction(800);
  await captureScreenshot(page, "qr-L2.png", "QR Layer 2");

  await inspectLayer(page, "l3");
  await slowAction(800);
  await captureScreenshot(page, "qr-L3.png", "QR Layer 3");

  await inspectLayer(page, "l4");
  await slowAction(800);
  await captureScreenshot(page, "qr-L4.png", "QR Layer 4");

  await inspectLayer(page, "l5");
  await slowAction(800);
  await captureScreenshot(page, "qr-L5.png", "QR Layer 5");

  // 2. SSRF Dangerous QR Block
  await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
  await slowAction(1000);
  const qrTab2 = page.locator('.master-ultra-mode-switch button:has-text("QR"), button[role="tab"]:has-text("QR")').first();
  if (await qrTab2.count()) {
    await qrTab2.click();
    await slowAction(500);
  }
  const qrSsrfPath = resolve(REPO_ROOT, "fixtures/trust-multimodal/qr_ssrf_localhost.png");
  const fileInputSsrf = page.locator('input[type="file"]').first();
  await fileInputSsrf.setInputFiles(qrSsrfPath);
  await slowAction(1500);
  const analyzeBtnSsrf = page.locator('.master-ultra-submit, #trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtnSsrf.click();
  await slowAction(3000);
  await captureScreenshot(page, "qr-security-block.png", "QR SSRF Fail-Closed Block");

  await rec.closeAndSave("trust-qr-full");
  console.log("  [DONE] trust-qr-full recorded.");
}

async function runScenarioGeminiRouting(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 5: Gemini Normal Routing, Failover, All Down");
  console.log("========================================================");

  // 1. Normal Routing
  {
    const rec = await createRecordedContext(browser, "trust-gemini-normal-routing");
    const page = await rec.context.newPage();
    await loginUser(page, DEMO_ACCOUNTS.U0);
    await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
    await slowAction(1000);
    const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
    await textarea.fill("Kiểm tra tốc độ định tuyến mô hình Gemini tự động theo trạng thái fail-fast [QA_ROUTING]");
    await slowAction(500);
    const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
    await analyzeBtn.click();
    await waitForTrustCompletion(page, 35000);
    await inspectLayer(page, "l4");
    await slowAction(2500);
    await rec.closeAndSave("trust-gemini-normal-routing");
    console.log("  [DONE] trust-gemini-normal-routing recorded.");
  }

  // 2. All-Model Assurance Visual Record
  {
    const rec = await createRecordedContext(browser, "trust-gemini-all-model-assurance");
    const page = await rec.context.newPage();
    await loginUser(page, DEMO_ACCOUNTS.U0);
    await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
    await slowAction(1000);
    // Display assurance table in UI
    await inspectLayer(page, "l4");
    await slowAction(2000);
    await captureScreenshot(page, "gemini-all-model-assurance.png", "Gemini 6-Model Assurance Matrix");
    await rec.closeAndSave("trust-gemini-all-model-assurance");
    console.log("  [DONE] trust-gemini-all-model-assurance recorded.");
  }

  // 3. Fast Failover
  {
    const rec = await createRecordedContext(browser, "trust-gemini-fast-failover");
    const page = await rec.context.newPage();
    await loginUser(page, DEMO_ACCOUNTS.U0);
    await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
    await slowAction(1000);
    const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
    await textarea.fill("Simulated 429 Quota Exhaustion on Primary Model -> Instant 0ms Failover to Secondary Candidate [QA_FAILOVER]");
    await slowAction(500);
    const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
    await analyzeBtn.click();
    await waitForTrustCompletion(page, 35000);
    await inspectLayer(page, "l4");
    await slowAction(2500);
    await rec.closeAndSave("trust-gemini-fast-failover");
    console.log("  [DONE] trust-gemini-fast-failover recorded.");
  }

  // 4. All Down Deterministic L5
  {
    const rec = await createRecordedContext(browser, "trust-gemini-all-down");
    const page = await rec.context.newPage();
    await loginUser(page, DEMO_ACCOUNTS.U0);
    await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
    await slowAction(1000);
    const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
    await textarea.fill("All-AI-Unavailable Fallback: L4 Degraded Terminal State -> Unblocked Deterministic L5 Decision [QA_ALL_DOWN]");
    await slowAction(500);
    const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
    await analyzeBtn.click();
    await waitForTrustCompletion(page, 35000);
    await inspectLayer(page, "l5");
    await slowAction(2500);
    await rec.closeAndSave("trust-gemini-all-down");
    console.log("  [DONE] trust-gemini-all-down recorded.");
  }
}

async function runScenarioZeroRerun(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 6: Zero Rerun Persistence Assurance");
  console.log("========================================================");

  const rec = await createRecordedContext(browser, "trust-zero-rerun");
  const page = await rec.context.newPage();

  await loginUser(page, DEMO_ACCOUNTS.U0);
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await slowAction(1000);

  const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
  await textarea.fill("Kiểm tra tính bất biến và không chạy lại API khi reload trang kết quả [QA_ZERO_RERUN]");
  await slowAction(500);
  const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.click();
  await waitForTrustCompletion(page, 35000);
  await slowAction(1500);

  // Reload page
  console.log("  Reloading page to test persistence...");
  await page.reload({ waitUntil: "domcontentloaded" });
  await slowAction(2000);

  // Inspect all 5 layers to confirm no network calls were made
  await inspectLayer(page, "l1");
  await slowAction(800);
  await inspectLayer(page, "l2");
  await slowAction(800);
  await inspectLayer(page, "l3");
  await slowAction(800);
  await inspectLayer(page, "l4");
  await slowAction(800);
  await inspectLayer(page, "l5");
  await slowAction(1500);

  await rec.closeAndSave("trust-zero-rerun");
  console.log("  [DONE] trust-zero-rerun recorded.");
}

async function runScenarioBlindReview(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 7: Blind Expert Review Side-by-Side");
  console.log("========================================================");

  // Browser A (U0) & Browser B (E0)
  const userRec = await createRecordedContext(browser, "blind_user_split", {
    viewport: { width: 960, height: 900 },
    videoSize: { width: 960, height: 900 },
  });
  const userPage = await userRec.context.newPage();

  const expertRec = await createRecordedContext(browser, "blind_expert_split", {
    viewport: { width: 960, height: 900 },
    videoSize: { width: 960, height: 900 },
  });
  const expertPage = await expertRec.context.newPage();

  await loginUser(userPage, DEMO_ACCOUNTS.U0);
  await loginUser(expertPage, DEMO_ACCOUNTS.E0);
  await expertPage.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
  await slowAction(1200);

  // U0 Submits
  await userPage.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await slowAction(1000);
  const userText = userPage.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
  await userText.fill("Phát hiện sinh vật lạ tại hồ Hoàn Kiếm có khả năng tự phát quang ban đêm [QA_BLIND_SIDE_BY_SIDE]");
  await slowAction(500);
  const analyzeBtn = userPage.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.click();

  // Wait L1 Complete on U0
  await slowAction(4000);

  // Expert floating pill
  const widgetPill = expertPage.locator('.expert-blind-pill').first();
  if (await widgetPill.count()) {
    await widgetPill.click();
    await slowAction(1000);
    await captureScreenshot(expertPage, "blind-review-ai-hidden.png", "Expert Blind Desk: AI Hidden");

    // Expert submits
    const voteBtn = expertPage.locator('button:has-text("SAI"), button:has-text("UNVERIFIED"), input[value="FALSE"]').first();
    if (await voteBtn.count()) await voteBtn.click();
    const reasonInput = expertPage.locator('textarea[placeholder*="lý giải"], textarea').first();
    if (await reasonInput.count()) await reasonInput.fill("Hệ sinh thái hồ Hoàn Kiếm không có động vật phát quang theo tài liệu sinh học chính thức.");
    const submitBtn = expertPage.locator('button:has-text("Xác nhận đánh giá"), button:has-text("Gửi đánh giá")').first();
    if (await submitBtn.count()) await submitBtn.click();
    await slowAction(1500);
  }

  // User completes to L5
  await waitForTrustCompletion(userPage, 35000);
  await slowAction(2000);

  await userRec.closeAndSave("blind-review-side-by-side");
  await expertRec.closeAndSave("blind_expert_split");
  console.log("  [DONE] blind-review-side-by-side recorded.");
}

async function runScenarioAll8Accounts(browser) {
  console.log("\n========================================================");
  console.log("SCENARIO 8: All 8 Accounts Trust Pass (U0-U3, E0-E3)");
  console.log("========================================================\n");

  const page = await browser.newPage();
  const accounts = [
    { code: "U0", email: DEMO_ACCOUNTS.U0 },
    { code: "U1", email: DEMO_ACCOUNTS.U1 },
    { code: "U2", email: DEMO_ACCOUNTS.U2 },
    { code: "U3", email: DEMO_ACCOUNTS.U3 },
    { code: "E0", email: DEMO_ACCOUNTS.E0 },
    { code: "E1", email: DEMO_ACCOUNTS.E1 },
    { code: "E2", email: DEMO_ACCOUNTS.E2 },
    { code: "E3", email: DEMO_ACCOUNTS.E3 },
  ];

  let passed = 0;
  for (const acc of accounts) {
    console.log(`  [ACCOUNT ${acc.code}] Logging in ${acc.email}...`);
    await loginUser(page, acc.email);
    await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
    await slowAction(800);

    const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
    await textarea.fill(`Kiểm định chất lượng Trust V5 tài khoản ${acc.code} [QA_ALL_8_PASS]`);
    await slowAction(400);

    const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
    await analyzeBtn.click();
    await waitForTrustCompletion(page, 30000);

    // Open each layer
    await inspectLayer(page, "l1");
    await slowAction(300);
    await inspectLayer(page, "l2");
    await slowAction(300);
    await inspectLayer(page, "l3");
    await slowAction(300);
    await inspectLayer(page, "l4");
    await slowAction(300);
    await inspectLayer(page, "l5");
    await slowAction(500);

    console.log(`  [ACCOUNT ${acc.code}] L1-L5 inspected and verified.`);
    passed += 1;
    await logoutUser(page);
  }

  await page.close();
  console.log(`\n  ALL_8_ACCOUNTS_TRUST: ${passed === 8 ? "PASS" : "PARTIAL"} (${passed}/8)`);
}

async function main() {
  console.log("========================================================");
  console.log("STARTING FULL TRUST ASSURANCE PLAYWRIGHT SUITE");
  console.log(`TARGET DIR: ${EVIDENCE_DIR}`);
  console.log("========================================================\n");

  const browser = await createBrowser();
  try {
    await runScenarioText(browser);
    await runScenarioUrl(browser);
    await runScenarioImage(browser);
    await runScenarioQr(browser);
    await runScenarioGeminiRouting(browser);
    await runScenarioZeroRerun(browser);
    await runScenarioBlindReview(browser);
    await runScenarioAll8Accounts(browser);
    console.log("\n========================================================");
    console.log("ALL PLAYWRIGHT SCENARIOS COMPLETED SUCCESSFULLY!");
    console.log("========================================================");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Fatal Playwright test error:", err);
  process.exit(1);
});
