import { AI_GATEWAY_CONFIG, GEMINI_PRODUCTION_CHAIN_ENTRY_IDS, validateActiveModelIdentifiers } from "../../ai-gateway/config/AIGatewayConfig.js";
import { GeminiProvider } from "../../ai-gateway/providers/GeminiProvider.js";
import { TavilyRetriever } from "../../ai-trust/layer3/retrieval/TavilyRetriever.js";
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

export function getBackendIdentity(env = process.env) {
  const parse = (value) => { try { return new URL(value); } catch { return null; } };
  const auth = parse(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL);
  const browserAuth = parse(env.NEXT_PUBLIC_SUPABASE_URL);
  const database = parse(env.DATABASE_URL);
  const ref = (url) => url?.hostname.match(/^(?:db\.)?([a-z0-9]{20})\.supabase\.co$/)?.[1] || null;
  const authProjectRef = ref(auth);
  const browserAuthProjectRef = ref(browserAuth);
  const databaseProjectRef = ref(database) || database?.username.match(/^postgres\.([a-z0-9]{20})$/)?.[1] || null;
  const refs = [authProjectRef, browserAuthProjectRef, databaseProjectRef].filter(Boolean);
  const alignment = new Set(refs).size > 1 ? "MISMATCH" : refs.length === 3 ? "MATCH" : "UNVERIFIED";
  return { authProjectRef, browserAuthProjectRef, databaseProjectRef, alignment, durableSessionBacking: "DATABASE_URL" };
}

export function classifyDatabaseFailure(error) {
  const code = String(error?.code || "").trim().toUpperCase();
  if (code === "28P01" || code === "28000") return "DATABASE_AUTH_FAILED";
  if (code.startsWith("08") || ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND"].includes(code)) {
    return "DATABASE_CONNECTION_FAILED";
  }
  if (/TLS|SSL|CERT/.test(code)) return "DATABASE_TLS_FAILED";
  return "DATABASE_CHECK_FAILED";
}

export function getTrustProviderReadiness(env = process.env) {
  const tavily = new TavilyRetriever({ env });
  const gemini = new GeminiProvider({ env });
  const modelValidation = validateActiveModelIdentifiers();
  const geminiModels = GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((entryId) => AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId]?.model).filter(hasValue);
  const geminiModelConfigured = modelValidation.valid && geminiModels.length > 0;
  const tavilyConfigured = tavily.isConfigured();
  const geminiConfigured = gemini.isConfigured();

  return {
    tavilyConfigured,
    geminiConfigured,
    geminiModelConfigured,
    geminiModels,
    geminiModelRouteValid: modelValidation.valid,
    geminiModelValidation: modelValidation.entries,
    liveEvidenceConfigured: tavilyConfigured,
    aiSynthesisConfigured: geminiConfigured && geminiModelConfigured,
  };
}

export async function checkReadiness() {
  const backendIdentity = getBackendIdentity();
  const databaseConfigured = hasValue(process.env.DATABASE_URL);
  let databaseAvailable = null;
  let databaseFailureCode = null;
  let expertQualificationSchemaAvailable = null;
  let reportSchemaAvailable = null;
  let realtimeSchemaAvailable = null;
  let communitySchemaAvailable = null;
  let expertV5SchemaAvailable = null;
  let trustSchemaAvailable = null;
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
          to_regclass('private.realtime_events') is not null as realtime_available,
          not exists (select 1 from unnest(array[
            'public.posts', 'public.comments', 'public.community_contributions',
            'public.community_comments', 'public.community_contribution_revisions',
            'public.community_reactions', 'public.community_source_clusters'
          ]) required(name) where to_regclass(required.name) is null) as community_available,
          not exists (select 1 from unnest(array[
            'private.expert_v5_config', 'private.expert_mission_level_policy',
            'private.expert_v5_source_registry', 'private.expert_v5_source_events',
            'private.expert_v5_source_snapshots', 'private.expert_v5_ingestion_requests',
            'private.expert_v5_questions', 'private.expert_v5_question_events',
            'private.expert_mission_progression', 'private.expert_daily_missions',
            'private.expert_mission_attempts', 'private.expert_mission_answers',
            'private.expert_mission_events', 'private.expert_room_presence',
            'private.expert_verification_rooms', 'private.expert_room_participants',
            'private.expert_room_rounds', 'private.expert_room_answers',
            'private.expert_room_evidence_packages', 'private.expert_room_adjudications',
            'private.expert_room_events'
          ]) required(name) where to_regclass(required.name) is null) as expert_v5_available,
          not exists (select 1 from unnest(array[
            'public.trust_cases', 'public.trust_case_revisions', 'public.trust_runs',
            'public.trust_stage_runs', 'public.trust_verdict_revisions',
            'public.case_inputs', 'public.evidence'
          ]) required(name) where to_regclass(required.name) is null) as trust_available`);
      expertQualificationSchemaAvailable = schemaResult.rows[0]?.expert_available === true;
      reportSchemaAvailable = schemaResult.rows[0]?.reports_available === true;
      realtimeSchemaAvailable = schemaResult.rows[0]?.realtime_available === true;
      communitySchemaAvailable = schemaResult.rows[0]?.community_available === true;
      expertV5SchemaAvailable = schemaResult.rows[0]?.expert_v5_available === true;
      trustSchemaAvailable = schemaResult.rows[0]?.trust_available === true;
    } catch (error) {
      databaseAvailable = false;
      databaseFailureCode = classifyDatabaseFailure(error);
      expertQualificationSchemaAvailable = false;
      reportSchemaAvailable = false;
      realtimeSchemaAvailable = false;
      communitySchemaAvailable = false;
      expertV5SchemaAvailable = false;
      trustSchemaAvailable = false;
    }
  }

  const supabaseAuthConfigured = hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
    && (hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || hasValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY));
  const sessionConfigured = supabaseAuthConfigured
    && databaseConfigured
    && hasValue(process.env.STUDENTHUB_SESSION_PEPPER);

  const trustProviders = getTrustProviderReadiness();
  const liveProvidersRequired = process.env.STUDENTHUB_READINESS_REQUIRE_LIVE_PROVIDERS === "true";
  const providersConfigured = trustProviders.liveEvidenceConfigured && trustProviders.aiSynthesisConfigured;
  const labbe = getLabbeReadiness();

  const screenshotStorageRequired = process.env.STUDENTHUB_READINESS_REQUIRE_SCREENSHOT_STORAGE === "true";
  const screenshotStorageConfigured = hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
    && hasValue(process.env.STUDENTHUB_SCREENSHOT_STORAGE_BUCKET);

  const checks = {
    runtime: { status: "AVAILABLE", configured: true },
    database: {
      status: safeStatus(databaseConfigured, databaseAvailable),
      configured: databaseConfigured,
      failureCode: databaseFailureCode,
    },
    supabaseAuth: { status: supabaseAuthConfigured ? "AVAILABLE" : "NOT_CONFIGURED", configured: supabaseAuthConfigured },
    durableSession: { status: sessionConfigured ? "AVAILABLE" : "NOT_CONFIGURED", configured: sessionConfigured },
    liveProviders: {
      status: liveProvidersRequired
        ? (providersConfigured ? "AVAILABLE" : "NOT_CONFIGURED")
        : "NOT_REQUIRED",
      configured: providersConfigured,
      required: liveProvidersRequired,
      ...trustProviders
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
    && checks.durableSession.status === "AVAILABLE"
    && backendIdentity.alignment !== "MISMATCH";

  const requiredCapabilitiesReady = platformReady
    && (!liveProvidersRequired || providersConfigured)
    && (!screenshotStorageRequired || screenshotStorageConfigured);

  const capabilityStatuses = {
    trustLocal: {
      status: trustSchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      source: "StudentHub deterministic local pipeline",
      verification: "SCHEMA_CHECK_ONLY"
    },
    trustLiveProviders: {
      status: providersConfigured ? "AVAILABLE" : liveProvidersRequired ? "NOT_READY" : "NOT_CONFIGURED",
      required: liveProvidersRequired,
      configured: providersConfigured,
      ...trustProviders,
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
      status: expertQualificationSchemaAvailable === true && expertV5SchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      profile: "EXISTING_RUNTIME_ADAPTER",
      quiz: expertQualificationSchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      missions: expertV5SchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      rooms: expertV5SchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      verification: "SCHEMA_CHECK_ONLY"
    },
    community: {
      status: communitySchemaAvailable === true ? "AVAILABLE" : databaseAvailable === true ? "MIGRATION_REQUIRED" : "DATABASE_REQUIRED",
      verification: "SCHEMA_CHECK_ONLY"
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
    backendIdentity,
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
    providerReadiness: trustProviders,
    runStatus: "IDLE",
    checkedAt: new Date().toISOString(),
    checks
  };
}
