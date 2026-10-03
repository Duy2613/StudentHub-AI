import test from "node:test";
import assert from "node:assert/strict";
import { projectRoomTrustLayers } from "../../src/lib/expert/roomTrustLayerProjection.js";

test("Room Trust projection presents the four macro layers with truthful grouped statuses", () => {
  const layers = projectRoomTrustLayers({
    pipelineModel: "INTERNAL_V5",
    stages: {
      l1: { operationStatus: "COMPLETED", finding: "LOCAL_CLEAR", summary: "Input screen complete." },
      l2a: { operationStatus: "COMPLETED", finding: "NO_KNOWN_THREAT", summary: "Threat scan complete." },
      l2b: { operationStatus: "PARTIAL", finding: "UNKNOWN", summary: "Semantic scan was partial." },
      l2c: { operationStatus: "COMPLETED", finding: "UNKNOWN_STUDENT_RISK", summary: "Context scan complete." },
      l3: { operationStatus: "FAILED", finding: "UNAVAILABLE", summary: "Retrieval provider unavailable." },
      l4: { operationStatus: "COMPLETED", finding: "UNKNOWN", summary: "No safe conclusion." },
      l5: { operationStatus: "COMPLETED", finding: "INSUFFICIENT_EVIDENCE", summary: "Evidence insufficient." },
    },
  });

  assert.deepEqual(layers.map(({ id }) => id), ["L1", "L2", "L3", "L4"]);
  assert.deepEqual(layers.map(({ status }) => status), ["COMPLETE", "PARTIAL", "FAILED", "COMPLETE"]);
  assert.equal(layers[1].subStages.length, 3);
  assert.equal(layers[2].finding, "UNAVAILABLE");
  assert.equal(layers[3].subStages[1].id, "L5");
});

test("four-layer pipeline maps its single L2 stage and missing reports stay explicit", () => {
  const layers = projectRoomTrustLayers({
    pipelineModel: "FOUR_LAYER",
    stages: { l2: { operationStatus: "RUNNING", finding: "PARTIAL", summary: "Analysis is still running." } },
  });

  assert.equal(layers[0].status, "NOT_REPORTED");
  assert.equal(layers[1].status, "RUNNING");
  assert.equal(layers[1].subStages[0].id, "L2");
  assert.equal(layers[2].status, "NOT_REPORTED");
  assert.equal(layers[3].status, "NOT_REPORTED");
});

test("Room Trust projection bounds text and removes control characters", () => {
  const summary = `${"x".repeat(800)}\nsecret`;
  const [layer] = projectRoomTrustLayers({ stages: { l1: { operationStatus: "COMPLETED", summary } } });
  assert.equal(layer.summary.length, 700);
  assert.equal(layer.summary.includes("\n"), false);
});
