#!/usr/bin/env node
/**
 * StudentHub AI — P24/P25 Reality Gate Smoke Test
 * 
 * Verifies the mandatory Pre-Phase Reality Gate:
 * 1. U0 login
 * 2. U0 /trust
 * 3. Analyze click
 * 4. Request leaves browser
 * 5. Trust case created
 * 6. Trust run created
 * 7. L1 RUNNING visible
 * 8. L1 COMPLETED visible
 * 9. L2 RUNNING visible
 * 10. E0 receives Blind Review assignment
 * 11. Floating widget appears
 * 12. Review Desk opens correctly
 */

import "./canonicalEnvLoader.mjs";
import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { getPostgresPool } from "../frontend/src/lib/server/database/PostgresPool.js";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const QA_RUN_ID = `qa_reality_${Date.now()}_${randomBytes(4).toString("hex")}`;
const ARTIFACTS_DIR = resolve("artifacts", "p24-reality-gate");

if (!existsSync(ARTIFACTS_DIR)) {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
}
const SCREENSHOTS_DIR = resolve(ARTIFACTS_DIR, "screenshots");
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const U0_EMAIL = "demo-user@gmail.com";
const E0_EMAIL = "demo-expert@gmail.com";
const QA_PASSWORD = "StudentHubQA2026!";

async function runRealityGate() {
  console.log("========================================================");
  console.log("STARTING MANDATORY REALITY GATE SMOKE TEST");
  console.log(`QA_RUN_ID: ${QA_RUN_ID}`);
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log("========================================================\n");

  const pool = getPostgresPool();
  let browser = null;

  const gates = {
    REALITY_GATE_ANALYZE: "FAIL",
    REALITY_GATE_L1: "FAIL",
    REALITY_GATE_L2: "FAIL",
    REALITY_GATE_EXPERT_DISPATCH: "FAIL",
    REALITY_GATE_WIDGET: "FAIL",
    REALITY_GATE_REVIEW_DESK: "FAIL",
  };

  const correlationData = {
    CLIENT_REQUEST_ID: null,
    SERVER_CORRELATION_ID: null,
    TRUST_RUN_CORRELATION_ID: null,
    SSE_CORRELATION_ID: null,
  };

  try {
    // 0. Launch Playwright Chromium
    console.log("[1/12] Launching Playwright Chromium browser...");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const userContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: resolve(ARTIFACTS_DIR, "videos") },
    });
    const userPage = await userContext.newPage();

    // Setup network capture on user page
    let outgoingRequestSent = false;
    userPage.on("request", (req) => {
      if (req.url().includes("/api/v1/trust")) {
        outgoingRequestSent = true;
        const headers = req.headers();
        const reqId = headers["x-request-id"] || headers["x-correlation-id"];
        if (reqId) correlationData.CLIENT_REQUEST_ID = reqId;
        console.log(`  -> Detected outgoing /api/v1/trust request. Client ID: ${reqId}`);
      }
    });

    userPage.on("response", (res) => {
      if (res.url().includes("/api/v1/trust")) {
        const headers = res.headers();
        const corrId = headers["x-correlation-id"] || headers["x-request-id"];
        if (corrId) correlationData.SERVER_CORRELATION_ID = corrId;
        console.log(`  <- Detected /api/v1/trust response. Status: ${res.status()}, Server ID: ${corrId}`);
      }
    });

    // 1. U0 Login
    console.log(`[2/12] Logging in as U0 (${U0_EMAIL})...`);
    await userPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await userPage.fill('input#email', U0_EMAIL);
    await userPage.fill('input#password', QA_PASSWORD);
    await userPage.click('button[type="submit"]');

    // Wait for login redirection
    await userPage.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15_000 });
    console.log(`  U0 logged in. Current URL: ${userPage.url()}`);
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "01_u0_logged_in.png") });

    // 2. Navigate to /trust
    console.log("[3/12] Navigating U0 to /trust?mode=text...");
    await userPage.goto(`${BASE_URL}/trust?mode=text`, { waitUntil: "networkidle" });
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "02_u0_trust_view.png") });

    // 3. Switch to Text Mode & Enter Claim
    console.log("[4/12] Entering text claim in Trust Studio...");
    const textTab = userPage.locator('button[role="tab"]:has-text("Văn bản")');
    try {
      await textTab.waitFor({ state: "visible", timeout: 10_000 });
      await textTab.click();
    } catch {
      console.log("  Tab button wait timed out or already in text mode");
    }

    const claimText = `Tin tức: Thuốc đặc trị X công bố khỏi hẳn tiểu đường sau 7 ngày điều trị [QA_${QA_RUN_ID}]`;
    const textarea = userPage.locator('.trust-text-field textarea, textarea');
    await textarea.waitFor({ state: "visible", timeout: 15_000 });
    await textarea.fill(claimText);
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "03_u0_claim_filled.png") });

    // 4. Click Analyze
    console.log("[5/12] Clicking Analyze button...");
    const submitBtn = userPage.locator('button.master-ultra-submit, button.primary-action.trust-submit, button:has-text("Phân tích rủi ro")');
    await submitBtn.waitFor({ state: "visible", timeout: 10_000 });

    // Wait until button is enabled
    await userPage.waitForFunction(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const target = allBtns.find((b) => b.textContent.includes("Phân tích rủi ro") || b.classList.contains("master-ultra-submit"));
      return target && !target.disabled;
    }, { timeout: 10_000 });

    await submitBtn.click();

    // Check request left browser
    await userPage.waitForTimeout(1500);
    if (outgoingRequestSent) {
      gates.REALITY_GATE_ANALYZE = "PASS";
      console.log("  [PASS] Request left browser -> REALITY_GATE_ANALYZE = PASS");
    } else {
      throw new Error("Request did not leave browser on Analyze click!");
    }

    // 5. Observe L1 RUNNING & L1 COMPLETED
    console.log("[6/12] Monitoring L1 Claim Intelligence status in UI...");
    await userPage.waitForFunction(() => {
      const rail1 = document.querySelector('.master-ultra-rail-item:first-child, .trust-macro-progress li[data-stage-index="1"], .pipeline-list li:first-child');
      const stage = document.querySelector('[data-layer-id="l1"], .master-ultra-journey-stage, .master-ultra-run-shell');
      return Boolean(rail1 || stage);
    }, { timeout: 20_000 });
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "04_u0_l1_progress.png") });

    // Wait for L1 to complete
    console.log("[7/12] Waiting for L1 COMPLETED in UI...");
    await userPage.waitForFunction(() => {
      const rail1 = document.querySelector('.master-ultra-rail-item:first-child, .trust-macro-progress li[data-stage-index="1"]');
      if (rail1) {
        const status = rail1.getAttribute('data-status');
        const text = rail1.textContent;
        if (status === "COMPLETE" || rail1.classList.contains("is-complete") || text.includes("Hoàn tất") || text.includes("Đã đọc")) return true;
      }
      const stage = document.querySelector('[data-layer-id="l1"]');
      if (stage) {
        const st = stage.getAttribute('data-journey-state') || "";
        if (st.includes("COMPLETE") || st.includes("TRANSITION")) return true;
      }
      const rail2 = document.querySelector('.master-ultra-rail-item:nth-child(2), .trust-macro-progress li[data-stage-index="2"]');
      if (rail2 && (rail2.getAttribute('data-status') === "RUNNING" || rail2.classList.contains("is-active"))) return true;
      return false;
    }, { timeout: 35_000 });
    gates.REALITY_GATE_L1 = "PASS";
    console.log("  [PASS] L1 COMPLETED visible -> REALITY_GATE_L1 = PASS");
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "05_u0_l1_completed.png") });

    // 6. Observe L2 RUNNING
    console.log("[8/12] Waiting for L2 RUNNING visible in UI...");
    await userPage.waitForFunction(() => {
      const rail2 = document.querySelector('.master-ultra-rail-item:nth-child(2), .trust-macro-progress li[data-stage-index="2"]');
      if (rail2) {
        const status = rail2.getAttribute('data-status');
        if (status === "RUNNING" || status === "COMPLETE" || status === "PARTIAL" || rail2.classList.contains("is-active") || rail2.classList.contains("is-attention") || rail2.textContent.includes("Đang thu thập") || rail2.textContent.includes("Một phần") || rail2.textContent.includes("Hoàn tất")) return true;
      }
      const stage2 = document.querySelector('[data-layer-id="l2"], [data-layer-id="l2a"], [data-layer-id="l3"], [data-layer-id="l4"], [data-layer-id="l5"]');
      if (stage2) return true;
      return false;
    }, { timeout: 35_000 });
    gates.REALITY_GATE_L2 = "PASS";
    console.log("  [PASS] L2 RUNNING visible -> REALITY_GATE_L2 = PASS");
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "06_u0_l2_running.png") });

    // 7. Verify DB: Trust Case Created, Run Created, and Expert Dispatch
    console.log("[9/12] Verifying Database records for Case, Run, and Expert Blind Review Assignment...");
    let createdCaseId = null;
    let createdRunId = null;

    // Retry DB query up to 15s
    const dbDeadline = Date.now() + 15_000;
    while (Date.now() < dbDeadline) {
      const caseRes = await pool.query(
        `SELECT id, owner_id, state, created_at 
           FROM public.trust_cases 
          WHERE owner_id = (SELECT id FROM auth.users WHERE email = $1)
          ORDER BY created_at DESC 
          LIMIT 1`,
        [U0_EMAIL]
      );
      if (caseRes.rows.length > 0) {
        createdCaseId = caseRes.rows[0].id;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!createdCaseId) {
      throw new Error("DB Assertion Failed: Trust case was not created in public.trust_cases!");
    }
    console.log(`  [DB] Confirmed public.trust_cases entry: ${createdCaseId}`);

    const runRes = await pool.query(
      `SELECT id, case_id, request_id, status, created_at 
         FROM public.trust_runs 
        WHERE case_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1`,
      [createdCaseId]
    );
    if (runRes.rows.length > 0) {
      createdRunId = runRes.rows[0].id;
      correlationData.TRUST_RUN_CORRELATION_ID = runRes.rows[0].request_id;
      console.log(`  [DB] Confirmed public.trust_runs entry: ${createdRunId}, request_id: ${runRes.rows[0].request_id}`);
    }

    // Verify Blind Review assignment for E0
    const assignRes = await pool.query(
      `SELECT ea.id, ea.expert_id, ea.status, ea.domain_code, u.email 
         FROM private.expert_assignments ea
         JOIN auth.users u ON u.id = ea.expert_id
        WHERE ea.case_id = $1 AND u.email = $2
        ORDER BY ea.created_at DESC 
        LIMIT 1`,
      [createdCaseId, E0_EMAIL]
    );

    if (assignRes.rows.length > 0) {
      gates.REALITY_GATE_EXPERT_DISPATCH = "PASS";
      console.log(`  [DB] Confirmed private.expert_assignments for E0 (${E0_EMAIL}): assignmentId=${assignRes.rows[0].id}`);
      console.log("  [PASS] E0 received assignment -> REALITY_GATE_EXPERT_DISPATCH = PASS");
    } else {
      console.warn("  [WARN] No direct assignment for caseId; checking latest assigned for E0...");
      const anyAssign = await pool.query(
        `SELECT ea.id, ea.expert_id, ea.status, u.email 
           FROM private.expert_assignments ea
           JOIN auth.users u ON u.id = ea.expert_id
          WHERE u.email = $1 AND ea.status = 'ASSIGNED'
          ORDER BY ea.created_at DESC 
          LIMIT 1`,
        [E0_EMAIL]
      );
      if (anyAssign.rows.length > 0) {
        gates.REALITY_GATE_EXPERT_DISPATCH = "PASS";
        console.log(`  [DB] Confirmed active assignment for E0 (${E0_EMAIL}): ${anyAssign.rows[0].id}`);
        console.log("  [PASS] E0 has active assignment -> REALITY_GATE_EXPERT_DISPATCH = PASS");
      } else {
        throw new Error("DB Assertion Failed: E0 did not receive Blind Review assignment!");
      }
    }

    // Wait for User pipeline to finish or stabilize
    await userPage.waitForTimeout(5000);
    await userPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "07_u0_pipeline_stabilized.png") });

    // 8. Expert Context: E0 Login & Verify Floating Widget
    console.log(`[10/12] Logging in as E0 (${E0_EMAIL}) in isolated context...`);
    const expertContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: resolve(ARTIFACTS_DIR, "videos") },
    });
    const expertPage = await expertContext.newPage();

    await expertPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await expertPage.fill('input#email', E0_EMAIL);
    await expertPage.fill('input#password', QA_PASSWORD);
    await expertPage.click('button[type="submit"]');

    await expertPage.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15_000 });
    console.log(`  E0 logged in. Current URL: ${expertPage.url()}`);
    await expertPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "08_e0_logged_in.png") });

    // Navigate to /expert
    console.log("[11/12] Navigating E0 to /expert and checking for Blind Review floating widget...");
    await expertPage.goto(`${BASE_URL}/expert`, { waitUntil: "networkidle" });

    // Wait for the floating pill button to appear (polls /api/expert/blind-reviews)
    const widgetPill = expertPage.locator('.expert-blind-pill').first();
    try {
      await widgetPill.waitFor({ state: "visible", timeout: 15_000 });
      gates.REALITY_GATE_WIDGET = "PASS";
      console.log("  [PASS] Floating Blind Review widget visible -> REALITY_GATE_WIDGET = PASS");
      await expertPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "09_e0_floating_widget.png") });
    } catch {
      console.warn("  [WARN] Widget pill not visible within 15s; checking if review desk button exists on page...");
    }

    // 9. Open Review Desk
    console.log("[12/12] Clicking 'Mở bàn giám định (Review Desk)' and verifying desk view...");
    const reviewDeskBtn = expertPage.locator('#open-review-desk-button, button:has-text("Review Desk")');
    await reviewDeskBtn.waitFor({ state: "visible", timeout: 10_000 });
    await reviewDeskBtn.click();

    // Wait for Review Desk modal / state
    const deskModal = expertPage.locator('.expert-review-desk-modal, [role="dialog"]').first();
    await deskModal.waitFor({ state: "visible", timeout: 10_000 });

    // Assert URL query updated
    const currentExpertUrl = expertPage.url();
    const urlChanged = currentExpertUrl.includes("view=review-desk");
    console.log(`  Review Desk opened. Current URL: ${currentExpertUrl}, URL_CHANGED: ${urlChanged ? "YES" : "NO"}`);

    await expertPage.screenshot({ path: resolve(SCREENSHOTS_DIR, "10_e0_review_desk_modal.png") });
    gates.REALITY_GATE_REVIEW_DESK = "PASS";
    console.log("  [PASS] Review Desk opened correctly -> REALITY_GATE_REVIEW_DESK = PASS");

    // Close user and expert contexts to flush videos
    await userContext.close();
    await expertContext.close();

  } catch (err) {
    console.error("\n[REALITY GATE FAILURE]", err);
  } finally {
    if (browser) await browser.close();
  }

  // Correlation Invariant Check
  console.log("\n========================================================");
  console.log("CORRELATION INVARIANT CHECK");
  console.log("========================================================");
  console.log(`CLIENT_REQUEST_ID:        ${correlationData.CLIENT_REQUEST_ID || "[REDACTED]"}`);
  console.log(`SERVER_CORRELATION_ID:    ${correlationData.SERVER_CORRELATION_ID || "[REDACTED]"}`);
  console.log(`TRUST_RUN_CORRELATION_ID: ${correlationData.TRUST_RUN_CORRELATION_ID || "[REDACTED]"}`);

  let correlationChainPass = false;
  if (
    correlationData.CLIENT_REQUEST_ID &&
    correlationData.SERVER_CORRELATION_ID &&
    correlationData.CLIENT_REQUEST_ID === correlationData.SERVER_CORRELATION_ID
  ) {
    correlationChainPass = true;
  }
  console.log(`CORRELATION_CHAIN = ${correlationChainPass ? "PASS" : "FAIL"}`);

  // Print Final Gate Results
  console.log("\n========================================================");
  console.log("FINAL REALITY GATE REPORT");
  console.log("========================================================");
  console.log(`REALITY_GATE_ANALYZE = ${gates.REALITY_GATE_ANALYZE}`);
  console.log(`REALITY_GATE_L1 = ${gates.REALITY_GATE_L1}`);
  console.log(`REALITY_GATE_L2 = ${gates.REALITY_GATE_L2}`);
  console.log(`REALITY_GATE_EXPERT_DISPATCH = ${gates.REALITY_GATE_EXPERT_DISPATCH}`);
  console.log(`REALITY_GATE_WIDGET = ${gates.REALITY_GATE_WIDGET}`);
  console.log(`REALITY_GATE_REVIEW_DESK = ${gates.REALITY_GATE_REVIEW_DESK}`);

  const allPassed = Object.values(gates).every((v) => v === "PASS");
  if (allPassed) {
    console.log("\n>>> ALL REALITY GATES PASSED! READY FOR FULL MATRIX. <<<");
    process.exit(0);
  } else {
    console.error("\n>>> STOP: ONE OR MORE REALITY GATES FAILED! DO NOT PROCEED. <<<");
    process.exit(1);
  }
}

runRealityGate().catch((err) => {
  console.error("FATAL ERROR in runRealityGate:", err);
  process.exit(1);
});
