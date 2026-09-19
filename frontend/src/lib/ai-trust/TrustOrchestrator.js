/**
 * Public Trust entrypoint for the StudentHub-owned four-layer pipeline.
 *
 * The optional Render compatibility adapter is constructed only at this
 * server-side boundary. Its Layer 2/3/4 observations are normalized by the
 * adapter; StudentHub's deterministic Final Predict remains authoritative.
 */

import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { OwnBackendTrustOrchestrator } from "./OwnBackendTrustOrchestrator.js";

export class TrustOrchestrator extends OwnBackendTrustOrchestrator {
  constructor(options = {}) {
    super({
      ...options,
      legacyVerificationAdapter: options.legacyVerificationAdapter || createLegacyVerificationAdapter(),
    });
  }
}

export function createTrustOrchestrator(options = {}) {
  return new TrustOrchestrator(options);
}
