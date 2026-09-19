/**
 * Public Trust entrypoint for the StudentHub-owned four-layer pipeline.
 *
 * The historical internal V5 orchestrator is intentionally not imported here:
 * the public route must not construct a legacy/Friend adapter or expose L5.
 */

import { OwnBackendTrustOrchestrator, createOwnBackendTrustOrchestrator } from "./OwnBackendTrustOrchestrator.js";

export class TrustOrchestrator extends OwnBackendTrustOrchestrator {}

export function createTrustOrchestrator(options = {}) {
  return createOwnBackendTrustOrchestrator(options);
}
