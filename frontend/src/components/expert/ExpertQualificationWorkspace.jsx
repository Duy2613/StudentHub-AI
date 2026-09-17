"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  GraduationCap,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { EXPERT_LIFECYCLE_STATE } from "@/lib/auth/presentationState";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

/**
 * The 8 server-owned qualification states in canonical order.
 * CRITICAL SAFETY DIRECTIVE:
 * Qualification states are server-owned. The UI displays actual state returned
 * by the server without simulating client transitions.
 */
const QUALIFICATION_STATES = [
  { id: "PROFILE", label: "Profile", icon: UserCheck },
  { id: "IDENTITY_REVIEW", label: "Identity Review", icon: FileSearch },
  { id: "QUIZ_ELIGIBLE", label: "Quiz Eligible", icon: GraduationCap },
  { id: "QUIZ_IN_PROGRESS", label: "Quiz In Progress", icon: Clock3 },
  { id: "DOMAIN_REVIEW", label: "Domain Review", icon: FileCheck2 },
  { id: "ACTIVE", label: "Active", icon: ShieldCheck },
  { id: "REJECTED", label: "Rejected", icon: ShieldAlert, isTerminal: true },
  { id: "APPEALED", label: "Appealed", icon: RotateCcw, isTerminal: true },
];

function resolveActiveStateIndex(lifecycle, application) {
  if (!lifecycle || lifecycle === EXPERT_LIFECYCLE_STATE.NONE) return -1;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.APPLICATION) return 0; // Profile
  if (lifecycle === EXPERT_LIFECYCLE_STATE.IDENTITY_REVIEW) return 1; // Identity Review
  if (lifecycle === EXPERT_LIFECYCLE_STATE.QUIZ) {
    return application?.quizStatus === "IN_PROGRESS" ? 3 : 2; // Quiz In Progress or Quiz Eligible
  }
  if (lifecycle === EXPERT_LIFECYCLE_STATE.PRACTICE || lifecycle === EXPERT_LIFECYCLE_STATE.HUMAN_REVIEW) {
    return 4; // Domain Review
  }
  if (lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE) return 5; // Active
  if (lifecycle === EXPERT_LIFECYCLE_STATE.REJECTED) return 6; // Rejected
  if (lifecycle === EXPERT_LIFECYCLE_STATE.APPEALED) return 7; // Appealed
  return 0;
}

const COPY = {
  public: {
    title: "Mô hình qualification công khai 8 bước",
    body: "Toàn bộ lộ trình xác minh được phân định chặt chẽ: Profile → Identity Review → Quiz Eligible → Quiz In Progress → Domain Review → Active (hoặc Rejected / Appealed). Không có quyền hạn nào được tự sinh từ trình duyệt.",
  },
  none: {
    title: "Bạn chưa bắt đầu qualification",
    body: "Hồ sơ ứng viên và quyền expert được server quản lý. Không có authority được suy ra từ trình duyệt.",
  },
  active: {
    title: "Domain đã được kích hoạt",
    body: "Projection active chỉ xuất hiện khi server trả về trạng thái hợp lệ cho domain tương ứng.",
  },
  rejected: {
    title: "Hồ sơ chưa đạt thẩm định",
    body: "Hồ sơ đã được Hội đồng xem xét và từ chối. Bạn có thể nộp đơn phúc khảo (Appealed) nếu có chứng cứ bổ sung.",
  },
  appealed: {
    title: "Đơn phúc khảo đang được xem xét",
    body: "Hội đồng Chuyên môn độc lập đang thụ lý và đánh giá lại các căn cứ phúc khảo.",
  },
  pending: {
    title: "Qualification đang được xử lý",
    body: "Bước hiện tại được giữ nguyên theo lifecycle server. Reviewer mới là bên có quyền chuyển trạng thái.",
  },
};

function copyFor(lifecycle, publicView) {
  if (publicView) return COPY.public;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.NONE) return COPY.none;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE) return COPY.active;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.REJECTED) return COPY.rejected;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.APPEALED) return COPY.appealed;
  return COPY.pending;
}

export default function ExpertQualificationWorkspace({
  lifecycle = EXPERT_LIFECYCLE_STATE.NONE,
  application = null,
  publicView = false,
}) {
  const activeIndex = publicView ? -1 : resolveActiveStateIndex(lifecycle, application);
  const copy = copyFor(lifecycle, publicView);

  return (
    <section className="expert-qualification-workspace" aria-labelledby="expert-qualification-workspace-title" id="expert-qualification">
      <div className="expert-qualification-layout">
        <div className="expert-qualification-copy">
          <div className="expert-qualification-heading">
            <div>
              <span className="expert-kicker text-emerald-400 font-mono tracking-widest text-xs uppercase">QUALIFICATION PIPELINE · SERVER OWNED</span>
              <h2 id="expert-qualification-workspace-title" className="font-serif text-2xl text-slate-100 mt-1">
                Lộ trình 8 trạng thái thẩm định
              </h2>
            </div>
            <LockKeyhole size={19} className="text-slate-400" aria-hidden="true" />
          </div>

          <div className="expert-qualification-state">
            <div className="expert-state-mark">
              {!publicView && lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE ? (
                <CheckCircle2 size={21} className="text-emerald-400" />
              ) : !publicView && lifecycle === EXPERT_LIFECYCLE_STATE.REJECTED ? (
                <AlertCircle size={21} className="text-rose-400" />
              ) : (
                <Clock3 size={21} className="text-amber-400" />
              )}
            </div>
            <div>
              <strong className="text-slate-200">{copy.title}</strong>
              <p className="text-slate-400 text-sm mt-1">{copy.body}</p>
              <small className="expert-qualification-flow-note text-xs text-slate-500 font-mono block mt-2">
                Trạng thái: {publicView ? "PUBLIC PROJECTION" : lifecycle}
              </small>
              {!publicView && application?.updatedAt && (
                <small className="text-xs text-slate-500 font-mono">
                  Cập nhật gần nhất: {new Date(application.updatedAt).toLocaleDateString("vi-VN")}
                </small>
              )}
            </div>
          </div>

          {/* 8 Server-Owned States Display */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-3">
              Server State Sequence (8 Trạng thái thực)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUALIFICATION_STATES.map((stateItem, idx) => {
                const Icon = stateItem.icon;
                const isCurrent = idx === activeIndex;
                const isPassed = activeIndex >= 0 && idx < activeIndex && !stateItem.isTerminal;
                const isTerminalActive = isCurrent && stateItem.isTerminal;

                return (
                  <div
                    key={stateItem.id}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? isTerminalActive && stateItem.id === "REJECTED"
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                          : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : isPassed
                        ? "bg-white/[0.02] border-white/10 text-slate-300"
                        : "bg-black/20 border-white/5 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
                      <Icon size={13} className={isCurrent ? "text-emerald-400 animate-pulse" : ""} />
                    </div>
                    <strong className="text-[11px] block font-medium leading-tight">
                      {stateItem.label}
                    </strong>
                    <small className="text-[9px] font-mono block mt-0.5 opacity-75">
                      {isCurrent ? "ĐANG HIỆN DIỆN" : isPassed ? "HOÀN TẤT" : "CHỜ SERVER"}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="expert-qualification-footer mt-6">
            <span className="text-xs text-slate-400 inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              {publicView ? "Public model, status chưa được mở" : "Server-controlled authority validation"}
            </span>
            <Link href="/expert/profile" className="text-link inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
              {publicView ? "Bắt đầu với hồ sơ" : "Mở Expert Profile"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <figure className="expert-qualification-media">
          {/* qualification.webp is a visible journey surface for the semantic stages. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={V3_MEDIA.expert.qualification}
            alt="Minh họa lộ trình 8 trạng thái qualification từ Profile đến Active"
            loading="lazy"
            className="rounded-lg border border-white/10"
          />
          <figcaption className="text-xs text-slate-400 mt-2">
            Profile · Identity Review · Quiz Eligible · Quiz In Progress · Domain Review · Active · Rejected · Appealed
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
