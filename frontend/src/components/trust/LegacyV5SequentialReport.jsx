"use client";

import React from "react";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Layers,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";

const V5_LAYER_DEFINITIONS = Object.freeze([
  {
    id: "l1",
    number: "01",
    title: "Deterministic Screen",
    description: "Quét kỹ thuật cục bộ",
    stageIds: ["l1"],
  },
  {
    id: "l2",
    number: "02",
    title: "Threat & Semantic Intelligence",
    description: "Threat, semantic và StudentHub domain",
    stageIds: ["l2a", "l2b", "l2c"],
  },
  {
    id: "l3",
    number: "03",
    title: "Evidence & Provenance",
    description: "Đối chiếu bằng chứng đa nguồn",
    stageIds: ["l3"],
  },
  {
    id: "l4",
    number: "04",
    title: "Synthesis & Reasoning",
    description: "Policy và kết luận cuối",
    stageIds: ["l4"],
  },
  {
    id: "l5",
    number: "05",
    title: "Assurance Audit",
    description: "Kiểm tra độ chắc và failure boundary",
    stageIds: ["l5"],
  },
]);

const L2_SUBSTAGE_LABELS = Object.freeze({
  l2a: "L2A · Threat",
  l2b: "L2B · Semantic",
  l2c: "L2C · StudentHub",
});

const STATUS_LABELS = Object.freeze({
  NOT_STARTED: "WAITING",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  COMPLETED: "DONE",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
  BLOCKED: "BLOCKED",
});

const CRITICAL_FINDINGS = new Set([
  "LOCAL_BLOCK",
  "THREAT_MATCH",
  "MALICIOUS",
  "DANGEROUS",
  "CONTRADICTED",
]);

function upper(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function readable(value, fallback = "UNKNOWN") {
  const text = upper(value).replaceAll("_", " ");
  return text || fallback;
}

function shortText(value, fallback = "Chưa có mô tả được công bố.") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const text = value.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

function resultStatus(result) {
  if (!result || typeof result !== "object") return "NOT_STARTED";
  const status = upper(result.operationStatus || result.status);
  if (["RUNNING", "QUEUED", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED", "BLOCKED"].includes(status)) return status;
  if (status === "AVAILABLE") return "COMPLETED";
  if (["ERROR", "UNAVAILABLE"].includes(status)) return "FAILED";
  return "COMPLETED";
}

function resultFinding(result) {
  if (!result || typeof result !== "object") return null;
  return result.finding || result.rawVerdict || result.verdict || result.truthStatus || result.status || null;
}

function fallbackStages(layers = {}, processing = false) {
  const hasLayer2A = Boolean(layers.layer2A);
  return {
    l1: layers.layer1 ? { ...layers.layer1, operationStatus: resultStatus(layers.layer1) } : null,
    l2a: (layers.layer2A || (!hasLayer2A ? layers.layer2 : null))
      ? { ...(layers.layer2A || layers.layer2), operationStatus: resultStatus(layers.layer2A || layers.layer2) }
      : null,
    l2b: hasLayer2A && layers.layer2 ? { ...layers.layer2, operationStatus: resultStatus(layers.layer2) } : null,
    l2c: layers.layer2C ? { ...layers.layer2C, operationStatus: resultStatus(layers.layer2C) } : null,
    l3: layers.layer3 ? { ...layers.layer3, operationStatus: resultStatus(layers.layer3) } : processing ? { operationStatus: "RUNNING" } : null,
    l4: layers.layer4 ? { ...layers.layer4, operationStatus: resultStatus(layers.layer4) } : null,
    l5: null,
  };
}

function pipelineStageMap(pipeline) {
  const candidate = pipeline?.stages;
  if (Array.isArray(candidate)) {
    const mapped = Object.fromEntries(candidate.filter((stage) => stage && typeof stage === "object" && typeof stage.stageId === "string").map((stage) => [stage.stageId, stage]));
    return Object.keys(mapped).length ? mapped : null;
  }
  if (!candidate || typeof candidate !== "object") return null;
  const mapped = Object.fromEntries(Object.entries(candidate).filter(([, stage]) => stage && typeof stage === "object"));
  return Object.keys(mapped).length ? mapped : null;
}

function stageMap(pipeline, layers, processing) {
  return pipelineStageMap(pipeline) || fallbackStages(layers, processing);
}

function effectiveStatus(stage) {
  return upper(stage?.operationStatus) || resultStatus(stage);
}

function statusRank(status) {
  return {
    FAILED: 7,
    BLOCKED: 7,
    RUNNING: 6,
    PARTIAL: 5,
    COMPLETED: 4,
    SKIPPED: 3,
    QUEUED: 2,
    NOT_STARTED: 1,
  }[status] || 0;
}

function groupedStatus(stages, stageIds) {
  const statuses = stageIds.map((id) => effectiveStatus(stages[id]));
  if (statuses.some((status) => ["FAILED", "BLOCKED"].includes(status))) return "FAILED";
  if (statuses.includes("RUNNING")) return "RUNNING";
  if (statuses.includes("PARTIAL")) return "PARTIAL";
  if (statuses.includes("COMPLETED") && statuses.some((status) => ["SKIPPED", "NOT_STARTED"].includes(status))) return "PARTIAL";
  return statuses.reduce((best, status) => statusRank(status) > statusRank(best) ? status : best, "NOT_STARTED");
}

function findingForStage(stage, finalDecision) {
  return stage?.finding || resultFinding(stage) || finalDecision?.security || null;
}

function sourceCountFor(stageId, stage, pipeline, layers) {
  const layerResultKey = { l1: "layer1", l3: "layer3", l4: "layer4" }[stageId];
  const value = (layerResultKey && (pipeline?.layerResults?.[layerResultKey] || layers?.[layerResultKey])) || stage || {};
  if (stageId === "l3") return (Array.isArray(value.sources) ? value.sources.length : 0) || (Array.isArray(value.evidence) ? value.evidence.length : 0) || (Array.isArray(value.evidenceRefs) ? value.evidenceRefs.length : 0);
  if (stageId === "l4") return Array.isArray(value.independentResearchSources) ? value.independentResearchSources.length : Array.isArray(value.sources) ? value.sources.length : 0;
  if (stageId === "l5") return Array.isArray(pipeline?.assurance?.anomalies) ? pipeline.assurance.anomalies.length : 0;
  return Array.isArray(value.signals) ? value.signals.length : 0;
}

function stageSummary(stage, fallbackFinding, status) {
  if (status === "SKIPPED") return shortText(stage?.summary, "Stage không thuộc nhánh chạy hiện tại.");
  return shortText(stage?.summary || stage?.reason, fallbackFinding ? `Finding: ${readable(fallbackFinding)}.` : undefined);
}

function StatusIcon({ status, critical = false, size = 15 }) {
  if (status === "RUNNING") return <LoaderCircle size={size} className="animate-spin" aria-hidden="true" />;
  if (critical || ["FAILED", "BLOCKED"].includes(status)) return <ShieldAlert size={size} aria-hidden="true" />;
  if (status === "COMPLETED") return <Check size={size} aria-hidden="true" />;
  if (status === "SKIPPED") return <AlertTriangle size={size} aria-hidden="true" />;
  return <CircleHelp size={size} aria-hidden="true" />;
}

function statusTone(status, critical = false) {
  if (critical || ["FAILED", "BLOCKED"].includes(status)) return "text-rose-300 border-rose-500/35 bg-rose-500/10";
  if (status === "RUNNING") return "text-amber-300 border-amber-500/35 bg-amber-500/10";
  if (status === "COMPLETED") return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  if (status === "SKIPPED") return "text-white/45 border-white/10 bg-white/[0.03]";
  if (status === "PARTIAL") return "text-amber-200 border-amber-500/25 bg-amber-500/[0.07]";
  return "text-white/45 border-white/10 bg-white/[0.02]";
}

function StatusPill({ status, critical = false }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-mono font-bold tracking-wider ${statusTone(status, critical)}`}>
      <StatusIcon status={status} critical={critical} size={12} />
      {STATUS_LABELS[status] || readable(status)}
    </span>
  );
}

function V5StageCard({ definition, stage, finalDecision, pipeline, layers }) {
  const status = effectiveStatus(stage);
  const finding = findingForStage(stage, definition.id === "l4" ? finalDecision : null);
  const findingLabel = status === "SKIPPED" ? "SKIPPED" : readable(finding);
  const critical = CRITICAL_FINDINGS.has(upper(finding));
  const sourceCount = sourceCountFor(definition.id, stage, pipeline, layers);

  return (
    <article className={`rounded-2xl border p-4 transition-colors ${critical ? "border-rose-500/35 bg-rose-950/10" : "border-white/10 bg-[#0c0f17]/75"}`} data-stage-id={definition.id} data-operation-status={status}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 font-mono text-xs font-black text-[#34d399]">{definition.number}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">LAYER {definition.number.replace(/^0/, "")}</p>
            <h3 className="mt-1 text-sm font-bold tracking-tight text-white">{definition.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{definition.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={status} critical={critical} />
          <span className={`text-[10px] font-mono uppercase tracking-wider ${critical ? "text-rose-300" : "text-white/50"}`}>{findingLabel}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-3 text-[11px] text-white/50">
        <span className="font-mono">{sourceCount > 0 ? `${sourceCount} signal${sourceCount === 1 ? "" : "s"}` : "No extra records"}</span>
        <span className="truncate">{stageSummary(stage, finding, status)}</span>
      </div>
    </article>
  );
}

function V5Layer2Card({ definition, stages, finalDecision, pipeline }) {
  const status = groupedStatus(stages, definition.stageIds);
  const primaryStage = stages.l2a || stages.l2b || stages.l2c;
  const finding = findingForStage(primaryStage, null);
  const critical = CRITICAL_FINDINGS.has(upper(finding));

  return (
    <article className={`rounded-2xl border p-4 transition-colors ${critical ? "border-rose-500/35 bg-rose-950/10" : "border-white/10 bg-[#0c0f17]/75"}`} data-stage-id="l2" data-operation-status={status}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 font-mono text-xs font-black text-[#34d399]">{definition.number}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">LAYER 2 · LEGACY GROUP</p>
            <h3 className="mt-1 text-sm font-bold tracking-tight text-white">{definition.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{definition.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={status} critical={critical} />
          <span className={`text-[10px] font-mono uppercase tracking-wider ${critical ? "text-rose-300" : "text-white/50"}`}>{readable(finding)}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-2 border-t border-white/5 pt-3 sm:grid-cols-3">
        {definition.stageIds.map((stageId) => {
          const stage = stages[stageId];
          const stageStatus = effectiveStatus(stage);
          const stageFinding = findingForStage(stage, null);
          const stageCritical = CRITICAL_FINDINGS.has(upper(stageFinding));
          return (
            <div key={stageId} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
              <span className="truncate text-[10px] font-mono uppercase tracking-wider text-white/55">{L2_SUBSTAGE_LABELS[stageId]}</span>
              <span className={`shrink-0 text-[10px] font-mono font-bold ${stageCritical ? "text-rose-300" : stageStatus === "COMPLETED" ? "text-emerald-300" : stageStatus === "RUNNING" ? "text-amber-300" : "text-white/40"}`}>
                {stageStatus === "SKIPPED" ? "SKIPPED" : readable(stageFinding, STATUS_LABELS[stageStatus] || "WAITING")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 truncate text-[11px] text-white/50">{stageSummary(primaryStage, finding, status)}{pipeline?.finalDecision?.security ? ` · Policy: ${readable(pipeline.finalDecision.security)}` : finalDecision?.security ? ` · Policy: ${readable(finalDecision.security)}` : ""}</p>
    </article>
  );
}

export default function LegacyV5SequentialReport({ pipeline = null, layers = {}, processing = false }) {
  const stages = stageMap(pipeline, layers, processing);
  const finalDecision = pipeline?.finalDecision || null;

  return (
    <section id="legacy-v5-sequential" className="space-y-4 rounded-3xl border border-amber-500/20 bg-[#0a0b11]/80 p-4 shadow-xl sm:p-5" data-v5-pipeline-status={pipeline?.pipelineStatus || (processing ? "RUNNING" : "IDLE")} aria-labelledby="legacy-v5-sequential-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-300">
            <Layers size={17} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300/75">Trust Engine V5 · legacy view</p>
            <h2 id="legacy-v5-sequential-title" className="mt-1 text-lg font-bold tracking-tight text-white">Sequential 5-layer report</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/45">Bố cục cũ được khôi phục bên dưới. Finding và trạng thái chỉ lấy từ pipeline hiện tại; lớp chưa chạy sẽ giữ SKIPPED.</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-white/50">{readable(pipeline?.pipelineStatus || (processing ? "RUNNING" : "READY"))}</span>
      </div>

      <div className="grid gap-3">
        {V5_LAYER_DEFINITIONS.map((definition) => definition.id === "l2" ? (
          <V5Layer2Card key={definition.id} definition={definition} stages={stages} finalDecision={finalDecision} pipeline={pipeline} />
        ) : (
          <V5StageCard key={definition.id} definition={definition} stage={stages[definition.stageIds[0]]} finalDecision={finalDecision} pipeline={pipeline} layers={layers} />
        ))}
      </div>
    </section>
  );
}
