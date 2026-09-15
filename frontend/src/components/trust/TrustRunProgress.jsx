"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, MinusCircle } from "lucide-react";
import { TRUST_PRIMARY_PIPELINE_COUNT } from "@/lib/ai-trust/v5/TrustPresentationModel.js";

const STATUS_ICON = {
  WAITING: <MinusCircle size={15} aria-hidden="true" />,
  RUNNING: <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />,
  COMPLETE: <CheckCircle2 size={15} aria-hidden="true" />,
  PARTIAL: <AlertTriangle size={15} aria-hidden="true" />,
  FAILED: <AlertTriangle size={15} aria-hidden="true" />,
};

export default function TrustRunProgress({ model }) {
  const stages = model?.macroStages || [];
  const overallStatus = model?.pipelineStatus === "COMPLETED"
      ? "COMPLETE"
      : ["RUNNING", "PARTIAL", "FAILED"].includes(model?.pipelineStatus)
        ? model.pipelineStatus
      : "WAITING";
  return (
    <section
      className="intelligence-panel trust-run-progress"
      aria-labelledby="trust-run-progress-title"
      data-trust-primary-pipeline-count={TRUST_PRIMARY_PIPELINE_COUNT}
      data-stale-run-event-render="0"
    >
      <div className="panel-heading">
        <div>
          <p className="product-kicker">Trust progress</p>
          <h2 id="trust-run-progress-title" className="product-section-title">Tiến độ kiểm tra</h2>
        </div>
        <span className={`live-indicator ${overallStatus === "RUNNING" ? "is-live" : ""}`}>
          {overallStatus}
        </span>
      </div>
      <ol className="trust-macro-progress" aria-label="Năm giai đoạn kiểm tra chính">
        {stages.map((stage, index) => (
          <li key={stage.id} data-status={stage.status} data-stage-index={index + 1}>
            <span className="trust-macro-progress-index">{index + 1}</span>
            <div className="trust-macro-progress-copy">
              <div className="trust-macro-progress-title">
                <strong>{stage.name}</strong>
                <span className={`trust-stage-status trust-stage-status-${String(stage.status).toLowerCase()}`}>
                  {STATUS_ICON[stage.status]}
                  {stage.statusLabel}
                </span>
              </div>
              <small>{stage.description}</small>
            </div>
          </li>
        ))}
      </ol>
      {!stages.length && <p className="empty-state">Chưa có dữ liệu tiến độ.</p>}
    </section>
  );
}
