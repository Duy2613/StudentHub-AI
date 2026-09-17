import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MASTER_ULTRA_LAYERS,
  MASTER_ULTRA_STATES,
  normalizeMasterUltraRun,
} from "../../src/lib/ai-trust/v5/MasterUltraTrustModel.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("Master Ultra exposes the exact five-layer public state machine", () => {
  assert.deepEqual(MASTER_ULTRA_STATES, [
    "IDLE",
    "INPUT_READY",
    "SUBMITTING",
    "L1_ENTER",
    "L1_RUNNING",
    "L1_COMPLETE",
    "TRANSITION_1_2",
    "L2_ENTER",
    "L2_RUNNING",
    "L2_COMPLETE",
    "TRANSITION_2_3",
    "L3_ENTER",
    "L3_RUNNING",
    "L3_COMPLETE",
    "TRANSITION_3_4",
    "L4_ENTER",
    "L4_RUNNING",
    "L4_COMPLETE",
    "TRANSITION_4_5",
    "L5_ENTER",
    "L5_RUNNING",
    "L5_COMPLETE",
    "CONVERGENCE",
    "COMPLETE_OVERVIEW",
    "INSPECT_LAYER",
    "ERROR_RECOVERABLE",
    "ERROR_FATAL",
  ]);
  assert.deepEqual(MASTER_ULTRA_LAYERS.map((layer) => layer.id), ["l1", "l2", "l3", "l4", "l5"]);
  assert.deepEqual(MASTER_ULTRA_LAYERS.map((layer) => layer.name), [
    "Claim Intelligence",
    "Evidence Discovery",
    "Evidence Forensics",
    "AI Verification",
    "Decision Intelligence",
  ]);
});

test("Master Ultra DTO preserves Main V5 authority, provenance, adapter signals, and honest gaps", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: {
      pipelineStatus: "COMPLETED",
      stages: {
        l1: { operationStatus: "COMPLETED" },
        l2a: { operationStatus: "COMPLETED" },
        l2c: { operationStatus: "COMPLETED" },
        l3: { operationStatus: "COMPLETED" },
        l4: { operationStatus: "COMPLETED" },
      },
      finalDecision: {
        label: "Không nên tiếp tục",
        rationale: "Nguồn đối chiếu mâu thuẫn với yêu cầu chuyển tiền.",
        recommendedAction: "Không chuyển tiền trước khi xác minh qua kênh chính thức.",
      },
    },
    canonicalResult: {
      input: { type: "TEXT", content: "Một thông báo học bổng yêu cầu phí giữ chỗ." },
      claims: [{ id: "claim-1", text: "Yêu cầu phí giữ chỗ", type: "financial_request" }],
      evidence: {
        items: [{
          id: "source-1",
          title: "Cổng thông tin học bổng chính thức",
          publisher: "University",
          url: "https://university.example/scholarship",
          sourceType: "official",
          relationship: "supporting",
          independenceGroup: "official-1",
          snippet: "Trang chính thức không yêu cầu khoản phí này.",
        }],
        relationships: [{ sourceId: "source-1", relationship: "contradicting" }],
        independenceGroups: [{ id: "official-1", label: "University official origin", memberCount: 1 }],
      },
      providerObservations: [{ provider: "Main Trust V5", model: "v5-live", status: "OBSERVED" }],
      analysisStreams: [{ id: "stream-1", label: "Evidence comparison", provider: "Main Trust V5", status: "COMPLETED" }],
      sequentialSignal: { provider: "Sequential", status: "OBSERVED", rawVerdict: "REVIEW", reason: "Adapter signal only." },
      decisionTwin: { nextAction: "Verify through the university domain." },
      decision: undefined,
    },
    presentation: {
      macroStages: MASTER_ULTRA_LAYERS.map((layer) => ({ id: layer.id, status: "WAITING" })),
      finalDecisionLabel: "Không nên tiếp tục",
      reasons: ["Khoản phí không xuất hiện trên nguồn chính thức."],
    },
    input: { type: "text", content: "Một thông báo học bổng yêu cầu phí giữ chỗ." },
    sourceProvenance: { sourceMode: "LIVE", providerMode: "LIVE" },
  });

  assert.equal(normalized.schemaVersion, "trust.master-ultra.v1");
  assert.equal(normalized.authority.main, "MAIN_TRUST_V5");
  assert.equal(normalized.authority.finalDecision, "MAIN_TRUST_V5");
  assert.equal(normalized.authority.sequential, "ADAPTER_SIGNAL");
  assert.equal(normalized.noRerunOnInspect, true);
  assert.deepEqual(normalized.macroStages.map((layer) => layer.status), ["COMPLETE", "PARTIAL", "COMPLETE", "COMPLETE", "COMPLETE"]);
  assert.equal(normalized.layers.l2.sources[0].url, "https://university.example/scholarship");
  assert.equal(normalized.layers.l3.contradicting[0].id, "source-1");
  assert.equal(normalized.layers.l4.streams[0].provider, "Main Trust V5");
  assert.equal(normalized.layers.l5.verdict, "Không nên tiếp tục");
  assert.equal(normalized.layers.l5.confidence, null);
  assert.equal(normalized.layers.l5.evidenceSufficiency, null);
  assert.equal(normalized.layers.l5.decisionTwin.nextAction, "Verify through the university domain.");
});

test("Master Ultra UI keeps inspection local and renders one dominant layer at a time", () => {
  const journey = read("src/components/trust/TrustMasterUltraJourney.jsx");
  const workspace = read("src/components/trust/TrustWorkspaceClient.jsx");

  assert.match(journey, /data-master-ultra-state/);
  assert.match(journey, /data-main-authority="MAIN_TRUST_V5"/);
  assert.match(journey, /data-primary-layer-count="5"/);
  assert.match(journey, /INSPECT_LAYER/);
  assert.match(journey, /NO RERUN/);
  assert.match(journey, /Replay journey/);
  assert.match(journey, /MASTER_ULTRA_STATES\.includes/);
  assert.doesNotMatch(workspace, /TrustForensicPipelineVisualizer/);
});
