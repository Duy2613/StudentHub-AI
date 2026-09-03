/**
 * StudentHub AI — Canonical Academic Workflow State Machine
 * 
 * Enforces strict, authoritative workflow state transitions:
 * - Prevents illegal regressive transitions (e.g. COMPLETED -> NOT_STARTED)
 * - Produces immutable audit events for every state change
 * - Handles terminal and recoverable states deterministically
 */

import { createSecureId } from "../../security/secureId.js";

export const WORKFLOW_STATES = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED"
});

export const WORKFLOW_EVENTS = Object.freeze({
  TASK_CREATED: "TASK_CREATED",
  TASK_STARTED: "TASK_STARTED",
  TASK_BLOCKED: "TASK_BLOCKED",
  TASK_UNBLOCKED: "TASK_UNBLOCKED",
  TASK_STEP_COMPLETED: "TASK_STEP_COMPLETED",
  TASK_SUBMITTED: "TASK_SUBMITTED",
  TASK_VERIFICATION_REQUESTED: "TASK_VERIFICATION_REQUESTED",
  TASK_VERIFIED: "TASK_VERIFIED",
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_RECONCILED: "TASK_RECONCILED",
  TASK_EXPIRED: "TASK_EXPIRED",
  TASK_CANCELLED: "TASK_CANCELLED"
});

// Authoritative transition mapping
const ALLOWED_TRANSITIONS = Object.freeze({
  [WORKFLOW_STATES.NOT_STARTED]: Object.freeze([
    WORKFLOW_STATES.READY,
    WORKFLOW_STATES.IN_PROGRESS,
    WORKFLOW_STATES.BLOCKED,
    WORKFLOW_STATES.CANCELLED
  ]),
  [WORKFLOW_STATES.READY]: Object.freeze([
    WORKFLOW_STATES.IN_PROGRESS,
    WORKFLOW_STATES.BLOCKED,
    WORKFLOW_STATES.EXPIRED,
    WORKFLOW_STATES.CANCELLED
  ]),
  [WORKFLOW_STATES.IN_PROGRESS]: Object.freeze([
    WORKFLOW_STATES.BLOCKED,
    WORKFLOW_STATES.PENDING_VERIFICATION,
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.EXPIRED,
    WORKFLOW_STATES.CANCELLED
  ]),
  [WORKFLOW_STATES.BLOCKED]: Object.freeze([
    WORKFLOW_STATES.READY,
    WORKFLOW_STATES.IN_PROGRESS,
    WORKFLOW_STATES.EXPIRED,
    WORKFLOW_STATES.CANCELLED
  ]),
  [WORKFLOW_STATES.PENDING_VERIFICATION]: Object.freeze([
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.IN_PROGRESS, // Verification rejected/needs revision
    WORKFLOW_STATES.EXPIRED
  ]),
  [WORKFLOW_STATES.COMPLETED]: Object.freeze([
    // Terminal state — No automated backward transitions
  ]),
  [WORKFLOW_STATES.EXPIRED]: Object.freeze([
    // Can only transition back to IN_PROGRESS/READY via explicit reconciliation
    WORKFLOW_STATES.IN_PROGRESS,
    WORKFLOW_STATES.READY
  ]),
  [WORKFLOW_STATES.CANCELLED]: Object.freeze([
    // Terminal state
  ])
});

export class AcademicWorkflowStateMachine {
  /**
   * Checks if a transition from currentState to targetState is allowed
   * @param {string} currentState 
   * @param {string} targetState 
   * @returns {boolean}
   */
  static canTransition(currentState, targetState) {
    if (!currentState || !targetState) return false;
    if (currentState === targetState) return true; // Idempotent no-op

    const allowed = ALLOWED_TRANSITIONS[currentState];
    return Array.isArray(allowed) && allowed.includes(targetState);
  }

  /**
   * Validates transition and throws explicit error if illegal
   * @param {string} currentState 
   * @param {string} targetState 
   */
  static validateTransition(currentState, targetState) {
    if (!this.canTransition(currentState, targetState)) {
      throw new Error(
        `[ILLEGAL_STATE_TRANSITION] Cannot transition workflow from ${currentState} to ${targetState}`
      );
    }
  }

  /**
   * Creates an immutable WorkflowEvent
   * @param {string} type 
   * @param {object} params 
   * @returns {object} Canonical WorkflowEvent
   */
  static createEvent(type, {
    eventId,
    taskId,
    fromState,
    toState,
    actor = "STUDENT",
    reason = "",
    evidence = null,
    metadata = {}
  }) {
    if (!type || !WORKFLOW_EVENTS[type]) {
      throw new Error(`[INVALID_EVENT_TYPE] Unknown workflow event type: ${type}`);
    }

    return Object.freeze({
      eventId: eventId || createSecureId("EVT"),
      taskId,
      type,
      fromState,
      toState,
      actor,
      reason: reason ? String(reason).trim() : "",
      evidence: evidence ? Object.freeze({ ...evidence }) : null,
      metadata: Object.freeze({ ...metadata }),
      timestamp: new Date().toISOString()
    });
  }
}
