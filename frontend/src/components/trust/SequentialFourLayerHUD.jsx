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
      status: matched ? flagLabel : "No signal",
      passed: matched ? false : null,
      isKey,
    };
  };

  const checks = inputType === "url"
    ? [
        flaggedCheck("HTTP / HTTPS transport", ["unencrypted_transport"], "Unencrypted HTTP", true),
        flaggedCheck("Domain & TLD", ["suspicious_tld", "invalid_domain"], "Suspicious", true),
        flaggedCheck("Redirect chain", ["shortened_url"], "Shortener flagged", true),
        flaggedCheck("Keyword / lure scan", ["phishing_keywords", "scam_lure"], "Lures detected", true),
        flaggedCheck("Exposed key scan", ["exposed_key_pattern"], "Token exposed", true),
        flaggedCheck("Credential parameters", ["credential_param"], "Detected"),
        flaggedCheck("Homoglyph / Punycode", ["homoglyph_attack", "punycode_spoof"], "Spoofing flagged"),
        flaggedCheck("SSRF / IP guard", ["ssrf_ip_format", "loopback_target"], "Blocked"),
        flaggedCheck("Userinfo spoofing", ["userinfo_spoofing"], "Detected"),
        flaggedCheck("Executable extension", ["executable_extension"], "Dangerous extension"),
        flaggedCheck("Payload size bounds", ["payload_limit_exceeded"], "Exceeded limit"),
        flaggedCheck("Domain authority", ["domain_authority_verified"], "Verified"),
      ]
    : inputType === "image" || inputType === "qr" || inputType === "file"
    ? [
        flaggedCheck("MIME & format validation", ["invalid_mime", "unsupported_format"], "Invalid format", true),
        flaggedCheck("Payload size bounds", ["oversized_file", "payload_limit_exceeded"], "Exceeded", true),
        flaggedCheck("OCR text normalization", ["ocr_failed"], "Extraction failed", true),
        flaggedCheck("QR matrix decoding", ["qr_decode_failed"], "Decode failed", true),
        flaggedCheck("Keyword / lure scan", ["phishing_keywords", "scam_lure"], "Lures detected", true),
        flaggedCheck("Exposed key scan", ["exposed_key_pattern"], "Token exposed"),
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
        flaggedCheck("Exposed key scan", ["exposed_key_pattern"], "Token exposed", true),
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

function percentValue(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const normalized = value > 1 ? value / 100 : value;
  if (normalized < 0 || normalized > 1) return null;
  return Math.round(normalized * 100);
}

function normalizeSourceItems(items) {
  const values = Array.isArray(items) ? items : [];
  const normalized = values.map((item, idx) => {
    const source = typeof item === "string" ? { title: item } : item || {};
    const stance = String(source.stance || source.status || source.verdict || "NEUTRAL").toUpperCase();
    const url = source.url || source.sourceUrl || null;
    return {
      name: source.publisher || source.title || source.domain || source.sourceTitle || source.sourceId || source.sourceName || url || `Source ${idx + 1}`,
      stance: stance.includes("SUPPORT") || stance.includes("VERIF") || stance === "TRUE" ? "Supports" : stance.includes("REFUT") || stance.includes("CONTRAD") || stance === "FALSE" ? "Refutes" : "Neutral",
      quality: String(source.authorityTier || "").toUpperCase().includes("HIGH") || (typeof source.confidence === "number" && source.confidence >= 0.8) ? "High" : "Standard",
      url,
      origin: source.origin || source.sourceType || source.provider || null,
    };
  });
  return normalized.filter((source, index, list) => list.findIndex((item) => `${item.name}|${item.url || ""}` === `${source.name}|${source.url || ""}`) === index);
}

function SourceList({ title, sources, limit = 5 }) {
  if (!sources.length) {
    return <p className="text-xs text-white/45">No sources returned.</p>;
  }

  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
        {title} ({sources.length})
      </span>
      <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-black/30">
        {sources.slice(0, limit).map((source, idx) => {
          const content = (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
              <span className="min-w-0 truncate font-semibold text-white/85" title={source.url || source.name}>{source.name}</span>
              <span className={source.stance === "Supports" ? "shrink-0 text-emerald-400" : source.stance === "Refutes" ? "shrink-0 text-rose-400" : "shrink-0 text-white/40"}>
                {source.stance}
              </span>
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
      {sources.length > limit && <p className="text-xs font-mono text-white/45">+{sources.length - limit} more sources</p>}
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

  // Layer 2 derivation. The canonical response keeps the adapter name at the
  // top level and the real provider observation inside providerResults.
  const l2ProviderResults = Array.isArray(l2Result?.providerResults) ? l2Result.providerResults : Array.isArray(l2Result?.providers) ? l2Result.providers : [];
  const l2ProviderResult =
    l2ProviderResults.find((item) => item && typeof item === "object") ||
    null;
  const l2ProviderName =
    l2ProviderResult?.provider ||
    l2Result?.providerName ||
    (String(l2Result?.provider || "").toLowerCase().includes("google") ? l2Result.provider : null) ||
    "Google Safe Browsing";
  const l2ProviderStatus = String(
    l2ProviderResult?.providerStatus ||
    l2ProviderResult?.status ||
    providerStatusFor(l2Result)
  ).toUpperCase();
  const l2ProviderHealthy = l2ProviderResult?.success === true || l2ProviderStatus === "SUCCESS";
  const l2RawVerdict = String(
    l2ProviderResult?.rawVerdict ||
    l2ProviderResult?.verdict ||
    l2Result?.rawVerdict ||
    l2Result?.verdict ||
    l2Result?.finding ||
    "UNKNOWN"
  ).toUpperCase();
  const l2Verdict = l2RawVerdict.includes("DANGEROUS") || l2RawVerdict.includes("THREAT")
    ? "DANGEROUS"
    : l2RawVerdict.includes("SUSPICIOUS")
    ? "SUSPICIOUS"
    : ["SAFE", "PASS", "CLEAN", "NO_KNOWN_THREAT"].some((value) => l2RawVerdict.includes(value)) && l2ProviderHealthy
    ? "SAFE"
    : "UNKNOWN";
  const rawL2Conf = typeof (l2ProviderResult?.confidence ?? l2Result?.providerConfidence ?? l2Result?.confidence ?? l2Result?.assessmentConfidence) === "number"
    ? (l2ProviderResult?.confidence ?? l2Result?.providerConfidence ?? l2Result?.confidence ?? l2Result?.assessmentConfidence)
    : null;
  const l2Confidence = percentValue(rawL2Conf);
  const l2Finding = l2ProviderResult?.message || l2ProviderResult?.reason || l2Result?.reason || l2Result?.message || (l2Verdict === "SAFE"
    ? "No known Safe Browsing threat was returned."
    : l2ProviderStatus === "UNKNOWN"
    ? "No Layer 2 provider result was returned."
    : `Layer 2 provider status: ${l2ProviderStatus}.`);
  const l2BadgeStyle = getVerdictBadgeStyle(l2Verdict);

  // Layer 3 derivation
  const l3RawVerdict = String(l3Result?.rawVerdict || l3Result?.truthStatus || l3Result?.finding || "UNKNOWN").toUpperCase();
  const l3Verdict = l3RawVerdict.includes("SUPPORTED") || l3RawVerdict === "TRUE" || l3RawVerdict.includes("VERIFIED_TRUE") ? "SUPPORTED" : l3RawVerdict.includes("CONTRAD") || l3RawVerdict === "FALSE" ? "CONTRADICTED" : l3RawVerdict.includes("MIXED") ? "MIXED" : l3RawVerdict.includes("INSUFFICIENT") ? "INSUFFICIENT" : "UNKNOWN";
  const l3Reason = l3Result?.reason || l3Result?.message || l3Result?.legacyIntegration?.reason || "No determinate Layer 3 finding was returned.";
  const l3Sources = normalizeSourceItems(l3Result?.sources?.length ? l3Result.sources : l3Result?.evidence?.length ? l3Result.evidence : l3Result?.evidenceItems || l3Result?.legacyIntegration?.sources);
  const l3SourceCount = l3Sources.length;

  // Layer 4 sources must be independent from Layer 3 retrieval results.
  const l4Sources = normalizeSourceItems(l4Result?.independentResearchSources || l4Result?.sources || l4Result?.legacyIntegration?.sources);
  const l4ContradictoryEvidence = Array.isArray(l4Result?.contradictoryEvidence) ? l4Result.contradictoryEvidence : [];

  // Layer 4 derivation (Heroic Final Result)
  const l4ProviderStatus = providerStatusFor(l4Result);
  const l4RawVerdict = String(
    l4Result?.rawVerdict ||
    l4Result?.verdict ||
    l4Result?.truthStatus ||
    l4Result?.securityClassification ||
    finalVerdict?.truth ||
    finalVerdict?.l4Decision?.verdict ||
    "UNKNOWN"
  ).toUpperCase();
  const l4IsSafe = ["TRUE", "SAFE", "SUPPORTED", "VERIFIED_TRUE", "NO_KNOWN_THREAT", "CLEAN"].some((k) => l4RawVerdict.includes(k));
  const l4IsDanger = ["FALSE", "FAKE", "MALICIOUS", "DANGEROUS", "CONTRADICTED"].some((k) => l4RawVerdict.includes(k));
  const l4FinalDisplayVerdict = l4IsSafe ? "TRUE" : l4IsDanger ? "FALSE" : "UNKNOWN";

  const rawL4Conf = typeof (l4Result?.assessmentConfidence ?? l4Result?.confidence ?? l4Result?.providerConfidence ?? finalVerdict?.l4Decision?.confidence) === "number"
    ? (l4Result?.assessmentConfidence ?? l4Result?.confidence ?? l4Result?.providerConfidence ?? finalVerdict?.l4Decision?.confidence)
    : null;
  const l4FinalConfidence = percentValue(rawL4Conf);

  const rawL4Agreement = typeof l4Result?.evidenceAgreement === "number" ? l4Result.evidenceAgreement : null;
  const l4EvidenceAgreement = rawL4Agreement !== null ? Math.round(rawL4Agreement * 100) : null;

  const rawL4Quality = typeof l4Result?.sourceQuality === "number" ? l4Result.sourceQuality : null;
  const l4SourceQuality = rawL4Quality !== null ? Math.round(rawL4Quality * 100) : null;

  const l4AiModel =
    l4Result?.groqModel ||
    l4Result?.geminiModel ||
    l4Result?.model ||
    l4Result?.providerId ||
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
            <div className="pt-4 space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-2.5">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Provider</span>
                  <strong className="mt-1 block truncate text-sm font-semibold text-white/90" title={l2ProviderName}>{l2ProviderName}</strong>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-2.5">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Status</span>
                  <strong className={`mt-1 block text-sm font-black ${l2BadgeStyle.textColor}`}>{l2Verdict}</strong>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-2.5">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Confidence</span>
                  <strong className="mt-1 block text-sm font-black text-white/90">{l2Confidence !== null ? `${l2Confidence}%` : "—"}</strong>
                </div>
              </div>

              <p className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-xs leading-relaxed text-white/70">
                {l2Finding}
              </p>

              <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 text-xs">
                <span className="font-mono text-white/40">Result</span>
                <div className={`flex items-center gap-1.5 font-semibold ${l2Verdict === "SAFE" ? "text-emerald-300" : l2Verdict === "DANGEROUS" ? "text-rose-300" : "text-amber-200"}`}>
                  <span>{l2Verdict === "SAFE" ? "Safe to continue" : l2Verdict === "DANGEROUS" ? "Pipeline stopped" : "Continue with caution"}</span>
                  {l2Verdict !== "DANGEROUS" && <ArrowRight size={13} aria-hidden="true" />}
                  {l2Verdict !== "DANGEROUS" && <span>Layer 3</span>}
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
            <div className="pt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-white/70">Web Evidence</span>
                <ArrowRight size={13} className="text-white/35" aria-hidden="true" />
                <span className="text-cyan-300">🔎 Tavily searching</span>
                <ArrowRight size={13} className="text-white/35" aria-hidden="true" />
                <span className="text-emerald-300">✓ Evidence collected</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-2.5">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Sources</span>
                  <strong className="mt-1 block text-sm font-black text-white/90">{l3SourceCount} nguồn kiểm chứng</strong>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-2.5">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Finding</span>
                  <strong className={`mt-1 block text-sm font-black ${getVerdictBadgeStyle(l3Verdict).textColor}`}>{l3Verdict}</strong>
                </div>
              </div>

              <SourceList title="Sources" sources={l3Sources} limit={4} />
              <p className="text-xs leading-relaxed text-white/50">{l3Reason}</p>

              <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 text-xs">
                <span className="font-mono text-white/40">Result</span>
                {(l3Result?.canContinueToLayer4 === true || l3Result?.legacyIntegration?.canContinueToLayer4 === true) ? (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-300"><span>Continue</span><ArrowRight size={13} aria-hidden="true" /><span>Layer 4</span></span>
                ) : (
                  <span className="font-semibold text-amber-200">Layer 4 not authorized</span>
                )}
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
            <div className="pt-4 space-y-4">
              {/* Checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-white/75 sm:grid-cols-4">
                <div className="flex items-center gap-2">
                  {l4Sources.length > 0 ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Additional research</span>
                </div>
                <div className="flex items-center gap-2">
                  {l4EvidenceAgreement !== null ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Evidence comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  {l4SourceQuality !== null ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <span className="w-[14px] text-center text-white/35 font-bold shrink-0">?</span>}
                  <span>Source quality</span>
                </div>
                <div className="flex items-center gap-2">
                  {l4ProviderStatus === "SUCCESS" ? <Check size={14} className="text-emerald-400 stroke-[3] shrink-0" /> : <AlertTriangle size={14} className="text-amber-400 shrink-0" />}
                  <span>AI verification</span>
                </div>
              </div>

              {/* ╭──────────────────────────────╮
                  │         FINAL RESULT         │
                  │             TRUE             │
                  │              98%             │
                  ╰──────────────────────────────╯ */}
              <div
                className={`relative overflow-hidden rounded-2xl border-2 p-5 text-center transition-all sm:p-7 ${l4HeroStyle.border} ${l4HeroStyle.bg}`}
              >
                <span className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
                  FINAL RESULT
                </span>

                <div className={`mb-1 text-4xl font-black tracking-tight sm:text-5xl ${l4HeroStyle.text}`}>
                  {l4FinalDisplayVerdict}
                </div>

                {l4FinalConfidence !== null && (
                  <div className="text-2xl font-mono font-black text-white/90">
                    {l4FinalConfidence}%
                  </div>
                )}
              </div>

              {/* Supporting Metrics: Evidence Agreement & Source Quality */}
              {(l4EvidenceAgreement !== null || l4SourceQuality !== null) && (
                <div className="grid grid-cols-2 gap-2">
                  {l4EvidenceAgreement !== null && (
                    <div className="rounded-xl border border-white/5 bg-black/40 p-3 text-center">
                      <span className="mb-1 block text-[10px] font-mono text-white/50">Evidence Agreement</span>
                      <strong className="text-lg font-mono font-bold text-white/90 sm:text-xl">
                        {l4EvidenceAgreement}%
                      </strong>
                    </div>
                  )}
                  {l4SourceQuality !== null && (
                    <div className="rounded-xl border border-white/5 bg-black/40 p-3 text-center">
                      <span className="mb-1 block text-[10px] font-mono text-white/50">Source Quality</span>
                      <strong className="text-lg font-mono font-bold text-white/90 sm:text-xl">
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

              <SourceList title="Sources" sources={l4Sources} limit={4} />
              {l4ContradictoryEvidence.length > 0 && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-200/80">
                  <span className="font-mono uppercase tracking-wider text-rose-300">Contradictory evidence</span>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {l4ContradictoryEvidence.slice(0, 3).map((item, idx) => <li key={idx}>{typeof item === "string" ? item : item?.summary || item?.details || "Contradictory record"}</li>)}
                  </ul>
                </div>
              )}

              {/* =========================================================================
                  [ ANALYZE ANOTHER ITEM ]
                  ========================================================================= */}
              {onReset && (
                <div className="flex justify-center border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={onReset}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3 text-sm font-extrabold tracking-tight text-slate-950 shadow-xl transition-all duration-200 hover:from-emerald-400 hover:to-cyan-400 hover:shadow-2xl active:scale-[0.99] sm:w-auto sm:text-base"
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
        summary={l1Result?.details?.decisionRationale || "Các detector được giữ theo kết quả thực tế; mục không có cảnh báo hiển thị No signal, không phải chứng nhận an toàn tuyệt đối."}
      />
    </div>
  );
}
