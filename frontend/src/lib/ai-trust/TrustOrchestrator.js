/**
 * Canonical server-side Trust entrypoint.
 *
 * The V5 pipeline remains the owned StudentHub policy engine. This facade
 * supplies the optional legacy verification adapter at the server boundary so
 * route handlers never need to know legacy endpoint names or response shapes.
 */

import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { TrustPipelineOrchestrator } from "./v5/TrustPipelineOrchestrator.js";

export class TrustOrchestrator extends TrustPipelineOrchestrator {
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
