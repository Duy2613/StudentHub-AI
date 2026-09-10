import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from "jose";
import { createSecretKey } from "node:crypto";
import { validateRemoteUrlSync } from "../hardening/SafeRemoteUrl.js";
import { normalizeUuidSubjectId } from "./normalizeSubjectId.js";

function isLoopbackHttpIssuer(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" && ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export class OidcTokenVerifier {
  constructor({ issuer, audience = "authenticated", jwksUrl, jwks, secret, algorithms = ["ES256", "RS256"] } = {}) {
    if (!issuer) throw new Error("OIDC issuer is required.");
    const localTestVerifier = process.env.STUDENTHUB_LOCAL_E2E === "1" && isLoopbackHttpIssuer(issuer);
    if (localTestVerifier) {
      this.issuer = String(issuer).replace(/\/$/, "");
      this.audience = audience;
      this.algorithms = algorithms;
      if (jwks) {
        this.keySet = createLocalJWKSet(jwks);
      } else if (secret) {
        this.algorithms = ["HS256"];
        this.keySet = createSecretKey(Buffer.from(String(secret), "utf8"));
      } else {
        const localJwksTarget = jwksUrl || `${this.issuer}/.well-known/jwks.json`;
        this.keySet = createRemoteJWKSet(new URL(localJwksTarget), { cooldownDuration: 1_000, cacheMaxAge: 60_000 });
      }
      return;
    }
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
    const { payload, protectedHeader } = await jwtVerify(token, this.keySet, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: this.algorithms,
      requiredClaims: ["sub", "exp", "iss", "aud"],
    });
    const userId = normalizeUuidSubjectId(payload.sub);
    if (!userId) throw new Error("OIDC subject must be a UUID.");
    return {
      userId,
      email: typeof payload.email === "string" ? payload.email : "",
      emailVerified: payload.email_verified === true,
      authProvider: "supabase",
      jti: typeof payload.jti === "string" ? payload.jti : null,
      amr: Array.isArray(payload.amr) ? payload.amr : [],
      algorithm: protectedHeader.alg,
    };
  }
}

export function createSupabaseTokenVerifier() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || baseUrl.includes("placeholder")) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  const issuer = `${baseUrl.replace(/\/$/, "")}/auth/v1`;
  if (process.env.STUDENTHUB_LOCAL_E2E === "1") {
    if (!process.env.STUDENTHUB_LOCAL_JWT_SECRET) throw new Error("STUDENTHUB_LOCAL_JWT_SECRET is required for local E2E.");
    return new OidcTokenVerifier({
      issuer: process.env.SUPABASE_JWT_ISSUER || issuer,
      audience: process.env.SUPABASE_JWT_AUDIENCE || "authenticated",
      jwksUrl: process.env.STUDENTHUB_LOCAL_JWKS_URL || `${issuer}/.well-known/jwks.json`,
      algorithms: ["ES256", "RS256"],
    });
  }
  return new OidcTokenVerifier({ issuer, audience: process.env.SUPABASE_JWT_AUDIENCE || "authenticated" });
}
