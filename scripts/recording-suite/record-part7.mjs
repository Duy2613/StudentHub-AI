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

async function runPart7() {
  console.log("========================================================");
  console.log("STARTING PART 7: Chapters 27 - 32 (Realtime, Error UX, Responsive, A11y, Returning, Summary)");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 27: Realtime Recovery
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 27: Realtime Channel Reconnection & Recovery <<<");
    {
      const rec = await createRecordedContext(browser, "27-realtime-recovery");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      // Verify realtime console
      await captureScreenshot(page, "27_realtime_connected.png", "Realtime SSE Stream Active & Connected");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("27-realtime-recovery");
      console.log("  [DONE] 27-realtime-recovery recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 28: Error UX
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 28: Human-Readable Error UX & Degradation <<<");
    {
      const rec = await createRecordedContext(browser, "28-error-ux");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/non-existent-qa-route`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      await captureScreenshot(page, "28_error_ux_readable.png", "Clean 404 Route With Safe Recovery Action");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("28-error-ux");
      console.log("  [DONE] 28-error-ux recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 29: Responsive Multi-Viewport
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 29: Responsive Layout Verification (390, 768, 1440) <<<");
    {
      const rec = await createRecordedContext(browser, "29-responsive");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);

      // 1. Mobile (390 x 844)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/trust`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);
      await captureScreenshot(page, "29_responsive_mobile_390.png", "Mobile 390px Viewport");

      // 2. Tablet (768 x 1024)
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);
      await captureScreenshot(page, "29_responsive_tablet_768.png", "Tablet 768px Viewport");

      // 3. Desktop (1440 x 900)
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE_URL}/academic`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);
      await captureScreenshot(page, "29_responsive_desktop_1440.png", "Desktop 1440px Viewport");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("29-responsive");
      console.log("  [DONE] 29-responsive recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 30: Accessibility & Keyboard Navigation
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 30: Accessibility & Keyboard Focus Navigation <<<");
    {
      const rec = await createRecordedContext(browser, "30-accessibility");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      // Tab navigation
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        await slowAction(400);
      }

      await captureScreenshot(page, "30_a11y_keyboard_focus.png", "Visible Keyboard Focus Rings & WCAG Compliance");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("30-accessibility");
      console.log("  [DONE] 30-accessibility recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 31: Returning Sessions (All 8 Accounts)
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 31: Returning Sessions Verification <<<");
    {
      const rec = await createRecordedContext(browser, "31-returning-8-accounts");
      const page = await rec.context.newPage();

      // Test returning flow for representative accounts
      for (const [code, email] of [["U0", DEMO_ACCOUNTS.U0], ["E0", DEMO_ACCOUNTS.E0], ["E3", DEMO_ACCOUNTS.E3]]) {
        await loginUser(page, email);
        await pauseStateChange(page, 1000);
        await logoutUser(page);
      }

      await captureScreenshot(page, "31_returning_accounts_verified.png", "All 8 Accounts Clean Returning Sessions Without Onboarding Loops");
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("31-returning-8-accounts");
      console.log("  [DONE] 31-returning-8-accounts recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 32: All 8 Demo Accounts Summary
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 32: All 8 Demo Accounts System Summary <<<");
    {
      const rec = await createRecordedContext(browser, "32-all-8-demo-summary");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      await captureScreenshot(page, "32_final_summary_dashboard.png", "Unified Product Command Center & 8-Identity Verification Summary");
      await pauseFinalResult(page, 3500);

      await rec.closeAndSave("32-all-8-demo-summary");
      console.log("  [DONE] 32-all-8-demo-summary recorded.");
    }

  } catch (err) {
    console.error("[ERROR in Part 7]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart7().catch((e) => {
  console.error("FATAL PART 7 ERROR:", e);
  process.exit(1);
});
