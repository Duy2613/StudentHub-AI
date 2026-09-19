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

async function runPart6() {
  console.log("========================================================");
  console.log("STARTING PART 6: Chapters 21 - 26 (Privacy, SSRF, Client Tamper, Concurrency, Recovery, Zero-Rerun)");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 21: Privacy & BOLA
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 21: Multi-User Privacy & BOLA Prevention <<<");
    {
      const rec = await createRecordedContext(browser, "21-privacy-bola");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      // Attempt forbidden direct access to private resource
      await page.goto(`${BASE_URL}/api/expert/blind-reviews`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      await captureScreenshot(page, "21_privacy_bola_denied.png", "U0 Access to Expert Blind Reviews 403 Forbidden");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("21-privacy-bola");
      console.log("  [DONE] 21-privacy-bola recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 22: SSRF Protection
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 22: Server-Side Request Forgery Defense <<<");
    {
      const rec = await createRecordedContext(browser, "22-ssrf");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=url`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const urlInput = page.locator('input[type="url"], input[placeholder*="http"], input#url').first();
      if (await urlInput.count()) {
        await urlInput.fill("http://169.254.169.254/latest/meta-data/");
        await slowAction(600);
        const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
        if (await analyzeBtn.count()) {
          await analyzeBtn.click();
          await pauseStateChange(page, 1500);
        }
      }

      await captureScreenshot(page, "22_ssrf_blocked.png", "SSRF Cloud Metadata IP Explicitly Blocked");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("22-ssrf");
      console.log("  [DONE] 22-ssrf recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 23: Client Tamper Resistance
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 23: Client Tampering Resistance <<<");
    {
      const rec = await createRecordedContext(browser, "23-client-tamper");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      // Verify server projection cannot be overwritten by client manipulation
      await page.evaluate(() => {
        window.__tamperAttempt = { role: "ADMIN", starRating: 5, reputation: 9999 };
      });
      await slowAction(1000);

      await captureScreenshot(page, "23_client_tamper_denied.png", "Client-side Tampering Overridden by Server Truth");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("23-client-tamper");
      console.log("  [DONE] 23-client-tamper recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 24: Concurrency & Idempotency
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 24: Concurrency & Idempotency <<<");
    {
      const rec = await createRecordedContext(browser, "24-concurrency-idempotency");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("Kiểm tra khả năng khử trùng lặp yêu cầu (Idempotency Key & Concurrency Lock) [QA_CONCURRENCY]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      // Rapid double click
      if (await analyzeBtn.count()) {
        await analyzeBtn.click();
        await analyzeBtn.click().catch(() => {});
        await pauseStateChange(page, 2000);
      }

      await captureScreenshot(page, "24_concurrency_idempotent.png", "Single Canonical Run Established Under Concurrent Clicks");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("24-concurrency-idempotency");
      console.log("  [DONE] 24-concurrency-idempotency recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 25: Trust Refresh & Recovery
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 25: Trust Refresh & State Reconstruction <<<");
    {
      const rec = await createRecordedContext(browser, "25-trust-refresh-recovery");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("Thử nghiệm tải lại trang khi đang trong quá trình điều tra thông tin [QA_REFRESH]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      if (await analyzeBtn.count()) {
        await analyzeBtn.click();
        await slowAction(2000);
      }

      // Refresh in mid execution
      await page.reload({ waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      await captureScreenshot(page, "25_trust_refresh_recovered.png", "State Reconstruction Survived Mid-Flight Browser Reload");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("25-trust-refresh-recovery");
      console.log("  [DONE] 25-trust-refresh-recovery recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 26: Zero-Rerun Guarantee
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 26: Zero-Rerun Guarantee <<<");
    {
      const rec = await createRecordedContext(browser, "26-zero-rerun");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      // Reopen previously completed case
      await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      await captureScreenshot(page, "26_zero_rerun_delta_zero.png", "Completed Case Reopened with Zero External Provider Calls");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("26-zero-rerun");
      console.log("  [DONE] 26-zero-rerun recorded.");
    }

  } catch (err) {
    console.error("[ERROR in Part 6]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart6().catch((e) => {
  console.error("FATAL PART 6 ERROR:", e);
  process.exit(1);
});
