import { isDemoAccountEmail } from "./demoAccountPolicy.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCEPTANCE_ENVIRONMENTS = new Set(["preview", "staging", "test"]);

/**
 * Acceptance Mode only changes internal harness throttling. It is opt-in and
 * cannot be enabled on a production deployment, even if the flag is copied.
 */
export function isDemoAcceptanceModeEnabled(environment = process.env) {
  if (String(environment.STUDENTHUB_ACCEPTANCE_MODE || "").trim().toLowerCase() !== "true") {
    return false;
  }

  const vercelEnvironment = String(environment.VERCEL_ENV || "").trim().toLowerCase();
  const deploymentEnvironment = String(environment.STUDENTHUB_DEPLOYMENT_ENV || "").trim().toLowerCase();
  if (vercelEnvironment === "production" || deploymentEnvironment === "production") return false;
  if (vercelEnvironment && !["preview", "development"].includes(vercelEnvironment)) return false;
  if (deploymentEnvironment && !ACCEPTANCE_ENVIRONMENTS.has(deploymentEnvironment)) return false;

  if (["test", "development"].includes(environment.NODE_ENV)) return true;
  if (environment.NODE_ENV !== "production") return false;
  return vercelEnvironment === "preview" || ACCEPTANCE_ENVIRONMENTS.has(deploymentEnvironment);
}

/**
 * Returns a per-UID rate-limit bucket only for a verified Supabase identity
 * whose signed email belongs to the server-owned eight-account demo allowlist.
 * Callers must pass identity data returned by OidcTokenVerifier, never request
 * body, query, or client metadata.
 */
export function getDemoAcceptanceRateLimitKey(identity, action, environment = process.env) {
  if (!isDemoAcceptanceModeEnabled(environment) || identity?.emailVerified !== true || !isDemoAccountEmail(identity.email)) {
    return null;
  }

  const userId = String(identity.userId || "").trim();
  const safeAction = String(action || "").trim().toUpperCase();
  if (!UUID_PATTERN.test(userId) || !/^[A-Z0-9_:-]{1,80}$/.test(safeAction)) return null;

  return `subject:${userId}:action:${safeAction}:demo-acceptance`;
}
