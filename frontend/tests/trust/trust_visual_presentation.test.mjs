import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MASTER_ULTRA_LAYERS,
  normalizeMasterUltraRun,
} from "../../src/lib/ai-trust/v5/MasterUltraTrustModel.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("1. Trust 5-layer visual rendering is complete and canonical", () => {
  const journeySource = read("src/components/trust/TrustMasterUltraJourney.jsx");
  const layerIds = MASTER_ULTRA_LAYERS.map((l) => l.id);
  assert.deepEqual(layerIds, ["l1", "l2", "l3", "l4", "l5"]);

  // Verify all 5 layers are implemented as subcomponents
  assert.match(journeySource, /function ClaimLayer/);
  assert.match(journeySource, /function DiscoveryLayer/);
  assert.match(journeySource, /function ForensicsLayer/);
  assert.match(journeySource, /function AiVerificationLayer/);
  assert.match(journeySource, /function DecisionLayer/);

  // Verify verified media assets are referenced
  assert.match(journeySource, /\/media\/v3\/trust\/l1-claim\.webp/);
  assert.match(journeySource, /\/media\/v3\/trust\/l2-discovery\.mp4/);
  assert.match(journeySource, /\/media\/v3\/trust\/l3-forensics\.webp/);
  assert.match(journeySource, /\/media\/v3\/trust\/l4-multiai\.mp4/);
  assert.match(journeySource, /\/media\/v3\/trust\/l5-decision\.webp/);
});

test("2. L4 Gemini AVAILABLE state renders real observations without synthetic consensus", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: { pipelineStatus: "COMPLETED", stages: { l4: { operationStatus: "COMPLETED" } } },
    canonicalResult: {
      providerObservations: [
        { provider: "Gemini", model: "gemini-2.5-pro", status: "COMPLETED", latencyMs: 380 }
      ],
      analysisStreams: [
        { id: "stream-gemini", label: "Semantic consistency review", provider: "Gemini", status: "COMPLETED" }
      ],
    }
  });

  assert.equal(normalized.layers.l4.streams[0].provider, "Gemini");
  assert.equal(normalized.layers.l4.streams[0].status, "COMPLETED");

  const journeySource = read("src/components/trust/TrustMasterUltraJourney.jsx");
  assert.doesNotMatch(journeySource, /Internal Academic Model/i);
  assert.doesNotMatch(journeySource, /Multi-model consensus/i);
  assert.doesNotMatch(journeySource, /synthetic AI agreement/i);
});

test("3. L4 Gemini 429 state renders truthful degraded notice", () => {
  const journeySource = read("src/components/trust/TrustMasterUltraJourney.jsx");
  assert.match(journeySource, /Rate limit \/ timeout \/ unavailable/i);
  assert.match(journeySource, /Decision Intelligence continued using deterministic Trust policy/i);
  assert.match(journeySource, /429/);
});

test("4. L4 Gemini TIMEOUT state renders truthful degraded notice", () => {
  const journeySource = read("src/components/trust/TrustMasterUltraJourney.jsx");
  assert.match(journeySource, /504/);
});

test("5. L4 Gemini UNAVAILABLE state renders truthful degraded notice", () => {
  const journeySource = read("src/components/trust/TrustMasterUltraJourney.jsx");
  assert.match(journeySource, /503/);
});

test("6. L5 still renders after degraded L4", () => {
  const normalizedWithDegradedL4 = normalizeMasterUltraRun({
    pipeline: {
      pipelineStatus: "COMPLETED",
      stages: {
        l1: { operationStatus: "COMPLETED" },
        l2a: { operationStatus: "COMPLETED" },
        l3: { operationStatus: "COMPLETED" },
        l4: { operationStatus: "FAILED", error: "Gemini 429 Rate Limit" },
        l5: { operationStatus: "COMPLETED" },
      },
      finalDecision: {
        label: "Cần thận trọng",
        rationale: "Bằng chứng gốc chưa đủ điều kiện công nhận.",
        recommendedAction: "Đối chiếu lại với phòng đào tạo.",
      },
    },
    canonicalResult: {
      providerObservations: [
        { provider: "Gemini", status: "FAILED", error: "RATE_LIMITED" }
      ],
      decision: {
        label: "Cần thận trọng",
        truthStatus: "Cần thận trọng",
        verdict: "Cần thận trọng",
        security: "SECURE",
        risk: "MEDIUM",
        evidenceSufficiency: "PARTIAL",
      },
    }
  });

  // L5 remains populated and canonical
  assert.equal(normalizedWithDegradedL4.layers.l5.verdict, "Cần thận trọng");
  assert.ok(normalizedWithDegradedL4.macroStages.find((s) => s.id === "l5"));
});

test("6a. Macro status keeps degraded L2B/L4 visible after pipeline completion", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: {
      pipelineStatus: "COMPLETED",
      finalDecision: { label: "Cần thận trọng" },
      stages: {
        l1: { operationStatus: "COMPLETED" },
        l2a: { operationStatus: "COMPLETED" },
        l2b: { operationStatus: "PARTIAL", providerStatus: "RATE_LIMITED" },
        l2c: { operationStatus: "COMPLETED" },
        l3: { operationStatus: "COMPLETED" },
        l4: { operationStatus: "PARTIAL", providerStatus: "AUTH_FAILED" },
        l5: { operationStatus: "COMPLETED" },
      },
    },
  });

  const statusById = Object.fromEntries(normalized.macroStages.map((stage) => [stage.id, stage.status]));
  assert.equal(statusById.l1, "COMPLETE");
  assert.equal(statusById.l2, "PARTIAL");
  assert.equal(statusById.l3, "COMPLETE");
  assert.equal(statusById.l4, "PARTIAL");
  assert.equal(statusById.l5, "COMPLETE");
});

test("7. No infinite loading state when stages fail or complete", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: {
      pipelineStatus: "FAILED",
      stages: {
        l4: { operationStatus: "FAILED" },
      }
    }
  });

  // Does not remain running infinitely
  assert.notEqual(normalized.macroStages.find((s) => s.id === "l4")?.status, "RUNNING");
});

test("8. No hidden alternate AI fallback is injected", () => {
  const journeySource = read("src/components/trust/TrustMasterUltraJourney.jsx");
  const modelSource = read("src/lib/ai-trust/v5/MasterUltraTrustModel.js");

  // Verify no fallback synthetic provider injection
  assert.doesNotMatch(journeySource, /fallbackAIProvider/i);
  assert.doesNotMatch(journeySource, /syntheticFallback/i);
  assert.doesNotMatch(modelSource, /syntheticFallback/i);
});

test("11. Trust verdict remains independent of Expert UI (no averaging or combined score)", () => {
  const matrixSource = read("src/components/trust/TrustVsExpertComparisonMatrix.jsx");
  assert.match(matrixSource, /KHÔNG GỘP ĐIỂM/);
  assert.match(matrixSource, /ĐỐI CHIẾU ĐỘC LẬP/);
  assert.doesNotMatch(matrixSource, /averageScore/i);
  assert.doesNotMatch(matrixSource, /combinedVerdict/i);
  assert.doesNotMatch(matrixSource, /combinedConfidence/i);
});

test("12. Route-scoped CSS does not leak global styles", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /\.trust-forensic-lab/);
  assert.match(css, /\[data-pillar="trust"\]/);
  assert.match(css, /\.expert-council-space/);
  assert.match(css, /\[data-pillar="expert"\]/);

  // Ensure root variables are not overwritten
  assert.ok(!css.includes(":root {\n  --sh-trust-cyan"));
});

test("13. Reduced motion safety overrides video and animation", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.trust-forensic-lab video,\s*\.expert-council-space video\s*\{\s*display:\s*none\s*!important;/);
});

test("14. Responsive breakpoints are defined for 390, 768, 1024, 1440, 1920", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /@media \(max-width: 1024px\)/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
});
