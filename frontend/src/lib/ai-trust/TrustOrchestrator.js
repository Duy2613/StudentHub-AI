/**
 * Canonical server-side Trust entrypoint.
 *
 * The V5 pipeline remains the owned StudentHub policy engine. This facade
 * supplies the optional legacy verification adapter at the server boundary so
 * route handlers never need to know legacy endpoint names or response shapes.
 */

import { createFriendBackendAdapter } from "./integrations/friendBackend/FriendBackendAdapter.js";
import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { createProviderGateway } from "./providerGateway/ProviderGateway.js";
import { TrustPipelineOrchestrator } from "./v5/TrustPipelineOrchestrator.js";

export class TrustOrchestrator extends TrustPipelineOrchestrator {
  constructor(options = {}) {
    const friendBackendAdapter = options.friendBackendAdapter || options.legacyVerificationAdapter || createFriendBackendAdapter();
    const legacyVerificationAdapter = friendBackendAdapter;
    const providerGateway = options.providerGateway || createProviderGateway({ legacyVerificationAdapter, friendBackendAdapter });
    super({
      ...options,
      providerGateway,
    });
    this.friendBackendAdapter = friendBackendAdapter;
  }
}

export function createTrustOrchestrator(options = {}) {
  return new TrustOrchestrator(options);
}
