"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { EXPERT_LIFECYCLE_STATE, normalizeExpertLifecycleState } from "@/lib/auth/presentationState";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import ExpertQualificationPanel from "./ExpertQualificationPanel";

export default function ExpertProfileWorkspace() {
  const { profile, isAuthenticated, isLoading, status } = useAuth();
  const [lifecycle, setLifecycle] = useState(EXPERT_LIFECYCLE_STATE.NONE);
  const [application, setApplication] = useState(null);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const controller = new AbortController();
    apiRequest("/api/expert/qualification", { signal: controller.signal, requestId: createSecureId("expert-profile-read") })
      .then((payload) => {
        const data = payload?.data || {};
        setLifecycle(normalizeExpertLifecycleState(data.state));
        setApplication(data.application || null);
        setDomains(Array.isArray(data.application?.approvedDomains) ? data.application.approvedDomains : []);
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setError(apiErrorMessage(caught));
      });
    return () => controller.abort("expert-profile-unmounted");
  }, [isAuthenticated]);

  if (isLoading || status === "UNKNOWN") return <div className="workspace-loading" role="status">Đang xác minh phiên và đọc hồ sơ…</div>;
  if (status === "ERROR") {
    return <div className="unified-workspace unified-expert-profile-workspace"><section className="unified-auth-empty" role="alert"><UserRoundCheck size={25} /><h1>Không thể xác minh phiên</h1><p>Dịch vụ xác thực hiện chưa khả dụng. Vui lòng thử lại sau.</p><Link href="/" className="secondary-action">Về trang chủ</Link></section></div>;
  }
  if (status === "ANONYMOUS" || !isAuthenticated) {
    return <div className="unified-workspace unified-expert-profile-workspace"><section className="unified-auth-empty"><UserRoundCheck size={25} /><h1>Hồ sơ chuyên gia</h1><p>Đăng nhập để bắt đầu hoặc tiếp tục qualification. Hồ sơ này không dùng chung với vai trò của User Profile.</p><Link href="/login?next=%2Fexpert%2Fprofile" className="primary-action">Đăng nhập</Link></section></div>;
  }

  const isActive = lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE;
  const publicName = application?.profile?.displayName || profile?.fullName || "Chuyên gia StudentHub";
  const publicBio = application?.profile?.bio || profile?.bio || "Chưa có tiểu sử công khai.";

  return (
    <div className="unified-workspace unified-expert-profile-workspace">
      <header className="unified-page-intro"><div><span className="data-label">Expert Profile · {isActive ? "active" : "qualification"}</span><h1>{isActive ? publicName : "Hồ sơ chuyên gia của bạn"}</h1><p>{isActive ? "Đây là projection công khai của qualification đã được server xác nhận; quyền thao tác vẫn mở ở Expert Dashboard." : "Expert Profile là lộ trình qualification riêng. Không chỉnh role trong User Profile và không suy ra authority từ trình duyệt."}</p></div><div className="unified-intro-mark"><ShieldCheck size={22} /><span>{isActive ? "ACTIVE EXPERT" : "SERVER CONTROLLED"}</span><strong>{lifecycle}</strong></div></header>
      {error && <div className="community-state community-state-error" role="alert">{error}</div>}
      {isActive ? (
        <>
          <section className="expert-profile-active-card" aria-labelledby="active-expert-profile-title"><div className="expert-profile-active-heading"><span className="expert-profile-active-icon"><CheckCircle2 size={22} /></span><div><span className="data-label">Public expert projection</span><h2 id="active-expert-profile-title">{publicName}</h2><p>{publicBio}</p></div></div><div className="expert-profile-active-grid"><div><span className="data-label">Verified domains</span><strong>{domains.length ? domains.map((domain) => domain.replaceAll("_", " ")).join(" · ") : "Chưa có dữ liệu"}</strong></div><div><span className="data-label">Reputation state</span><strong>{application?.reputationState || "Chưa đủ dữ liệu uy tín"}</strong></div><div><span className="data-label">Earned stars</span><strong>{Array.isArray(application?.earnedStars) && application.earnedStars.length ? application.earnedStars.length : "Chưa có xếp hạng sao"}</strong></div><div><span className="data-label">Assessment stats</span><strong>Chưa có dữ liệu</strong></div><div><span className="data-label">Mission summary</span><strong>Chưa có dữ liệu</strong></div></div><p className="expert-profile-boundary"><ShieldCheck size={15} /> Domain, reputation state, earned stars và authority chỉ đọc từ server; không có nút chỉnh sửa ở đây.</p></section>
          <Link href="/expert" className="primary-action expert-profile-dashboard-link">Mở Expert Dashboard <ArrowRight size={15} /></Link>
        </>
      ) : (
        <ExpertQualificationPanel />
      )}
      <section className="expert-profile-linked-note"><span className="data-label">Identity boundary</span><p>User Profile là nơi chỉnh tên, avatar, bio và thông tin học tập. Expert Profile chỉ phản ánh qualification và domain do server quản lý.</p><Link href="/profile" className="text-link">Mở User Profile <ArrowRight size={14} /></Link></section>
    </div>
  );
}
