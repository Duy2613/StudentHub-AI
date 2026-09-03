import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SEQUENTIAL_STATE,
  LAYER_STATUS,
  createInitialSequentialState,
  getLayerDisplayStatus,
  isLayerActive,
  sequentialStateReducer,
} from "../../src/lib/ai-trust/sequential/SequentialTrustStateMachine.js";

describe("SequentialTrustStateMachine", () => {
  it("initializes with IDLE state and pending layers", () => {
    const state = createInitialSequentialState();
    assert.equal(state.state, SEQUENTIAL_STATE.IDLE);
    assert.equal(state.activeLayer, null);
    assert.equal(getLayerDisplayStatus(state.state, 1, state.layerResults), LAYER_STATUS.PENDING);
    assert.equal(getLayerDisplayStatus(state.state, 2, state.layerResults), LAYER_STATUS.PENDING);
    assert.equal(getLayerDisplayStatus(state.state, 3, state.layerResults), LAYER_STATUS.PENDING);
    assert.equal(getLayerDisplayStatus(state.state, 4, state.layerResults), LAYER_STATUS.PENDING);
  });

  it("transitions sequentially through all 4 layers and preserves data", () => {
    let state = createInitialSequentialState();

    // 1. START -> L1_RUNNING
    state = sequentialStateReducer(state, { type: "START", payload: { requestId: "req-1" } });
    assert.equal(state.state, SEQUENTIAL_STATE.L1_RUNNING);
    assert.equal(state.activeLayer, 1);
    assert.equal(isLayerActive(state.state, 1), true);
    assert.equal(isLayerActive(state.state, 2), false);
    assert.equal(getLayerDisplayStatus(state.state, 1, state.layerResults), LAYER_STATUS.RUNNING);
    assert.equal(getLayerDisplayStatus(state.state, 2, state.layerResults), LAYER_STATUS.PENDING);

    // 2. L1_SUCCESS -> L1_COMPLETE
    const l1Result = { status: "PASS", confidence: 0.98, riskLevel: "LOW" };
    state = sequentialStateReducer(state, { type: "L1_SUCCESS", payload: { result: l1Result } });
    assert.equal(state.state, SEQUENTIAL_STATE.L1_COMPLETE);
    assert.equal(state.collapsedLayers[1], false); // L1 result is clearly visible initially
    assert.equal(getLayerDisplayStatus(state.state, 1, state.layerResults), LAYER_STATUS.COMPLETED);

    // 3. START_L2 -> L2_RUNNING (L1 detail collapses/fades)
    state = sequentialStateReducer(state, { type: "START_L2" });
    assert.equal(state.state, SEQUENTIAL_STATE.L2_RUNNING);
    assert.equal(state.activeLayer, 2);
    assert.equal(state.collapsedLayers[1], true); // L1 detail is collapsed/faded
    assert.equal(state.collapsedLayers[2], false); // L2 is active
    assert.equal(getLayerDisplayStatus(state.state, 1, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 2, state.layerResults), LAYER_STATUS.RUNNING);

    // 4. L2_SUCCESS -> L2_COMPLETE
    const l2Result = { finding: "NO_KNOWN_THREAT", status: "PASS" };
    state = sequentialStateReducer(state, { type: "L2_SUCCESS", payload: { result: l2Result } });
    assert.equal(state.state, SEQUENTIAL_STATE.L2_COMPLETE);
    assert.equal(state.collapsedLayers[2], false); // L2 result is displayed

    // 5. START_L3 -> L3_RUNNING (L2 detail collapses/fades)
    state = sequentialStateReducer(state, { type: "START_L3" });
    assert.equal(state.state, SEQUENTIAL_STATE.L3_RUNNING);
    assert.equal(state.activeLayer, 3);
    assert.equal(state.collapsedLayers[2], true); // L2 detail collapsed
    assert.equal(getLayerDisplayStatus(state.state, 2, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 3, state.layerResults), LAYER_STATUS.RUNNING);

    // 6. L3_SUCCESS -> L3_COMPLETE
    const l3Result = { verdict: "SUPPORTED", evidenceCount: 4 };
    state = sequentialStateReducer(state, { type: "L3_SUCCESS", payload: { result: l3Result } });
    assert.equal(state.state, SEQUENTIAL_STATE.L3_COMPLETE);
    assert.equal(state.collapsedLayers[3], false);

    // 7. START_L4 -> L4_RUNNING (L3 detail collapses/fades)
    state = sequentialStateReducer(state, { type: "START_L4" });
    assert.equal(state.state, SEQUENTIAL_STATE.L4_RUNNING);
    assert.equal(state.activeLayer, 4);
    assert.equal(state.collapsedLayers[3], true); // L3 detail collapsed
    assert.equal(getLayerDisplayStatus(state.state, 3, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 4, state.layerResults), LAYER_STATUS.RUNNING);

    // 8. L4_SUCCESS -> L4_COMPLETE
    const l4Result = { verdict: "TRUE", confidence: 0.95 };
    state = sequentialStateReducer(state, { type: "L4_SUCCESS", payload: { result: l4Result } });
    assert.equal(state.state, SEQUENTIAL_STATE.L4_COMPLETE);

    // 9. FINAL_VERDICT -> FINAL
    const finalVerdict = { verdict: "VERIFIED_AUTHENTIC", security: "NO_KNOWN_THREAT" };
    state = sequentialStateReducer(state, { type: "FINAL_VERDICT", payload: { verdict: finalVerdict } });
    assert.equal(state.state, SEQUENTIAL_STATE.FINAL);

    // Verify all four layer results remain stored in memory
    assert.deepEqual(state.layerResults.layer1, l1Result);
    assert.deepEqual(state.layerResults.layer2, l2Result);
    assert.deepEqual(state.layerResults.layer3, l3Result);
    assert.deepEqual(state.layerResults.layer4, l4Result);
    assert.deepEqual(state.finalVerdict, finalVerdict);

    // All layers show COMPLETED
    assert.equal(getLayerDisplayStatus(state.state, 1, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 2, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 3, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 4, state.layerResults), LAYER_STATUS.COMPLETED);
  });

  it("isolates errors to failed layer without blank screen or losing prior results", () => {
    let state = createInitialSequentialState();
    state = sequentialStateReducer(state, { type: "START" });
    const l1Result = { status: "PASS", confidence: 0.99 };
    state = sequentialStateReducer(state, { type: "L1_SUCCESS", payload: { result: l1Result } });
    state = sequentialStateReducer(state, { type: "START_L2" });

    // Layer 2 fails (e.g. backend unavailable)
    state = sequentialStateReducer(state, {
      type: "FAIL_LAYER",
      payload: { layer: 2, code: "BACKEND_UNAVAILABLE", message: "Friend backend unavailable" },
    });

    assert.equal(state.state, SEQUENTIAL_STATE.L2_ERROR);
    assert.equal(state.activeLayer, 2);
    assert.equal(state.error.code, "BACKEND_UNAVAILABLE");

    // Previous Layer 1 result is preserved!
    assert.deepEqual(state.layerResults.layer1, l1Result);
    assert.equal(getLayerDisplayStatus(state.state, 1, state.layerResults), LAYER_STATUS.COMPLETED);
    assert.equal(getLayerDisplayStatus(state.state, 2, state.layerResults), LAYER_STATUS.ERROR);
    assert.equal(getLayerDisplayStatus(state.state, 3, state.layerResults), LAYER_STATUS.PENDING);
    assert.equal(getLayerDisplayStatus(state.state, 4, state.layerResults), LAYER_STATUS.PENDING);

    // Retry Layer 2
    state = sequentialStateReducer(state, { type: "RETRY" });
    assert.equal(state.state, SEQUENTIAL_STATE.L2_RUNNING);
    assert.equal(state.error, null);
    assert.deepEqual(state.layerResults.layer1, l1Result);
  });

  it("handles cancellation and timeout deterministically", () => {
    let state = createInitialSequentialState();
    state = sequentialStateReducer(state, { type: "START" });
    state = sequentialStateReducer(state, { type: "TIMEOUT" });
    assert.equal(state.state, SEQUENTIAL_STATE.TIMEOUT);
    assert.equal(state.error.code, "TIMEOUT");

    state = createInitialSequentialState();
    state = sequentialStateReducer(state, { type: "START" });
    state = sequentialStateReducer(state, { type: "CANCEL" });
    assert.equal(state.state, SEQUENTIAL_STATE.CANCELLED);
    assert.equal(state.error.code, "CANCELLED");
  });

  it("supports user manual toggle of collapsed layers without erasing data", () => {
    let state = createInitialSequentialState();
    state = sequentialStateReducer(state, { type: "START" });
    state = sequentialStateReducer(state, { type: "L1_SUCCESS", payload: { result: { pass: true } } });
    state = sequentialStateReducer(state, { type: "START_L2" });

    assert.equal(state.collapsedLayers[1], true);

    // User clicks to re-expand Layer 1 to inspect details
    state = sequentialStateReducer(state, { type: "TOGGLE_COLLAPSE", payload: { layer: 1 } });
    assert.equal(state.collapsedLayers[1], false);
    assert.deepEqual(state.layerResults.layer1, { pass: true });

    // User clicks again to re-collapse
    state = sequentialStateReducer(state, { type: "TOGGLE_COLLAPSE", payload: { layer: 1 } });
    assert.equal(state.collapsedLayers[1], true);
  });
});
