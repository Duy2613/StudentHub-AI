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

test("Trust public model exposes four analysis layers plus a separately gated Final Predict", () => {
  assert.deepEqual(MASTER_ULTRA_LAYERS.map((layer) => layer.id), ["l1", "l2", "l3", "l4"]);
  assert.deepEqual(MASTER_ULTRA_LAYERS.map((layer) => layer.name), [
    "Deterministic Screen",
    "Threat & Semantic Intelligence",
    "Evidence Retrieval",
    "Synthesis & Reasoning",
  ]);
  assert.deepEqual(MASTER_ULTRA_LAYERS.map((layer) => layer.internalStageIds), [
    ["l1"],
    ["l2a", "l2b", "l2c"],
    ["l3"],
    ["l4", "l5"],
  ]);
  assert.deepEqual(MASTER_ULTRA_STATES, [
    "IDLE", "INPUT_READY", "SUBMITTING", "L1_READY", "L1_ENTER", "L1_RUNNING", "L1_COMPLETE",
    "TRANSITION_1_2", "L2_ENTER", "L2_RUNNING", "L2_COMPLETE", "TRANSITION_2_3",
    "L3_ENTER", "L3_RUNNING", "L3_COMPLETE", "TRANSITION_3_4", "L4_ENTER", "L4_RUNNING",
    "L4_COMPLETE", "FINAL_PREDICT_LOCKED", "FINAL_PREDICT_PUBLISHED", "COMPLETE_OVERVIEW",
    "INSPECT_LAYER", "ERROR_RECOVERABLE", "ERROR_FATAL",
  ]);
});

test("Trust DTO preserves Main V5 authority, stage status, separate sources/evidence, and published decision", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: {
      pipelineStatus: "COMPLETED",
      stages: {
        l1: { operationStatus: "COMPLETED" },
        l2a: { operationStatus: "COMPLETED" },
        l2b: { operationStatus: "PARTIAL", providerStatus: "RATE_LIMITED" },
        l2c: { operationStatus: "COMPLETED" },
        l3: { operationStatus: "COMPLETED" },
        l4: { operationStatus: "COMPLETED" },
        l5: { operationStatus: "COMPLETED" },
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
      sources: [{
        sourceId: "source-1",
        title: "Cổng thông tin học bổng chính thức",
        publisher: "University",
        url: "https://university.example/scholarship",
        sourceType: "official",
        independenceGroup: "official-1",
      }],
      evidence: {
        items: [{
          evidenceId: "evidence-1",
          sourceId: "source-1",
          claimIds: ["claim-1"],
          relationship: "contradicting",
          excerpt: "Trang chính thức không yêu cầu khoản phí này.",
        }],
        relationships: [{ evidenceId: "evidence-1", sourceId: "source-1", relationship: "contradicting" }],
        independenceGroups: [{ id: "official-1", label: "University official origin", memberCount: 1 }],
      },
      providerObservations: [{ provider: "Main Trust V5", model: "v5-live", status: "OBSERVED" }],
      analysisStreams: [{ id: "stream-1", label: "Evidence comparison", provider: "Main Trust V5", status: "COMPLETED" }],
      sequentialSignal: { provider: "Sequential", status: "OBSERVED", rawVerdict: "REVIEW", reason: "Adapter signal only." },
      decisionTwin: { nextAction: "Verify through the university domain." },
    },
    presentation: {
      macroStages: MASTER_ULTRA_LAYERS.map((layer) => ({ id: layer.presentationId, status: "WAITING" })),
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
  assert.deepEqual(normalized.macroStages.map((layer) => layer.status), ["COMPLETE", "PARTIAL", "COMPLETE", "COMPLETE"]);
  assert.equal(normalized.layers.l2.claims[0].text, "Yêu cầu phí giữ chỗ");
  assert.equal(normalized.layers.l3.sources[0].url, "https://university.example/scholarship");
  assert.equal(Object.hasOwn(normalized.layers.l3.sources[0], "relationship"), false);
  assert.equal(normalized.layers.l3.evidenceItems[0].sourceId, "source-1");
  assert.equal(normalized.layers.l3.contradicting[0].id, "evidence-1");
  assert.equal(normalized.layers.l4.streams[0].provider, "Main Trust V5");
  assert.equal(normalized.finalPredict.status, "PUBLISHED");
  assert.equal(normalized.finalPredict.verdict, "Không nên tiếp tục");
  assert.equal(normalized.finalPredict.confidence, null);
  assert.equal(normalized.finalPredict.evidenceSufficiency, null);
  assert.equal(normalized.finalPredict.decisionTwin.nextAction, "Verify through the university domain.");
});

test("Processing state does not synthesize progress; absent final verdict keeps Final Predict locked", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: { pipelineStatus: "COMPLETED" },
    canonicalResult: { decision: { agreement: 0.88, evidenceAgreement: 0.88 } },
    processing: true,
  });

  assert.deepEqual(normalized.macroStages.map((stage) => stage.status), ["WAITING", "WAITING", "WAITING", "WAITING"]);
  assert.equal(normalized.macroStages[0].locked, false);
  assert.deepEqual(normalized.macroStages.slice(1).map((stage) => stage.locked), [true, true, true]);
  assert.equal(normalized.finalPredict.status, "LOCKED");
  assert.equal(normalized.finalPredict.verdict, null);
});

test("FOUR_LAYER API stages map to all four visible Trust stages", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: {
      pipelineModel: "FOUR_LAYER",
      pipelineStatus: "COMPLETED",
      stages: Object.fromEntries(["l1", "l2", "l3", "l4"].map((id) => [id, { operationStatus: "COMPLETED" }])),
      finalPredict: { truthVerdict: "SUPPORTED" },
    },
  });

  assert.deepEqual(normalized.macroStages.map((stage) => stage.status), ["COMPLETE", "COMPLETE", "COMPLETE", "COMPLETE"]);
  assert.deepEqual(normalized.macroStages.map((stage) => stage.locked), [false, false, false, false]);
  assert.equal(normalized.finalPredict.status, "PUBLISHED");
  assert.equal(normalized.finalPredict.verdict, "SUPPORTED");
});

test("Source records never become evidence items and evidence retains its source/claim references", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: { stages: { l3: { operationStatus: "COMPLETED" } } },
    canonicalResult: {
      sources: [{ sourceId: "s-1", title: "Primary source", url: "https://example.edu/policy", relationship: "SUPPORTS" }],
      evidence: { items: [{ evidenceId: "e-1", sourceId: "s-1", claimIds: ["c-1"], excerpt: "Policy text", relation: "CONTRADICTS" }] },
    },
  });

  assert.equal(normalized.sources.length, 1);
  assert.equal(normalized.evidence.length, 1);
  assert.equal(normalized.evidence[0].id, "e-1");
  assert.equal(normalized.evidence[0].sourceId, "s-1");
  assert.deepEqual(normalized.evidence[0].claimIds, ["c-1"]);
  assert.equal(normalized.evidence[0].relationship, "contradicts");
  assert.equal(normalized.sources[0].relationship, undefined);
});

test("Master Ultra UI has composer, observed input, four layers, and backend-driven progression only", () => {
  const journey = read("src/components/trust/TrustMasterUltraJourney.jsx");
  const workspace = read("src/components/trust/TrustWorkspaceClient.jsx");
  const activeWorkspace = read("src/components/trust/TrustV4Workspace.jsx");

  assert.match(journey, /data-master-ultra-state/);
  assert.match(journey, /data-main-authority="MAIN_TRUST_V5"/);
  assert.match(journey, /data-primary-layer-count="4"/);
  assert.match(journey, /data-testid="trust-observed-input"/);
  assert.match(journey, /data-testid="trust-final-predict"/);
  assert.match(journey, /INSPECT_LAYER/);
  assert.match(journey, /NO RERUN/);
  assert.doesNotMatch(journey, /setTimeout|Replay journey|VERIFIED_IMMUTABLE/);
  assert.match(journey, /MASTER_ULTRA_STATES\.includes/);
  assert.match(activeWorkspace, /import TrustMasterUltraJourney from ["']\.\/TrustMasterUltraJourney["']/);
  assert.match(activeWorkspace, /<TrustMasterUltraJourney/);
  assert.doesNotMatch(workspace, /TrustForensicPipelineVisualizer/);
});

test("Master Ultra preserves missing provider, evidence, and OCR measurements as unavailable", () => {
  const normalized = normalizeMasterUltraRun({
    pipeline: {
      pipelineStatus: "COMPLETED",
      stages: {
        l1: { operationStatus: "COMPLETED" },
        l2a: { operationStatus: "COMPLETED" },
        l2b: { operationStatus: "COMPLETED" },
        l2c: { operationStatus: "COMPLETED" },
        l3: { operationStatus: "COMPLETED" },
        l4: { operationStatus: "COMPLETED" },
        l5: { operationStatus: "COMPLETED" },
      },
    },
    canonicalResult: {
      input: { type: "URL", content: "https://example.test/claim" },
      decision: { agreement: 0.88, evidenceAgreement: 0.88, sourceAgreement: 0.88 },
    },
    layers: { layer4: { sourceQuality: 0.92 } },
  });

  assert.equal(normalized.layers.l1.inputType, "url");
  assert.equal(normalized.layers.l1.screenResult, "NOT_ASSESSED");
  assert.equal(normalized.layers.l1.risk, "UNKNOWN");
  assert.equal(normalized.layers.l1.qrDetected, null);
  assert.equal(normalized.layers.l2.threatIntelligence.status, "NOT_CHECKED");
  assert.equal(normalized.layers.l2.semanticIntelligence.urgency, "NOT_ASSESSED");
  assert.equal(normalized.layers.l2.semanticIntelligence.impersonation, "NOT_ASSESSED");
  assert.equal(normalized.layers.l2.studentDomainRisk.domainRisk, "UNKNOWN");
  assert.equal(normalized.layers.l3.retrievalProvider, null);
  assert.equal(normalized.layers.l3.tavilyStatus, "NOT_RUN");
  assert.equal(normalized.layers.l3.sourceCount, 0);
  assert.equal(normalized.layers.l3.evidenceCount, 0);
  assert.equal(normalized.layers.l3.sourceIndependence, null);
  assert.equal(normalized.layers.l3.freshness, null);
  assert.equal(normalized.layers.l4.agreement, null);
  assert.equal(normalized.layers.l4.sourceQuality, null);
  assert.equal(normalized.layers.l4.evidenceSufficiency, null);
  assert.equal(normalized.layers.l4.reasoningSummary, null);
  assert.equal(normalized.layers.l4.aiExecutedModel, null);
  assert.equal(normalized.layers.l4.independentGroupsCount, null);
  assert.equal(normalized.layers.l4.reasons.length, 0);
  assert.equal(normalized.finalPredict.status, "LOCKED");
  assert.equal(normalized.finalPredict.verdict, null);
  assert.equal(normalized.finalPredict.confidence, null);
  assert.equal(normalized.finalPredict.sourceAgreement, null);
  assert.equal(normalized.finalPredict.securityRisk, null);
  assert.equal(normalized.finalPredict.humanReviewState, "LOCKED");

  const imageInput = normalizeMasterUltraRun({
    pipeline: { stages: { l1: { operationStatus: "COMPLETED" } } },
    canonicalResult: { input: { type: "IMAGE", content: "receipt-photo" } },
  }).layers.l1;
  assert.equal(imageInput.ocrStatus, "NOT_REPORTED");
  assert.equal(imageInput.qrDetected, null);
  assert.equal(imageInput.qrCount, null);
});

test("Master Ultra does not contain hardcoded positive trust metrics or integrity claims", () => {
  const journey = read("src/components/trust/TrustMasterUltraJourney.jsx");
  const model = read("src/lib/ai-trust/v5/MasterUltraTrustModel.js");

  assert.doesNotMatch(journey, /(?:0\.88|0\.92|85%|88%|PRIVATE_SUBNETS_SAFE|Tavily Web Search|AI Verification ✓|VERIFIED_IMMUTABLE)/);
  assert.doesNotMatch(model, /(?:"0\.88"|"0\.92"|"85%"|gemini-3\.8-flash|NEEDS_REVIEW)/);
});
