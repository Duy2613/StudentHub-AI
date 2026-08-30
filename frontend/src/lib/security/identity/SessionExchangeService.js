import { createSupabaseTokenVerifier } from "./OidcTokenVerifier.js";
import { getDurableSessionService } from "./DurableSessionService.js";
import crypto from "node:crypto";

export class SessionExchangeService {
  constructor({ verifier, sessions } = {}) {
    this.verifier = verifier || createSupabaseTokenVerifier();
    this.sessions = sessions || getDurableSessionService();
  }

  async exchange(upstreamToken, metadata = {}) {
    if (!upstreamToken) throw new Error("UPSTREAM_TOKEN_REQUIRED");
    const identity = await this.verifier.verify(upstreamToken);
    // Bind the durable session to this exact verified proof. This makes exchange
    // one-time even when an upstream provider omits a jti claim.
    const exchangeProofId = crypto.createHash("sha256").update(upstreamToken).digest("base64url");
    const session = await this.sessions.createSession({ ...identity, exchangeProofId }, metadata);
    return {
      cookie: this.sessions.serializeCookie(session.secret, session.expiresAt),
      safeMetadata: {
        userId: identity.userId,
        email: identity.email,
        emailVerified: identity.emailVerified,
        expiresAt: session.expiresAt.toISOString(),
      }
    };
  }
}

let defaultExchangeService;
export function getSessionExchangeService() {
  if (!defaultExchangeService) defaultExchangeService = new SessionExchangeService();
  return defaultExchangeService;
}
export function setSessionExchangeServiceForTests(service) { defaultExchangeService = service; }
