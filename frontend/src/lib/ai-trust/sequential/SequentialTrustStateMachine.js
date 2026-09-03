/**
 * Deterministic finite state machine for the sequential 4-layer Trust Engine.
 *
 * Implements the explicit states:
 * IDLE
 * → L1_RUNNING → L1_COMPLETE
 * → L2_RUNNING → L2_COMPLETE
 * → L3_RUNNING → L3_COMPLETE
 * → L4_RUNNING → L4_COMPLETE
 * → FINAL
 *
 * Error / boundary states:
 * L1_ERROR, L2_ERROR, L3_ERROR, L4_ERROR, CANCELLED, TIMEOUT
 *
 * Visual disappearance rule:
 * Completed layers have their visual details collapsed/faded before the next layer
 * starts running, but canonical result data is NEVER destroyed.
 */

export const SEQUENTIAL_STATE = Object.freeze({
  IDLE: "IDLE",
  L1_RUNNING: "L1_RUNNING",
  L1_COMPLETE: "L1_COMPLETE",
  L2_RUNNING: "L2_RUNNING",
  L2_COMPLETE: "L2_COMPLETE",
  L3_RUNNING: "L3_RUNNING",
  L3_COMPLETE: "L3_COMPLETE",
  L4_RUNNING: "L4_RUNNING",
  L4_COMPLETE: "L4_COMPLETE",
  FINAL: "FINAL",
  L1_ERROR: "L1_ERROR",
  L2_ERROR: "L2_ERROR",
  L3_ERROR: "L3_ERROR",
  L4_ERROR: "L4_ERROR",
  CANCELLED: "CANCELLED",
  TIMEOUT: "TIMEOUT",
});

export const LAYER_STATUS = Object.freeze({
  PENDING: "PENDING",     // ○ Pending
  RUNNING: "RUNNING",     // ● Running
  COMPLETED: "COMPLETED", // ✓ Completed
  ERROR: "ERROR",         // ✕ Failed
});

export function createInitialSequentialState() {
  return Object.freeze({
    state: SEQUENTIAL_STATE.IDLE,
    activeLayer: null,
    collapsedLayers: Object.freeze({ 1: false, 2: false, 3: false, 4: false }),
    layerResults: Object.freeze({
      layer1: null,
      layer2: null,
      layer3: null,
      layer4: null,
    }),
    finalVerdict: null,
    error: null,
    requestId: null,
  });
}

/**
 * Returns whether a layer is currently active (running or just completed detail view).
 */
export function isLayerActive(state, layer) {
  if (layer === 1) return state === SEQUENTIAL_STATE.L1_RUNNING || state === SEQUENTIAL_STATE.L1_COMPLETE;
  if (layer === 2) return state === SEQUENTIAL_STATE.L2_RUNNING || state === SEQUENTIAL_STATE.L2_COMPLETE;
  if (layer === 3) return state === SEQUENTIAL_STATE.L3_RUNNING || state === SEQUENTIAL_STATE.L3_COMPLETE;
  if (layer === 4) return state === SEQUENTIAL_STATE.L4_RUNNING || state === SEQUENTIAL_STATE.L4_COMPLETE;
  return false;
}

/**
 * Get compact display status for a layer.
 * Returns: PENDING (○), RUNNING (●), COMPLETED (✓), or ERROR (✕)
 */
export function getLayerDisplayStatus(state, layer, layerResults = {}) {
  // Check if this layer has an error
  if (
    (layer === 1 && state === SEQUENTIAL_STATE.L1_ERROR) ||
    (layer === 2 && state === SEQUENTIAL_STATE.L2_ERROR) ||
    (layer === 3 && state === SEQUENTIAL_STATE.L3_ERROR) ||
    (layer === 4 && state === SEQUENTIAL_STATE.L4_ERROR)
  ) {
    return LAYER_STATUS.ERROR;
  }

  // Check if this layer is currently running
  if (
    (layer === 1 && state === SEQUENTIAL_STATE.L1_RUNNING) ||
    (layer === 2 && state === SEQUENTIAL_STATE.L2_RUNNING) ||
    (layer === 3 && state === SEQUENTIAL_STATE.L3_RUNNING) ||
    (layer === 4 && state === SEQUENTIAL_STATE.L4_RUNNING)
  ) {
    return LAYER_STATUS.RUNNING;
  }

  // Check if this layer has completed
  const hasResult = Boolean(layerResults[`layer${layer}`]);
  if (hasResult) {
    return LAYER_STATUS.COMPLETED;
  }

  if (state === SEQUENTIAL_STATE.FINAL && hasResult) {
    return LAYER_STATUS.COMPLETED;
  }

  return LAYER_STATUS.PENDING;
}

/**
 * Pure transition function for the sequential 4-layer state machine.
 */
export function sequentialStateReducer(current, action) {
  const { type, payload = {} } = action;

  switch (type) {
    case "START": {
      return {
        ...createInitialSequentialState(),
        state: SEQUENTIAL_STATE.L1_RUNNING,
        activeLayer: 1,
        requestId: payload.requestId || null,
      };
    }

    case "L1_SUCCESS": {
      if (current.state !== SEQUENTIAL_STATE.L1_RUNNING) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L1_COMPLETE,
        activeLayer: 1,
        collapsedLayers: { ...current.collapsedLayers, 1: false },
        layerResults: { ...current.layerResults, layer1: payload.result },
        error: null,
      };
    }

    case "START_L2": {
      if (current.state !== SEQUENTIAL_STATE.L1_COMPLETE) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L2_RUNNING,
        activeLayer: 2,
        // Layer 1 collapses/fades as Layer 2 becomes active
        collapsedLayers: { ...current.collapsedLayers, 1: true, 2: false },
        error: null,
      };
    }

    case "L2_SUCCESS": {
      if (current.state !== SEQUENTIAL_STATE.L2_RUNNING) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L2_COMPLETE,
        activeLayer: 2,
        collapsedLayers: { ...current.collapsedLayers, 2: false },
        layerResults: { ...current.layerResults, layer2: payload.result },
        error: null,
      };
    }

    case "START_L3": {
      if (current.state !== SEQUENTIAL_STATE.L2_COMPLETE) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L3_RUNNING,
        activeLayer: 3,
        // Layer 2 collapses/fades as Layer 3 becomes active
        collapsedLayers: { ...current.collapsedLayers, 2: true, 3: false },
        error: null,
      };
    }

    case "L3_SUCCESS": {
      if (current.state !== SEQUENTIAL_STATE.L3_RUNNING) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L3_COMPLETE,
        activeLayer: 3,
        collapsedLayers: { ...current.collapsedLayers, 3: false },
        layerResults: { ...current.layerResults, layer3: payload.result },
        error: null,
      };
    }

    case "START_L4": {
      if (current.state !== SEQUENTIAL_STATE.L3_COMPLETE) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L4_RUNNING,
        activeLayer: 4,
        // Layer 3 collapses/fades as Layer 4 becomes active
        collapsedLayers: { ...current.collapsedLayers, 3: true, 4: false },
        error: null,
      };
    }

    case "L4_SUCCESS": {
      if (current.state !== SEQUENTIAL_STATE.L4_RUNNING) return current;
      return {
        ...current,
        state: SEQUENTIAL_STATE.L4_COMPLETE,
        activeLayer: 4,
        collapsedLayers: { ...current.collapsedLayers, 4: false },
        layerResults: { ...current.layerResults, layer4: payload.result },
        error: null,
      };
    }

    case "FINAL_VERDICT": {
      return {
        ...current,
        state: SEQUENTIAL_STATE.FINAL,
        activeLayer: null,
        // When final verdict is reached, all layer results remain in memory,
        // previous details are collapsed by default so user can inspect final verdict
        collapsedLayers: { 1: true, 2: true, 3: true, 4: true },
        finalVerdict: payload.verdict || payload.result || null,
        error: null,
      };
    }

    case "FAIL_LAYER": {
      const layer = payload.layer || current.activeLayer || 1;
      const errorStateMap = {
        1: SEQUENTIAL_STATE.L1_ERROR,
        2: SEQUENTIAL_STATE.L2_ERROR,
        3: SEQUENTIAL_STATE.L3_ERROR,
        4: SEQUENTIAL_STATE.L4_ERROR,
      };
      const nextState = errorStateMap[layer] || SEQUENTIAL_STATE.L1_ERROR;
      return {
        ...current,
        state: nextState,
        activeLayer: layer,
        // Do NOT wipe previous layerResults!
        error: {
          layer,
          code: payload.code || "LAYER_ERROR",
          message: payload.message || `Lớp ${layer} gặp sự cố kết nối.`,
          retryable: payload.retryable !== false,
        },
      };
    }

    case "RETRY": {
      // Retry from the failed layer without resetting prior layers
      if (current.state === SEQUENTIAL_STATE.L1_ERROR) {
        return { ...current, state: SEQUENTIAL_STATE.L1_RUNNING, activeLayer: 1, error: null };
      }
      if (current.state === SEQUENTIAL_STATE.L2_ERROR) {
        return { ...current, state: SEQUENTIAL_STATE.L2_RUNNING, activeLayer: 2, error: null };
      }
      if (current.state === SEQUENTIAL_STATE.L3_ERROR) {
        return { ...current, state: SEQUENTIAL_STATE.L3_RUNNING, activeLayer: 3, error: null };
      }
      if (current.state === SEQUENTIAL_STATE.L4_ERROR) {
        return { ...current, state: SEQUENTIAL_STATE.L4_RUNNING, activeLayer: 4, error: null };
      }
      return current;
    }

    case "TIMEOUT": {
      return {
        ...current,
        state: SEQUENTIAL_STATE.TIMEOUT,
        error: {
          layer: current.activeLayer,
          code: "TIMEOUT",
          message: "Thời gian xử lý vượt quá giới hạn an toàn.",
          retryable: true,
        },
      };
    }

    case "CANCEL": {
      return {
        ...current,
        state: SEQUENTIAL_STATE.CANCELLED,
        error: {
          layer: current.activeLayer,
          code: "CANCELLED",
          message: "Tiến trình đã được người dùng dừng.",
          retryable: true,
        },
      };
    }

    case "TOGGLE_COLLAPSE": {
      const layer = payload.layer;
      if (!layer || !current.collapsedLayers) return current;
      return {
        ...current,
        collapsedLayers: {
          ...current.collapsedLayers,
          [layer]: !current.collapsedLayers[layer],
        },
      };
    }

    case "RESET": {
      return createInitialSequentialState();
    }

    default:
      return current;
  }
}
