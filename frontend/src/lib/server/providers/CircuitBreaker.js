/**
 * StudentHub AI — CircuitBreaker
 * 
 * Production circuit breaker preventing cascading upstream failures.
 * States:
 * - CLOSED: Normal execution
 * - OPEN: Immediately rejects requests with CircuitBreakerOpenError
 * - HALF_OPEN: Probes upstream with a single request
 */

import { CircuitBreakerOpenError } from "./ProviderErrors.js";

export const CIRCUIT_STATE = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
});

export class CircuitBreaker {
  constructor({
    provider = "unknown",
    failureThreshold = 5,
    resetTimeoutMs = 15000,
    now = () => Date.now(),
  } = {}) {
    this.provider = provider;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.now = now;

    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.halfOpenProbePending = false;
  }

  canExecute() {
    const currentTime = this.now();
    if (this.state === CIRCUIT_STATE.CLOSED) return true;

    if (this.state === CIRCUIT_STATE.OPEN) {
      if (currentTime - this.openedAt >= this.resetTimeoutMs) {
        this.state = CIRCUIT_STATE.HALF_OPEN;
        this.halfOpenProbePending = false;
        return true;
      }
      return false;
    }

    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      if (!this.halfOpenProbePending) {
        this.halfOpenProbePending = true;
        return true;
      }
      return false;
    }

    return false;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = CIRCUIT_STATE.CLOSED;
    this.openedAt = null;
    this.halfOpenProbePending = false;
  }

  recordFailure() {
    this.consecutiveFailures += 1;
    if (this.state === CIRCUIT_STATE.HALF_OPEN || this.consecutiveFailures >= this.failureThreshold) {
      this.state = CIRCUIT_STATE.OPEN;
      this.openedAt = this.now();
      this.halfOpenProbePending = false;
    }
  }

  assertAvailable() {
    if (!this.canExecute()) {
      const resetAt = this.openedAt ? new Date(this.openedAt + this.resetTimeoutMs).toISOString() : null;
      throw new CircuitBreakerOpenError(this.provider, { resetAt });
    }
  }

  getState() {
    // Refresh state if reset timeout expired
    this.canExecute();
    return this.state;
  }
}
