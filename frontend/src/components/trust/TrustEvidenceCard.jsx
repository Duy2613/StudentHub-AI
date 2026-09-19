"use client";

import React from "react";
import { ExternalLink, Globe, ShieldCheck, CheckCircle2, XCircle, Info, Lock } from "lucide-react";

/**
 * Validates whether a URL is a public safe http/https URL.
 * Strictly forbids javascript:, data:, file:, and malformed targets.
 */
export function isSafePublicUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * TrustEvidenceCard: Canonical shared evidence card component across L2, L3, L4, and L5.
 * Maintains consistent identity, typography, security filtering, and relationship badges.
 */
export default function TrustEvidenceCard({ evidence, compact = false, onSelect = null }) {
  if (!evidence) return null;

  const {
    id,
    title,
    url,
    domain,
    publisher,
    snippet,
    relationship = "context",
    sourceType = "UNKNOWN",
    quality = null,
    independence = null,
    independenceGroup = null,
    publishedAt = null,
    retrievedAt = null,
    provider = null,
  } = evidence;

  const relLower = String(relationship).toLowerCase();
  const isSupporting = relLower.includes("support") || relLower.includes("corrobor");
  const isContradicting = relLower.includes("contrad") || relLower.includes("refut") || relLower.includes("disprove");

  const badgeConfig = isContradicting
    ? {
        label: "CONTRADICTING",
        icon: XCircle,
        className: "bg-rose-500/15 text-rose-300 border-rose-500/40",
      }
    : isSupporting
    ? {
        label: "SUPPORTING",
        icon: CheckCircle2,
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
      }
    : {
        label: "CONTEXT",
        icon: Info,
        className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
      };

  const BadgeIcon = badgeConfig.icon;
  const safeUrl = isSafePublicUrl(url) ? url : null;
  const displayDomain = domain || (safeUrl ? (() => { try { return new URL(safeUrl).hostname; } catch { return ""; } })() : "Nguồn trực tuyến");
  const displayPublisher = publisher || displayDomain;

  return (
    <article
      data-testid="trust-evidence-card"
      data-evidence-id={id || displayDomain}
      className={`relative rounded-lg border border-white/10 bg-black/40 p-3.5 transition-all duration-150 hover:border-white/20 hover:bg-black/60 text-xs text-slate-200 ${
        compact ? "py-2.5 px-3" : ""
      }`}
    >
      {/* Top row: Publisher / Domain + Relationship Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-slate-400">
          <Globe size={13} className="text-slate-400 flex-shrink-0" />
          <span className="font-semibold text-slate-300 truncate">{displayPublisher}</span>
          {displayDomain && displayDomain !== displayPublisher && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 truncate">{displayDomain}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {sourceType && sourceType !== "UNKNOWN" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/10 text-slate-300 bg-white/5 uppercase">
              {sourceType}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${badgeConfig.className}`}
          >
            <BadgeIcon size={11} />
            {badgeConfig.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-1.5">
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:underline leading-snug block line-clamp-2 transition-colors"
          >
            {title || safeUrl}
          </a>
        ) : (
          <h4 className="text-sm font-semibold text-slate-100 leading-snug block line-clamp-2">
            {title || "Bằng chứng đã đối chiếu"}
          </h4>
        )}
      </div>

      {/* Excerpt / Snippet */}
      {snippet && (
        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2 line-clamp-3 bg-white/[0.02] p-2 rounded border border-white/5">
          "{snippet}"
        </p>
      )}

      {/* Meta Row: Quality, Independence, Freshness */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          {(quality || sourceType) && (
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-cyan-400" />
              <span>Chất lượng: <strong className="text-slate-200">{quality || "Chuẩn hoá"}</strong></span>
            </span>
          )}
          {(independence || independenceGroup) && (
            <span>
              Độc lập: <strong className="text-slate-200">{independence || independenceGroup || "Độc lập"}</strong>
            </span>
          )}
          {publishedAt && (
            <span>
              Ngày: <strong className="text-slate-300">{publishedAt}</strong>
            </span>
          )}
        </div>

        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-[11px] ml-auto transition-colors"
          >
            <span>Mở nguồn</span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </article>
  );
}
