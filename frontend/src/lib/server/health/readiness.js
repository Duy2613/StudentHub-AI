import { getLegacyVerificationConfig } from "../../ai-trust/integrations/legacyVerification/config.js";
import { getLayer2AConfig } from "../../ai-trust/layer2a/config.js";
import { getPostgresPool } from "../database/PostgresPool.js";
import { getLabbeReadiness } from "../integrations/LabbeBridge.js";

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
  let expertQualificationSchemaAvailable = null;
  let reportSchemaAvailable = null;
  let realtimeSchemaAvailable = null;
  if (databaseConfigured) {
    try {
      const pool = getPostgresPool();
      await pool.query("select 1 as ready");
      databaseAvailable = true;
      const schemaResult = await pool.query(`
        select to_regclass('public.expert_applications') is not null
          and to_regclass('public.expert_quiz_attempts') is not null
          and to_regclass('public.expert_quiz_answers') is not null
          and to_regclass('private.integration_outbox') is not null as expert_available,
          to_regclass('private.report_jobs') is not null
          and to_regclass('private.report_artifacts') is not null
          and to_regclass('private.report_job_events') is not null as reports_available,
          to_regclass('private.realtime_events') is not null as realtime_available`);
      expertQualificationSchemaAvailable = schemaResult.rows[0]?.expert_available === true;
      reportSchemaAvailable = schemaResult.rows[0]?.reports_available === true;
      realtimeSchemaAvailable = schemaResult.rows[0]?.realtime_available === true;
    } catch {
      databaseAvailable = false;
      expertQualificationSchemaAvailable = false;
      reportSchemaAvailable = false;
      realtimeSchemaAvailable = false;
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
  const labbe = getLabbeReadiness();

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

  const platformReady = checks.runtime.status === "AVAILABLE"
    && checks.database.status === "AVAILABLE"
    && checks.durableSession.status === "AVAILABLE";

  const requiredCapabilitiesReady = platformReady
    && (!liveProvidersRequired || providersConfigured)
    && (!screenshotStorageRequired || screenshotStorageConfigured);

  const capabilityStatuses = {
    trustLocal: {
      status: checks.database.status === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE",
      source: "StudentHub deterministic local pipeline"
    },
    trustLiveProviders: {
      status: providersConfigured ? "AVAILABLE" : liveProvidersRequired ? "NOT_READY" : "NOT_CONFIGURED",
      required: liveProvidersRequired,
      configured: providersConfigured,
    },
    screenshotEvidence: {
      status: screenshotStorageConfigured ? "AVAILABLE" : screenshotStorageRequired ? "NOT_READY" : "NOT_CONFIGURED",
      required: screenshotStorageRequired,
      configured: screenshotStorageConfigured,
    },
    realtime: {
      status: realtimeSchemaAvailable === true
        ? "AVAILABLE"
        : databaseAvailable === false
          ? "UNAVAILABLE"
          : "DEGRADED",
      transport: realtimeSchemaAvailable === true ? "POSTGRES_EVENT_LOG_SSE" : "PROCESS_LOCAL_SSE",
      authoritative: realtimeSchemaAvailable === true,
      sourceOfTruth: realtimeSchemaAvailable === true
        ? "PostgreSQL realtime event log and durable domain snapshots"
        : "Durable domain records and transactional outbox",
      schema: realtimeSchemaAvailable === true ? "AVAILABLE" : "NOT_VERIFIED"
    },
    experts: {
      status: "PARTIAL",
      profile: "EXISTING_RUNTIME_ADAPTER",
      quiz: expertQualificationSchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED"
    },
    reports: {
      status: reportSchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      template: "trust-case.report.v1",
      storage: "PRIVATE_POSTGRES",
      immutableSnapshot: reportSchemaAvailable === true,
    },
    labbe: {
      status: labbe.status === "READY" ? "AVAILABLE" : labbe.status === "SHADOW" ? "PARTIAL" : labbe.status,
      mode: labbe.mode,
      delivery: labbe.delivery,
      configured: labbe.configured,
      writeback: labbe.writeback
    }
  };
  const capabilityReady = Object.values(capabilityStatuses).every((capability) => capability.status === "AVAILABLE");
  const ready = requiredCapabilitiesReady;

  return {
    readinessModelVersion: "readiness.v2",
    status: ready ? "READY" : "NOT_READY",
    ready,
    liveness: { status: checks.runtime.status, checkedAt: new Date().toISOString() },
    platformReadiness: {
      status: platformReady ? "READY" : "NOT_READY",
      ready: platformReady,
      checks: {
        runtime: checks.runtime,
        database: checks.database,
        durableSession: checks.durableSession
      }
    },
    capabilityReadiness: {
      status: capabilityReady ? "READY" : "PARTIAL",
      ready: capabilityReady,
      requiredReady: requiredCapabilitiesReady,
      capabilities: capabilityStatuses
    },
    runStatus: "IDLE",
    checkedAt: new Date().toISOString(),
    checks
  };
}
