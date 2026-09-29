import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, ExternalLink, UserCheck, type LucideIcon } from "lucide-react";

/**
 * StudentHub AI — Canonical Domain Primitives
 *
 * Governing Authority: MASTER FRONTEND CONSTITUTION v3.0 (M-35, M-36, M-37)
 * Semantic, typed APIs adhering to the M-03 Truth Boundary.
 * Visual semantics never invent scores or confuse AI with "verified" (C-09).
 */

// ---------------------------------------------------------------------------
// 1. VerificationState (M-12, M-35, C-09)
// ---------------------------------------------------------------------------
export type VerificationStateType = "VERIFIED" | "INSUFFICIENT" | "CONFLICTING" | "DISPUTED" | "UNVERIFIED";

interface VerificationStateProps {
  state: VerificationStateType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationState({ state, size = "md", className = "" }: VerificationStateProps) {
  const configs: Record<VerificationStateType, { label: string; icon: LucideIcon; toneClass: string }> = {
    VERIFIED: {
      label: "Bằng chứng ủng hộ",
      icon: CheckCircle2,
      toneClass: "bg-[var(--status-mint-bg)] text-[var(--status-mint)] border-[var(--status-mint)]",
    },
    INSUFFICIENT: {
      label: "Chưa đủ bằng chứng",
      icon: AlertTriangle,
      toneClass: "bg-[var(--status-amber-bg)] text-[var(--status-amber)] border-[var(--status-amber)]",
    },
    CONFLICTING: {
      label: "Nguồn tin mâu thuẫn",
      icon: AlertCircle,
      toneClass: "bg-[var(--status-coral-bg)] text-[var(--status-coral)] border-[var(--status-coral)]",
    },
    DISPUTED: {
      label: "Đang tranh cãi",
      icon: AlertTriangle,
      toneClass: "bg-[var(--status-coral-bg)] text-[var(--status-coral)] border-[var(--status-coral)]",
    },
    UNVERIFIED: {
      label: "Chưa qua kiểm chứng",
      icon: AlertCircle,
      toneClass: "bg-white/5 text-[var(--text-secondary)] border-white/10",
    },
  };

  const config = configs[state] || configs.UNVERIFIED;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.toneClass} ${sizeClasses[size]} ${className}`}
      role="status"
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// 2. RiskIndicator (M-12, M-35)
// ---------------------------------------------------------------------------
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface RiskIndicatorProps {
  level: RiskLevel;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RiskIndicator({ level, label, size = "md" }: RiskIndicatorProps) {
  const configs: Record<RiskLevel, { defaultLabel: string; toneClass: string }> = {
    LOW: { defaultLabel: "Rủi ro thấp", toneClass: "text-[var(--status-mint)] bg-[var(--status-mint-bg)] border-[var(--status-mint)]/30" },
    MEDIUM: { defaultLabel: "Cần chú ý", toneClass: "text-[var(--status-amber)] bg-[var(--status-amber-bg)] border-[var(--status-amber)]/30" },
    HIGH: { defaultLabel: "Rủi ro cao", toneClass: "text-[var(--status-coral)] bg-[var(--status-coral-bg)] border-[var(--status-coral)]/30" },
    CRITICAL: { defaultLabel: "Nguy hiểm / Báo động", toneClass: "text-[var(--status-red)] bg-[var(--status-red-bg)] border-[var(--status-red)]/40 font-bold" },
  };

  const config = configs[level] || configs.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs ${config.toneClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      <span>{label || config.defaultLabel}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// 3. EvidenceStrength (M-12, M-35)
// ---------------------------------------------------------------------------
export type EvidenceStrengthGrade = "STRONG" | "MODERATE" | "LIMITED" | "INSUFFICIENT";

interface EvidenceStrengthProps {
  strength: EvidenceStrengthGrade;
}

export function EvidenceStrength({ strength }: EvidenceStrengthProps) {
  const configs: Record<EvidenceStrengthGrade, { label: string; width: string; tone: string }> = {
    STRONG: { label: "Mạnh", width: "w-full", tone: "bg-[var(--status-mint)]" },
    MODERATE: { label: "Trung bình", width: "w-2/3", tone: "bg-[var(--status-mint)]/80" },
    LIMITED: { label: "Hạn chế", width: "w-1/3", tone: "bg-[var(--status-amber)]" },
    INSUFFICIENT: { label: "Chưa đủ", width: "w-1/6", tone: "bg-[var(--status-coral)]" },
  };

  const config = configs[strength] || configs.INSUFFICIENT;

  return (
    <div className="flex flex-col gap-1 w-full max-w-[140px]">
      <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
        <span>Độ mạnh bằng chứng</span>
        <span className="font-semibold text-[var(--text-primary)]">{config.label}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-label="Độ mạnh bằng chứng">
        <div className={`h-full rounded-full ${config.tone} ${config.width} transition-all duration-300`} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. SourceCitation (M-12, M-35)
// ---------------------------------------------------------------------------
interface SourceCitationProps {
  title: string;
  sourceName: string;
  url?: string;
  provenanceTier?: string;
  timestamp?: string;
}

export function SourceCitation({ title, sourceName, url, provenanceTier, timestamp }: SourceCitationProps) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {provenanceTier && (
            <span className="type-tech text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-secondary)]">
              {provenanceTier}
            </span>
          )}
          <span className="text-xs text-[var(--text-secondary)]">{sourceName}</span>
          {timestamp && (
            <span className="type-tech text-[10px] text-[var(--text-tertiary)]">
              {timestamp}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          aria-label={`Mở nguồn: ${title}`}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. TrustConclusion (M-12, M-13)
// ---------------------------------------------------------------------------
interface TrustConclusionProps {
  verdictTitle: string;
  reasoningSummary: string;
  verificationState: VerificationStateType;
  nextAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function TrustConclusion({ verdictTitle, reasoningSummary, verificationState, nextAction }: TrustConclusionProps) {
  return (
    <div className="p-6 md:p-8 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-default)] shadow-[var(--elevation-2)] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="type-tech text-xs tracking-wider uppercase text-[var(--text-tertiary)]">
          KẾT LUẬN KIỂM CHỨNG
        </span>
        <VerificationState state={verificationState} size="md" />
      </div>

      <div className="space-y-2">
        <h2 className="type-h2 text-[var(--text-primary)] font-[family-name:var(--font-editorial)]">
          {verdictTitle}
        </h2>
        <p className="type-body text-[var(--text-secondary)] reading-measure">
          {reasoningSummary}
        </p>
      </div>

      {nextAction && (
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">Bước tiếp theo gợi ý:</span>
          {nextAction.href ? (
            <a
              href={nextAction.href}
              className="ui-button ui-button-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--action-primary)] text-white hover:opacity-90 transition-opacity"
            >
              {nextAction.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={nextAction.onClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--action-primary)] text-white hover:opacity-90 transition-opacity"
            >
              {nextAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. ExpertCredential (M-15)
// ---------------------------------------------------------------------------
interface ExpertCredentialProps {
  fullName: string;
  domain: string;
  scopeAllowed: string[];
  scopeExcluded?: string[];
  organization?: string;
}

export function ExpertCredential({ fullName, domain, scopeAllowed, scopeExcluded, organization }: ExpertCredentialProps) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-primary)]">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="type-title text-[var(--text-primary)]">{fullName}</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {domain} {organization && `· ${organization}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-[var(--border-subtle)]">
        <div>
          <span className="font-semibold text-[var(--status-mint)] block mb-1">
            ✓ Có thẩm quyền đánh giá:
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)]">
            {scopeAllowed.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {scopeExcluded && scopeExcluded.length > 0 && (
          <div>
            <span className="font-semibold text-[var(--status-coral)] block mb-1">
              ✕ Ngoài phạm vi chuyên môn:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)]">
              {scopeExcluded.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. LearningProgress (M-11, M-35)
// ---------------------------------------------------------------------------
interface LearningProgressProps {
  courseName: string;
  currentLesson: string;
  completedLessons: number;
  totalLessons: number;
  continueRoute: string;
}

export function LearningProgress({
  courseName,
  currentLesson,
  completedLessons,
  totalLessons,
  continueRoute,
}: LearningProgressProps) {
  const percentage = Math.round((completedLessons / Math.max(1, totalLessons)) * 100);

  return (
    <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="type-tech text-[10px] uppercase text-[var(--text-tertiary)]">
            HỌC TẬP HIỆN TẠI
          </span>
          <h3 className="type-title text-[var(--text-primary)]">{courseName}</h3>
          <p className="text-xs text-[var(--text-secondary)]">Đang học: {currentLesson}</p>
        </div>
        <span className="type-tech text-sm font-semibold text-[var(--action-primary)]">
          {percentage}%
        </span>
      </div>

      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="bg-[var(--action-primary)] h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--text-secondary)]">
          {completedLessons}/{totalLessons} bài học hoàn tất
        </span>
        <a
          href={continueRoute}
          className="inline-flex items-center gap-1 font-semibold text-[var(--action-primary)] hover:underline"
        >
          Tiếp tục học →
        </a>
      </div>
    </div>
  );
}
