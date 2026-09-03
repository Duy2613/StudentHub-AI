import { createHash } from "node:crypto";
import { createSecureId } from "../../security/secureId.js";
import { Layer1ScreenService } from "../layer1/Layer1ScreenService.js";
import { Layer2AReputationService } from "../layer2a/Layer2AReputationService.js";
import { Layer2SemanticService } from "../layer2/Layer2SemanticService.js";
import { Layer3EvidenceService } from "../layer3/Layer3EvidenceService.js";
import { Layer4TrustService } from "../layer4/Layer4TrustService.js";
import { StudentDomainRiskModel } from "./l2c/StudentDomainRiskModel.js";
import { AdversarialAssuranceAuditor, applyAssuranceDowngrade } from "./l5/AdversarialAssuranceAuditor.js";
import {
  OPERATION_STATUS,
  PIPELINE_STATUS,
  STAGE_IDS,
  createInitialPipeline,
  createStageEnvelope,
  toPublicPipelineResult,
} from "./contracts.js";
import { decideReputationLookup } from "../layer2a/ReputationLookupPolicy.js";
import { failedStage, stageFromL1, stageFromL2A, stageFromL2B, stageFromL2C, stageFromL3, stageFromL4, stageFromL5 } from "./stageAdapters.js";
import { buildCanonicalTrustProjection } from "../integrations/canonicalTrustProjection.js";
import { PROVIDER_CAPABILITY } from "../providerGateway/types.js";
import { createInvestigationBudget } from "./investigationBudget.js";

const TRANSIENT_L2A_STATUSES = new Set(["TIMEOUT", "RATE_LIMITED", "UNAVAILABLE", "CIRCUIT_OPEN", "ERROR"]);
const TRANSIENT_L3_STATUSES = new Set(["TIMEOUT", "UNAVAILABLE", "ERROR", "NOT_CONFIGURED"]);
const NON_CONTINUABLE_PROVIDER_STATES = new Set(["TIMEOUT", "UNAVAILABLE", "NOT_CONFIGURED", "RATE_LIMITED", "AUTH_FAILED", "MALFORMED", "INVALID_RESPONSE", "CIRCUIT_OPEN"]);
const BUDGETED_STAGES = new Set(["l2a", "l2b", "l2c", "l3", "l4", "l5"]);

export class TrustPipelineCancelledError extends Error {
  constructor() {
    super("Trust pipeline was cancelled.");
    this.name = "TrustPipelineCancelledError";
    this.code = "PIPELINE_CANCELLED";
  }
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedString(value, limit) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, limit) : "";
}

function safeMetadata(value) {
  const input = asObject(value);
  const allowed = ["url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "extractionAuthority", "institutionContext"];
  const output = {};
  for (const key of allowed) {
    const item = input[key];
    if (typeof item === "string") output[key] = boundedString(item, key === "ocrText" || key === "qrContent" || key === "qrPayload" ? 16_000 : 2_048);
    else if (typeof item === "number" && Number.isFinite(item) && item >= 0) output[key] = item;
  }
  return output;
}

function normalizeInput(value) {
  const input = asObject(value);
  const type = ["text", "url", "image", "file"].includes(String(input.type || "text").toLowerCase()) ? String(input.type || "text").toLowerCase() : "text";
  return {
    type,
    content: boundedString(input.content, 160_000),
    metadata: safeMetadata(input.metadata),
  };
}

function nowMs() {
  return typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
}

function nowIso() {
  return new Date().toISOString();
}

function fingerprint(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function stageTiming() {
  return { startedAt: nowIso(), startedClock: nowMs() };
}

function completedTiming(timing) {
  const completedAt = nowIso();
  return { startedAt: timing.startedAt, completedAt, latencyMs: Math.max(0, Math.round(nowMs() - timing.startedClock)) };
}

function isTransient(stageId, result) {
  const providerStatus = String(result?.providerStatus || result?.retrievalStatus || result?.metrics?.providerStatus || "").toUpperCase();
  if (stageId === "l2a") return TRANSIENT_L2A_STATUSES.has(providerStatus);
  if (stageId === "l3") return TRANSIENT_L3_STATUSES.has(providerStatus) || ["UNAVAILABLE", "INVALID_RESPONSE", "ERROR"].includes(String(result?.legacyIntegration?.status || "").toUpperCase());
  if (stageId === "l4") return ["UNAVAILABLE", "INVALID_RESPONSE", "ERROR", "PARTIAL"].includes(String(result?.legacyIntegration?.status || result?.legacyIntegration?.providerStatus || "").toUpperCase());
  return false;
}

function adapterIsEnabled(adapter) {
  if (!adapter || typeof adapter !== "object") return false;
  if (adapter.enabled === true || adapter.isConfigured === true) return true;
  try {
    return typeof adapter.isConfigured === "function" && adapter.isConfigured() === true;
  } catch {
    return false;
  }
}

function capabilityIsEnabled(provider, capability, method) {
  if (!provider) return false;
  if (typeof provider.isCapabilityConfigured === "function") {
    try {
      return provider.isCapabilityConfigured(capability) === true;
    } catch {
      return false;
    }
  }
  return adapterIsEnabled(provider) && typeof provider[method] === "function";
}

function canContinueToIndependentResearch(layer3Result) {
  const layer3 = asObject(layer3Result);
  const legacy = asObject(layer3.legacyIntegration);
  // An absent Layer 3 result is an outage/failed stage, not permission to
  // continue into an independent research provider. The continuation decision
  // must be derived from a concrete Layer 3 observation or an explicit typed
  // provider state.
  if (!layer3Result || Object.keys(layer3).length === 0) return false;
  const providerStatus = String(legacy.providerStatus || layer3.retrievalStatus || layer3.metrics?.retrievalStatus || "").toUpperCase();
  if (NON_CONTINUABLE_PROVIDER_STATES.has(providerStatus)) return false;
  if (legacy.status && String(legacy.status).toUpperCase() !== "COMPLETED") return false;
  if (legacy.stop === true || legacy.canContinueToLayer4 === false) return false;
  const canonicalStatus = String(layer3.status || "").toUpperCase();
  const hasCanonicalInvestigationState = [
    "VERIFIED",
    "CONTESTED",
    "UNVERIFIED",
    "INSUFFICIENT_EVIDENCE",
    "PARTIAL",
  ].includes(canonicalStatus);
  return hasCanonicalInvestigationState || !canonicalStatus;
}

export function isRetryEligible(stageId, result = {}) {
  return ["l2a", "l3"].includes(stageId) && isTransient(stageId, result);
}

function terminalStatusForStage(stage) {
  if (stage?.operationStatus === OPERATION_STATUS.FAILED || stage?.operationStatus === OPERATION_STATUS.BLOCKED) return PIPELINE_STATUS.PARTIAL;
  if (stage?.operationStatus === OPERATION_STATUS.PARTIAL) return PIPELINE_STATUS.PARTIAL;
  return null;
}

function cloneSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

export class TrustPipelineOrchestrator {
  constructor(options = {}) {
    const services = asObject(options.services);
    this.services = {
      l1: typeof services.l1 === "function" ? services.l1 : (params) => Layer1ScreenService.screen(params),
      l2a: typeof services.l2a === "function" ? services.l2a : (params) => Layer2AReputationService.verify(params),
      l2b: typeof services.l2b === "function" ? services.l2b : (params) => Layer2SemanticService.verify(params),
      l3: typeof services.l3 === "function" ? services.l3 : (params) => Layer3EvidenceService.verify(params),
      l4: typeof services.l4 === "function" ? services.l4 : (params) => Layer4TrustService.evaluate(params),
      l2c: typeof services.l2c === "function" ? services.l2c : (params) => StudentDomainRiskModel.analyze({ content: params.content, inputType: params.inputType }, { context: params.context }),
      l5: typeof services.l5 === "function" ? services.l5 : (params) => AdversarialAssuranceAuditor.audit(params, { aiReviewer: options.aiReviewer }),
    };
    this.providers = {
      l2a: options.layer2AProvider || null,
      l2b: options.semanticProvider || null,
      l3: options.retriever || null,
    };
    this.providerGateway = options.providerGateway || null;
    this.legacyVerificationAdapter = options.legacyVerificationAdapter || null;
    this.legacyVerificationProvider = this.providerGateway || this.legacyVerificationAdapter;
    this.legacyVerificationEnabled = adapterIsEnabled(this.legacyVerificationProvider);
    this.maxRetriesPerStage = Number.isInteger(options.maxRetriesPerStage) ? Math.max(0, Math.min(1, options.maxRetriesPerStage)) : 1;
    this._activeController = null;
    this._lastRun = null;
    this._lastInput = null;
  }

  _assertActive(signal) {
    if (signal?.aborted) throw new TrustPipelineCancelledError();
  }

  async _emit(pipeline, event, onTransition) {
    if (typeof onTransition !== "function") return;
    try {
      await onTransition({
        event,
        stageId: pipeline.currentStage,
        pipeline: toPublicPipelineResult(cloneSafe(pipeline)),
      });
    } catch {
      // Observability/stream listeners must never change a policy result.
    }
  }

  _setStage(pipeline, stageId, patch) {
    pipeline.stages[stageId] = createStageEnvelope({
      ...pipeline.stages[stageId],
      ...patch,
      stageId,
      requestId: pipeline.requestId,
    });
  }

  _recordAttempt(pipeline, stageId, attempt, stage, errorCode = null) {
    pipeline.audit.stageAttempts.push({
      stageId,
      attempt,
      status: stage?.operationStatus || OPERATION_STATUS.FAILED,
      finding: stage?.finding || null,
      errorCode: boundedString(errorCode || stage?.audit?.errorCode, 120) || null,
      startedAt: stage?.startedAt || null,
      completedAt: stage?.completedAt || null,
    });
  }

  async _stageWorker(stageId, input, rawResults, requestId, signal, budget = null) {
    if (stageId === "l1") {
      return this.services.l1({ ...input, options: { requestId, signal } });
    }
    if (stageId === "l2a") {
      // L1 hard-block status does not by itself decide disclosure. The typed
      // policy prevents private/metadata/SSRF targets from leaving the trust
      // boundary, while valid public targets may receive reputation-only
      // lookup. L1's hard negative remains authoritative regardless.
      const url = input.type === "url" ? input.content || input.metadata.url || "" : "";
      const reputationProvider = this.providers.l2a || (
        capabilityIsEnabled(this.legacyVerificationProvider, PROVIDER_CAPABILITY.URL_THREAT, "layer2Provider") && typeof this.legacyVerificationProvider?.layer2Provider === "function"
          ? this.legacyVerificationProvider.layer2Provider()
          : null
      );
      return this.services.l2a({
        url,
        reputationLookup: decideReputationLookup(url),
        requestId,
        options: reputationProvider ? { provider: reputationProvider, signal, budget } : { signal, budget },
      });
    }
    if (stageId === "l2b") {
      return this.services.l2b({ ...input, layer1Result: rawResults.l1, options: this.providers.l2b ? { provider: this.providers.l2b, requestId, signal, budget } : { requestId, signal, budget } });
    }
    if (stageId === "l2c") {
      return this.services.l2c({ content: input.content || input.metadata.ocrText || input.metadata.qrContent || "", inputType: input.type, context: { inputType: input.type, institutionContext: input.metadata.institutionContext }, layer1Result: rawResults.l1, layer2BResult: rawResults.l2b, signal });
    }
    if (stageId === "l3") {
      const layer3Params = {
        claims: rawResults.l2b?.claims || [],
        candidateSources: rawResults.l2b?.verificationPackage?.candidateSources || [],
        layer2Result: rawResults.l2b || null,
        layer2CResult: rawResults.l2c || null,
        layer2CVerificationPackage: rawResults.l2c?.verificationPackage || null,
        input,
        requestId,
        signal,
        options: { requestId, signal, budget, ...(this.providers.l3 ? { retriever: this.providers.l3 } : {}) },
      };
      if (capabilityIsEnabled(this.legacyVerificationProvider, PROVIDER_CAPABILITY.WEB_EVIDENCE, "verifyLayer3") && typeof this.legacyVerificationProvider?.verifyLayer3 === "function") {
        return this.legacyVerificationProvider.verifyLayer3(layer3Params);
      }
      return this.services.l3(layer3Params);
    }
    if (stageId === "l4") {
      const localResult = await this.services.l4({
        layer1Result: rawResults.l1 || null,
        layer2AResult: rawResults.l2a || null,
        layer2Result: rawResults.l2b || null,
        layer2CResult: rawResults.l2c || null,
        layer3Result: rawResults.l3 || null,
        input,
        options: { requestId, signal, budget },
      });
      if (!capabilityIsEnabled(this.legacyVerificationProvider, PROVIDER_CAPABILITY.INDEPENDENT_RESEARCH, "verifyLayer4") || typeof this.legacyVerificationProvider?.verifyLayer4 !== "function") return localResult;

      const canRunIndependentSynthesis = canContinueToIndependentResearch(rawResults.l3);
      if (!canRunIndependentSynthesis) {
        return {
          ...localResult,
          legacyIntegration: {
            status: "SKIPPED",
            providerStatus: "SKIPPED",
            providerId: "legacy_verification_layer4",
            requestId,
            rawVerdict: null,
            assessmentConfidence: null,
            evidenceAgreement: null,
            sourceQuality: null,
            stop: true,
            canContinueToLayer4: false,
            reason: "Legacy Layer 3 continuation policy did not authorize independent Layer 4 synthesis.",
            contradictoryEvidence: [],
            sources: [],
            sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
            limitations: ["Layer 4 legacy synthesis was skipped by validated server-side continuation policy."],
          },
        };
      }

      const independent = await this.legacyVerificationProvider.verifyLayer4({
        input,
        layer1Result: rawResults.l1 || null,
        layer2AResult: rawResults.l2a || null,
        layer2Result: rawResults.l2b || null,
        layer2CResult: rawResults.l2c || null,
        layer3Result: rawResults.l3 || null,
        unresolvedSignals: rawResults.l3?.legacyIntegration?.unresolvedSignals || [],
        requestId,
        signal,
        budget,
      });
      return {
        ...localResult,
        legacyIntegration: independent || {
          status: "UNAVAILABLE",
          providerStatus: "UNAVAILABLE",
          providerId: "legacy_verification_layer4",
          requestId,
          rawVerdict: null,
          assessmentConfidence: null,
          evidenceAgreement: null,
          sourceQuality: null,
          stop: true,
          canContinueToLayer4: false,
          reason: "Legacy Layer 4 returned no usable result.",
          contradictoryEvidence: [],
          sources: [],
          sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
          limitations: ["No independent legacy synthesis was used by the canonical policy."],
        },
      };
    }
    const auditStages = cloneSafe(rawResults._pipelineStages || {});
    if (auditStages.l5) {
      // The auditor runs while L5 itself is in flight. Treat its own slot as a
      // bounded placeholder for the upstream consistency check; a missing L5
      // result is still detected when an external caller submits a completed
      // pipeline without the required stage.
      auditStages.l5 = { ...auditStages.l5, operationStatus: OPERATION_STATUS.COMPLETED, finding: null };
    }
    return this.services.l5({
      pipeline: rawResults._pipeline || null,
      stages: auditStages,
      l4Result: rawResults.l4 || null,
      requestId,
      signal,
    });
  }

  _adapt(stageId, raw, requestId, timing, operationStatus = OPERATION_STATUS.COMPLETED, attempt = 1, errorCode = null) {
    const completed = completedTiming(timing);
    const common = { ...completed, operationStatus, audit: { attempt, attemptCount: attempt, errorCode, transition: operationStatus } };
    if (stageId === "l1") return stageFromL1(raw, requestId, common);
    if (stageId === "l2a") {
      const stage = stageFromL2A(raw, requestId, common, false);
      if (operationStatus !== OPERATION_STATUS.COMPLETED) stage.operationStatus = operationStatus;
      return stage;
    }
    if (stageId === "l2b") return stageFromL2B(raw, requestId, common);
    if (stageId === "l2c") return stageFromL2C(raw, requestId, common);
    if (stageId === "l3") {
      const stage = stageFromL3(raw, requestId, common);
      if (operationStatus !== OPERATION_STATUS.COMPLETED) stage.operationStatus = operationStatus;
      return stage;
    }
    if (stageId === "l4") return stageFromL4(raw, requestId, common);
    return stageFromL5(raw, requestId, common);
  }

  async _executeStage(stageId, pipeline, input, rawResults, signal, onTransition, options = {}) {
    this._assertActive(signal);
    pipeline.currentStage = stageId;
    if (!pipeline.audit.stageSequence.includes(stageId)) pipeline.audit.stageSequence.push(stageId);
    const runningTiming = stageTiming();
    this._setStage(pipeline, stageId, {
      operationStatus: OPERATION_STATUS.RUNNING,
      finding: null,
      startedAt: runningTiming.startedAt,
      completedAt: null,
      latencyMs: null,
      providerStatus: "RUNNING",
      summary: "Stage đang thực thi; chưa có finding cuối.",
      safeToContinue: false,
      audit: { attempt: 0, attemptCount: 0, transition: OPERATION_STATUS.RUNNING },
    });
    await this._emit(pipeline, "STAGE_STARTED", onTransition);

    let lastRaw = null;
    let lastError = null;
    let finalStage = null;
    const startAttempt = Number.isInteger(options.startAttempt) && options.startAttempt > 0 ? options.startAttempt : 1;
    for (let attempt = startAttempt; attempt <= startAttempt + this.maxRetriesPerStage; attempt += 1) {
      this._assertActive(signal);
      const attemptTiming = attempt === startAttempt ? runningTiming : stageTiming();
      try {
        if (BUDGETED_STAGES.has(stageId) && options.budget) {
          const budgetResult = options.budget.tryConsume("providerCalls");
          if (!budgetResult.allowed) {
            const failureCode = `INVESTIGATION_BUDGET_${boundedString(budgetResult.code, 80) || "EXCEEDED"}`;
            finalStage = failedStage(stageId, pipeline.requestId, failureCode, { startedAt: attemptTiming.startedAt, completedAt: nowIso() });
            this._recordAttempt(pipeline, stageId, attempt, finalStage, failureCode);
            break;
          }
        }
        const raw = await this._stageWorker(stageId, input, rawResults, pipeline.requestId, signal, options.budget);
        this._assertActive(signal);
        lastRaw = raw;
        const retryable = isRetryEligible(stageId, raw) && attempt < startAttempt + this.maxRetriesPerStage;
        const reputationSkipped = stageId === "l2a" && raw?.reputationLookupPolicy === "SKIP" && raw?.notApplicable !== true;
        const operationStatus = reputationSkipped
          ? OPERATION_STATUS.SKIPPED
          : retryable ? OPERATION_STATUS.PARTIAL : (isTransient(stageId, raw) ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED);
        finalStage = this._adapt(stageId, raw || {}, pipeline.requestId, attemptTiming, operationStatus, attempt);
        this._recordAttempt(pipeline, stageId, attempt, finalStage);
        if (retryable) {
          const retryBudget = options.budget?.tryConsume?.("retries");
          if (retryBudget && !retryBudget.allowed) {
            pipeline.audit.stageAttempts.push({ stageId, attempt, status: "RETRY_BLOCKED_BY_BUDGET", finding: finalStage.finding, errorCode: `INVESTIGATION_BUDGET_${boundedString(retryBudget.code, 80) || "EXCEEDED"}`, startedAt: finalStage.startedAt, completedAt: finalStage.completedAt });
            break;
          }
          pipeline.audit.stageAttempts.push({ stageId, attempt, status: "RETRY_SCHEDULED", finding: finalStage.finding, errorCode: "TRANSIENT_PROVIDER", startedAt: finalStage.startedAt, completedAt: finalStage.completedAt });
          await this._emit(pipeline, "STAGE_RETRY_SCHEDULED", onTransition);
          continue;
        }
        break;
      } catch (error) {
        if (signal?.aborted || error?.name === "AbortError" || error?.code === "PIPELINE_CANCELLED") throw new TrustPipelineCancelledError();
        lastError = error;
        const retryable = ["l2a", "l3"].includes(stageId) && attempt < startAttempt + this.maxRetriesPerStage;
        const failureCode = boundedString(error?.code || error?.name || "STAGE_FAILURE", 120);
        finalStage = failedStage(stageId, pipeline.requestId, failureCode, { startedAt: attemptTiming.startedAt, completedAt: nowIso() });
        this._recordAttempt(pipeline, stageId, attempt, finalStage, failureCode);
        if (retryable) {
          const retryBudget = options.budget?.tryConsume?.("retries");
          if (retryBudget && !retryBudget.allowed) {
            pipeline.audit.stageAttempts.push({ stageId, attempt, status: "RETRY_BLOCKED_BY_BUDGET", finding: finalStage.finding, errorCode: `INVESTIGATION_BUDGET_${boundedString(retryBudget.code, 80) || "EXCEEDED"}`, startedAt: finalStage.startedAt, completedAt: finalStage.completedAt });
            break;
          }
          pipeline.audit.stageAttempts.push({ stageId, attempt, status: "RETRY_SCHEDULED", finding: finalStage.finding, errorCode: failureCode, startedAt: finalStage.startedAt, completedAt: finalStage.completedAt });
          await this._emit(pipeline, "STAGE_RETRY_SCHEDULED", onTransition);
          continue;
        }
        break;
      }
    }

    if (!finalStage) finalStage = failedStage(stageId, pipeline.requestId, lastError?.name || "STAGE_FAILURE", completedTiming(runningTiming));
    this._setStage(pipeline, stageId, finalStage);
    rawResults[stageId] = lastRaw;
    pipeline.audit.stageAttempts = pipeline.audit.stageAttempts.slice(-80);
    if (stageId === "l1" && finalStage.finding === "LOCAL_BLOCK") {
      pipeline.audit.hardNegativePropagation.push({ source: "l1", finding: finalStage.finding, destination: "l4", expected: "MALICIOUS/BLOCK" });
    }
    if (stageId === "l2a" && finalStage.finding === "THREAT_MATCH") {
      pipeline.audit.hardNegativePropagation.push({ source: "l2a", finding: finalStage.finding, destination: "l4", expected: "MALICIOUS/BLOCK" });
    }
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);
    return terminalStatusForStage(finalStage);
  }

  async run(rawInput = {}, options = {}) {
    if (this._activeController) this._activeController.abort("superseded-by-new-run");
    const controller = new AbortController();
    this._activeController = controller;
    const callerSignal = options.signal;
    const forwardAbort = () => controller.abort(callerSignal?.reason || "caller-aborted");
    if (callerSignal?.aborted) forwardAbort();
    else callerSignal?.addEventListener("abort", forwardAbort, { once: true });

    const input = normalizeInput(rawInput);
    const requestId = boundedString(options.requestId, 160) || createSecureId("req_v5");
    const budget = options.investigationBudget && typeof options.investigationBudget.tryConsume === "function"
      ? options.investigationBudget
      : createInvestigationBudget({ limits: options.budgetLimits, clock: options.budgetClock });
    const startedAt = nowIso();
    let pipeline = createInitialPipeline({ requestId, startedAt });
    pipeline.pipelineStatus = PIPELINE_STATUS.RUNNING;
    pipeline.audit.inputFingerprint = fingerprint(input);
    pipeline.audit.budget = budget.snapshot();
    const rawResults = {};
    const onTransition = options.onTransition;
    const retryStageId = STAGE_IDS.includes(options.retryStageId) ? options.retryStageId : null;
    const retrySource = retryStageId && this._lastRun && this._lastInput && fingerprint(this._lastInput) === pipeline.audit.inputFingerprint ? this._lastRun : null;
    const startIndex = retrySource ? STAGE_IDS.indexOf(retryStageId) : 0;
    let partial = false;

    try {
      if (retrySource && startIndex > 0) {
        for (const stageId of STAGE_IDS.slice(0, startIndex)) {
          pipeline.stages[stageId] = cloneSafe(retrySource.stages[stageId]);
          if (retrySource.layerResults?.[stageId]) rawResults[stageId] = cloneSafe(retrySource.layerResults[stageId]);
          else if (retrySource.layerResults?.[{ l1: "layer1", l2a: "layer2A", l2b: "layer2B", l2c: "layer2C", l3: "layer3", l4: "layer4" }[stageId]]) rawResults[stageId] = cloneSafe(retrySource.layerResults[{ l1: "layer1", l2a: "layer2A", l2b: "layer2B", l2c: "layer2C", l3: "layer3", l4: "layer4" }[stageId]]);
          pipeline.audit.stageSequence.push(stageId);
        }
        pipeline.audit.stageAttempts.push(...cloneSafe(retrySource.audit?.stageAttempts || []));
        pipeline.audit.hardNegativePropagation.push(...cloneSafe(retrySource.audit?.hardNegativePropagation || []));
      }

      await this._emit(pipeline, "PIPELINE_STARTED", onTransition);
      for (const stageId of STAGE_IDS.slice(startIndex)) {
        this._assertActive(controller.signal);
        rawResults._pipelineStages = pipeline.stages;
        rawResults._pipeline = pipeline;
        const stageStatus = await this._executeStage(stageId, pipeline, input, rawResults, controller.signal, onTransition, {
          startAttempt: retryStageId === stageId && retrySource ? (Number(pipeline.stages[stageId]?.audit?.attemptCount) || 0) + 1 : 1,
          budget,
        });
        pipeline.audit.budget = budget.snapshot();
        if (stageStatus === PIPELINE_STATUS.PARTIAL) partial = true;

        // L5 audits the completed upstream result. It is not allowed to audit a
        // future result or to be bypassed by a hard block.
        if (stageId === "l4") {
          rawResults._pipelineStages = pipeline.stages;
          rawResults._pipeline = pipeline;
        }
      }

      const assurance = rawResults.l5 || {};
      const l4 = rawResults.l4 || {};
      pipeline.assurance = assurance;
      pipeline.finalDecision = applyAssuranceDowngrade(l4, assurance);
      pipeline.layerResults = {
        layer1: rawResults.l1 || null,
        layer2A: rawResults.l2a || null,
        layer2B: rawResults.l2b || null,
        layer2C: rawResults.l2c || null,
        layer3: rawResults.l3 || null,
        layer4: rawResults.l4 || null,
      };
      pipeline.pipelineStatus = partial ? PIPELINE_STATUS.PARTIAL : PIPELINE_STATUS.COMPLETED;
      pipeline.completedAt = nowIso();
      pipeline.audit.budget = budget.snapshot();
      const projection = buildCanonicalTrustProjection({
        requestId,
        input,
        pipeline,
        layers: {
          layer1: rawResults.l1 || null,
          layer2A: rawResults.l2a || null,
          layer2: rawResults.l2b || null,
          layer2C: rawResults.l2c || null,
          layer3: rawResults.l3 || null,
          layer4: rawResults.l4 || null,
        },
        finalDecision: pipeline.finalDecision,
      });
      pipeline.verificationId = projection.verificationId;
      pipeline.mode = projection.mode;
      pipeline.state = projection.state;
      pipeline.input = projection.input;
      pipeline.layers = projection.layers;
      pipeline.decision = projection.decision;
      pipeline.evidence = projection.evidence;
      pipeline.graph = projection.graph;
      pipeline.passport = projection.passport;
      await this._emit(pipeline, "PIPELINE_COMPLETED", onTransition);
      const publicResult = toPublicPipelineResult(cloneSafe(pipeline));
      this._lastRun = cloneSafe(pipeline);
      this._lastInput = input;
      return publicResult;
    } catch (error) {
      if (error instanceof TrustPipelineCancelledError || controller.signal.aborted) {
        pipeline.pipelineStatus = PIPELINE_STATUS.CANCELLED;
        pipeline.completedAt = nowIso();
        await this._emit(pipeline, "PIPELINE_CANCELLED", onTransition);
        throw new TrustPipelineCancelledError();
      }
      pipeline.pipelineStatus = PIPELINE_STATUS.FAILED;
      pipeline.completedAt = nowIso();
      pipeline.audit.budget = budget.snapshot();
      await this._emit(pipeline, "PIPELINE_FAILED", onTransition);
      throw error;
    } finally {
      callerSignal?.removeEventListener("abort", forwardAbort);
      if (this._activeController === controller) this._activeController = null;
    }
  }

  async retry(stageId, options = {}) {
    if (!STAGE_IDS.includes(stageId) || !["l2a", "l3"].includes(stageId)) {
      throw new Error("Only transient L2A/L3 stages are retryable.");
    }
    if (!this._lastRun || !this._lastInput) throw new Error("No completed pipeline is available for retry.");
    return this.run(this._lastInput, { ...options, retryStageId: stageId, requestId: this._lastRun.requestId });
  }
}

export function createTrustPipelineOrchestrator(options) {
  return new TrustPipelineOrchestrator(options);
}
