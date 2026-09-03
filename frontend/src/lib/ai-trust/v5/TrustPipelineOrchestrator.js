/**
 * In the standalone Sequential variant, the native StudentHub owner pipeline
 * has been replaced by the Friend Backend 4-layer sequential pipeline.
 */
import { FriendBackendNotConfiguredError, TrustPipelineCancelledError } from "../TrustOrchestrator.js";

export { TrustPipelineCancelledError };

export class TrustPipelineOrchestrator {
  constructor() {}
  async run() {
    throw new FriendBackendNotConfiguredError("Native StudentHub trust pipeline is not included in this sequential variant.");
  }
}

export function createTrustPipelineOrchestrator() {
  return new TrustPipelineOrchestrator();
}

export function isRetryEligible() {
  return false;
}
