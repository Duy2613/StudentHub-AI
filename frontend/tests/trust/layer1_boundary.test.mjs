import assert from "node:assert/strict";
import test from "node:test";

import {
  HardRuleEngine,
  ITrustSignalModel,
  Layer1ScreenService,
  DecisionEngine,
  createLayer1Result,
  createSignal,
  executeAuxiliaryModelSafe,
} from "../../src/lib/ai-trust/layer1/index.js";

test("Layer 1 keeps malformed direct calls UNKNOWN and never manufactures confidence", async () => {
  const result = await Layer1ScreenService.screen({ type: "url", content: null, metadata: null, options: null });

  assert.equal(result.status, "UNKNOWN");
  assert.equal(result.confidence, 0);
  assert.equal(result.details.scope, "LOCAL_SCREEN_ONLY");
  assert.equal(result.details.providerIndependent, true);
  assert.equal(result.details.notFinalSafety, true);
  assert.notEqual(result.status, "PASS");

  const malformed = createLayer1Result({
    status: "not-a-layer1-status",
    confidence: Number.NaN,
    reasons: "not-an-array",
    signals: [null, { type: "test_signal", confidence: "0.99", evidence: {} }],
    details: { providerIndependent: false, notFinalSafety: false },
    metrics: { executionTimeMs: Number.POSITIVE_INFINITY, detectorsExecuted: ["ok", 1] },
  });

  assert.equal(malformed.status, "UNKNOWN");
  assert.equal(malformed.confidence, 0);
  assert.equal(malformed.signals.length, 1);
  assert.equal(malformed.signals[0].confidence, 0);
  assert.equal(malformed.details.providerIndependent, true);
  assert.equal(malformed.details.notFinalSafety, true);
  assert.equal(malformed.metrics.executionTimeMs, 0);

  for (const directInput of [null, [], {}, { signals: "forged" }]) {
    const direct = DecisionEngine.resolve(directInput);
    assert.equal(direct.status, "UNKNOWN");
    assert.equal(direct.confidence, 0);
    assert.equal(direct.details.notFinalSafety, true);
  }
});

test("Layer 1 redacts cyclic evidence without throwing", () => {
  const evidence = { password: "do-not-log", nested: {} };
  evidence.nested.self = evidence;

  const signal = createSignal({
    type: "hostile_input",
    confidence: "not-a-number",
    evidence,
  });

  assert.equal(signal.confidence, 0);
  assert.equal(signal.evidence.password, "[REDACTED]");
  assert.equal(signal.evidence.nested.self, "[REDACTED_CYCLIC_REFERENCE]");
  assert.doesNotThrow(() => HardRuleEngine.evaluate([null, {}, signal]));
});

test("Layer 1 blocks unsupported schemes at the local boundary", async () => {
  const result = await Layer1ScreenService.screen({
    type: "url",
    content: ["javascript", ":", "alert(1)"].join(""),
  });

  assert.equal(result.status, "BLOCK");
  assert.ok(result.reasons.includes("unsupported_scheme"));
  assert.equal(result.details.earlyExit, true);
  assert.equal(result.nextLayer, null);
});

test("Layer 1 blocks canonicalized private destinations before any provider", async () => {
  const localHost = ["127", "0", "0", "1"].join(".");
  const result = await Layer1ScreenService.screen({
    type: "url",
    content: new URL("/health", `http://${localHost}`).toString(),
  });

  assert.equal(result.status, "BLOCK");
  assert.ok(result.reasons.includes("ssrf_attempt"));
  assert.equal(result.details.scope, "LOCAL_SCREEN_ONLY");
  assert.equal(result.details.providerIndependent, true);
  assert.ok(result.signals.every((signal) => signal.requestId === undefined || signal.requestId));
});

test("Layer 1 auxiliary model failure and invalid confidence remain non-authoritative", async () => {
  class InvalidConfidenceModel extends ITrustSignalModel {
    async analyzeText() {
      return { isSuspicious: true, confidence: "forged", modelLabel: "untrusted" };
    }
  }

  class FailingModel extends ITrustSignalModel {
    async analyzeText() {
      throw new Error("provider failure");
    }
  }

  const invalid = await executeAuxiliaryModelSafe({
    model: new InvalidConfidenceModel("invalid-confidence-model"),
    type: "text",
    content: "ordinary content",
  });
  assert.equal(invalid.modelSignals.length, 1);
  assert.equal(invalid.modelSignals[0].confidence, 0);
  assert.equal(invalid.modelSignals[0].severity, "medium");

  const failed = await executeAuxiliaryModelSafe({
    model: new FailingModel("failing-model"),
    type: "text",
    content: "ordinary content",
  });
  assert.deepEqual(failed.modelSignals, []);
  assert.equal(failed.modelUsed, null);
});

test("Layer 1 M3 hostile URL corpus never crashes or becomes final safety", async () => {
  const testHost = process.env.TRUST_ENGINE_TEST_HOST || "example.invalid";
  const corpus = [
    null,
    "",
    "not a URL",
    "javascript:alert(1)",
    "data:text/plain,payload",
    "ftp://" + testHost + "/download",
    "http://127.0.0.1/admin",
    "http://2130706433/admin",
    "http://0x7f000001/admin",
    "http://0177.0.0.1/admin",
    "http://[::ffff:127.0.0.1]/admin",
    "https://" + testHost + "/" + "a".repeat(9000),
    "https://" + testHost + "/%252525252525252525252525252525",
    "https://" + testHost + "/path%00confusion?next=%2F%2F" + testHost,
    "https://" + testHost + "/login?password=redacted",
  ];

  for (const content of corpus) {
    const result = await Layer1ScreenService.screen({ type: "url", content });
    assert.ok(["BLOCK", "SUSPICIOUS", "PASS", "UNKNOWN"].includes(result.status));
    assert.equal(result.details.scope, "LOCAL_SCREEN_ONLY");
    assert.equal(result.details.providerIndependent, true);
    assert.equal(result.details.notFinalSafety, true);
    assert.notEqual(result.status, "SAFE");
    assert.notEqual(result.status, "ALLOW");
  }
});
