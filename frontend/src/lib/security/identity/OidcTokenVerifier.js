import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from "jose";
import { validateRemoteUrlSync } from "../hardening/SafeRemoteUrl.js";

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
    const { payload, protectedHeader } = await jwtVerify(token, this.keySet, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: this.algorithms,
      requiredClaims: ["sub", "exp", "iss", "aud"],
    });
    if (!payload.sub) throw new Error("OIDC subject is required.");
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

export function createSupabaseTokenVerifier() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || baseUrl.includes("placeholder")) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  const issuer = `${baseUrl.replace(/\/$/, "")}/auth/v1`;
  return new OidcTokenVerifier({ issuer, audience: process.env.SUPABASE_JWT_AUDIENCE || "authenticated" });
}
