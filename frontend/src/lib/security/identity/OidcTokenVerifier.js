import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from "jose";
import { validateRemoteUrlSync } from "../hardening/SafeRemoteUrl.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

const PROD_SUPABASE_PROJECT_REF = "kytdomflmjytzyaabogi";

export class OidcTokenVerifier {
  constructor({ issuer, audience = "authenticated", jwksUrl, jwks, algorithms = ["ES256", "RS256"] } = {}) {
    if (!issuer) throw new Error("OIDC issuer is required.");
    const issuerResult = validateRemoteUrlSync(String(issuer).replace(/\/$/, ""));
    if (!issuerResult.ok || !issuerResult.url.startsWith("https://")) {
      throw new Error("OIDC issuer must be an HTTPS public endpoint.");
    }
    this.issuer = issuerResult.url;
    this.audience = audience;
    this.algorithms = algorithms;
    if (jwks) {
      this.keySet = createLocalJWKSet(jwks);
    } else {
      const jwksTarget = jwksUrl || `${this.issuer}/.well-known/jwks.json`;
      const jwksResult = validateRemoteUrlSync(jwksTarget);
      if (!jwksResult.ok || !jwksResult.url.startsWith("https://")) {
        throw new Error("OIDC JWKS must be an HTTPS public endpoint.");
      }
      this.keySet = createRemoteJWKSet(new URL(jwksResult.url), { cooldownDuration: 5_000, cacheMaxAge: 10 * 60_000 });
    }
  }

  async verify(token) {
    if (!token || typeof token !== "string" || !token.trim()) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_TOKEN_MISSING,
        message: "Bootstrap authorization token is missing.",
        statusCode: 401,
      });
    }

    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_TOKEN_INVALID,
        message: "Malformed bootstrap token format.",
        statusCode: 401,
      });
    }

    // Pre-flight check on unverified claims for issuer separation guard
    // (Cryptographic verification follows immediately below via jwtVerify)
    try {
      const unverifiedPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      if (unverifiedPayload?.iss && typeof unverifiedPayload.iss === "string") {
        if (unverifiedPayload.iss.includes(PROD_SUPABASE_PROJECT_REF) && !this.issuer.includes(PROD_SUPABASE_PROJECT_REF)) {
          throw new SecurityError({
            code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_ISSUER_INVALID,
            message: "Production Supabase token rejected on staging environment.",
            statusCode: 401,
          });
        }
        if (unverifiedPayload.iss !== this.issuer) {
          throw new SecurityError({
            code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_ISSUER_INVALID,
            message: `Token issuer '${unverifiedPayload.iss}' does not match configured issuer '${this.issuer}'.`,
            statusCode: 401,
          });
        }
      }
    } catch (preflightErr) {
      if (preflightErr instanceof SecurityError) throw preflightErr;
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_TOKEN_INVALID,
        message: "Malformed bootstrap token payload.",
        statusCode: 401,
      });
    }

    let payload;
    let protectedHeader;
    try {
      const verified = await jwtVerify(cleanToken, this.keySet, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: this.algorithms,
        requiredClaims: ["sub", "exp", "iss", "aud"],
      });
      payload = verified.payload;
      protectedHeader = verified.protectedHeader;
    } catch (err) {
      if (err instanceof SecurityError) throw err;
      if (err?.code === "ERR_JWT_CLAIM_VALIDATION_FAILED" && err?.claim === "iss") {
        throw new SecurityError({
          code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_ISSUER_INVALID,
          message: "Token issuer validation failed.",
          statusCode: 401,
        });
      }
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_TOKEN_INVALID,
        message: "Cryptographic token verification failed.",
        statusCode: 401,
      });
    }

    if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.trim()) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_TOKEN_INVALID,
        message: "OIDC subject is required.",
        statusCode: 401,
      });
    }

    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      emailVerified: payload.email_verified === true,
      authProvider: "supabase",
      jti: typeof payload.jti === "string" ? payload.jti : null,
      amr: Array.isArray(payload.amr) ? payload.amr : [],
      algorithm: protectedHeader.alg,
    };
  }
}

let configuredSupabaseVerifier = null;

export function createSupabaseTokenVerifier() {
  if (configuredSupabaseVerifier) return configuredSupabaseVerifier;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || baseUrl.includes("placeholder")) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  const issuer = `${baseUrl.replace(/\/$/, "")}/auth/v1`;
  return new OidcTokenVerifier({ issuer, audience: process.env.SUPABASE_JWT_AUDIENCE || "authenticated" });
}

export function setSupabaseTokenVerifierForTests(verifier) {
  configuredSupabaseVerifier = verifier;
}
