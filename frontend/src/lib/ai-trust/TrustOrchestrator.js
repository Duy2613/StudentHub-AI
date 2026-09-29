/**
 * Public Trust entrypoint.
 *
 * The web route explicitly selects the friend-backend-authoritative runner.
 * The StudentHub-owned runner remains exported for its isolated internal
 * tests and legacy callers, but it is not used by the web Trust route.
 */

import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { OwnBackendTrustOrchestrator } from "./OwnBackendTrustOrchestrator.js";
import { FriendBackendTrustOrchestrator } from "./FriendBackendTrustOrchestrator.js";

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
  if (options.authority === "FRIEND_BACKEND") return new FriendBackendTrustOrchestrator(options);
  return new TrustOrchestrator(options);
}
