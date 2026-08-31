"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, GitBranch, Loader2, MessageSquare, Search, ShieldAlert, Users, XCircle } from "lucide-react";

const TOPICS = [
  ["TOEIC_SUBMISSION_TIME", "Nộp chứng chỉ TOEIC"],
  ["GRADUATION_DOSSIER_REVIEW", "Hồ sơ xét tốt nghiệp"],
  ["COURSE_REGISTRATION", "Đăng ký học phần"]
];

const SIGNAL_LABELS = {
  STRONG_COMMUNITY_SIGNAL: "TÍN HIỆU MẠNH",
  MODERATE_COMMUNITY_SIGNAL: "TÍN HIỆU VỪA",
  MIXED_EXPERIENCES: "TRẢI NGHIỆM PHÂN KỲ",
  APPARENT_CONSENSUS: "ĐỒNG THUẬN ĐÁNG NGỜ",
  UNVERIFIED_RUMOR: "TIN ĐỒN CHƯA XÁC MINH",
  WEAK_SIGNAL: "TÍN HIỆU YẾU",
  UNKNOWN: "CHƯA CÓ DỮ LIỆU"
};

export function CommunityIntelligenceStudio() {
  const [topic, setTopic] = useState(TOPICS[0][0]);
  const [cohort, setCohort] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cohortRef = useRef("");
  const topicRef = useRef(topic);

  const loadReport = useCallback(async (requestedTopic = topicRef.current) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/community/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: requestedTopic, cohort: cohortRef.current || undefined, queryType: "WHAT_STUDENTS_EXPERIENCING" }), cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Không tải được báo cáo cộng đồng.");
      setData(payload.result);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải Community Reality Graph.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void loadReport(TOPICS[0][0]); }, 0);
    return () => clearTimeout(timer);
  }, [loadReport]);

  const signal = data?.communityReality?.signal || "UNKNOWN";
  const gap = data?.officialComparison || {};
  const isSuspicious = data?.independence?.syndicationWarning || signal === "APPARENT_CONSENSUS";

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="max-w-3xl"><div className="eyebrow text-emerald-300"><Users className="w-3.5 h-3.5" /> COMMUNITY REALITY GRAPH · T3</div><h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">Diễn đàn có thể kể chuyện. Hệ thống phải đo được nguồn gốc.</h2><p className="mt-3 text-sm leading-7 text-white/60">Tách trải nghiệm trực tiếp khỏi tin đồn, gom bài sao chép thành một nguồn, giữ lại ngoại lệ theo khóa/ngành và không cho số đông phủ quyết văn bản chính thức.</p></div>
          <form className="w-full xl:w-[410px] space-y-2" onSubmit={(event) => { event.preventDefault(); const matched = TOPICS.find((item) => item[1].toLowerCase() === query.trim().toLowerCase()); const requestedTopic = matched?.[0] || query.trim().toUpperCase().replace(/\s+/g, "_") || topicRef.current; topicRef.current = requestedTopic; setTopic(requestedTopic); loadReport(requestedTopic); }}><div className="flex gap-2"><label htmlFor="community-topic" className="sr-only">Chủ đề cộng đồng</label><input id="community-topic" value={query} onChange={(event) => setQuery(event.target.value)} className="input-glass flex-1" placeholder="Tìm chủ đề hoặc chọn bên dưới" /><button type="submit" className="button-primary px-4" disabled={loading}><Search className="w-4 h-4" /> Phân tích</button></div><div className="flex gap-2"><label htmlFor="community-cohort" className="sr-only">Lọc khóa</label><input id="community-cohort" value={cohort} onChange={(event) => { setCohort(event.target.value); cohortRef.current = event.target.value; }} className="input-glass flex-1" placeholder="Lọc theo khóa, ví dụ K24" /><span className="text-[11px] self-center text-white/35">lọc tùy chọn</span></div></form>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{TOPICS.map(([id, label]) => <button key={id} type="button" onClick={() => { topicRef.current = id; setTopic(id); setQuery(label); loadReport(id); }} className={`px-3 py-2 rounded-xl text-xs border transition-colors ${topic === id ? "bg-emerald-400/15 border-emerald-300/40 text-emerald-200" : "bg-white/[0.03] border-white/10 text-white/55 hover:text-white"}`}>{label}</button>)}</div>
      </section>

      {error && <div role="alert" className="surface-card p-4 border-rose-400/30 bg-rose-500/5 text-sm text-rose-200 flex gap-3"><XCircle className="w-5 h-5 shrink-0" />{error}</div>}
      {loading && !data ? <div className="surface-card py-16 flex flex-col items-center gap-3 text-white/50"><Loader2 className="w-6 h-6 animate-spin text-emerald-300" /><p className="text-sm">Đang gom provenance, phân nhóm cohort và đo độ độc lập…</p></div> : data && <>
        <section className="surface-card p-5 sm:p-6"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className={`status-chip ${isSuspicious ? "text-amber-200 bg-amber-400/10 border-amber-300/30" : "text-emerald-200 bg-emerald-400/10 border-emerald-300/30"}`}>{SIGNAL_LABELS[signal] || signal}</span><span className="status-chip text-white/55 bg-white/[0.03] border-white/10">{data.communityReality?.firstHandReportCount || 0} báo cáo trực tiếp</span></div><h3 className="mt-3 text-xl font-semibold text-white">Báo cáo vận hành: {data.topic}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{data.communityReality?.signalSummary || "Chưa có tóm tắt."}</p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[["Tác giả độc lập", data.independence?.uniqueAuthorsCount ?? 0], ["Cụm provenance", data.independence?.provenanceClustersCount ?? 0], ["Trung vị xử lý", data.communityReality?.medianObservedDays ? `${data.communityReality.medianObservedDays} ngày` : "—"], ["Friction", data.frictionSignals?.length ?? 0]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.035] border border-white/[0.07] p-3 min-w-[90px]"><p className="text-[11px] text-white/40">{label}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>)}</div></div>{isSuspicious && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 flex gap-3"><ShieldAlert className="w-5 h-5 text-amber-300 shrink-0" /><p className="text-sm leading-6 text-amber-100/75">{data.independence?.syndicationWarning || "Số lượng bài viết không được xem là số lượng bằng chứng độc lập."}</p></div>}</section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4"><article className="surface-card p-5"><div className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-cyan-300" /><h4 className="text-sm font-semibold text-white">Official vs. Reality Gap</h4></div><div className="mt-4 space-y-3"><Metric label="Mục tiêu chính thức" value={gap.officialTarget || "Chưa có nguồn đối chiếu"} tone="blue" /><Metric label="Quan sát thực tế" value={gap.communityObserved || "Chưa đủ quan sát"} tone="emerald" /><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-[11px] text-white/40">Trạng thái</p><p className="mt-1 text-sm font-semibold text-amber-200">{gap.gapStatus || "UNKNOWN"}</p><p className="mt-2 text-xs leading-5 text-white/55">{gap.gapExplanation || "Không suy diễn khi thiếu dữ liệu."}</p></div></div></article><article className="surface-card p-5"><div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-violet-300" /><h4 className="text-sm font-semibold text-white">Ngữ cảnh và ngoại lệ</h4></div><div className="mt-4 space-y-2 text-xs text-white/60"><p>Khóa quan sát: {(data.context?.cohorts || []).join(", ") || "Chưa phân đoạn"}</p><p>Khoa/ngành: {(data.context?.faculties || []).join(", ") || "Chưa phân đoạn"}</p><p>Khoảng thời gian: {data.recency?.timeRange || "Chưa rõ"}</p>{(data.edgeCases || []).slice(0, 3).map((item, index) => <div key={index} className="rounded-lg bg-amber-400/[0.05] border border-amber-400/10 p-3 text-amber-100/70">Ngoại lệ: {typeof item === "string" ? item : item.description || item.explanation || JSON.stringify(item)}</div>)}</div></article></section>

        <section className="surface-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-300" /><h4 className="text-sm font-semibold text-white">Bằng chứng trải nghiệm gốc</h4></div><span className="text-xs text-white/40">Không đồng nghĩa với policy</span></div><div className="mt-4 grid gap-3">{(data.firstHandEvidence || []).length === 0 ? <Empty text="Chưa có báo cáo trực tiếp cho bộ lọc này." /> : data.firstHandEvidence.map((item) => <article key={item.postId} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-mono text-emerald-300">{item.postId}</span><span className="text-[11px] text-white/40">{item.cohort || "Không rõ khóa"} · {item.durationDays ? `${item.durationDays} ngày` : "không có mốc ngày"}</span></div><p className="mt-2 text-sm leading-6 text-white/70">{item.statement}</p></article>)}</div></section>
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.04] p-4 text-xs leading-5 text-blue-100/65 flex gap-3"><CheckCircle2 className="w-4 h-4 shrink-0 text-blue-300" />{data.invariants?.disclaimer || "Trải nghiệm cộng đồng chỉ bổ sung ngữ cảnh; luôn đối chiếu nguồn chính thức trước quyết định."}</div>
      </>}
    </div>
  );
}

function Metric({ label, value, tone }) { return <div className={`rounded-xl border p-3 ${tone === "blue" ? "border-blue-400/15 bg-blue-400/[0.04]" : "border-emerald-400/15 bg-emerald-400/[0.04]"}`}><p className="text-[11px] text-white/40">{label}</p><p className="mt-1 text-sm text-white/75">{value}</p></div>; }
function Empty({ text }) { return <div className="p-8 text-center text-sm text-white/40 border border-dashed border-white/10 rounded-xl">{text}</div>; }
