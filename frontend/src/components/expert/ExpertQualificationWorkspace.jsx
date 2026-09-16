"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { EXPERT_LIFECYCLE_STATE } from "@/lib/auth/presentationState";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

const STEPS = [
  ["IDENTITY", "Identity"],
  ["KNOWLEDGE", "Knowledge"],
  ["PRACTICAL_REVIEW", "Practical review"],
  ["HUMAN_EVALUATION", "Human evaluation"],
  ["ACTIVE", "Active authority"],
];

const LIFECYCLE_INDEX = Object.freeze({
  [EXPERT_LIFECYCLE_STATE.APPLICATION]: 0,
  [EXPERT_LIFECYCLE_STATE.IDENTITY_REVIEW]: 0,
  [EXPERT_LIFECYCLE_STATE.QUIZ]: 1,
  [EXPERT_LIFECYCLE_STATE.PRACTICE]: 2,
  [EXPERT_LIFECYCLE_STATE.HUMAN_REVIEW]: 3,
  [EXPERT_LIFECYCLE_STATE.ACTIVE]: 4,
});

const COPY = {
  public: { title: "Mô hình qualification công khai", body: "Danh tính, kiến thức, thực hành và human review là các lớp riêng. Trạng thái của từng ứng viên chỉ đọc từ server sau khi đăng nhập." },
  none: { title: "Bạn chưa bắt đầu qualification", body: "Hồ sơ ứng viên và quyền expert được server quản lý. Không có authority được suy ra từ trình duyệt." },
  active: { title: "Domain đã được kích hoạt", body: "Projection active chỉ xuất hiện khi server trả về trạng thái hợp lệ cho domain tương ứng." },
  pending: { title: "Qualification đang được xử lý", body: "Bước hiện tại được giữ nguyên theo lifecycle server. Reviewer mới là bên có quyền chuyển trạng thái." },
};

function copyFor(lifecycle, publicView) {
  if (publicView) return COPY.public;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.NONE) return COPY.none;
  if (lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE) return COPY.active;
  return COPY.pending;
}

export default function ExpertQualificationWorkspace({ lifecycle = EXPERT_LIFECYCLE_STATE.NONE, application = null, publicView = false }) {
  const currentIndex = publicView ? -1 : (LIFECYCLE_INDEX[lifecycle] ?? -1);
  const copy = copyFor(lifecycle, publicView);
  return (
    <section className="expert-qualification-workspace" aria-labelledby="expert-qualification-workspace-title" id="expert-qualification">
      <div className="expert-qualification-layout">
        <div className="expert-qualification-copy">
          <div className="expert-qualification-heading"><div><span className="expert-kicker">Qualification model</span><h2 id="expert-qualification-workspace-title">Một lộ trình, quyền hạn rõ ràng</h2></div><LockKeyhole size={19} aria-hidden="true" /></div>
          <div className="expert-qualification-state"><div className="expert-state-mark">{!publicView && lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE ? <CheckCircle2 size={21} /> : <Clock3 size={21} />}</div><div><strong>{copy.title}</strong><p>{copy.body}</p><small className="expert-qualification-flow-note">Hồ sơ → quiz → review domain → human evaluation.</small>{!publicView && application?.updatedAt && <small>Cập nhật gần nhất: {new Date(application.updatedAt).toLocaleDateString("vi-VN")}</small>}</div></div>
          <ol className="expert-qualification-steps">{STEPS.map(([step, label], index) => <li key={step} className={index <= currentIndex ? "is-complete" : index === currentIndex + 1 ? "is-next" : ""}><span>{index < currentIndex ? <CheckCircle2 size={14} /> : index + 1}</span><strong>{label}</strong></li>)}</ol>
          <div className="expert-qualification-footer"><span><ShieldCheck size={14} /> {publicView ? "Public model, status chưa được mở" : "Không có quyền authority ở bước này"}</span><Link href="/expert/profile" className="text-link">{publicView ? "Bắt đầu với hồ sơ" : "Mở Expert Profile"} <ArrowRight size={14} /></Link></div>
        </div>
        <figure className="expert-qualification-media">
          {/* qualification.webp is a visible journey surface for the five semantic stages. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={V3_MEDIA.expert.qualification} alt="Minh họa hành trình từ identity đến human evaluation" loading="lazy" />
          <figcaption>Identity, knowledge, practical review, human evaluation, active authority</figcaption>
        </figure>
      </div>
    </section>
  );
}
