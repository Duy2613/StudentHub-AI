/**
 * Public Trust entrypoint.
 *
 * StudentHub owns the canonical four-layer verdict. An explicitly enabled
 * Friend adapter may attach capability-scoped shadow observations only.
 * The friend-authoritative runner remains isolated for legacy compatibility.
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
