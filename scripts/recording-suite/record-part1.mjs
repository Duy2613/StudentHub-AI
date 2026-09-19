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

async function runPart1() {
  console.log("========================================================");
  console.log("STARTING PART 1: Chapters 00 - 04 (Baseline, Auth, Profile, Academic, Community)");
  console.log("========================================================\n");

  const browser = await createBrowser();

  try {
    // -------------------------------------------------------------
    // CHAPTER 00: Baseline Verification
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 00: Demo Baseline Verification <<<");
    {
      const rec = await createRecordedContext(browser, "00-demo-baseline");
      const page = await rec.context.newPage();

      // Inspect U0
      await loginUser(page, DEMO_ACCOUNTS.U0);
      await pauseStateChange(page, 1500);
      await captureScreenshot(page, "00_baseline_u0_active.png", "U0 Active User Baseline");

      // Inspect E0
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);
      await captureScreenshot(page, "00_baseline_e0_5star.png", "E0 5 Star / 250 Rep / 50 Reviews Baseline");

      // Inspect E3
      await logoutUser(page);
      await loginUser(page, DEMO_ACCOUNTS.E3);
      await page.goto(`${BASE_URL}/expert`, { waitUntil: "domcontentloaded" });
      await pauseFinalResult(page, 3000);
      await captureScreenshot(page, "00_baseline_e3_4star.png", "E3 4 Star / 245 Rep / 49 Reviews Baseline");

      await rec.closeAndSave("00-demo-baseline");
      console.log("  [DONE] 00-demo-baseline recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 01: Auth All 8 Accounts
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 01: Authentication All 8 Demo Accounts <<<");
    {
      const rec = await createRecordedContext(browser, "01-auth-all-8");
      const page = await rec.context.newPage();

      const accounts = [
        { code: "U0", email: DEMO_ACCOUNTS.U0, role: "USER", target: "/dashboard" },
        { code: "U1", email: DEMO_ACCOUNTS.U1, role: "USER", target: "/dashboard" },
        { code: "U2", email: DEMO_ACCOUNTS.U2, role: "USER", target: "/dashboard" },
        { code: "U3", email: DEMO_ACCOUNTS.U3, role: "USER", target: "/dashboard" },
        { code: "E0", email: DEMO_ACCOUNTS.E0, role: "EXPERT", target: "/expert" },
        { code: "E1", email: DEMO_ACCOUNTS.E1, role: "EXPERT", target: "/expert" },
        { code: "E2", email: DEMO_ACCOUNTS.E2, role: "EXPERT", target: "/expert" },
        { code: "E3", email: DEMO_ACCOUNTS.E3, role: "EXPERT", target: "/expert" },
      ];

      for (const acc of accounts) {
        console.log(`  Authenticating ${acc.code} (${acc.email})...`);
        await loginUser(page, acc.email);
        await pauseStateChange(page, 1000);
        await page.goto(`${BASE_URL}${acc.target}`, { waitUntil: "domcontentloaded" });
        await pauseStateChange(page, 1200);

        // Capture mandatory login screenshot
        await captureScreenshot(page, `login_${acc.code}.png`, `${acc.code} Logged In`);

        // Refresh test
        await page.reload({ waitUntil: "domcontentloaded" });
        await pauseStateChange(page, 800);

        // Logout
        await logoutUser(page);
      }

      await rec.closeAndSave("01-auth-all-8");
      console.log("  [DONE] 01-auth-all-8 recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 02: Profile Users & Experts
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 02: Profile Management & Invariant Protections <<<");
    {
      const rec = await createRecordedContext(browser, "02-profile-users-experts");
      const page = await rec.context.newPage();

      // U0 Profile
      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);
      await captureScreenshot(page, "profile_U0.png", "U0 User Profile");

      // Edit bio
      const bioInput = page.locator('textarea[name="bio"], textarea#bio, textarea').first();
      if (await bioInput.count()) {
        await bioInput.fill("Sinh viên CNTT đam mê AI và Kiểm chứng thông tin số (Verified Student)");
        await slowAction(600);
        const saveBtn = page.locator('button:has-text("Lưu"), button:has-text("Save")').first();
        if (await saveBtn.count()) {
          await saveBtn.click();
          await pauseStateChange(page, 1500);
        }
      }

      // E0 Expert Profile
      await logoutUser(page);
      await loginUser(page, DEMO_ACCOUNTS.E0);
      await page.goto(`${BASE_URL}/expert/profile`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2000);
      await captureScreenshot(page, "profile_E0.png", "E0 Expert Profile & Reputation Projection");

      // E1, E2, E3 profile screenshots
      for (const [code, email] of [["E1", DEMO_ACCOUNTS.E1], ["E2", DEMO_ACCOUNTS.E2], ["E3", DEMO_ACCOUNTS.E3]]) {
        await logoutUser(page);
        await loginUser(page, email);
        await page.goto(`${BASE_URL}/expert/profile`, { waitUntil: "domcontentloaded" });
        await pauseStateChange(page, 1000);
        await captureScreenshot(page, `profile_${code}.png`, `${code} Expert Profile`);
      }

      // U1, U2, U3 profile screenshots
      for (const [code, email] of [["U1", DEMO_ACCOUNTS.U1], ["U2", DEMO_ACCOUNTS.U2], ["U3", DEMO_ACCOUNTS.U3]]) {
        await logoutUser(page);
        await loginUser(page, email);
        await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
        await pauseStateChange(page, 1000);
        await captureScreenshot(page, `profile_${code}.png`, `${code} User Profile`);
      }

      await rec.closeAndSave("02-profile-users-experts");
      console.log("  [DONE] 02-profile-users-experts recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 03: Academic Full
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 03: Academic Timetable, Tasks & Reminders <<<");
    {
      const rec = await createRecordedContext(browser, "03-academic-full");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/academic`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2500);
      await captureScreenshot(page, "03_academic_timetable_view.png", "Academic Timetable View");

      // Test timetable navigation (Today, Week, Next Class)
      const tabs = page.locator('button:has-text("Hôm nay"), button:has-text("Tuần"), button:has-text("Tiết tới")');
      const tabCount = await tabs.count();
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await slowAction(800);
      }

      // Tasks and Reminders view
      const tasksTab = page.locator('button:has-text("Nhiệm vụ"), button:has-text("Bài tập"), a[href*="tasks"]').first();
      if (await tasksTab.count()) {
        await tasksTab.click();
        await pauseStateChange(page, 1500);
      }
      await captureScreenshot(page, "03_academic_tasks_view.png", "Academic Tasks & Deadlines");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("03-academic-full");
      console.log("  [DONE] 03-academic-full recorded.");
    }

    // -------------------------------------------------------------
    // CHAPTER 04: Community Full
    // -------------------------------------------------------------
    console.log("\n>>> RECORDING CHAPTER 04: Community Social Feed, Posts & Reactions <<<");
    {
      const rec = await createRecordedContext(browser, "04-community-full");
      const page = await rec.context.newPage();

      await loginUser(page, DEMO_ACCOUNTS.U0);
      await page.goto(`${BASE_URL}/community`, { waitUntil: "domcontentloaded" });
      await pauseStateChange(page, 2500);
      await captureScreenshot(page, "04_community_feed.png", "Community Social Feed");

      // Create a test post
      const createPostBtn = page.locator('button:has-text("Tạo bài viết"), button:has-text("Đăng bài"), textarea[placeholder*="chia sẻ"]').first();
      if (await createPostBtn.count()) {
        await createPostBtn.click();
        await slowAction(500);
        const postInput = page.locator('textarea[placeholder*="chia sẻ"], textarea').first();
        if (await postInput.count()) {
          await postInput.fill("Chia sẻ kinh nghiệm nhận diện tin giả trong mùa tuyển sinh đại học [QA Rehearsal 2026]");
          await slowAction(800);
        }
      }

      // Scroll and interact with reactions
      const reactionBtn = page.locator('button:has-text("Thích"), button:has-text("Quan tâm"), button[aria-label*="react"]').first();
      if (await reactionBtn.count()) {
        await reactionBtn.click();
        await slowAction(800);
      }

      await captureScreenshot(page, "04_community_interaction.png", "Community Post Interaction");
      await pauseFinalResult(page, 3000);

      await rec.closeAndSave("04-community-full");
      console.log("  [DONE] 04-community-full recorded.");
    }

  } catch (err) {
    console.error("[ERROR in Part 1]:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runPart1().catch((e) => {
  console.error("FATAL PART 1 ERROR:", e);
  process.exit(1);
});
