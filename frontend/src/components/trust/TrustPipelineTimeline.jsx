"use client";

import React from "react";
import { AlertTriangle, ArrowDown, Check, CircleHelp, Clock3, LoaderCircle, ShieldAlert } from "lucide-react";
import { STAGE_DEFINITIONS, STAGE_IDS } from "@/lib/ai-trust/v5/contracts.js";

const STATUS_LABELS = {
  NOT_STARTED: "CHƯA BẮT ĐẦU",
  QUEUED: "ĐANG XẾP HÀNG",
  RUNNING: "ĐANG KIỂM TRA",
  COMPLETED: "ĐÃ HOÀN TẤT",
  PARTIAL: "MỘT PHẦN",
  FAILED: "THẤT BẠI — ĐÃ GIẢM CẤP",
  SKIPPED: "BỊ BỎ QUA — CẦN RÀ SOÁT",
  BLOCKED: "BỊ CHẶN",
};

const CRITICAL_FINDINGS = new Set(["LOCAL_BLOCK", "THREAT_MATCH", "MALICIOUS"]);

function readable(value, fallback = "CHƯA CÓ FINDING") {
  return typeof value === "string" && value.trim() ? value.replaceAll("_", " ") : fallback;
}

function stageSignals(stage) {
  if (!Array.isArray(stage?.signals) || stage.signals.length === 0) return [{ code: "NO_SIGNALS_REPORTED", details: "Stage chưa báo tín hiệu nào trong phạm vi kiểm tra." }];
  return stage.signals.slice(0, 8);
}

function evidenceText(stage) {
  if (!Array.isArray(stage?.evidenceRefs) || stage.evidenceRefs.length === 0) return "Chưa có evidence reference được công bố ở stage này.";
  return stage.evidenceRefs.slice(0, 8).join(" · ");
}

function statusIcon(status, finding) {
  if (status === "RUNNING") return <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />;
  if (CRITICAL_FINDINGS.has(finding)) return <ShieldAlert size={16} aria-hidden="true" />;
  if (["COMPLETED", "PARTIAL"].includes(status)) return <Check size={16} aria-hidden="true" />;
  if (["FAILED", "BLOCKED", "SKIPPED"].includes(status)) return <AlertTriangle size={16} aria-hidden="true" />;
  return <CircleHelp size={16} aria-hidden="true" />;
}

function nextStageText(nextStage) {
  if (!nextStage) return "Đây là stage cuối; chờ final decision và action của policy.";
  const definition = STAGE_DEFINITIONS[nextStage];
  return `${nextStage.toUpperCase()} · ${definition?.stageName || "Stage kế tiếp"}`;
}

export default function TrustPipelineTimeline({ pipeline, processing = false }) {
  const pipelineStatus = pipeline?.pipelineStatus || (processing ? "RUNNING" : "IDLE");

  return <section className="trust-v5-timeline" aria-labelledby="trust-v5-timeline-title" data-v5-pipeline-status={pipelineStatus}>
    <div className="panel-heading">
      <div>
        <p className="product-kicker">Trust Engine V5 · sequential evidence</p>
        <h2 id="trust-v5-timeline-title" className="product-section-title">Bảy stage, bảy finding riêng</h2>
      </div>
      <span className={`live-indicator ${processing ? "is-live" : ""}`}>{readable(pipelineStatus)}</span>
    </div>
    <p className="trust-v5-timeline-intro">Mỗi stage có phạm vi và giới hạn riêng. Hoàn tất pipeline không đồng nghĩa nội dung an toàn.</p>
    <ol className="trust-v5-stage-list" aria-label="Trình tự bảy stage Trust Engine V5">
      {STAGE_IDS.map((stageId, index) => {
        const definition = STAGE_DEFINITIONS[stageId];
        const stage = pipeline?.stages?.[stageId];
        const operationStatus = stage?.operationStatus || "NOT_STARTED";
        const finding = stage?.finding || null;
        const critical = CRITICAL_FINDINGS.has(finding);
        const signals = stageSignals(stage);
        return <li key={stageId} className={`trust-v5-stage-item ${critical ? "is-critical" : ""}`} data-stage-id={stageId} data-operation-status={operationStatus} data-finding={finding || "NONE"}>
          <article className="trust-v5-stage-card" aria-labelledby={`trust-v5-stage-${stageId}`}>
            <header className="trust-v5-stage-header">
              <span className="trust-v5-stage-index" aria-hidden="true">{statusIcon(operationStatus, finding) || index + 1}</span>
              <div className="trust-v5-stage-title">
                <p className="product-kicker">{definition.architecturalLayer} · {stageId.toUpperCase()}</p>
                <h3 id={`trust-v5-stage-${stageId}`}>{definition.stageName}</h3>
                <p>{definition.role}</p>
              </div>
              <div className="trust-v5-stage-state" aria-live={critical ? "assertive" : "polite"}>
                <span className="trust-v5-status">{STATUS_LABELS[operationStatus] || readable(operationStatus)}</span>
                <strong>{readable(finding)}</strong>
              </div>
            </header>
            <dl className="trust-v5-stage-fields">
              <div className="trust-v5-stage-field trust-v5-stage-field-wide">
                <dt>Đang kiểm tra</dt>
                <dd>{stage?.checking || definition.checking}</dd>
              </div>
              <div className="trust-v5-stage-field trust-v5-stage-field-wide">
                <dt>Finding của stage</dt>
                <dd>{stage?.summary || "Stage chưa chạy; chưa có finding để diễn giải."}</dd>
              </div>
              <div className="trust-v5-stage-field">
                <dt>Finding này nghĩa là</dt>
                <dd>{stage?.meaning || "Chưa có diễn giải trước khi stage thực thi."}</dd>
              </div>
              <div className="trust-v5-stage-field">
                <dt>Finding này KHÔNG chứng minh</dt>
                <dd>{stage?.notProve || definition.notProve}</dd>
              </div>
              <div className="trust-v5-stage-field">
                <dt>Tín hiệu / evidence</dt>
                <dd>
                  <ul className="trust-v5-signal-list">
                    {signals.map((signal, signalIndex) => <li key={`${signal.code || "signal"}-${signalIndex}`}><strong>{readable(signal.code, "SIGNAL")}</strong><span>{signal.details || "Không có mô tả thêm."}</span></li>)}
                  </ul>
                  <span className="trust-v5-evidence-ref"><strong>Evidence refs:</strong> {evidenceText(stage)}</span>
                </dd>
              </div>
              <div className="trust-v5-stage-field">
                <dt>Giới hạn</dt>
                <dd><ul className="trust-v5-limit-list">{(stage?.limitations || definition.limitations).slice(0, 4).map((limit, limitIndex) => <li key={`${limit}-${limitIndex}`}>{limit}</li>)}</ul></dd>
              </div>
              <div className="trust-v5-stage-field trust-v5-stage-field-next">
                <dt><ArrowDown size={13} aria-hidden="true" /> Stage kế tiếp</dt>
                <dd>{nextStageText(stage?.nextStage ?? definition.nextStage)}</dd>
              </div>
            </dl>
            <footer className="trust-v5-stage-footer">
              <span><Clock3 size={13} aria-hidden="true" /> {stage?.latencyMs != null ? `${stage.latencyMs} ms` : "Chưa có latency"}</span>
              <span>Provider: {readable(stage?.providerStatus, "CHƯA CHẠY")}</span>
              <span>Action: {stage?.userAction || "Đọc finding và giới hạn trước khi hành động."}</span>
            </footer>
          </article>
        </li>;
      })}
    </ol>
  </section>;
}
