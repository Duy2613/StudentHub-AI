"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CircleHelp,
  Clock3,
  FileCheck2,
  GitMerge,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle
} from "lucide-react";

const DEFAULT_OBJECT_ID = "KNO_GRADUATION_DEADLINE_2026";
const LAYER_META = [
  { key: "officialTruth", label: "Lớp A · Chính thống", shortLabel: "OFFICIAL", icon: FileCheck2, card: "border-blue-400/20", iconTone: "bg-blue-400/10 text-blue-300", description: "Văn bản, quyết định và nguồn có thẩm quyền thể chế." },
  { key: "aiVerifiedReasoning", label: "Lớp B · AI kiểm chứng", shortLabel: "AI VERIFIED", icon: Sparkles, card: "border-violet-400/20", iconTone: "bg-violet-400/10 text-violet-300", description: "Suy luận có thể truy nguyên, không tự nâng thành quy chế." },
  { key: "expertInterpretation", label: "Lớp C · Chuyên gia", shortLabel: "EXPERT", icon: ShieldCheck, card: "border-indigo-400/20", iconTone: "bg-indigo-400/10 text-indigo-300", description: "Diễn giải trong phạm vi chuyên môn, tách khỏi hành chính." },
  { key: "communityReality", label: "Lớp D · Thực tế cộng đồng", shortLabel: "COMMUNITY", icon: GitMerge, card: "border-emerald-400/20", iconTone: "bg-emerald-400/10 text-emerald-300", description: "Trải nghiệm thực địa, độ trễ vận hành và ngoại lệ." }
];
const STATUS_META = {
  AUTHORITATIVE: ["CHÍNH THỐNG", "text-blue-300 bg-blue-500/10 border-blue-400/30"],
  SUPPORTED: ["ĐƯỢC HỖ TRỢ", "text-emerald-300 bg-emerald-500/10 border-emerald-400/30"],
  CONTEXTUALIZED: ["ĐÃ BỔ SUNG NGỮ CẢNH", "text-cyan-300 bg-cyan-500/10 border-cyan-400/30"],
  CONFLICTED: ["ĐANG MÂU THUẪN", "text-amber-300 bg-amber-500/10 border-amber-400/30"],
  UNRESOLVED: ["CHƯA KẾT LUẬN", "text-rose-300 bg-rose-500/10 border-rose-400/30"],
  UNKNOWN: ["CHƯA ĐỦ DỮ LIỆU", "text-neutral-300 bg-neutral-500/10 border-neutral-400/30"]
};

const textOf = (value, fallback = "Chưa có dữ liệu") => value === null || value === undefined || value === "" ? fallback : String(value);
const layerText = (object, layer) => {
  const value = object?.[layer.key];
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  if (Array.isArray(value)) return value.map((item) => item?.interpretation || item?.statement || item?.summary || item?.text).filter(Boolean).join(" ");
  return value.statement || value.synthesis || value.summary || value.explanation || value.value || null;
};

export function EvidenceFusionStudio() {
  const [objectId, setObjectId] = useState(DEFAULT_OBJECT_ID);
  const [knowledgeObject, setKnowledgeObject] = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [panelData, setPanelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [error, setError] = useState("");

  const loadObject = useCallback(async (requestedId = objectId) => {
    const id = requestedId.trim();
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/intelligence/fusion/objects/${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Không tải được Knowledge Object.");
      setKnowledgeObject(payload.knowledgeObject);
      setPanelData(null);
    } catch (loadError) {
      setKnowledgeObject(null);
      setError(loadError.message || "Không thể tải dữ liệu hợp nhất.");
    } finally {
      setLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadObject(DEFAULT_OBJECT_ID); }, 0);
    return () => clearTimeout(timer);
  }, [loadObject]);

  const loadPanel = useCallback(async (panel) => {
    if (!knowledgeObject?.knowledgeObjectId || panel === "overview") { setPanelData(null); return; }
    const endpoint = { provenance: "evidence", conflicts: "conflicts", unknowns: "unknowns" }[panel];
    setPanelLoading(true);
    try {
      const response = await fetch(`/api/intelligence/fusion/objects/${encodeURIComponent(knowledgeObject.knowledgeObjectId)}/${endpoint}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Không tải được dữ liệu drill-down.");
      setPanelData(payload);
    } catch (loadError) {
      setPanelData({ error: loadError.message || "Không thể tải dữ liệu." });
    } finally {
      setPanelLoading(false);
    }
  }, [knowledgeObject]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadPanel(activePanel); }, 0);
    return () => clearTimeout(timer);
  }, [activePanel, loadPanel]);

  const status = STATUS_META[knowledgeObject?.authoritativeState] || STATUS_META.UNKNOWN;
  const telemetry = knowledgeObject?.confidenceTelemetry || {};
  const layerCount = useMemo(() => LAYER_META.filter((layer) => layerText(knowledgeObject, layer)).length, [knowledgeObject]);
  const issueCount = (knowledgeObject?.contradictions?.length || 0) + (knowledgeObject?.unknowns?.length || 0);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="eyebrow text-cyan-300"><Layers className="w-3.5 h-3.5" /> 4-LAYER EVIDENCE OPERATING SYSTEM</div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">Một kết luận, bốn góc nhìn, không trộn lẫn thẩm quyền.</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">Chính thống quyết định hiệu lực. AI nối các mảnh bằng chứng. Chuyên gia diễn giải trong phạm vi. Cộng đồng bổ sung thực tế vận hành.</p>
          </div>
          <form className="flex w-full xl:w-[390px] gap-2" onSubmit={(event) => { event.preventDefault(); loadObject(); }}>
            <label className="sr-only" htmlFor="knowledge-object-id">Mã Knowledge Object</label>
            <input id="knowledge-object-id" value={objectId} onChange={(event) => setObjectId(event.target.value)} className="input-glass flex-1" placeholder="Nhập mã Knowledge Object" />
            <button type="submit" className="button-primary px-4" disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /><span>Đối soát</span></button>
          </form>
        </div>
      </section>

      {error && <div role="alert" className="surface-card p-4 border-rose-400/30 bg-rose-500/5 text-sm text-rose-200 flex items-start gap-3"><XCircle className="w-5 h-5 shrink-0" /><div><p className="font-medium">Không thể tải Knowledge Object</p><p className="mt-1 text-rose-200/70">{error}</p></div></div>}

      {knowledgeObject && <>
        <section className="surface-card p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className={`status-chip ${status[1]}`}>{status[0]}</span><span className="status-chip text-white/60 bg-white/[0.04] border-white/10">V{knowledgeObject.version || 1}</span><span className="status-chip text-white/50 bg-white/[0.03] border-white/10">{knowledgeObject.knowledgeObjectId}</span></div>
              <h3 className="mt-3 text-xl font-semibold text-white">{textOf(knowledgeObject.subject, "Knowledge Object")}</h3>
              <p className="mt-1 text-sm text-white/50">Phạm vi: {textOf(knowledgeObject.scope?.cohort || knowledgeObject.topic, "Tất cả phạm vi")} · Chính sách: {textOf(knowledgeObject.policyVersion)}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0 lg:min-w-[420px]">{[["Lớp có dữ liệu", `${layerCount}/4`], ["Nguồn", telemetry.totalSourcesCount ?? knowledgeObject.supportingEvidence?.length ?? 0], ["Cụm độc lập", telemetry.independentProvenanceClustersCount ?? "—"], ["Cần rà soát", issueCount]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.035] border border-white/[0.07] p-3"><p className="text-[11px] text-white/40">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>)}</div>
          </div>
          <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4 flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" /><p className="text-sm leading-6 text-cyan-100/80"><strong className="text-cyan-200">Nguyên tắc an toàn:</strong> dữ liệu cộng đồng và điểm AI không thể tự biến thành quy định chính thức. Khi xung đột, hệ thống phải hiển thị mâu thuẫn và chuyển sang đối soát con người.</p></div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{LAYER_META.map((layer) => { const Icon = layer.icon; const content = layerText(knowledgeObject, layer); return <article key={layer.key} className={`surface-card p-4 ${layer.card} min-h-[180px]`}><div className="flex items-start justify-between gap-3"><div className={`p-2 rounded-lg ${layer.iconTone}`}><Icon className="w-4 h-4" /></div><span className="text-[10px] tracking-widest text-white/40">{layer.shortLabel}</span></div><h4 className="mt-4 text-sm font-semibold text-white">{layer.label}</h4><p className="mt-1 text-xs leading-5 text-white/45">{layer.description}</p><div className="mt-4 text-xs leading-5 text-white/70 line-clamp-3">{content || <span className="text-white/35">Chưa có tín hiệu đáng tin cậy ở lớp này.</span>}</div></article>; })}</section>

        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap gap-1 p-2 border-b border-white/[0.07]">{["overview", "provenance", "conflicts", "unknowns"].map((panel) => <button key={panel} type="button" onClick={() => setActivePanel(panel)} className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${activePanel === panel ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"}`}>{panel === "overview" ? "Tổng quan" : panel === "provenance" ? "Chuỗi provenance" : panel === "conflicts" ? `Xung đột (${knowledgeObject.contradictions?.length || 0})` : `Unknowns (${knowledgeObject.unknowns?.length || 0})`}</button>)}</div>
          <div className="p-5 sm:p-6">{activePanel === "overview" ? <Overview object={knowledgeObject} telemetry={telemetry} /> : panelLoading ? <div className="py-12 flex justify-center text-cyan-300"><Loader2 className="w-5 h-5 animate-spin" /></div> : panelData?.error ? <p className="text-sm text-rose-300">{panelData.error}</p> : <DrillDown panel={activePanel} data={panelData} />}</div>
        </section>
      </>}
      {loading && !knowledgeObject && <div className="surface-card py-16 flex flex-col items-center gap-3 text-white/50"><Loader2 className="w-6 h-6 animate-spin text-cyan-300" /><p className="text-sm">Đang tải chuỗi bằng chứng…</p></div>}
    </div>
  );
}

function Overview({ object, telemetry }) {
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="lg:col-span-2 space-y-4"><h4 className="text-sm font-semibold text-white">Kết luận có thể hành động</h4><p className="text-sm leading-7 text-white/70">{textOf(object.aiVerifiedReasoning?.synthesis, "Chưa có bản tổng hợp AI được kiểm chứng.")}</p>{object.officialTruth && <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.05] p-4"><p className="text-[11px] uppercase tracking-wider text-blue-300/70">Nguồn quyết định</p><p className="mt-2 text-sm text-blue-50/80">{textOf(object.officialTruth.statement || object.officialTruth.value)}</p><p className="mt-2 text-xs text-white/40">{textOf(object.officialTruth.sourceId)} · {textOf(object.officialTruth.publishedAt, "Chưa rõ ngày ban hành")}</p></div>}</div><div className="space-y-3"><div className="flex items-center gap-2 text-sm font-semibold text-white"><Clock3 className="w-4 h-4 text-cyan-300" /> Tính thời điểm</div><p className="text-xs leading-5 text-white/55">Cập nhật cuối: {textOf(object.lastVerifiedAt)}<br />Hash nguồn: <span className="font-mono text-white/75">{textOf(object.sourceSetHash)}</span></p><div className="rounded-xl border border-white/[0.07] p-4"><p className="text-[11px] text-white/40">Sức khỏe bằng chứng</p><p className="mt-1 text-base font-semibold text-white">{textOf(object.evidenceHealth)}</p><p className="mt-2 text-xs text-white/50">Đường adjudication: {textOf(telemetry.adjudicationPath)}</p></div></div></div>;
}

function DrillDown({ panel, data }) {
  if (panel === "provenance") {
    const evidence = data?.supportingEvidence || [];
    return <div className="space-y-3"><div className="flex items-center gap-2"><GitMerge className="w-4 h-4 text-cyan-300" /><h4 className="text-sm font-semibold text-white">Chuỗi bằng chứng và nguồn gốc</h4></div>{evidence.length === 0 ? <EmptyState text="Chưa có supporting evidence." /> : evidence.map((item, index) => <div key={`${item.sourceId || item.id || "source"}-${index}`} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-mono text-cyan-200">{item.sourceId || item.id || `SOURCE_${index + 1}`}</span><span className="text-[11px] text-white/40">{item.sourceTier || item.authorityClass || "UNKNOWN_TIER"}</span></div><p className="mt-2 text-sm text-white/70">{item.statement || item.contentReference || item.title || "Nguồn đã được lưu trong provenance graph."}</p></div>)}</div>;
  }
  const Icon = panel === "conflicts" ? AlertTriangle : CircleHelp;
  const items = panel === "conflicts" ? [...(data?.contradictions || []), ...(data?.realityGaps || [])] : [...(data?.unknowns || []), ...(data?.limitations || [])];
  return <div className="space-y-3"><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-amber-300" /><h4 className="text-sm font-semibold text-white">{panel === "conflicts" ? "Điểm cần đối soát" : "Unknowns và giới hạn không được che giấu"}</h4></div>{items.length === 0 ? <EmptyState text={panel === "conflicts" ? "Không phát hiện xung đột đang mở." : "Không có unknowns được ghi nhận."} /> : items.map((item, index) => <div key={index} className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-sm leading-6 text-white/70">{typeof item === "string" ? item : item.explanation || item.reason || item.statement || JSON.stringify(item)}</div>)}</div>;
}

function EmptyState({ text }) { return <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">{text}</div>; }
