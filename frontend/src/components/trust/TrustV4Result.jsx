"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, BookOpen, GitCompareArrows, GraduationCap, Users } from "lucide-react";
import { apiRequest } from "@/lib/api/runtimeClient";
import { isUuid, relationLabel, text } from "@/lib/trust/trustV4Model";
import styles from "./trust-v4.module.css";

const RequestExpertReviewSheet = dynamic(() => import("@/components/expert/RequestExpertReviewSheet"));
const CommunityComposer = dynamic(() => import("@/components/community/CommunityComposer"));
const TrustV4Explorer = dynamic(() => import("./TrustV4Explorer"));

export function TrustDate({ value, prefix = "" }) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return <time dateTime={value}>{prefix}{new Date(value).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })}</time>;
}

export function SourceReference({ source }) {
  return <article className={styles.source}>
    <div className={styles.sourceTitle}>{source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={15} aria-hidden="true" /></a> : <strong>{source.title}</strong>}</div>
    <div className={styles.meta}>{source.publisher && <span>{source.publisher}</span>}{source.type && <span>{source.type}</span>}</div>
    {source.origin === "USER_SUPPLIED" || source.origin === "DIRECT_INPUT" ? <p className={styles.note}>Nguồn do người dùng cung cấp · chưa phải đối chứng độc lập.</p> : source.origin && <p className={styles.note}>Nguồn gốc: {source.origin}</p>}
    {source.availability && <p className={styles.note}>Khả dụng: {source.availability}</p>}
    <div className={styles.meta}><TrustDate value={source.publishedAt} prefix="Công bố " /><TrustDate value={source.effectiveAt} prefix="Hiệu lực " /><TrustDate value={source.retrievedAt} prefix="Truy xuất " /></div>
    {!source.url && <p className={styles.note}>Chưa có đường dẫn có thể mở an toàn.</p>}
  </article>;
}

export function EvidenceCard({ item, claims }) {
  const claim = claims.find((c) => c.id && c.id === item.claimId);
  return <article className={styles.evidence}>
    <div className={styles.meta}><span className={styles.relation} data-relation={item.relation}>{relationLabel(item.relation)}</span>{item.revision != null && <span>Phiên bản {String(item.revision)}</span>}</div>
    {item.excerpt ? <><span className={styles.note}>Trích đoạn được nguồn dữ liệu trả về</span><blockquote>{item.excerpt}</blockquote></> : <p>{item.summary || "Chưa có trích đoạn hoặc tóm tắt bằng chứng."}</p>}
    <p className={styles.note}>{claim ? `Mệnh đề: ${claim.statement}` : "Chưa xác định được mệnh đề liên kết."}</p>
    {item.source ? <SourceReference source={item.source} /> : <p className={styles.note}>Nguồn liên kết chưa có trong phản hồi này.</p>}
  </article>;
}

export function TrustConclusion({ model, stale, previous }) {
  return <section className={styles.conclusion} aria-labelledby="trust-conclusion-title" data-testid="trust-conclusion">
    <div className={styles.meta}><span className={styles.eyebrow}>Kết luận hiện tại</span>{model.caseRevision && <span>Phiên bản {model.caseRevision}</span>}<TrustDate value={model.completedAt} /></div>
    {(stale || previous) && <p className={styles.caution}>{stale ? "Bạn đã thay đổi đầu vào. Kết quả dưới đây áp dụng cho nội dung đã gửi trước đó." : "Đây là kết quả của lần kiểm chứng trước; lần gửi mới chưa có kết quả hoàn tất."}</p>}
    <h2 id="trust-conclusion-title">{model.title}</h2>
    {model.reasons.length ? <div className={styles.reason}><h3>Vì sao có nhận định này?</h3><ul>{model.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div> : <p className={styles.note}>Phản hồi chưa cung cấp giải thích cho kết luận.</p>}
    <div className={styles.uncertainty}><h3>Điều còn chưa rõ</h3>{model.uncertainty.length ? <ul>{model.uncertainty.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Phản hồi chưa công bố chi tiết về giới hạn. Điều này không có nghĩa nội dung đã được xác minh toàn diện.</p>}</div>
    {model.state === "PARTIAL" && <p className={styles.caution}>Một phần quy trình chưa hoàn tất. Hãy đọc các giới hạn trước khi sử dụng kết quả.</p>}
    {model.security && <p className={styles.note}>Phân loại rủi ro kỹ thuật: <strong>{model.security}</strong>. Đây là chiều đánh giá riêng với tính đúng sai của nội dung.</p>}
    {model.metrics.length > 0 && <details className={styles.details}><summary>Các chỉ số được công bố</summary><dl className={styles.metrics}>{model.metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? value.toLocaleString("vi-VN", { maximumFractionDigits: 3 }) : String(value)}</dd></div>)}</dl><p className={styles.note}>Giá trị gốc của hệ thống; không quy đổi thành xác suất nội dung đúng.</p></details>}
    {model.confidence !== null && model.confidenceExplanation && <p className={styles.note}>Độ tin cậy của nhận định: {model.confidence} · {model.confidenceExplanation}</p>}
  </section>;
}

export function TrustAiProvenance({ provenance }) {
  if (!provenance?.available) return null;
  const validation = provenance.citationValidation;
  const validationSummary = validation
    ? `${validation.checkedCount} URL đã được kiểm tra · ${validation.acceptedCount} chấp nhận · ${validation.rejectedCount} từ chối.`
    : "Backend không trả trạng thái kiểm tra URL cho trích dẫn này.";
  return <section id="trust-ai-provenance" className={styles.section} aria-labelledby="trust-ai-provenance-title" data-testid="trust-ai-provenance">
    <div className={styles.sectionHeading}>
      <div><span className={styles.eyebrow}>Nguồn gốc phân tích AI</span><h2 id="trust-ai-provenance-title">AI và liên kết được tham chiếu</h2></div>
      <span className={styles.note}>{provenance.status}</span>
    </div>
    {provenance.revisionBound
      ? <p className={styles.note}>Phân tích gắn với hồ sơ Trust đã lưu, phiên bản {provenance.caseRevision}. Mã lần chạy được giữ trong dữ liệu nguồn gốc của phản hồi.</p>
      : <p className={styles.caution}>Phân tích này chưa gắn được với một hồ sơ, phiên bản và lần chạy đã lưu; không dùng nó như kết luận hoặc trích dẫn Trust.</p>}
    <p className={styles.note}>Liên kết do AI tham chiếu không tự trở thành bằng chứng. Kết luận Trust vẫn theo kết quả có thẩm quyền riêng.</p>
    <p className={styles.note}>{validationSummary} {validation?.allLinksValidated ? "Các URL đều qua kiểm tra truy cập; điều này không xác nhận nội dung nguồn." : "Không phải mọi URL đều được xác nhận truy cập."}</p>
    {provenance.citations.length ? <ul className={styles.comparison}>
        {provenance.citations.map((citation) => <li key={citation.key}>
          <a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.title}<ArrowUpRight size={14} aria-hidden="true" /></a>
          <span>{citation.relation === "SUPPORTS" ? "AI xếp vào nhóm ủng hộ" : citation.relation === "CONTRADICTS" ? "AI xếp vào nhóm phản bác" : citation.relation === "MIXED" ? "AI liên hệ với cả hai phía" : "AI tham chiếu"} · {citation.validationStatus === "LAYER3_VALIDATED" ? "Nguồn đã được đối chiếu ở Layer 3" : citation.validationStatus === "REACHABLE" ? "URL truy cập được; nội dung chưa được xác nhận" : "Chưa có trạng thái kiểm tra chi tiết"}{citation.evidenceRevision != null ? ` · Evidence revision ${citation.evidenceRevision}` : ""}</span>
        </li>)}
    </ul> : <p className={styles.empty}>Phản hồi AI không có liên kết cấu trúc để hiển thị.</p>}
  </section>;
}

function ExpertAssessments({ model, onClose }) {
  const [result, setResult] = useState({ state: "idle", rows: [] });
  const active = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  const load = async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setResult({ state: "loading", rows: [] });
    try {
      const payload = await apiRequest(`/api/expert/assessments?caseId=${encodeURIComponent(model.caseId)}`, { signal: controller.signal, cache: "no-store" });
      if (controller.signal.aborted) return;
      // The canonical case-scoped endpoint omits case_id in projected rows.
      setResult({ state: "ready", rows: (Array.isArray(payload.data) ? payload.data : []).filter((row) => !row.case_id || row.case_id === model.caseId) });
    } catch { if (!controller.signal.aborted) setResult({ state: "error", rows: [] }); }
  };
  return <section className={styles.section} aria-label="Đánh giá chuyên gia">
    <div className={styles.sectionHeading}><h3>Nhận định chuyên gia</h3><button type="button" className={styles.textButton} onClick={onClose}>Đóng</button></div>
    {result.state === "idle" && <button type="button" className={styles.secondary} onClick={load}>Đọc đánh giá được phép xem</button>}
    {result.state === "loading" && <p role="status">Đang đọc đánh giá…</p>}
    {result.state === "error" && <p role="alert">Không đọc được đánh giá hoặc bạn chưa có quyền truy cập. <button type="button" className={styles.textButton} onClick={load}>Thử đọc lại</button></p>}
    {result.state === "ready" && !result.rows.length && <p>Chưa có đánh giá được phép hiển thị.</p>}
    {result.rows.map((row) => <article key={row.id} className={styles.evidence}><strong>{text(row.public_title) || "Danh tính công khai chưa được cung cấp"}</strong><p className={styles.note}>Phạm vi: {text(row.domain_code) || "Chưa được cung cấp"} · Phiên bản được đánh giá: {row.case_revision}</p>{row.case_revision !== model.caseRevision && <p className={styles.caution}>Đánh giá này thuộc phiên bản khác.</p>}<p>{text(row.reasoning) || text(row.assessment?.reasoning) || "Chưa có nội dung nhận định được công bố."}</p><p className={styles.note}>{text(row.uncertainty) || text(row.assessment?.uncertainty)}</p><TrustDate value={row.created_at} /></article>)}
    <p className={styles.note}>Nhận định độc lập của chuyên gia không tự thay đổi kết luận Trust.</p>
  </section>;
}

export function TrustCaseActions({ model, authenticated, readOnly = false }) {
  const [sheet, setSheet] = useState(null);
  const [publication, setPublication] = useState(false);
  const expertTriggerRef = useRef(null);
  const scopeReady = model.persisted && isUuid(model.caseId) && Number.isInteger(model.caseRevision);
  const [claimId, setClaimId] = useState(model.claims?.[0]?.id || "");

  return <>
    <section id="trust-next" className={styles.next} aria-labelledby="trust-next-title">
      <span className={styles.eyebrow}>{readOnly ? "Bản lưu bất biến" : "Từ hiểu rõ đến hành động"}</span>
      <h2 id="trust-next-title">{readOnly ? "Phiên bản kết quả này" : "Bạn có thể làm gì tiếp theo?"}</h2>
      {model.action && <p>{model.action}</p>}
      {readOnly ? <p className={styles.note}>Đây là kết quả đã lưu của đúng phiên bản và lần chạy được ghi trong nguồn gốc. Các hành động tạo dữ liệu mới đã tắt.</p> : <>
        {model.claims?.length > 0 && <label className={styles.note}>Mệnh đề gửi kèm yêu cầu chuyên gia
          <select value={claimId} onChange={(event) => setClaimId(event.target.value)}>
            <option value="">Không chọn mệnh đề riêng</option>
            {model.claims.map((claim) => <option key={claim.key} value={claim.id || ""}>{claim.statement}</option>)}
          </select>
        </label>}
        <div className={styles.actions}>
          <button ref={expertTriggerRef} type="button" className={styles.secondary} disabled={!scopeReady || !authenticated} onClick={(event) => { expertTriggerRef.current = event.currentTarget; setSheet("expert"); }}><GraduationCap size={17} />Yêu cầu chuyên gia</button>
          <button type="button" className={styles.secondary} disabled={!scopeReady || !authenticated} onClick={() => setSheet("community")}><Users size={17} />Thảo luận trong Cộng đồng</button>
          {scopeReady && authenticated && <button type="button" className={styles.textButton} onClick={() => setSheet("assessments")}>Xem đánh giá chuyên gia</button>}
        </div>
        {!scopeReady && <p className={styles.note}>Kết quả chưa có xác nhận lưu hồ sơ và phiên bản. Chưa thể liên kết yêu cầu chuyên gia hoặc bài viết.</p>}
        {!authenticated && <p className={styles.note}>Đăng nhập để sử dụng hồ sơ và các hành động liên kết.</p>}
        {publication && <p role="status">Đóng góp đã được công bố qua Cộng đồng.</p>}
      </>}
    </section>
    {!readOnly && sheet === "expert" && <RequestExpertReviewSheet caseId={model.caseId} caseRevision={model.caseRevision} claimId={claimId || null} defaultDomainCode={model.domain} restoreFocusRef={expertTriggerRef} onClose={() => setSheet(null)} />}
    {!readOnly && sheet === "community" && <CommunityComposer initialMode="VERIFY" initialCaseId={model.caseId} initialCaseRevision={model.caseRevision} onClose={() => setSheet(null)} onPublished={() => { setSheet(null); setPublication(true); }} />}
    {!readOnly && sheet === "assessments" && <ExpertAssessments model={model} onClose={() => setSheet(null)} />}
  </>;
}

export default function TrustV4Result({ model, snapshot, stale, previous, authenticated, onEdit, readOnly = false }) {
  const [claimKey, setClaimKey] = useState("all");
  const [explorer, setExplorer] = useState(false);
  const selected = model.claims.find((c) => c.key === claimKey);
  const evidence = selected ? model.evidence.filter((e) => selected.id && e.claimId === selected.id) : model.evidence;
  return <div className={styles.result}>
    <div className={styles.subject}><div><span className={styles.eyebrow}>{readOnly ? "Kết quả đã lưu · chỉ đọc" : "Nội dung đã kiểm chứng"}</span><p>{snapshot.label}</p></div>{!readOnly && <button className={styles.textButton} type="button" onClick={onEdit}>Sửa đầu vào</button>}</div>
    <TrustConclusion model={model} stale={stale} previous={previous} />
    <nav className={styles.resultNav} aria-label="Trong kết quả"><a href="#trust-evidence">Bằng chứng</a><a href="#trust-sources">Nguồn đối chiếu</a><a href="#trust-next">Bước tiếp theo</a></nav>
    {model.claims.length > 0 && <section className={styles.section} aria-labelledby="trust-claims-title"><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Phạm vi kiểm chứng</span><h2 id="trust-claims-title">Các mệnh đề được trích xuất</h2></div><span className={styles.note}>{model.claims.length} mệnh đề</span></div><p className={styles.note}>Chọn một mệnh đề để xem bằng chứng liên quan. Kết luận tổng thể không thay thế đánh giá riêng của từng mệnh đề.</p><p className={styles.note}>Phản hồi hiện chỉ hỗ trợ xem và lọc mệnh đề. Sửa, loại trừ hoặc xác nhận mệnh đề rồi chạy lại chưa có thao tác server được công bố.</p><div className={styles.claims}><button type="button" aria-pressed={!selected} onClick={() => setClaimKey("all")}>Tất cả mệnh đề</button>{model.claims.map((claim, index) => <button key={claim.key} type="button" aria-pressed={claimKey === claim.key} onClick={() => setClaimKey(claim.key)}><span className={styles.claimNumber}>{String(index + 1).padStart(2, "0")}</span><span>{claim.statement}<small>{claim.status || "Chưa có đánh giá riêng được công bố"}{claim.revision != null ? ` · phiên bản ${claim.revision}` : ""}{claim.origin ? ` · ${claim.origin}` : ""}</small>{claim.context && <small>Ngữ cảnh nguồn: {claim.context}</small>}</span></button>)}</div></section>}
    <section id="trust-evidence" className={styles.section} aria-labelledby="trust-evidence-title"><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Đọc và đối chiếu</span><h2 id="trust-evidence-title">Bằng chứng nói gì?</h2></div><BookOpen size={22} aria-hidden="true" /></div>{evidence.length ? evidence.map((item) => <EvidenceCard key={item.key} item={item} claims={model.claims} />) : <p className={styles.empty}>Chưa có bằng chứng liên kết được trả về cho phạm vi này. Nguồn xuất hiện trong danh sách không tự chứng minh mệnh đề.</p>}</section>
    <TrustAiProvenance provenance={model.aiProvenance} />
    {model.evidence.some((e) => e.claimId && e.source && e.relation) && <section className={styles.section} aria-labelledby="trust-comparison-title"><div className={styles.sectionHeading}><h2 id="trust-comparison-title">Đối chiếu từng mệnh đề</h2><GitCompareArrows size={22} aria-hidden="true" /></div><p className={styles.note}>Các quan hệ do hệ thống trả về; số lượng nguồn không tạo ra đồng thuận.</p><ul className={styles.comparison}>{evidence.filter((e) => e.source && e.claimId).map((e) => <li key={e.key}><strong>{model.claims.find((c) => c.id === e.claimId)?.statement || "Mệnh đề chưa có nội dung"}</strong><span>{e.source.title}</span><span>{relationLabel(e.relation)}</span></li>)}</ul></section>}
    <section id="trust-sources" className={styles.section} aria-labelledby="trust-sources-title"><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Có thể truy vết</span><h2 id="trust-sources-title">Nguồn đối chiếu</h2></div><span className={styles.note}>{model.sources.length} nguồn được trả về</span></div>{model.sources.length ? model.sources.map((source) => <SourceReference key={source.key} source={source} />) : <p className={styles.empty}>Chưa có bản ghi nguồn trong phản hồi.</p>}</section>
    <TrustCaseActions model={model} authenticated={authenticated} readOnly={readOnly} />
    {model.evidence.some((e) => e.claimId && e.source) && <section className={styles.section}><button className={styles.textButton} type="button" aria-expanded={explorer} onClick={() => setExplorer(!explorer)}>Khám phá quan hệ mệnh đề · bằng chứng · nguồn</button>{explorer && <TrustV4Explorer model={model} />}</section>}
  </div>;
}
