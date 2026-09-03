import { getLegacyVerificationConfig } from "@/lib/ai-trust/integrations/legacyVerification/config.js";
import { getLayer2AConfig } from "@/lib/ai-trust/layer2a/config.js";
import { getPostgresPool } from "@/lib/server/database/PostgresPool.js";

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function safeStatus(configured, available) {
  if (!configured) return "NOT_CONFIGURED";
  if (available === true) return "AVAILABLE";
  if (available === false) return "UNAVAILABLE";
  return "UNKNOWN";
}

export async function checkReadiness() {
  const databaseConfigured = hasValue(process.env.DATABASE_URL);
  let databaseAvailable = null;
  if (databaseConfigured) {
    try {
      await getPostgresPool().query("select 1 as ready");
      databaseAvailable = true;
    } catch {
      databaseAvailable = false;
    }
  }

  const supabaseAuthConfigured = hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
    && (hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || hasValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));
  const sessionConfigured = supabaseAuthConfigured
    && databaseConfigured
    && hasValue(process.env.STUDENTHUB_SESSION_PEPPER);

  const layer2 = getLayer2AConfig();
  const legacy = getLegacyVerificationConfig();
  const liveProvidersRequired = process.env.STUDENTHUB_READINESS_REQUIRE_LIVE_PROVIDERS === "true";
  const providersConfigured = Boolean(layer2.baseUrl) && legacy.enabled;

  const screenshotStorageRequired = process.env.STUDENTHUB_READINESS_REQUIRE_SCREENSHOT_STORAGE === "true";
  const screenshotStorageConfigured = hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
    && hasValue(process.env.STUDENTHUB_SCREENSHOT_STORAGE_BUCKET);

  const checks = {
    runtime: { status: "AVAILABLE", configured: true },
    database: { status: safeStatus(databaseConfigured, databaseAvailable), configured: databaseConfigured },
    supabaseAuth: { status: supabaseAuthConfigured ? "AVAILABLE" : "NOT_CONFIGURED", configured: supabaseAuthConfigured },
    durableSession: { status: sessionConfigured ? "AVAILABLE" : "NOT_CONFIGURED", configured: sessionConfigured },
    liveProviders: {
      status: liveProvidersRequired
        ? (providersConfigured ? "AVAILABLE" : "NOT_CONFIGURED")
        : "NOT_REQUIRED",
      configured: providersConfigured,
      required: liveProvidersRequired
    },
    screenshotStorage: {
      status: screenshotStorageRequired
        ? (screenshotStorageConfigured ? "AVAILABLE" : "NOT_CONFIGURED")
        : "NOT_REQUIRED",
      configured: screenshotStorageConfigured,
      required: screenshotStorageRequired
    }
  };

  const ready = checks.runtime.status === "AVAILABLE"
    && checks.database.status === "AVAILABLE"
    && checks.durableSession.status === "AVAILABLE"
    && (!liveProvidersRequired || providersConfigured)
    && (!screenshotStorageRequired || screenshotStorageConfigured);

  return {
    status: ready ? "READY" : "NOT_READY",
    ready,
    checkedAt: new Date().toISOString(),
    checks
  };
}
