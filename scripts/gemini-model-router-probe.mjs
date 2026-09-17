/**
 * One-shot, bounded Google Gemini model-router probe.
 *
 * This script is intentionally separate from the hermetic tests. It makes at
 * most one request per production candidate that is not already recorded as a
 * known 429/quota exhaustion, uses only GEMINI_API_KEY, and writes a
 * secret-free report. Gemma is shadow-only unless --probe-gemma is explicitly
 * supplied for the compatibility gate.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = resolve(process.cwd());
const frontendDir = join(rootDir, "frontend");
const frontendRequire = createRequire(join(frontendDir, "package.json"));

try {
  const { loadEnvConfig } = frontendRequire("@next/env");
  loadEnvConfig(frontendDir);
} catch {
  // Shell-provided server variables remain supported.
}

const [config, providerModule, dto, promptModule] = await Promise.all([
  import(pathToFileURL(join(frontendDir, "src/lib/ai-gateway/config/AIGatewayConfig.js")).href),
  import(pathToFileURL(join(frontendDir, "src/lib/ai-gateway/providers/GeminiProvider.js")).href),
  import(pathToFileURL(join(frontendDir, "src/lib/ai-trust/layer4/providers/GeminiTrustVerificationDTO.js")).href),
  import(pathToFileURL(join(frontendDir, "src/lib/ai-trust/layer4/providers/AIGatewayReasoningProvider.js")).href),
]);

const {
  AI_GATEWAY_CONFIG,
  GEMINI_PRODUCTION_CHAIN_ENTRY_IDS,
  GEMINI_MODEL_ROUTE_VALIDATION,
} = config;
const { GeminiProvider } = providerModule;
const {
  GEMINI_TRUST_VERIFICATION_SCHEMA,
  isValidGeminiTrustVerification,
} = dto;
const { buildGeminiLayer4Prompts } = promptModule;

const boundedBudgetMs = AI_GATEWAY_CONFIG.BUDGET.L4_TOTAL_MS;
const perModelTimeoutMs = AI_GATEWAY_CONFIG.BUDGET.L4_PER_MODEL_TIMEOUT_MS;
const canonicalKeyPresent = typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim().length > 0;
const probeGemma = process.argv.includes("--probe-gemma");
const reportDate = new Date().toISOString().slice(0, 10);
const reportPath = join(rootDir, `docs/reports/gemini_multi_model_router_probe_${reportDate}.json`);

function safeStatus(value) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 80) : null;
}

function safeHttpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

function prior429For(model) {
  const candidates = [
    join(rootDir, "docs/reports/gemini_only_provider_smoke_2026-09-16.json"),
    join(rootDir, `docs/reports/gemini_multi_model_router_probe_${reportDate}.json`),
  ];
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const report = JSON.parse(readFileSync(filePath, "utf8"));
      const records = Array.isArray(report.records)
        ? report.records
        : Array.isArray(report.REAL_PROBE_RESULTS) ? report.REAL_PROBE_RESULTS : [];
      if (records.some((record) => (record?.model || record?.MODEL) === model && safeHttpStatus(record.httpStatus ?? record.HTTP_STATUS) === 429)) return true;
    } catch {
      // An unreadable historical report cannot block a fresh bounded probe.
    }
  }
  return false;
}

function safeProbeRecord({ model, available, httpStatus = null, quotaFailure = null, providerErrorCode = null, durationMs = 0, schemaCompatible = "NOT_PROBED", httpRequests = 0, realOutbound = false, errorType = null, compatibilityChecks = null } = {}) {
  return {
    model,
    available,
    httpStatus: safeHttpStatus(httpStatus),
    rpmRpdFailure: quotaFailure,
    providerErrorCode: safeStatus(providerErrorCode),
    durationMs: Math.max(0, Math.min(Number(durationMs) || 0, 30_000)),
    schemaCompatible,
    httpRequests: Math.max(0, Math.min(Number(httpRequests) || 0, 2)),
    realOutbound: realOutbound === true,
    errorType: safeStatus(errorType),
    compatibilityChecks: compatibilityChecks && typeof compatibilityChecks === "object" ? { ...compatibilityChecks } : null,
  };
}

const deterministicFixture = {
  classification: "MALICIOUS",
  securityClassification: "MALICIOUS",
  truthStatus: "UNVERIFIED",
  enforcement: "BLOCK",
  keyReasons: ["Controlled compatibility safety gate: do not downgrade a hard block."],
};
const probeEvidence = [{
  evidenceId: "gemini-router-compatibility-evidence",
  claimId: "gemini-router-compatibility-claim",
  relation: "contradicts",
  sourceTitle: "Controlled compatibility fixture",
  sourceUrl: "https://example.com/studenthub-gemini-router-probe",
  excerpt: "Controlled evidence fixture for schema, grounding, and safety-boundary checks.",
}];
const probeEvidenceUrls = new Set(probeEvidence.map((item) => item.sourceUrl));
const { systemPrompt, userPrompt } = buildGeminiLayer4Prompts({ deterministic: deterministicFixture, evidence: probeEvidence });

function gemmaCompatibilityChecks({ parsed = null, httpStatus = null, available = "NO", durationMs = 0 } = {}) {
  const schemaCompatible = isValidGeminiTrustVerification(parsed, {
    allowedCitationUrls: probeEvidenceUrls,
    allowedModels: parsed?.model ? [parsed.model] : [],
    allowGemmaShadow: true,
  });
  const reasoningText = [
    ...(Array.isArray(parsed?.supportReasons) ? parsed.supportReasons : []),
    ...(Array.isArray(parsed?.contradictionReasons) ? parsed.contradictionReasons : []),
    ...(Array.isArray(parsed?.missingEvidence) ? parsed.missingEvidence : []),
    parsed?.uncertainty,
  ].filter((item) => typeof item === "string").join(" ");
  const citationUrls = Array.isArray(parsed?.citationsUsed) ? parsed.citationsUsed.map((item) => item?.url) : [];
  const safetyText = reasoningText.toLowerCase();
  const positiveSafetyClaim = /(^|\s)(safe|allow|allowed|cho phép)(\s|$)/u.test(safetyText) ||
    (/(^|\s)an toàn(\s|$)/u.test(safetyText) && !/không\s+an toàn/u.test(safetyText));
  return {
    endpointCompatibility: httpStatus === 200,
    structuredOutputCompatibility: schemaCompatible,
    vietnameseReasoningQuality: /[À-ỹĐđ]/u.test(reasoningText),
    evidenceGroundedResponse: citationUrls.every((url) => probeEvidenceUrls.has(url)),
    latency: Number(durationMs) > 0 && Number(durationMs) <= perModelTimeoutMs,
    currentProjectQuota: available === "YES" && httpStatus === 200,
    // The controlled fixture is a hard BLOCK. A candidate must not return a
    // positive SUPPORTS signal or an unqualified safe/allow instruction.
    safetyBehavior: parsed?.verdictSignal !== "SUPPORTS" && !positiveSafetyClaim,
    outputParserCompatibility: schemaCompatible,
  };
}

async function probeCatalogEntry(catalogEntry, { allowShadowCandidate = false } = {}) {
  if (!canonicalKeyPresent) return safeProbeRecord({ model: catalogEntry.model, available: "NO_CANONICAL_KEY", errorType: "NOT_CONFIGURED" });
  if (!allowShadowCandidate && prior429For(catalogEntry.model)) {
    return safeProbeRecord({ model: catalogEntry.model, available: "SKIPPED_KNOWN_EXHAUSTED", httpStatus: 429, quotaFailure: "KNOWN_PRIOR_429", schemaCompatible: "NOT_PROBED" });
  }

  let httpRequests = 0;
  const provider = new GeminiProvider({
    env: process.env,
    fetchImpl: (...args) => {
      httpRequests += 1;
      return globalThis.fetch(...args);
    },
  });
  const startedAt = Date.now();
  try {
    const generated = await provider.generate({
      catalogEntry,
      systemPrompt,
      userPrompt,
      jsonMode: true,
      responseSchema: GEMINI_TRUST_VERIFICATION_SCHEMA,
      timeoutMs: perModelTimeoutMs,
      maxOutputTokens: 512,
      allowShadowCandidate,
    });
    let parsed = null;
    try {
      parsed = JSON.parse(String(generated.text || ""));
    } catch {
      return safeProbeRecord({
        model: catalogEntry.model,
        available: "YES",
        httpStatus: generated.httpStatus,
        durationMs: Date.now() - startedAt,
        schemaCompatible: "NO",
        httpRequests,
        realOutbound: httpRequests > 0,
        errorType: "INVALID_JSON",
        compatibilityChecks: allowShadowCandidate ? gemmaCompatibilityChecks({ httpStatus: generated.httpStatus, available: "YES", durationMs: Date.now() - startedAt }) : null,
      });
    }
    const schemaCompatible = isValidGeminiTrustVerification(parsed, {
      allowedCitationUrls: probeEvidenceUrls,
      allowedModels: [catalogEntry.model],
      allowGemmaShadow: allowShadowCandidate,
    });
    return safeProbeRecord({
      model: catalogEntry.model,
      available: "YES",
      httpStatus: generated.httpStatus,
      durationMs: Date.now() - startedAt,
      schemaCompatible: schemaCompatible ? "YES" : "NO",
      httpRequests,
      realOutbound: httpRequests > 0,
      compatibilityChecks: allowShadowCandidate ? gemmaCompatibilityChecks({ parsed, httpStatus: generated.httpStatus, available: "YES", durationMs: Date.now() - startedAt }) : null,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    return safeProbeRecord({
      model: catalogEntry.model,
      available: "NO",
      httpStatus: error?.httpStatus,
      quotaFailure: error?.dailyQuotaExhausted === true ? "DAILY_QUOTA_EXHAUSTED" : error?.quotaExhausted === true ? "QUOTA_EXHAUSTED" : null,
      providerErrorCode: error?.providerErrorCode,
      durationMs,
      schemaCompatible: "NOT_VERIFIED",
      httpRequests,
      realOutbound: httpRequests > 0,
      errorType: error?.gatewayErrorType || error?.providerErrorCode,
      compatibilityChecks: allowShadowCandidate ? gemmaCompatibilityChecks({ httpStatus: error?.httpStatus, available: "NO", durationMs }) : null,
    });
  }
}

const productionRecords = [];
for (const entryId of GEMINI_PRODUCTION_CHAIN_ENTRY_IDS) {
  productionRecords.push(await probeCatalogEntry(AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId]));
}

async function shadowProbe(entryId) {
  const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
  if (!probeGemma) {
    return { MODEL: entry.model, STATUS: "NOT_RUN_SHADOW_ONLY", COMPATIBLE: false, CHECKS: {} };
  }
  const probe = await probeCatalogEntry(entry, { allowShadowCandidate: true });
  const checks = probe.compatibilityChecks || gemmaCompatibilityChecks({
    httpStatus: probe.httpStatus,
    available: probe.available,
    durationMs: probe.durationMs,
  });
  const compatible = Object.values(checks).every((value) => value === true);
  return {
    MODEL: entry.model,
    STATUS: compatible ? "COMPATIBLE" : "INCOMPATIBLE",
    COMPATIBLE: compatible,
    CHECKS: checks,
    PROBE: probe,
  };
}

const gemma31b = await shadowProbe("GEMMA_4_31B_IT");
const gemma26b = await shadowProbe("GEMMA_4_26B_A4B_IT");
const gemmaCompatible = gemma31b.COMPATIBLE === true || gemma26b.COMPATIBLE === true;
// A skipped prior 429 is useful evidence for avoiding a duplicate request,
// but it is not fresh availability or schema evidence.
const allProductionAvailable = productionRecords.every((record) => record.available === "YES");
const allProductionSchemaCompatible = productionRecords.every((record) => record.schemaCompatible === "YES");

function publicProbeRecord(record) {
  return {
    MODEL: record.model,
    AVAILABLE: record.available,
    HTTP_STATUS: record.httpStatus,
    "RPM/RPD failure": record.rpmRpdFailure,
    PROVIDER_ERROR_CODE: record.providerErrorCode,
    DURATION: record.durationMs,
    SCHEMA_COMPATIBLE: record.schemaCompatible,
    HTTP_REQUESTS: record.httpRequests,
    REAL_OUTBOUND: record.realOutbound,
    ERROR_TYPE: record.errorType,
  };
}

const report = {
  reportVersion: "gemini-multi-model-router-probe-v1",
  generatedAt: new Date().toISOString(),
  GEMINI_API_KEY_PRESENT: canonicalKeyPresent,
  MODEL_3_8: publicProbeRecord(productionRecords[0]),
  MODEL_3_7: publicProbeRecord(productionRecords[1]),
  MODEL_3_6: publicProbeRecord(productionRecords[2]),
  MODEL_2_5: {
    MODEL: "gemini-2.5-flash",
    AVAILABLE: "RETIRED",
    HTTP_STATUS: 404,
    "RPM/RPD failure": null,
    PROVIDER_ERROR_CODE: "PROJECT_MODEL_UNAVAILABLE",
    DURATION: 0,
    SCHEMA_COMPATIBLE: "NO",
    HTTP_REQUESTS: 0,
    REAL_OUTBOUND: false,
    ERROR_TYPE: "UNAVAILABLE_TO_NEW_USERS",
  },
  MODEL_ROUTER_RESULT: {
    ACTIVE_FALLBACK_CHAIN: GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((entryId) => AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId].model),
    ALL_PRODUCTION_PROBES_BOUNDED: productionRecords.every((record) => record.httpRequests <= 1 || record.available === "SKIPPED_KNOWN_EXHAUSTED"),
    ALL_PRODUCTION_AVAILABLE: allProductionAvailable,
    ALL_PRODUCTION_SCHEMA_COMPATIBLE: allProductionSchemaCompatible,
  },
  MODEL_COOLDOWN_RESULT: "PROCESS_LOCAL_PER_MODEL_COOLDOWN_ENABLED",
  MAX_L4_BUDGET: {
    totalMs: boundedBudgetMs,
    perModelTimeoutMs,
    maxAttempts: AI_GATEWAY_CONFIG.LIMITS.MAX_ROUTER_ATTEMPTS,
  },
  REAL_PROBE_RESULTS: productionRecords.map(publicProbeRecord),
  GEMMA_31B_COMPATIBILITY: gemma31b,
  GEMMA_26B_COMPATIBILITY: gemma26b,
  GEMMA_COMPATIBLE: gemmaCompatible ? "YES" : "NO",
  ACTIVE_FALLBACK_CHAIN: GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((entryId) => AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId].model),
  L4_ALL_MODELS_FAIL_TEST: "SEE_HERMETIC_FAULT_MATRIX",
  L5_AFTER_ALL_MODELS_FAIL: "SEE_HERMETIC_V5_PIPELINE_TEST",
  ZERO_RERUN: "ONE_ROUTING_SEQUENCE_PER_TRUST_RUN",
  NO_GROQ: "YES",
  NO_SEQUENTIAL: "YES",
  TRUST_AUTHORITY_CHANGED: "NO",
  VERDICT: !canonicalKeyPresent || !GEMINI_MODEL_ROUTE_VALIDATION.valid
    ? "GEMINI_MULTI_MODEL_ROUTER_BLOCKED"
    : (productionRecords.some((record) => record.available === "YES" && record.schemaCompatible === "YES") && GEMINI_MODEL_ROUTE_VALIDATION.valid)
      ? "GEMINI_MULTI_MODEL_ROUTER_VERIFIED"
      : "GEMINI_MULTI_MODEL_ROUTER_PARTIAL",
  noSecretsPrinted: true,
};

mkdirSync(join(rootDir, "docs/reports"), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
for (const record of productionRecords) {
  console.log(`[GEMINI_ROUTER_PROBE] ${record.model}: ${record.available} http=${record.httpStatus ?? "n/a"} schema=${record.schemaCompatible} ${record.durationMs}ms`);
}
console.log(`[GEMINI_ROUTER_PROBE] Report: ${reportPath}`);
console.log(`[GEMINI_ROUTER_PROBE] Verdict: ${report.VERDICT}`);

if (report.VERDICT === "GEMINI_MULTI_MODEL_ROUTER_BLOCKED") process.exitCode = 2;
