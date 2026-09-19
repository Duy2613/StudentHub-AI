import {
  createBrowser,
  createRecordedContext,
  loginUser,
  slowAction,
  pauseStateChange,
  pauseFinalResult,
  captureScreenshot,
  DEMO_ACCOUNTS,
  BASE_URL,
} from "./recording-helper.mjs";

async function runPart3() {
  console.log("========================================================");
  console.log("STARTING PART 3: Chapters 09 - 12 (Gemini Routing, Failover, All-Down, Providers)");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 09: Gemini Live Smoke
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 09: Gemini Model Live Smoke & Routing <<<");
    {
      const rec = await createRecordedContext(browser, "09-gemini-live-smoke");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("Kiểm tra khả năng định tuyến mô hình Gemini tự động theo trạng thái quota thực tế [QA_LIVE_SMOKE]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      await analyzeBtn.click();
      await slowAction(3000);

      await captureScreenshot(page, "09_gemini_live_smoke.png", "Live Gemini Routing Smoke");
      await pauseFinalResult(page, 4000);

      await rec.closeAndSave("09-gemini-live-smoke");
      console.log("  [DONE] 09-gemini-live-smoke recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 10: Gemini Fast Failover
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 10: Gemini Fast Failover (429 Quota Exhaustion) <<<");
    {
      const rec = await createRecordedContext(browser, "10-gemini-fast-failover");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("Simulated 429 Quota Exhaustion on Primary Model -> Instant 0ms Failover to Secondary Candidate [QA_FAILOVER]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      await analyzeBtn.click();
      await slowAction(4000);

      await captureScreenshot(page, "10_gemini_fast_failover.png", "Gemini 429 Fast Failover Path");
      await pauseFinalResult(page, 4000);

      await rec.closeAndSave("10-gemini-fast-failover");
      console.log("  [DONE] 10-gemini-fast-failover recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 11: All Gemini Down
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 11: All Gemini Down -> Deterministic L5 Continuation <<<");
    {
      const rec = await createRecordedContext(browser, "11-gemini-all-down");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("All-AI-Unavailable Fallback: L4 Degraded Terminal State -> Unblocked Deterministic L5 Decision [QA_ALL_DOWN]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      await analyzeBtn.click();
      await slowAction(5000);

      await captureScreenshot(page, "11_gemini_all_down.png", "All Gemini Down Fallback with Terminal L4 Degraded");
      await pauseFinalResult(page, 4000);

      await rec.closeAndSave("11-gemini-all-down");
      console.log("  [DONE] 11-gemini-all-down recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 12: Provider Failures (Tavily/Sightengine)
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 12: Provider Failures Graceful Handling <<<");
    {
      const rec = await createRecordedContext(browser, "12-provider-failures");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("External Evidence Discovery Provider Timeout -> Controlled Partial State without UI freeze [QA_PROVIDER_FAIL]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      await analyzeBtn.click();
      await slowAction(4000);

      await captureScreenshot(page, "12_provider_graceful_degrade.png", "Graceful Provider Degradation");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("12-provider-failures");
      console.log("  [DONE] 12-provider-failures recorded.");
    }

  } catch (err) {
    console.error("[ERROR in Part 3]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart3().catch((e) => {
  console.error("FATAL PART 3 ERROR:", e);
  process.exit(1);
});
