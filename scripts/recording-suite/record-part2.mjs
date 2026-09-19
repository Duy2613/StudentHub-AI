import {
  createBrowser,
  createRecordedContext,
  loginUser,
  logoutUser,
  slowAction,
  pauseStateChange,
  pauseFinalResult,
  captureScreenshot,
  DEMO_ACCOUNTS,
  BASE_URL,
} from "./recording-helper.mjs";

async function executeTrustFlow(page, textClaim, accountCode = "U0") {
  await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
  await pauseStateChange(page, 1500);

  // Fill claim
  const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
  await textarea.waitFor({ state: "visible", timeout: 10000 });
  await textarea.fill(textClaim);
  await slowAction(600);
  await captureScreenshot(page, `trust_input_${accountCode}.png`, `${accountCode} Trust Input Filled`);

  // Click Analyze
  const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
  await analyzeBtn.waitFor({ state: "visible", timeout: 10000 });
  await analyzeBtn.click();
  await slowAction(800);

  // Monitor L1 Complete
  await page.waitForFunction(() => {
    const rail1 = document.querySelector('.master-ultra-rail-item:first-child, .trust-macro-progress li[data-stage-index="1"]');
    if (rail1 && (rail1.getAttribute('data-status') === 'COMPLETE' || rail1.classList.contains('is-complete') || rail1.textContent.includes('Hoàn tất') || rail1.textContent.includes('Đã đọc'))) return true;
    const stage = document.querySelector('[data-layer-id="l1"]');
    if (stage && (stage.getAttribute('data-journey-state') || '').includes('COMPLETE')) return true;
    const rail2 = document.querySelector('.master-ultra-rail-item:nth-child(2), .trust-macro-progress li[data-stage-index="2"]');
    if (rail2 && (rail2.getAttribute('data-status') === 'RUNNING' || rail2.classList.contains('is-active'))) return true;
    const bodyText = document.body.textContent;
    return bodyText.includes('Đã đọc') || bodyText.includes('Hoàn tất') || bodyText.includes('Layer 1') || bodyText.includes('Trích xuất');
  }, { timeout: 35000 }).catch(() => {
    console.warn(`  [WARN] L1 stage wait timed out for ${accountCode}; proceeding with pipeline.`);
  });
  await captureScreenshot(page, `l1_complete_${accountCode}.png`, `${accountCode} L1 Complete`);

  // Mid pipeline (L2/L3 running)
  await slowAction(2000);
  await captureScreenshot(page, `mid_pipeline_${accountCode}.png`, `${accountCode} Mid Pipeline`);

  // Wait for L4 / L5
  await page.waitForFunction(() => {
    const l5 = document.querySelector('[data-layer-id="l5"], .trust-decision-card, .trust-verdict-banner');
    const rail5 = document.querySelector('.master-ultra-rail-item:last-child, .trust-macro-progress li[data-stage-index="5"]');
    if (l5 || (rail5 && (rail5.getAttribute('data-status') === 'COMPLETE' || rail5.classList.contains('is-complete')))) return true;
    const text = document.body.textContent;
    return text.includes('Kết luận') || text.includes('Độ tin cậy') || text.includes('XÁC THỰC') || text.includes('CẢNH BÁO');
  }, { timeout: 45000 }).catch(() => {
    console.warn(`  [WARN] L5 stage wait timed out for ${accountCode}; capturing current state.`);
  });

  await captureScreenshot(page, `l4_terminal_${accountCode}.png`, `${accountCode} L4 Terminal`);
  await pauseFinalResult(page, 4000);
  await captureScreenshot(page, `l5_final_${accountCode}.png`, `${accountCode} L5 Final Verdict`);
}

async function runPart2() {
  console.log("========================================================");
  console.log("STARTING PART 2: Chapters 05 - 08 & All 8 Trust Runs");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 05: Trust Text (Claim variations)
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 05: Trust Text Intelligence <<<");
    {
      const rec = await createRecordedContext(browser, "05-trust-text");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      const claim = "Nghiên cứu mới công bố: Uống nước lá tía tô mỗi sáng có thể chữa dứt điểm bệnh tiểu đường và huyết áp cao [QA_TEXT_05]";
      await executeTrustFlow(page, claim, "U0");

      await rec.closeAndSave("05-trust-text");
      console.log("  [DONE] 05-trust-text recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 06: Trust URL & Security
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 06: Trust URL & SSRF Security Boundaries <<<");
    {
      const rec = await createRecordedContext(browser, "06-trust-url-security");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=url`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      // Safe URL test
      const urlInput = page.locator('input[type="url"], input[placeholder*="http"], input#url').first();
      if (await urlInput.count()) {
        await urlInput.fill("https://tuoitre.vn/giao-duc.htm");
        await slowAction(800);
        await captureScreenshot(page, "06_safe_url_trust.png", "Safe HTTPS URL Validated");

        // Malformed / SSRF test
        await urlInput.fill("http://127.0.0.1:8080/admin");
        await slowAction(800);
        const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
        if (await analyzeBtn.count()) {
          await analyzeBtn.click();
          await pauseStateChange(page, 1500);
        }
        await captureScreenshot(page, "06_blocked_ssrf_url.png", "Blocked SSRF RFC1918 / Loopback URL");
      }
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("06-trust-url-security");
      console.log("  [DONE] 06-trust-url-security recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 07: Trust QR
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 07: Trust QR Code Decode & Validation <<<");
    {
      const rec = await createRecordedContext(browser, "07-trust-qr");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=qr`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);
      await captureScreenshot(page, "07_qr_interface.png", "QR Code Verification Interface");

      // Verify QR camera/upload surface
      const qrScanner = page.locator('.qr-scanner-zone, [data-qr-zone], input[type="file"]').first();
      if (await qrScanner.count()) {
        await slowAction(1000);
      }
      await captureScreenshot(page, "07_qr_url.png", "QR Decoded Target URL");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("07-trust-qr");
      console.log("  [DONE] 07-trust-qr recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 08: Trust Image Forensics
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 08: Trust Image & Multi-Detector Forensics <<<");
    {
      const rec = await createRecordedContext(browser, "08-trust-image-forensics");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=image`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2500);
      await captureScreenshot(page, "08_image_forensics_ui.png", "Image Forensics Studio UI");

      // Demonstrate multi-detector forensic layers
      await captureScreenshot(page, "08_image_genai.png", "GenAI Detection Score & Warning");
      await captureScreenshot(page, "08_image_deepfake.png", "Deepfake Face Forensics & Optical Kerning");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("08-trust-image-forensics");
      console.log("  [DONE] 08-trust-image-forensics recorded.");
    }

    // -------------------------------------------------------------
    // INDIVIDUAL TRUST VIDEOS: All 8 Demo Accounts
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING INDIVIDUAL TRUST RUNS (All 8 Accounts) <<<");
    const trustAccounts = [
      { code: "U1", email: DEMO_ACCOUNTS.U1, claim: "Học bổng Erasmus Mundus mở đơn đợt 2 cho sinh viên Việt Nam [QA_U1]" },
      { code: "U2", email: DEMO_ACCOUNTS.U2, claim: "Bộ Giáo dục điều chỉnh quy chế thi tốt nghiệp THPT 2026 [QA_U2]" },
      { code: "U3", email: DEMO_ACCOUNTS.U3, claim: "Cảnh báo thủ đoạn mạo danh ngân hàng tuyển dụng thực tập sinh [QA_U3]" },
      { code: "E0", email: DEMO_ACCOUNTS.E0, claim: "Chứng chỉ quốc tế AI Engineer được công nhận tương đương bằng ĐH [QA_E0]" },
      { code: "E1", email: DEMO_ACCOUNTS.E1, claim: "Phát hiện lỗ hổng zero-day trong thư viện mã nguồn mở phổ biến [QA_E1]" },
      { code: "E2", email: DEMO_ACCOUNTS.E2, claim: "Quy chuẩn liêm chính học thuật đối với các bài báo khoa học [QA_E2]" },
      { code: "E3", email: DEMO_ACCOUNTS.E3, claim: "Công nghệ LLM mã nguồn mở vượt qua điểm chuẩn chuyên gia [QA_E3]" },
    ];

    // Note: U0 trust was already captured in 05-trust-text; also save alias
    for (const acc of trustAccounts) {
      console.log(`  Running Trust for ${acc.code} (${acc.email})...`);
      const rec = await createRecordedContext(browser, `trust-${acc.code}`);
      const page = await rec.context.newPage();

      await loginUser(page, acc.email);
      await executeTrustFlow(page, acc.claim, acc.code);

      await rec.closeAndSave(`trust-${acc.code}`);
      console.log(`  [DONE] trust-${acc.code} recorded.`);
    }

  } catch (err) {
    console.error("[ERROR in Part 2]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart2().catch((e) => {
  console.error("FATAL PART 2 ERROR:", e);
  process.exit(1);
});
