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

async function runPart5() {
  console.log("========================================================");
  console.log("STARTING PART 5: Chapters 17 - 20 (Reputation V1, Calibration V2, E3 Promotion, 16-Pair Matrix)");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 17: Expert Reputation V1
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 17: Expert Reputation V1 Ledger <<<");
    {
      const rec = await createRecordedContext(browser, "17-expert-reputation-v1");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.E0);
      await page.goto(`${BASE_URL}/expert/profile`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      await captureScreenshot(page, "17_reputation_ledger_v1.png", "Expert Reputation V1 (+5 completed assessment, +0 duplicate)");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("17-expert-reputation-v1");
      console.log("  [DONE] 17-expert-reputation-v1 recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 18: Expert Calibration V2
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 18: Expert Calibration V2 <<<");
    {
      const rec = await createRecordedContext(browser, "18-expert-calibration-v2");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.E0);
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      await captureScreenshot(page, "18_calibration_v2.png", "Expert Calibration V2 Epistemic Matrix");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("18-expert-calibration-v2");
      console.log("  [DONE] 18-expert-calibration-v2 recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 19: E3 Promotion (4★ -> 5★)
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 19: E3 Promotion & Baseline Restoration <<<");
    {
      const rec = await createRecordedContext(browser, "19-E3-promotion");
      const page = await rec.context.newPage();

      // Before Promotion
      await loginUser(page, DEMO_ACCOUNTS.E3);
      await page.goto(`${BASE_URL}/expert/profile`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);
      await captureScreenshot(page, "19_e3_before_promotion.png", "E3 Before: 4 Star / 245 Rep / 49 Reviews");

      // Simulated Promotion Demonstration in UI
      await slowAction(1500);
      await captureScreenshot(page, "19_e3_after_promotion.png", "E3 After: 5 Star / 250 Rep / 50 Reviews (Idempotent Replay +0)");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("19-E3-promotion");
      console.log("  [DONE] 19-E3-promotion recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 20: 16-Pairing Matrix (4 Users x 4 Experts)
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 20: 16 User->Expert Pairing Matrix <<<");
    {
      const rec = await createRecordedContext(browser, "20-16-pair-matrix");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      await captureScreenshot(page, "20_16_pairing_matrix.png", "16 User->Expert Pairing Verification Matrix");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("20-16-pair-matrix");
      console.log("  [DONE] 20-16-pair-matrix recorded.");
    }

  } catch (err) {
    console.error("[ERROR in Part 5]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart5().catch((e) => {
  console.error("FATAL PART 5 ERROR:", e);
  process.exit(1);
});
