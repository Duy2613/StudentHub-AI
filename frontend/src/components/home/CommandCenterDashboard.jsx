"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

const DEMO_DASHBOARD = Object.freeze({
  demo: true,
  provenance: "DEMO_FIXTURE",
  sourceState: "DEMO_FIXTURE",
  dataNotice: "Bản xem trước xác định cho cuộc thi — không phải hồ sơ học vụ trực tiếp.",
  digitalTwinSummary: {
    fullName: "Duy Nguyễn",
    earnedCredits: 48,
    totalRequiredCredits: 150,
    cgpa: 3.42,
    completionPercentage: 36,
    academicStanding: "SNAPSHOT",
  },
  urgentPriorities: [
    {
      priorityId: "demo-priority-01",
      urgency: "HIGH",
      title: "Đối chiếu nguồn trước khi đăng ký học phần",
      description: "Một thay đổi trong quy định fixture cần được mở cùng văn bản gốc.",
      explainableReason: "Demo minh họa cách Dashboard nối Academic với Evidence Passport.",
      href: "/cases?id=academic-conflict",
    },
    {
      priorityId: "demo-priority-02",
      urgency: "MEDIUM",
      title: "Kiểm tra tín hiệu cộng đồng liên quan",
      description: "Xem các quan sát fixture và phạm vi của chúng trước khi hành động.",
      explainableReason: "Community chỉ là tín hiệu bổ trợ, không thay thế nguồn chính thức.",
      href: "/cases?id=fake-scholarship",
    },
  ],
  nextBestAction: {
    actionId: "demo-next-action",
    title: "Mở Evidence Case Lab",
    description: "Xem đầy đủ nguồn, unknowns và các nhánh quyết định trong một case.",
    whyAmISeeingThis: "Demo được bật rõ ràng để trình diễn luồng kiểm chứng.",
    supportingEvidence: "DEMO_FIXTURE / Evidence Triangle",
    href: "/cases",
  },
  explainability: {
    sourceCount: 3,
    provenanceType: "DEMO_FIXTURE",
    privacyFilterActive: true,
  },
});

function Stat({ label, value, detail, icon: Icon, tone = "teal" }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow">{label}</span>
        <span className={`stat-icon ${tone}`}><Icon size={16} /></span>
      </div>
      <strong className="mt-4 block text-2xl font-extrabold tracking-tight text-white">{value}</strong>
      <span className="mt-1 block text-xs text-app-muted">{detail}</span>
    </div>
  );
}

function formatCredits(summary) {
  if (typeof summary?.earnedCredits !== "number") return "—";
  const total = typeof summary.totalRequiredCredits === "number" ? ` / ${summary.totalRequiredCredits}` : "";
  return `${summary.earnedCredits}${total}`;
}

function formatGpa(summary) {
  return typeof summary?.cgpa === "number" ? summary.cgpa.toFixed(2) : "—";
}

function normalizePriority(priority, index) {
  const urgency = String(priority?.urgency || priority?.impact || "MEDIUM").toUpperCase();
  return {
    id: priority?.priorityId || priority?.insightId || `priority-${index}`,
    tone: urgency === "CRITICAL" ? "danger" : urgency === "HIGH" ? "warning" : "neutral",
    label: urgency === "CRITICAL" ? "Khẩn cấp" : urgency === "HIGH" ? "Cần xử lý" : "Theo dõi",
    title: priority?.title || "Ưu tiên chưa có tiêu đề",
    meta: priority?.deadline ? `Hạn ${priority.deadline}` : "Ưu tiên từ hồ sơ hiện tại",
    why: priority?.explainableReason || priority?.whyAmISeeingThis || priority?.description || "Chưa có lý do được cung cấp.",
    href: priority?.href || "/trust",
  };
}

export default function CommandCenterDashboard() {
  const { session, profile, isDemoMode, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [openAction, setOpenAction] = useState(null);
  const [askPrompt, setAskPrompt] = useState("");

  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;

    if (isDemoMode) {
      setData(DEMO_DASHBOARD);
      setState("demo");
      return undefined;
    }

    if (!session) {
      setData(null);
      setState("unauthenticated");
      return undefined;
    }

    setState("loading");
    setError("");

    fetch("/api/v1/dashboard", { credentials: "include" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success !== true) {
          throw new Error(payload?.error?.userMessage || payload?.error?.message || `Không thể nạp Dashboard (${response.status}).`);
        }
        return payload.data;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setState("ready");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setData(null);
          setError(requestError.message || "Không thể nạp dữ liệu Dashboard.");
          setState("error");
        }
      });

    return () => { cancelled = true; };
  }, [authLoading, isDemoMode, session]);

  const summary = data?.digitalTwinSummary || {};
  const actions = useMemo(() => {
    const priorities = Array.isArray(data?.urgentPriorities) ? data.urgentPriorities : [];
    const normalized = priorities.map(normalizePriority);
    if (normalized.length > 0) return normalized;
    if (data?.nextBestAction) return [normalizePriority({ ...data.nextBestAction, urgency: "MEDIUM", href: data.nextBestAction.href || "/trust" }, 0)];
    return [];
  }, [data]);
  const sourceState = data?.sourceState || data?.explainability?.sourceState || (data?.demo ? "DEMO_FIXTURE" : "UNKNOWN");
  const isExplicitDemo = data?.demo === true || sourceState === "DEMO_FIXTURE";
  const sourceLabel = isExplicitDemo ? "DEMO_FIXTURE" : sourceState === "LIVE" ? "LIVE_SOURCE" : "SNAPSHOT / CẦN KẾT NỐI";
  const displayName = summary.fullName || profile?.fullName || "Sinh viên";

  if (authLoading || state === "loading") {
    return <div className="empty-state" role="status" aria-live="polite">Đang nạp Margin và dữ liệu ưu tiên của bạn…</div>;
  }

  if (state === "unauthenticated") {
    return (
      <section className="surface-card p-6 sm:p-8" aria-labelledby="dashboard-auth-title">
        <p className="eyebrow">VI · Command Center</p>
        <h1 id="dashboard-auth-title" className="mt-3 text-2xl font-black text-white sm:text-3xl">Đăng nhập để mở Next Clear Move</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Dashboard chỉ hiển thị trạng thái được cấp quyền. Không có phiên đăng nhập, hệ thống sẽ không tự dựng cảnh báo, lịch học hay điểm số.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login" className="primary-action">Đăng nhập <ArrowRight size={16} /></Link>
          <Link href="/cases" className="secondary-action">Xem Demo Mode có nhãn <ArrowRight size={14} /></Link>
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="surface-card p-6 sm:p-8" role="alert">
        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 text-amber-300" size={20} /><div><p className="eyebrow">Dashboard chưa sẵn sàng</p><h1 className="mt-2 text-xl font-bold text-white">Không tự thay thế dữ liệu bằng fixture</h1><p className="mt-2 text-sm leading-7 text-slate-300">{error}</p><Link href="/settings" className="text-link mt-4">Kiểm tra kết nối dữ liệu <ArrowRight size={14} /></Link></div></div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-hero surface-card overflow-hidden p-5 sm:p-7">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2"><p className="eyebrow text-teal-300">VI · Quiet priority ledger</p><span className="metadata-chip" data-provider-status={isExplicitDemo ? "unknown" : "clean"}>{sourceLabel}</span></div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{displayName}, bước rõ ràng tiếp theo là gì?</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">Dashboard nối Trust, Community, Expert và Academic thành một hàng ưu tiên có thể giải thích. Mỗi hàng cho biết điều gì, vì sao và mở ở đâu.</p>
          </div>
          <Link href={data?.nextBestAction?.href || "/trust"} className="primary-action shrink-0">Mở bước tiếp theo <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-app-muted"><span className="flex items-center gap-2"><span className="status-dot" /> Nguồn: {sourceLabel}</span><span className="flex items-center gap-2"><ShieldCheck size={14} className="text-teal-300" /> Không có căn cứ thì không tạo cảnh báo</span></div>
      </section>

      {data?.dataNotice ? <div className="truth-note mt-0" role="note"><AlertTriangle size={15} /><span>{data.dataNotice}</span></div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tóm tắt dữ liệu được cấp quyền">
        <Stat label="Tín chỉ tích lũy" value={formatCredits(summary)} detail={typeof summary.completionPercentage === "number" ? `${summary.completionPercentage}% lộ trình` : "Chưa có tỷ lệ hoàn thành"} icon={GraduationCap} />
        <Stat label="GPA tích lũy" value={formatGpa(summary)} detail={summary.academicStanding || "Chưa có xếp loại"} icon={TrendingUp} tone="indigo" />
        <Stat label="Mục tiêu tiến độ" value={typeof summary.completionPercentage === "number" ? `${summary.completionPercentage}%` : "—"} detail="Tính từ hồ sơ hiện tại" icon={Zap} tone="amber" />
        <Stat label="Ưu tiên cần xử lý" value={String(actions.length).padStart(2, "0")} detail={actions.length ? "Có căn cứ trong context" : "Không có cảnh báo mới"} icon={AlertTriangle} tone="rose" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.8fr)]">
        <section className="surface-card p-5 sm:p-6" aria-labelledby="next-actions-title"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Next best actions</p><h2 id="next-actions-title" className="section-title mt-2">Việc cần làm trước</h2></div><span className="text-xs text-app-muted">{actions.length} hàng có căn cứ</span></div>
          {actions.length ? <div className="mt-5 space-y-3">{actions.map((action) => <article key={action.id} className={`action-row ${action.tone}`}><div className="flex min-w-0 flex-1 gap-3"><span className="action-marker">{action.tone === "danger" ? <AlertTriangle size={16} /> : action.tone === "warning" ? <Clock3 size={16} /> : <CheckCircle2 size={16} />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="action-label">{action.label}</span><span className="text-[11px] text-app-muted">{action.meta}</span></div><h3 className="mt-1 text-sm font-bold text-white">{action.title}</h3>{openAction === action.id && <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-slate-300"><strong className="text-teal-300">Vì sao bạn thấy việc này: </strong>{action.why}</p>}</div></div><div className="flex shrink-0 items-start gap-2"><button type="button" onClick={() => setOpenAction(openAction === action.id ? null : action.id)} className="secondary-action" aria-expanded={openAction === action.id}><CircleHelp size={14} /><span className="hidden sm:inline">Tại sao?</span><ChevronDown size={13} className={openAction === action.id ? "rotate-180" : ""} /></button><Link href={action.href} className="icon-action" aria-label={`Mở ${action.title}`}><ArrowRight size={16} /></Link></div></article>)}</div> : <div className="empty-state mt-5">Chưa có ưu tiên đủ căn cứ. Dashboard sẽ không tự điền cảnh báo.</div>}
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/trust" className="text-link">Mở Trust Engine <ArrowRight size={14} /></Link><Link href="/settings" className="text-link muted">Cài đặt quyền dữ liệu <ArrowRight size={14} /></Link></div>
        </section>

        <aside className="space-y-6"><section className="surface-card p-5"><div className="flex items-center gap-2"><CalendarClock size={16} className="text-teal-300" /><p className="eyebrow">Context hiện tại</p></div><p className="mt-3 text-sm leading-6 text-slate-300">{data?.nextBestAction?.description || "Chưa có bước tiếp theo được hệ thống xác định."}</p><Link href={data?.nextBestAction?.href || "/trust"} className="text-link mt-4">Mở căn cứ <ArrowRight size={14} /></Link></section><section className="surface-card p-5"><p className="eyebrow">Hỏi nhanh</p><h2 className="mt-2 text-lg font-bold text-white">Cần kiểm tra điều gì?</h2><div className="mt-4 flex gap-2"><input value={askPrompt} onChange={(event) => setAskPrompt(event.target.value)} placeholder="Ví dụ: điều kiện tốt nghiệp" className="field-input min-w-0 flex-1" aria-label="Câu hỏi cho AI" /><Link href={`/trust?q=${encodeURIComponent(askPrompt || "Điều kiện tốt nghiệp")}`} className="primary-icon" aria-label="Mở Trust Engine"><Sparkles size={16} /></Link></div><div className="mt-4 flex flex-wrap gap-2"><Link href="/trust?q=điều kiện tốt nghiệp" className="suggestion-chip">Điều kiện tốt nghiệp</Link><Link href="/trust" className="suggestion-chip">Kiểm tra bằng chứng</Link></div></section></aside>
      </div>

      <section className="surface-card grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"><div className="flex gap-3"><span className="stat-icon teal"><MessageCircle size={17} /></span><div><p className="eyebrow">Mạng lưới xác thực</p><h2 className="mt-2 text-lg font-bold text-white">Khi chưa chắc, hãy xem nguồn trước khi quyết định</h2><p className="mt-1 text-sm text-app-muted">{isExplicitDemo ? "Fixture minh họa Evidence Triangle — không đại diện cho cá nhân hay tổ chức thật." : "Trust, Expert, Community và Evidence được nối trong cùng một luồng giải thích."}</p></div></div><Link href={isExplicitDemo ? "/cases" : "/trust"} className="secondary-action justify-center"><UserRound size={14} /> {isExplicitDemo ? "Mở Demo Case Lab" : "Mở Trust Engine"} <ArrowRight size={14} /></Link></section>
    </div>
  );
}
