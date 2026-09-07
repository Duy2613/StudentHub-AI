"use client";

import React, { useState } from "react";
import {
  Check,
  AlertTriangle,
  ShieldAlert,
  LoaderCircle,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  LAYER_STATUS,
  getLayerDisplayStatus,
} from "@/lib/ai-trust/sequential/SequentialTrustStateMachine";
import TechnicalScanDetailsModal from "./TechnicalScanDetailsModal";

/**
 * Derives dynamic technical checks performed by Layer 1 based on actual Sequential detectors and signals.
 */
function deriveTechnicalChecks(layer1Result, inputType = "text") {
  const signals = Array.isArray(layer1Result?.signals) ? layer1Result.signals : [];
  const signalTypes = new Set(signals.map((s) => String(s.type || "").toLowerCase()));

  const flaggedCheck = (name, flagTypes, flagLabel, isKey = false) => {
    const matched = flagTypes.some((type) => signalTypes.has(type));
    return {
      name,
      status: matched ? flagLabel : "Not reported",
      passed: matched ? false : null,
      isKey,
    };
  };

  const checks = inputType === "url"
    ? [
        flaggedCheck("HTTPS connection", ["unencrypted_transport"], "Unencrypted HTTP", true),
        flaggedCheck("Domain information", ["suspicious_tld", "invalid_domain"], "Suspicious", true),
        flaggedCheck("Redirect chain", ["shortened_url"], "Shortener flagged", true),
        flaggedCheck("Suspicious keyword scan", ["phishing_keywords", "scam_lure"], "Lures detected", true),
        flaggedCheck("No exposed key pattern", ["exposed_key_pattern"], "Token exposed", true),
        flaggedCheck("Credential parameters", ["credential_param"], "Detected"),
        flaggedCheck("Homoglyph & Punycode", ["homoglyph_attack", "punycode_spoof"], "Spoofing flagged"),
        flaggedCheck("SSRF & IP Guard", ["ssrf_ip_format", "loopback_target"], "Blocked"),
        flaggedCheck("Userinfo spoofing", ["userinfo_spoofing"], "Detected"),
        flaggedCheck("Executable extensions", ["executable_extension"], "Dangerous extension"),
        flaggedCheck("URL syntax bounds", ["payload_limit_exceeded"], "Exceeded limit"),
        flaggedCheck("Domain authority rating", ["domain_authority_verified"], "Verified"),
      ]
    : inputType === "image" || inputType === "qr" || inputType === "file"
    ? [
        flaggedCheck("MIME & format validation", ["invalid_mime", "unsupported_format"], "Invalid format", true),
        flaggedCheck("Payload size bounds", ["oversized_file", "payload_limit_exceeded"], "Exceeded", true),
        flaggedCheck("OCR text normalization", ["ocr_failed"], "Extraction failed", true),
        flaggedCheck("QR matrix decoding", ["qr_decode_failed"], "Decode failed", true),
        flaggedCheck("Suspicious keyword scan", ["phishing_keywords", "scam_lure"], "Lures detected", true),
        flaggedCheck("No exposed key pattern", ["exposed_key_pattern"], "Token exposed"),
        flaggedCheck("Executable binary guard", ["executable_extension", "executable_binary"], "Executable detected"),
        flaggedCheck("Embedded URL extraction", ["embedded_url_risk"], "Risk flagged"),
        flaggedCheck("Steganography check", ["steganography_detected"], "Signal detected"),
        flaggedCheck("Phishing overlay heuristics", ["phishing_overlay"], "Signal detected"),
      ]
    : [
        flaggedCheck("Text integrity & encoding", ["invalid_encoding", "empty_input"], "Invalid input", true),
        flaggedCheck("Vietnamese scam patterns", ["vietnamese_scam_lure"], "Flagged", true),
        flaggedCheck("Urgent pressure heuristics", ["urgency_pressure"], "High pressure", true),
        flaggedCheck("Banking & OTP impersonation", ["otp_pressure"], "OTP demand", true),
        flaggedCheck("No exposed key pattern", ["exposed_key_pattern"], "Token exposed", true),
        flaggedCheck("Brand spoofing scan", ["brand_impersonation"], "Detected"),
        flaggedCheck("Hotline & contact verification", ["unverified_contact"], "Unverified"),
        flaggedCheck("Student target lures", ["student_task_scam"], "Task scam"),
        flaggedCheck("Anti-evasion normalization", ["encoding_evasion", "obfuscated_text"], "Evasion flagged"),
      ];

  return { checks, totalCount: checks.length };
}

/**
 * Normalizes verdict text and semantic styling
 */
function getVerdictBadgeStyle(verdict = "") {
  const v = String(verdict).toUpperCase();
  if (["SAFE", "PASS", "CLEAN", "LOW", "LOW RISK", "LOW_RISK", "TRUE", "SUPPORTED", "NO_KNOWN_THREAT"].some((k) => v.includes(k))) {
    return {
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      glowColor: "rgba(16, 185, 129, 0.25)",
      statusLabel: "SAFE / LOW RISK",
    };
  }
  if (["BLOCK", "MALICIOUS", "DANGEROUS", "HIGH", "HIGH RISK", "HIGH_RISK", "FALSE", "FAKE", "THREAT_MATCH"].some((k) => v.includes(k))) {
    return {
      textColor: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      glowColor: "rgba(244, 63, 94, 0.25)",
      statusLabel: "HIGH RISK / DANGEROUS",
    };
  }
  return {
    textColor: "text-amber-300",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "rgba(245, 158, 11, 0.25)",
    statusLabel: "SUSPICIOUS / UNCERTAIN",
  };
}

function providerStatusFor(result) {
  return String(
    result?.providerStatus ||
    result?.legacyIntegration?.providerStatus ||
    result?.retrievalStatus ||
    "UNKNOWN"
  ).toUpperCase();
}

function normalizeSourceItems(items) {
  const values = Array.isArray(items) ? items : [];
  return values.map((item, idx) => {
    const source = typeof item === "string" ? { title: item } : item || {};
    const stance = String(source.stance || source.status || source.verdict || "NEUTRAL").toUpperCase();
    return {
      name: source.publisher || source.title || source.domain || source.sourceTitle || source.sourceId || `Source ${idx + 1}`,
      stance: stance.includes("SUPPORT") || stance.includes("VERIF") || stance === "TRUE" ? "Supports" : stance.includes("REFUT") || stance.includes("CONTRAD") || stance === "FALSE" ? "Refutes" : "Neutral",
      quality: String(source.authorityTier || "").toUpperCase().includes("HIGH") || (typeof source.confidence === "number" && source.confidence >= 0.8) ? "High quality" : "Standard quality",
      url: source.url || source.sourceUrl || null,
      origin: source.origin || source.sourceType || source.provider || null,
    };
  });
}

function SourceList({ title, sources }) {
  if (!sources.length) {
    return <p className="text-xs text-white/45">No sources were returned by this layer.</p>;
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono tracking-wider uppercase text-white/40 block">
        {title} ({sources.length})
      </span>
      <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-black/30">
        {sources.slice(0, 6).map((source, idx) => {
          const content = (
            <div className="flex items-center justify-between gap-3 p-3 text-xs">
              <span className="text-white/90 font-bold truncate max-w-[180px] sm:max-w-xs">{source.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className={source.stance === "Supports" ? "text-emerald-400" : source.stance === "Refutes" ? "text-rose-400" : "text-slate-400"}>
                  {source.stance}
                </span>
                <span className="text-white/50 font-mono hidden sm:inline">{source.quality}</span>
              </div>
            </div>
          );
          return source.url ? (
            <a key={`${source.url}-${idx}`} href={source.url} target="_blank" rel="noreferrer" className="block hover:bg-white/[0.04] transition-colors" title={source.url}>
              {content}
            </a>
          ) : (
            <div key={`${source.name}-${idx}`}>{content}</div>
          );
        })}
      </div>
      {sources.length > 6 && <p className="text-xs text-white/45 font-mono">+{sources.length - 6} more sources</p>}
    </div>
  );
}

export default function SequentialFourLayerHUD({
  sequentialState,
  layers = {},
  inputType = "url",
  onRetry,
  onReset,
  className = "",
}) {
  const {
    state,
    activeLayer,
    layerResults = {},
    finalVerdict,
    error,
    skippedLayers = {},
  } = sequentialState;

  const [techModalOpen, setTechModalOpen] = useState(false);

  // Derive consolidated results
  const l1Result = layerResults.layer1 || layers.layer1;
  const l2Result = layerResults.layer2 || layers.layer2B || layers.layer2A;
  const l3Result = layerResults.layer3 || layers.layer3;
  const l4Result = layerResults.layer4 || layers.layer4 || finalVerdict;

  // Layer 1 derivation
  const { checks: l1Checks, totalCount: l1TotalCount } = deriveTechnicalChecks(l1Result, inputType);
  const l1KeyChecks = l1Checks.filter((c) => c.isKey).slice(0, 5);
  const rawL1Conf = typeof l1Result?.confidence === "number" ? l1Result.confidence : null;
  const l1Confidence = rawL1Conf !== null ? Math.round(rawL1Conf * 100) : null;
  const l1Verdict = l1Result?.status === "BLOCK"
    ? "HIGH RISK"
    : l1Result?.status === "SUSPICIOUS"
    ? "MEDIUM RISK"
    : l1Result?.status === "PASS"
    ? "LOW RISK"
    : "UNKNOWN";
  const l1BadgeStyle = getVerdictBadgeStyle(l1Verdict);

  // Layer 2 derivation
  const l2ProviderName =
    l2Result?.provider ||
    l2Result?.providers?.[0]?.provider ||
    layers.layer2A?.provider ||
    "Google Safe Browsing";
  const l2ProviderStatus = providerStatusFor(l2Result);
  const l2RawVerdict = String(l2Result?.rawVerdict || l2Result?.finding || "UNKNOWN").toUpperCase();
  const l2Verdict = l2RawVerdict.includes("DANGEROUS") || l2RawVerdict.includes("THREAT")
    ? "DANGEROUS"
    : l2RawVerdict.includes("SUSPICIOUS")
    ? "SUSPICIOUS"
    : ["SAFE", "PASS", "CLEAN", "NO_KNOWN_THREAT"].some((value) => l2RawVerdict.includes(value)) && l2ProviderStatus === "SUCCESS"
    ? "SAFE"
    : "UNKNOWN";
  const rawL2Conf = typeof (l2Result?.confidence ?? l2Result?.assessmentConfidence) === "number"
    ? (l2Result.confidence ?? l2Result.assessmentConfidence)
    : null;
  const l2Confidence = rawL2Conf !== null ? Math.round(rawL2Conf * 100) : null;
  const l2Finding = l2Result?.reason || l2Result?.message || (l2ProviderStatus === "UNKNOWN" ? "No Layer 2 provider result was returned." : `Layer 2 provider status: ${l2ProviderStatus}.`);
  const l2BadgeStyle = getVerdictBadgeStyle(l2Verdict);

  // Layer 3 derivation
  const l3ProviderStatus = providerStatusFor(l3Result);
  const l3RawVerdict = String(l3Result?.rawVerdict || l3Result?.truthStatus || l3Result?.finding || "UNKNOWN").toUpperCase();
  const l3Verdict = l3RawVerdict.includes("SUPPORTED") || l3RawVerdict === "TRUE" ? "SUPPORTED" : l3RawVerdict.includes("CONTRAD") || l3RawVerdict === "FALSE" ? "CONTRADICTED" : l3RawVerdict.includes("MIXED") ? "MIXED" : l3RawVerdict.includes("INSUFFICIENT") ? "INSUFFICIENT" : "UNKNOWN";
  const l3Reason = l3Result?.reason || l3Result?.message || l3Result?.legacyIntegration?.reason || "No determinate Layer 3 finding was returned.";
  const l3Sources = normalizeSourceItems(l3Result?.sources || l3Result?.evidence || l3Result?.legacyIntegration?.sources);
  const l3Evidence = normalizeSourceItems(l3Result?.evidence || l3Result?.evidenceItems);
  const l3SourceCount = l3Sources.length;

  // Layer 4 sources must be independent from Layer 3 retrieval results.
  const l4Sources = normalizeSourceItems(l4Result?.independentResearchSources || l4Result?.sources || l4Result?.legacyIntegration?.sources);
  const l4ContradictoryEvidence = Array.isArray(l4Result?.contradictoryEvidence) ? l4Result.contradictoryEvidence : [];

  // Layer 4 derivation (Heroic Final Result)
  const l4ProviderStatus = providerStatusFor(l4Result);
  const l4RawVerdict = String(
    l4Result?.rawVerdict ||
    l4Result?.truthStatus ||
    finalVerdict?.truth ||
    finalVerdict?.l4Decision?.verdict ||
    "UNKNOWN"
  ).toUpperCase();
  const l4IsSafe = ["TRUE", "SAFE", "SUPPORTED", "VERIFIED_TRUE", "CLEAN"].some((k) => l4RawVerdict.includes(k));
  const l4IsDanger = ["FALSE", "FAKE", "MALICIOUS", "DANGEROUS", "CONTRADICTED"].some((k) => l4RawVerdict.includes(k));
  const l4FinalDisplayVerdict = l4IsSafe ? "TRUE" : l4IsDanger ? "FALSE" : "UNKNOWN";

  const rawL4Conf = typeof (l4Result?.assessmentConfidence ?? l4Result?.confidence ?? finalVerdict?.l4Decision?.confidence) === "number"
    ? (l4Result?.assessmentConfidence ?? l4Result?.confidence ?? finalVerdict?.l4Decision?.confidence)
    : null;
  const l4FinalConfidence = rawL4Conf !== null ? Math.round(rawL4Conf * 100) : null;

  const rawL4Agreement = typeof l4Result?.evidenceAgreement === "number" ? l4Result.evidenceAgreement : null;
  const l4EvidenceAgreement = rawL4Agreement !== null ? Math.round(rawL4Agreement * 100) : null;

  const rawL4Quality = typeof l4Result?.sourceQuality === "number" ? l4Result.sourceQuality : null;
  const l4SourceQuality = rawL4Quality !== null ? Math.round(rawL4Quality * 100) : null;

  const l4AiModel =
    l4Result?.groqModel ||
    l4Result?.geminiModel ||
    finalVerdict?.actualModel ||
    null;

  const l4HeroStyle = l4IsSafe
    ? {
        border: "border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]",
        text: "text-emerald-400",
        bg: "bg-emerald-950/20",
      }
    : l4IsDanger
    ? {
        border: "border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.2)]",
        text: "text-rose-400",
        bg: "bg-rose-950/20",
      }
    : {
        border: "border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]",
        text: "text-amber-400",
        bg: "bg-amber-950/20",
      };

  // Status for each layer
  const l1Status = getLayerDisplayStatus(state, 1, layerResults, skippedLayers);
  const l2Status = getLayerDisplayStatus(state, 2, layerResults, skippedLayers);
  const l3Status = getLayerDisplayStatus(state, 3, layerResults, skippedLayers);
  const l4Status = getLayerDisplayStatus(state, 4, layerResults, skippedLayers);

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${className}`} aria-label="Sequential 4-Layer Investigation Report">
      {/* 0. Minimalist Stepper Header */}
      <div className="flex items-center justify-between px-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-white/50">
          <Layers size={14} className="text-[#34d399]" />
          <span className="tracking-widest uppercase font-bold text-white/70">INVESTIGATION PIPELINE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">STATUS:</span>
          <span className="text-white/90 font-bold uppercase">{state}</span>
        </div>
      </div>

      {/* Error Boundary Banner if any layer failed */}
      {error && (
        <div
          className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">
                Sự cố kiểm tra tại Lớp {error.layer || activeLayer}: {error.code}
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5">{error.message}</p>
            </div>
          </div>
          {error.retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-md shrink-0"
            >
              <RotateCcw size={14} /> Thử lại
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          LAYER 1: TECHNICAL SCAN
          ========================================================================= */}
      {(l1Status !== LAYER_STATUS.PENDING || activeLayer === 1) && (
        <article className="rounded-2xl border border-white/10 bg-[#0c0f17]/90 backdrop-blur-2xl p-6 shadow-xl transition-all duration-300">
          {/* Layer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-white/40">01</span>
              <h3 className="text-base font-bold text-white tracking-wide uppercase">TECHNICAL SCAN</h3>
            </div>
            {l1Status === LAYER_STATUS.COMPLETED ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <Check size={14} className="stroke-[3]" /> Complete
              </span>
            ) : l1Status === LAYER_STATUS.RUNNING ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-mono animate-pulse">
                <LoaderCircle size={14} className="animate-spin" /> Scanning vectors...
              </span>
            ) : l1Status === LAYER_STATUS.SKIPPED ? (
              <span className="text-xs font-semibold text-white/45 font-mono">Skipped</span>
            ) : null}
          </div>

          {/* Running State */}
          {l1Status === LAYER_STATUS.RUNNING && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <LoaderCircle size={32} className="animate-spin text-emerald-400" />
              <p className="text-xs font-mono text-white/70">Đang kiểm tra {l1TotalCount} vector an ninh kỹ thuật...</p>
            </div>
          )}

          {/* Completed State */}
          {l1Status === LAYER_STATUS.COMPLETED && (
            <div className="pt-5 space-y-5">
              {/* Verdict & Percentage */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${l1BadgeStyle.textColor}`}>
                    {l1Verdict}
                  </span>
                </div>
                {l1Confidence !== null && (
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white/90">
                    {l1Confidence}%
                  </div>
                )}
              </div>

              {/* 4–6 Key Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {l1KeyChecks.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-white/80 font-medium">
                    {check.passed === true ? (
                      <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" />
                    ) : check.passed === false ? (
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    ) : (
                      <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>
                    )}
                    <span>{check.name}<span className="ml-1.5 text-white/40 font-mono">({check.status})</span></span>
                  </div>
                ))}
              </div>

              {/* Checks Completed Trigger & Next Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
                <button
                  type="button"
                  onClick={() => setTechModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-mono text-xs transition-colors cursor-pointer group"
                >
                  <span className="font-bold text-emerald-400">{l1TotalCount} checks reported</span>
                  <ChevronRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="flex items-center gap-1.5 text-white/40 font-mono text-xs">
                  <span>Continue</span>
                  <ArrowRight size={13} className="text-white/60" />
                  <span className="text-white/70 font-semibold">Layer 2</span>
                </div>
              </div>
            </div>
          )}
        </article>
      )}

      {/* =========================================================================
          LAYER 2: SECURITY PROVIDER
          ========================================================================= */}
      {(l2Status !== LAYER_STATUS.PENDING || activeLayer === 2) && (
        <article className="rounded-2xl border border-white/10 bg-[#0c0f17]/90 backdrop-blur-2xl p-6 shadow-xl transition-all duration-300">
          {/* Layer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-white/40">02</span>
              <h3 className="text-base font-bold text-white tracking-wide uppercase">SECURITY PROVIDER</h3>
            </div>
            {l2Status === LAYER_STATUS.COMPLETED ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <Check size={14} className="stroke-[3]" /> Complete
              </span>
            ) : l2Status === LAYER_STATUS.RUNNING ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-mono animate-pulse">
                <LoaderCircle size={14} className="animate-spin" /> Querying threat database...
              </span>
            ) : l2Status === LAYER_STATUS.SKIPPED ? (
              <span className="text-xs font-semibold text-white/45 font-mono">Skipped</span>
            ) : null}
          </div>

          {/* Running State */}
          {l2Status === LAYER_STATUS.RUNNING && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <LoaderCircle size={32} className="animate-spin text-cyan-400" />
              <p className="text-xs font-mono text-white/70">Đang đối soát an toàn với {l2ProviderName}...</p>
            </div>
          )}

          {l2Status === LAYER_STATUS.SKIPPED && (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-semibold text-white/75">Layer 2 was skipped by the server policy.</p>
              <p className="text-xs text-white/45">No provider result is available for this layer.</p>
            </div>
          )}

          {/* Completed State */}
          {l2Status === LAYER_STATUS.COMPLETED && (
            <div className="pt-5 space-y-5">
              {/* Provider Identifier */}
              <div className="text-xs font-mono tracking-wider uppercase text-white/50">
                {l2ProviderName}
              </div>

              {/* Verdict & Percentage */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${l2BadgeStyle.textColor}`}>
                    {l2Verdict}
                  </span>
                </div>
                {l2Confidence !== null && (
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white/90">
                    {l2Confidence}%
                  </div>
                )}
              </div>

              {/* Prose Finding */}
              <p className="text-sm text-white/80 leading-relaxed">
                {l2Finding}
              </p>

              {/* Checklist */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                  {l2ProviderStatus === "SUCCESS" ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <AlertTriangle size={14} className="text-amber-400 shrink-0" />}
                  <span>Provider status: {l2ProviderStatus}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                  {l2Result?.latencyMs !== null && l2Result?.latencyMs !== undefined ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>{l2Result?.latencyMs !== null && l2Result?.latencyMs !== undefined ? "Provider response received" : "Provider latency not reported"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                  {l2Verdict === "SAFE" || l2Verdict === "DANGEROUS" ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Finding: {l2Verdict}</span>
                </div>
              </div>

              {/* Continuation */}
              <div className="flex items-center justify-end pt-3 border-t border-white/5 text-xs">
                <div className="flex items-center gap-1.5 text-white/40 font-mono text-xs">
                  <span>{l2Verdict === "DANGEROUS" ? "Stopped" : "Continue"}</span>
                  {l2Verdict !== "DANGEROUS" && <ArrowRight size={13} className="text-white/60" />}
                  {l2Verdict !== "DANGEROUS" && <span className="text-white/70 font-semibold">Layer 3</span>}
                </div>
              </div>
            </div>
          )}
        </article>
      )}

      {/* =========================================================================
          LAYER 3: WEB EVIDENCE
          ========================================================================= */}
      {(l3Status !== LAYER_STATUS.PENDING || activeLayer === 3) && (
        <article className="rounded-2xl border border-white/10 bg-[#0c0f17]/90 backdrop-blur-2xl p-6 shadow-xl transition-all duration-300">
          {/* Layer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-white/40">03</span>
              <h3 className="text-base font-bold text-white tracking-wide uppercase">WEB EVIDENCE</h3>
            </div>
            {l3Status === LAYER_STATUS.COMPLETED ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <Check size={14} className="stroke-[3]" /> Complete
              </span>
            ) : l3Status === LAYER_STATUS.RUNNING ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-mono animate-pulse">
                <LoaderCircle size={14} className="animate-spin" /> Gathering sources...
              </span>
            ) : l3Status === LAYER_STATUS.SKIPPED ? (
              <span className="text-xs font-semibold text-white/45 font-mono">Skipped</span>
            ) : null}
          </div>

          {/* Running State */}
          {l3Status === LAYER_STATUS.RUNNING && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <LoaderCircle size={32} className="animate-spin text-cyan-400" />
              <p className="text-xs font-mono text-white/70">Đang thu thập và đối chiếu bằng chứng đa nguồn...</p>
            </div>
          )}

          {l3Status === LAYER_STATUS.SKIPPED && (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-semibold text-white/75">Layer 3 was skipped because the server stopped the pipeline.</p>
              <p className="text-xs text-white/45">No web evidence was collected for this run.</p>
            </div>
          )}

          {/* Completed State */}
          {l3Status === LAYER_STATUS.COMPLETED && (
            <div className="pt-5 space-y-5">
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${getVerdictBadgeStyle(l3Verdict).textColor}`}>
                    {l3Verdict}
                  </span>
                  <p className="text-xs text-white/50 mt-1">Provider status: {l3ProviderStatus}</p>
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed">{l3Reason}</p>
              <SourceList title="L3 web evidence" sources={l3Sources} />
              {l3Evidence.length > 0 && <SourceList title="L3 evidence records" sources={l3Evidence} />}

              {/* Continuation */}
              <div className="flex items-center justify-end pt-3 border-t border-white/5 text-xs">
                <div className="flex items-center gap-1.5 text-white/40 font-mono text-xs">
                  <span>{(l3Result?.canContinueToLayer4 === true || l3Result?.legacyIntegration?.canContinueToLayer4 === true) ? "Continue" : "Stopped / no continuation signal"}</span>
                  {(l3Result?.canContinueToLayer4 === true || l3Result?.legacyIntegration?.canContinueToLayer4 === true) && <ArrowRight size={13} className="text-white/60" />}
                  {(l3Result?.canContinueToLayer4 === true || l3Result?.legacyIntegration?.canContinueToLayer4 === true) && <span className="text-white/70 font-semibold">Layer 4</span>}
                </div>
              </div>
            </div>
          )}
        </article>
      )}

      {/* =========================================================================
          LAYER 4: FINAL AI VERIFICATION (HEROIC RESULT)
          ========================================================================= */}
      {(l4Status !== LAYER_STATUS.PENDING || activeLayer === 4) && (
        <article className="rounded-2xl border border-white/15 bg-[#0e121c]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300">
          {/* Layer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-white/40">04</span>
              <h3 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span>🤖</span> FINAL AI VERIFICATION
              </h3>
            </div>
            {l4Status === LAYER_STATUS.COMPLETED ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <Check size={14} className="stroke-[3]" /> Complete
              </span>
            ) : l4Status === LAYER_STATUS.RUNNING ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 font-mono animate-pulse">
                <LoaderCircle size={14} className="animate-spin" /> Synthesizing final judgment...
              </span>
            ) : l4Status === LAYER_STATUS.SKIPPED ? (
              <span className="text-xs font-semibold text-white/45 font-mono">Skipped</span>
            ) : null}
          </div>

          {/* Running State */}
          {l4Status === LAYER_STATUS.RUNNING && (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <LoaderCircle size={40} className="animate-spin text-purple-400" />
              <p className="text-sm font-mono text-white/80">Mô hình AI đang đối soát và tổng hợp kết luận cuối cùng...</p>
            </div>
          )}

          {l4Status === LAYER_STATUS.SKIPPED && (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-white/75">Layer 4 was not run.</p>
              <p className="text-xs text-white/45">The final result remains UNKNOWN unless an earlier hard-stop decision applies.</p>
            </div>
          )}

          {/* Completed State: THE HEROIC RESULT */}
          {l4Status === LAYER_STATUS.COMPLETED && (
            <div className="pt-6 space-y-8">
              {/* Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  {l4Sources.length > 0 ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Additional research {l4Sources.length > 0 ? "reported" : "not reported"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {l4EvidenceAgreement !== null ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Evidence comparison {l4EvidenceAgreement !== null ? "reported" : "not reported"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {l4SourceQuality !== null ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Source quality {l4SourceQuality !== null ? "reported" : "not reported"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {l4ProviderStatus === "SUCCESS" ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <AlertTriangle size={14} className="text-amber-400 shrink-0" />}
                  <span>AI provider: {l4ProviderStatus}</span>
                </div>
              </div>

              {/* ╭──────────────────────────────╮
                  │         FINAL RESULT         │
                  │             TRUE             │
                  │              98%             │
                  ╰──────────────────────────────╯ */}
              <div
                className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border-2 transition-all ${l4HeroStyle.border} ${l4HeroStyle.bg}`}
              >
                <span className="text-xs font-mono font-bold tracking-widest text-white/40 uppercase block mb-3">
                  FINAL RESULT
                </span>

                <div className={`text-5xl sm:text-7xl font-black tracking-tight ${l4HeroStyle.text} mb-2`}>
                  {l4FinalDisplayVerdict}
                </div>

                {l4FinalConfidence !== null && (
                  <div className="text-3xl sm:text-4xl font-mono font-black text-white/90">
                    {l4FinalConfidence}%
                  </div>
                )}
              </div>

              {/* Supporting Metrics: Evidence Agreement & Source Quality */}
              {(l4EvidenceAgreement !== null || l4SourceQuality !== null) && (
                <div className="grid grid-cols-2 gap-4">
                  {l4EvidenceAgreement !== null && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                      <span className="text-xs font-mono text-white/50 block mb-1">Evidence Agreement</span>
                      <strong className="text-xl sm:text-2xl font-mono font-bold text-white/90">
                        {l4EvidenceAgreement}%
                      </strong>
                    </div>
                  )}
                  {l4SourceQuality !== null && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                      <span className="text-xs font-mono text-white/50 block mb-1">Source Quality</span>
                      <strong className="text-xl sm:text-2xl font-mono font-bold text-white/90">
                        {l4SourceQuality}%
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* AI Model Badge (Subtle, smaller than result) */}
              {l4AiModel && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                  <span className="text-white/40 uppercase">AI Model</span>
                  <span className="text-purple-300 font-semibold">{l4AiModel}</span>
                </div>
              )}

              <SourceList title="L4 independent research" sources={l4Sources} />
              {l4ContradictoryEvidence.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-200/80">
                  <span className="font-mono uppercase tracking-wider text-rose-300">Contradictory evidence</span>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {l4ContradictoryEvidence.slice(0, 6).map((item, idx) => <li key={idx}>{typeof item === "string" ? item : item?.summary || item?.details || "Contradictory record"}</li>)}
                  </ul>
                </div>
              )}

              {/* =========================================================================
                  [ ANALYZE ANOTHER ITEM ]
                  ========================================================================= */}
              {onReset && (
                <div className="pt-6 border-t border-white/10 flex justify-center">
                  <button
                    type="button"
                    onClick={onReset}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm sm:text-base tracking-tight shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                  >
                    <RotateCcw size={18} />
                    <span>Analyze another item</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </article>
      )}

      {/* Technical Details Modal */}
      <TechnicalScanDetailsModal
        isOpen={techModalOpen}
        onClose={() => setTechModalOpen(false)}
        checks={l1Checks}
        totalCount={l1TotalCount}
        summary={l1Result?.details?.decisionRationale || "Chỉ các detector có tín hiệu trả về mới được đánh dấu; những kiểm tra không có dữ liệu sẽ hiển thị Not reported."}
      />
    </div>
  );
}
