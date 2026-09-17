import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../");

import {
  MASTER_ULTRA_LAYERS,
  normalizeMasterUltraRun,
} from "../src/lib/ai-trust/v5/MasterUltraTrustModel.js";
import {
  TRUST_MACRO_STAGES,
  createTrustPresentationModel,
} from "../src/lib/ai-trust/v5/TrustPresentationModel.js";
import { stageFromL4 } from "../src/lib/ai-trust/v5/stageAdapters.js";
import { TrustPipelineOrchestrator } from "../src/lib/ai-trust/v5/TrustPipelineOrchestrator.js";
import { postAuthDestination } from "../src/lib/auth/authRedirects.js";
import { PROFILE_STATUS } from "../src/lib/auth/presentationState.js";

// ============================================================================
// GUARD 1 & 2: Trust Macro Mapping & Immediate Monotonic Progression
// ============================================================================
test("Guard 2: Canonical macro mapping inspection and verification", () => {
  // 1. Inspect MasterUltraTrustModel layers
  assert.equal(MASTER_ULTRA_LAYERS.length, 5, "Must have exactly 5 macro layers");
  assert.deepEqual(
    MASTER_ULTRA_LAYERS[0].internalStageIds,
    ["l1"],
    "Claim Intelligence must map exclusively to L1"
  );
  assert.deepEqual(
    MASTER_ULTRA_LAYERS[1].internalStageIds,
    ["l2a", "l2b", "l2c"],
    "Evidence Discovery must map to L2A, L2B, L2C"
  );
  assert.deepEqual(
    MASTER_ULTRA_LAYERS[2].internalStageIds,
    ["l3"],
    "Evidence Forensics must map to L3"
  );
  assert.deepEqual(
    MASTER_ULTRA_LAYERS[3].internalStageIds,
    ["l4"],
    "AI Verification must map to L4"
  );
  assert.deepEqual(
    MASTER_ULTRA_LAYERS[4].internalStageIds,
    ["l5"],
    "Decision Intelligence must map to L5"
  );

  // 2. Inspect TrustPresentationModel stages
  assert.equal(TRUST_MACRO_STAGES.length, 5, "Must have exactly 5 presentation macro stages");
  assert.deepEqual(TRUST_MACRO_STAGES[0].internalStageIds, ["l1"]);
  assert.deepEqual(TRUST_MACRO_STAGES[1].internalStageIds, ["l2a", "l2b", "l2c"]);
  assert.deepEqual(TRUST_MACRO_STAGES[2].internalStageIds, ["l3"]);
  assert.deepEqual(TRUST_MACRO_STAGES[3].internalStageIds, ["l4"]);
  assert.deepEqual(TRUST_MACRO_STAGES[4].internalStageIds, ["l5"]);
});

test("Guard 2: Monotonic progress: When L1 completes (3ms) and L2A is running, Macro 1 is COMPLETE and Macro 2 is RUNNING", () => {
  const pipelineState = {
    pipelineStatus: "RUNNING",
    currentStage: "l2a",
    stages: {
      l1: { operationStatus: "COMPLETED", finding: "LOCAL_CLEAR" },
      l2a: { operationStatus: "RUNNING" },
      l2b: { operationStatus: "NOT_STARTED" },
      l2c: { operationStatus: "NOT_STARTED" },
      l3: { operationStatus: "NOT_STARTED" },
      l4: { operationStatus: "NOT_STARTED" },
      l5: { operationStatus: "NOT_STARTED" },
    },
  };

  const normalized = normalizeMasterUltraRun({
    pipeline: pipelineState,
    processing: true,
  });

  const macro0 = normalized.macroStages.find((s) => s.id === "l1");
  const macro1 = normalized.macroStages.find((s) => s.id === "l2");

  assert.equal(
    macro0?.status,
    "COMPLETE",
    "Macro 0 (Claim Intelligence) must transition to COMPLETE immediately upon L1 completion"
  );
  assert.equal(
    macro1?.status,
    "RUNNING",
    "Macro 1 (Evidence Discovery) must be RUNNING while L2A is active"
  );
  const statusIndex = normalized.macroStages.findIndex(
    (layer) => layer.status === "RUNNING" || layer.status === "PARTIAL" || layer.status === "FAILED"
  );
  assert.equal(
    statusIndex,
    1,
    "Target active layer index must advance to 1 (Evidence Discovery), never remaining stuck at 0"
  );
});

// ============================================================================
// GUARD 3: Trust Run reaches L5 without RealtimeContext / SSE stream
// ============================================================================
test("Guard 3: Trust run reaches L5 and final result appears when /api/realtime/stream is unavailable", async () => {
  // Global RealtimeContext connects to /api/realtime/stream.
  // TrustPipelineOrchestrator must execute deterministically and autonomously.
  const orchestrator = new TrustPipelineOrchestrator();

  const runResult = await orchestrator.run({
    type: "text",
    content: "Đóng 500k để nhận học bổng toàn phần và cam kết việc làm.",
  });

  assert.ok(runResult, "Trust run must return a result");
  assert.ok(
    ["COMPLETED", "PARTIAL"].includes(runResult.pipelineStatus),
    `Pipeline must complete or degrade gracefully, got ${runResult.pipelineStatus}`
  );
  assert.ok(runResult.stages?.l5, "Pipeline must reach L5");
  assert.equal(
    runResult.stages.l5.operationStatus,
    "COMPLETED",
    "L5 must be COMPLETED"
  );
  assert.ok(runResult.finalDecision, "Final decision must be synthesized");
  assert.ok(
    runResult.finalDecision.enforcement,
    "Final decision must produce enforcement action"
  );
});

// ============================================================================
// GUARD 4: Exact Provider Failure Semantics Preserved
// ============================================================================
test("Guard 4: Preserve exact provider failure semantics without flattening", () => {
  const failureModes = [
    { rawCode: "RATE_LIMITED", expectedProvider: "RATE_LIMITED" },
    { rawCode: "TIMEOUT", expectedProvider: "TIMEOUT" },
    { rawCode: "INVALID_RESPONSE", expectedProvider: "INVALID_RESPONSE" },
    { rawCode: "UNAVAILABLE", expectedProvider: "UNAVAILABLE" },
    { rawCode: "ERROR", expectedProvider: "ERROR" },
  ];

  for (const { rawCode, expectedProvider } of failureModes) {
    const rawL4Result = {
      securityClassification: "UNKNOWN",
      truthStatus: "INSUFFICIENT_EVIDENCE",
      aiVerificationStatus: rawCode,
      aiVerificationErrorType: rawCode,
      aiVerification: { provider: "gemini", model: "gemini-2.5-pro" },
    };

    const adapted = stageFromL4(rawL4Result, "req_test_failures", {});

    assert.equal(
      adapted.providerStatus,
      expectedProvider,
      `providerStatus must remain truthful for ${rawCode}, never flattened to generic status`
    );
    assert.equal(
      adapted.operationStatus,
      "PARTIAL",
      `operationStatus must degrade to PARTIAL for ${rawCode}`
    );
    assert.equal(
      adapted.safeToContinue,
      true,
      `safeToContinue must be true so downstream L5 can audit and conclude`
    );
  }
});

// ============================================================================
// GUARD 5: Returning-User Profile Routing State Machine
// ============================================================================
test("Guard 5: Returning-user profile routing distinguishes all 4 profile states", () => {
  assert.equal(PROFILE_STATUS.LOADING, "PROFILE_LOADING");
  assert.equal(PROFILE_STATUS.FOUND, "PROFILE_FOUND");
  assert.equal(PROFILE_STATUS.NOT_FOUND, "PROFILE_NOT_FOUND");
  assert.equal(PROFILE_STATUS.ERROR, "PROFILE_ERROR");

  // 1. Returning user with existing profile (onboarded: true) -> must go to /dashboard (or next)
  const existingUserDest = postAuthDestination({ next: "/dashboard", onboarded: true });
  assert.equal(existingUserDest, "/dashboard", "Onboarded user routes to /dashboard");

  // 2. Returning user with custom next param -> must preserve returnPath
  const customNextDest = postAuthDestination({ next: "/expert", onboarded: true });
  assert.equal(customNextDest, "/expert", "Onboarded user routes to custom next destination");

  // 3. New user with explicit PROFILE_NOT_FOUND (onboarded: false) -> routes to /onboarding
  const newUserDest = postAuthDestination({ next: "/dashboard", onboarded: false });
  assert.equal(newUserDest, "/onboarding", "Explicitly non-onboarded user routes to /onboarding");
});

// ============================================================================
// GUARD 6: Stacking Context & Clickability Guard
// ============================================================================
test("Guard 6: Stacking context rules in globals.css prevent overlay blocking", () => {
  const cssContent = fs.readFileSync(path.join(frontendDir, "src/app/globals.css"), "utf8");

  // Verify .app-header has z-index: 50
  assert.ok(
    cssContent.includes(".app-header") && cssContent.includes("z-index: 50"),
    ".app-header must define z-index: 50"
  );

  // Verify sticky toolbars in expert use top: var(--app-header-height, 4.25rem) and z-index: 40
  assert.ok(
    cssContent.includes("top: var(--app-header-height, 4.25rem)"),
    "Sticky toolbar must offset by --app-header-height"
  );
  assert.ok(
    cssContent.includes("z-index: 40"),
    "Sticky toolbar must use z-index: 40 (beneath header z-50)"
  );

  // Verify decorative layers use pointer-events: none !important
  assert.ok(
    cssContent.includes(".expert-hero-vignette") &&
    cssContent.includes("pointer-events: none !important"),
    "Decorative layers must enforce pointer-events: none !important"
  );

  // Verify interactive elements have pointer-events: auto
  assert.ok(
    cssContent.includes(".expert-card") &&
    cssContent.includes("pointer-events: auto !important"),
    "Expert interactive elements must enforce pointer-events: auto !important"
  );
});

// ============================================================================
// GUARD 7: Qualification Deduplication Reuses Existing State Ownership
// ============================================================================
test("Guard 7: Qualification deduplication reuses AuthContext state ownership", () => {
  const authContextContent = fs.readFileSync(path.join(frontendDir, "src/lib/auth/AuthContext.jsx"), "utf8");
  const shellContent = fs.readFileSync(path.join(frontendDir, "src/components/layout/UnifiedAppShell.jsx"), "utf8");
  const workspaceContent = fs.readFileSync(path.join(frontendDir, "src/components/expert/ExpertNetworkWorkspace.jsx"), "utf8");
  const communityContent = fs.readFileSync(path.join(frontendDir, "src/components/community/CommunitySocialWorkspace.jsx"), "utf8");

  // AuthContext manages the qualification fetch
  assert.ok(
    authContextContent.includes("/api/expert/qualification"),
    "AuthContext must own the /api/expert/qualification fetch"
  );
  assert.ok(
    authContextContent.includes("expertLifecycleState"),
    "AuthContext must expose expertLifecycleState"
  );

  // Consumers read from AuthContext, NOT redundant individual fetches
  assert.ok(
    !shellContent.includes('fetch("/api/expert/qualification")'),
    "UnifiedAppShell must not fetch /api/expert/qualification directly"
  );
  assert.ok(
    !workspaceContent.includes('fetch("/api/expert/qualification")'),
    "ExpertNetworkWorkspace must not fetch /api/expert/qualification directly"
  );
  assert.ok(
    !communityContent.includes('fetch("/api/expert/qualification")'),
    "CommunitySocialWorkspace must not fetch /api/expert/qualification directly"
  );
});
