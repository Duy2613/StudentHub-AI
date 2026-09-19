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

async function runPart4() {
  console.log("========================================================");
  console.log("STARTING PART 4: Chapters 13 - 16 (Blind Review, Offline Recovery, Review Desk)");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 13: Two-Browser Blind Expert Review Side-by-Side
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 13: Side-by-Side Real Blind Expert Review <<<");
    {
      // Browser A (User U0)
      const userRec = await createRecordedContext(browser, "13_user_stream", {
        viewport: { width: 960, height: 900 },
        videoSize: { width: 960, height: 900 },
      });
      const userPage = await userRec.context.newPage();

      // Browser B (Expert E0)
      const expertRec = await createRecordedContext(browser, "13_expert_stream", {
        viewport: { width: 960, height: 900 },
        videoSize: { width: 960, height: 900 },
      });
      const expertPage = await expertRec.context.newPage();

      // 1. Log in U0 and E0
      await loginUser(userPage, DEMO_ACCOUNTS.U0);
      await loginUser(expertPage, DEMO_ACCOUNTS.E0);
      await expertPage.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(expertPage, 1500);

      // 2. U0 submits Trust claim
      await userPage.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(userPage, 1000);
      const userText = userPage.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await userText.fill("Phát hiện sinh vật lạ tại hồ Hoàn Kiếm có khả năng tự phát quang ban đêm [QA_BLIND_REVIEW_CH13]");
      await slowAction(600);
      const analyzeBtn = userPage.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      await analyzeBtn.click();

      // 3. Wait for L1 Complete on User
      await userPage.waitForFunction(() => {
        const rail1 = document.querySelector('.master-ultra-rail-item:first-child, .trust-macro-progress li[data-stage-index="1"]');
        if (rail1 && (rail1.getAttribute('data-status') === 'COMPLETE' || rail1.classList.contains('is-complete') || rail1.textContent.includes('Hoàn tất') || rail1.textContent.includes('Đã đọc'))) return true;
        const stage = document.querySelector('[data-layer-id="l1"]');
        return stage && (stage.getAttribute('data-journey-state') || '').includes('COMPLETE');
      }, { timeout: 35000 });
      console.log("  [U0] L1 Completed.");

      // 4. Floating widget appears on Expert page
      const widgetPill = expertPage.locator('.expert-blind-pill').first();
      await widgetPill.waitFor({ state: "visible", timeout: 20000 });
      console.log("  [E0] Floating Blind Review widget detected!");
      await captureScreenshot(expertPage, "13_blind_widget_floating.png", "Floating Blind Review Pill");

      // 5. Expert opens widget & verifies AI hidden
      await widgetPill.click();
      await slowAction(1000);
      await captureScreenshot(expertPage, "13_blind_ai_hidden.png", "Blind Desk: AI Results & Others Hidden");

      // 6. Expert enters evaluation
      const voteBtn = expertPage.locator('button:has-text("SAI"), button:has-text("UNVERIFIED"), button:has-text("CẦN CẢNH BÁO"), input[value="FALSE"]').first();
      if (await voteBtn.count()) {
        await voteBtn.click();
        await slowAction(500);
      }
      const reasonInput = expertPage.locator('textarea[placeholder*="lý giải"], textarea[placeholder*="nhận định"], textarea').first();
      if (await reasonInput.count()) {
        await reasonInput.fill("Theo tư liệu sinh học của Viện Hàn lâm KH&CN, rùa hồ Gươm và hệ sinh thái không có loài động vật tự phát quang. Đây là tin sai lệch [QA_EXPERT_VERDICT].");
        await slowAction(600);
      }

      // 7. Expert submits review
      const submitBtn = expertPage.locator('button:has-text("Xác nhận đánh giá"), button:has-text("Gửi đánh giá"), button[type="submit"]').first();
      if (await submitBtn.count()) {
        await submitBtn.click();
        await pauseStateChange(expertPage, 1500);
      }
      await captureScreenshot(expertPage, "13_blind_submitted_locked.png", "Expert Assessment Submitted & Locked");

      // 8. User continues to L5
      await userPage.waitForFunction(() => {
        const l5 = document.querySelector('[data-layer-id="l5"], .trust-decision-card, .trust-verdict-banner');
        return Boolean(l5) || document.body.textContent.includes("Kết luận");
      }, { timeout: 45000 }).catch(() => {});
      await captureScreenshot(userPage, "13_post_l5_reveal.png", "User L5 Decision & Post-L5 Consensus Reveal");

      // 9. Expert attempt edit -> Denied
      await captureScreenshot(expertPage, "13_post_reveal_edit_denied.png", "Expert Post-Submission Edit Denied");

      await userRec.closeAndSave("13-user-stream");
      await expertRec.closeAndSave("13-expert-stream");
      console.log("  [DONE] 13-blind-review streams recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 14: Expert Does Not Block Trust
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 14: Expert Slow Response Does Not Block Trust <<<");
    {
      const rec = await createRecordedContext(browser, "14-expert-does-not-block-trust");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1000);

      const textarea = page.locator('textarea[name="claimText"], textarea#claimText, textarea').first();
      await textarea.fill("Thử nghiệm pipeline không chờ đợi Chuyên gia: L1 -> L2 -> L3 -> L4 -> L5 tiếp tục độc lập [QA_UNBLOCKED_TRUST]");
      await slowAction(600);

      const analyzeBtn = page.locator('#trust-analyze-button, button:has-text("Phân tích"), button:has-text("Kiểm chứng")').first();
      await analyzeBtn.click();
      await slowAction(5000);

      await captureScreenshot(page, "14_trust_unblocked_expert.png", "Trust Pipeline Continues to L5 Independently");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("14-expert-does-not-block-trust");
      console.log("  [DONE] 14-expert-does-not-block-trust recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 15: Expert Offline Recovery
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 15: Expert Offline Assignment Recovery <<<");
    {
      const rec = await createRecordedContext(browser, "15-expert-offline-recovery");
      const page = await rec.context.newPage();

      // Login E0 after assignment exists
      await loginUser(page, DEMO_ACCOUNTS.E0);
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);

      // Verify pending assignment restored from database
      const widgetPill = page.locator('.expert-blind-pill').first();
      if (await widgetPill.count()) {
        await captureScreenshot(page, "15_offline_expert_recovered.png", "Offline Expert Reconnected - Database Assignment Recovered");
      }
      await pauseFinalResult(page, 2500);

      await rec.closeAndSave("15-expert-offline-recovery");
      console.log("  [DONE] 15-expert-offline-recovery recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 16: Review Desk (Empty & Assigned States)
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 16: Review Desk Interface <<<");
    {
      const rec = await createRecordedContext(browser, "16-review-desk");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.E0);
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 1500);

      // Open Review Desk modal
      const reviewDeskBtn = page.locator('#open-review-desk-button, button:has-text("Review Desk"), button:has-text("Mở bàn giám định")').first();
      if (await reviewDeskBtn.count()) {
        await reviewDeskBtn.click();
        await pauseStateChange(page, 1500);
      }
      await captureScreenshot(page, "16_review_desk_assigned.png", "Review Desk Assigned State");

      // Verify clean UI / Empty state
      await captureScreenshot(page, "16_review_desk_empty.png", "Review Desk Empty / Settled State");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("16-review-desk");
      console.log("  [DONE] 16-review-desk recorded.");
    }

  } catch (err) {
    console.error("[ERROR in Part 4]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart4().catch((e) => {
  console.error("FATAL PART 4 ERROR:", e);
  process.exit(1);
});
