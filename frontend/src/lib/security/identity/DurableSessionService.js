import crypto from "node:crypto";
import { PostgresSessionRepository } from "./PostgresSessionRepository.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

export const SESSION_COOKIE_NAME = "studenthub_session";

export class DurableSessionService {
  constructor({ repository, pepper, now = () => new Date(), idleMs = 30 * 60_000, absoluteMs = 24 * 60 * 60_000 } = {}) {
    this.repository = repository || new PostgresSessionRepository();
    this.pepper = pepper || process.env.STUDENTHUB_SESSION_PEPPER;
    this.now = now;
    this.idleMs = idleMs;
    this.absoluteMs = absoluteMs;
    if (!this.pepper || this.pepper.length < 32) {
      throw new Error("STUDENTHUB_SESSION_PEPPER must contain at least 32 characters.");
    }
  }

  hashSecret(secret) {
    return crypto.createHmac("sha256", this.pepper).update(secret).digest();
  }

  async createSession(identity, metadata = {}) {
    if (!identity?.userId) throw new Error("Verified upstream userId is required.");
    const secret = crypto.randomBytes(32).toString("base64url");
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + this.absoluteMs);
    const idleExpiresAt = new Date(Math.min(createdAt.getTime() + this.idleMs, expiresAt.getTime()));
    await this.repository.create({
      tokenHash: this.hashSecret(secret),
      userId: identity.userId,
      authProvider: identity.authProvider || "supabase",
      upstreamJtiHash: identity.exchangeProofId
        ? this.hashSecret(`proof:${identity.exchangeProofId}`)
        : identity.jti ? this.hashSecret(`jti:${identity.jti}`) : null,
      createdAt,
      idleExpiresAt,
      expiresAt,
      userAgentHash: metadata.userAgent ? this.hashSecret(`ua:${metadata.userAgent}`) : null,
    });
    return { secret, expiresAt, userId: identity.userId };
  }

  async validateSession(secret) {
    if (!secret) throw SecurityError.unauthorized("Missing session cookie.");
    const record = await this.repository.findActive(this.hashSecret(secret), this.now());
    if (!record) {
      throw new SecurityError({ code: SECURITY_ERROR_CODE.SESSION_REVOKED, message: "Session is invalid, expired, or revoked.", statusCode: 401 });
    }
    return record;
  }

  async revokeSession(secret, reason = "LOGOUT") {
    if (!secret) return false;
    return this.repository.revoke(this.hashSecret(secret), reason);
  }

  serializeCookie(secret, expiresAt, { secure = process.env.NODE_ENV === "production" } = {}) {
    const parts = [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(secret)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Expires=${expiresAt.toUTCString()}`,
      `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - this.now().getTime()) / 1000))}`,
    ];
    if (secure) parts.push("Secure");
    return parts.join("; ");
  }

  clearCookie({ secure = process.env.NODE_ENV === "production" } = {}) {
    return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure ? "; Secure" : ""}`;
  }
}

let defaultService;
export function getDurableSessionService() {
  if (!defaultService) defaultService = new DurableSessionService();
  return defaultService;
}
export function setDurableSessionServiceForTests(service) { defaultService = service; }
