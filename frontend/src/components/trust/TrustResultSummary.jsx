"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, FileSearch, ShieldAlert } from "lucide-react";

function valueOrFallback(value) {
  return value || "Chưa có dữ liệu";
}

export default function TrustResultSummary({ model, verdict, onNewAnalysis, onPrint }) {
  const reasons = model?.reasons || [];
  const sourceCount = model?.sources?.length || model?.evidence?.length || 0;
  const evidenceCount = model?.evidence?.length || 0;
  const counterEvidence = model?.counterEvidence || [];
  const review = model?.humanReview;
  const reviewText = review?.status || review?.reason || review?.message || (review ? "Cần human review" : "Không áp dụng");

  return (
    <section className="intelligence-panel trust-result-summary" aria-labelledby="trust-result-summary-title">
      <div className="trust-result-summary-heading">
        <div>
          <p className="product-kicker">Trust result</p>
          <h2 id="trust-result-summary-title" className="product-section-title">Kết luận kiểm tra</h2>
        </div>
        <div className="trust-result-summary-actions">
          {onNewAnalysis && <button type="button" className="text-link" onClick={onNewAnalysis}>Kiểm tra nội dung khác</button>}
          {onPrint && <button type="button" className="text-link" onClick={onPrint}>In báo cáo</button>}
          {model?.finalDecision?.security === "MALICIOUS" || model?.finalDecision?.epistemicState === "DANGEROUS" ? <ShieldAlert size={22} className="text-red-400" aria-label="Cảnh báo nguy hiểm" /> : <CheckCircle2 size={22} className="text-cyan-400" aria-label="Kết quả Trust" />}
        </div>
      </div>
      <div className="trust-result-summary-decision">
        <span className="trust-result-summary-label">Phán quyết cuối</span>
        <strong>{verdict || valueOrFallback(model?.finalDecisionLabel)}</strong>
        {model?.recommendedAction && <p>{model.recommendedAction}</p>}
      </div>
      <dl className="trust-result-summary-metrics">
        <div><dt>Độ chắc quyết định</dt><dd>{valueOrFallback(model?.confidence)}</dd></div>
        <div><dt>Đủ bằng chứng</dt><dd>{valueOrFallback(model?.evidenceSufficiency)}</dd></div>
        <div><dt>Nguồn/evidence</dt><dd>{sourceCount || evidenceCount ? `${sourceCount || evidenceCount} bản ghi` : "Chưa có dữ liệu"}</dd></div>
      </dl>
      <div className="trust-result-summary-supporting">
        <article>
          <span><FileSearch size={15} /> Lý do chính</span>
          {reasons.length ? <ul>{reasons.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>Chưa có dữ liệu</p>}
        </article>
        <article>
          <span><AlertTriangle size={15} /> Phản biện và human review</span>
          <p>{counterEvidence.length ? `${counterEvidence.length} tín hiệu cần xem xét thêm.` : "Không có dữ liệu phản biện được công bố."}</p>
          <small>{valueOrFallback(reviewText)}</small>
        </article>
      </div>
      <p className="trust-result-summary-note">Kết luận dựa trên dữ liệu của phiên hiện tại; thiếu dữ liệu không được diễn giải thành an toàn.</p>
    </section>
  );
}
