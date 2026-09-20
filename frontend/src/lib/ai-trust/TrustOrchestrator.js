/**
 * Public Trust entrypoint for the StudentHub-owned four-layer pipeline.
 *
 * The optional Render compatibility adapter is constructed only when an
 * explicit opt-in is supplied. The canonical public route must be able to
 * run without the friend deployment and must never use its observations as
 * authoritative Trust evidence.
 */

import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { OwnBackendTrustOrchestrator } from "./OwnBackendTrustOrchestrator.js";

export class TrustOrchestrator extends OwnBackendTrustOrchestrator {
  constructor(options = {}) {
    const legacyVerificationAdapter = options.legacyVerificationAdapter
      || (options.enableLegacyVerification === true ? createLegacyVerificationAdapter() : null);
    super({
      ...options,
      legacyVerificationAdapter,
    });
  }
}

export function createTrustOrchestrator(options = {}) {
  return new TrustOrchestrator(options);
}
