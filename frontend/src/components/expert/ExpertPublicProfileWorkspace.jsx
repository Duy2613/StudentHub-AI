"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Building2, CheckCircle2, FileSearch, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

function domainLabel(domain) {
  return String(domain || "").replaceAll("_", " ");
}

function PublicList({ title, items, empty }) {
  return (
    <section className="expert-profile-public-list" aria-labelledby={`public-list-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <span className="expert-kicker">{title}</span>
      <h2 id={`public-list-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h2>
      {items.length ? <ul>{items.map((item, index) => <li key={`${item.title || item.roleTitle || item.type || "item"}-${index}`}><strong>{item.title || item.roleTitle || item.type || "Public record"}</strong><span>{item.venue || item.organization || item.issuer || item.field || "Chưa có mô tả thêm"}</span>{item.year && <small>{item.year}</small>}</li>)}</ul> : <p>{empty}</p>}
    </section>
  );
}

export default function ExpertPublicProfileWorkspace() {
  const params = useParams();
  const expertId = typeof params?.expertId === "string" ? params.expertId : "";
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal) => {
    if (!expertId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiRequest(`/api/expert/profile/${encodeURIComponent(expertId)}`, { signal, requestId: createSecureId("expert-public-profile") });
      setExpert(payload?.expert || null);
      if (!payload?.expert) setError("Không tìm thấy hồ sơ chuyên gia.");
    } catch (caught) {
      if (caught?.code !== "ABORTED") setError(apiErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [expertId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort("expert-public-profile-unmounted");
  }, [load]);

  if (loading) return <div className="unified-workspace expert-public-profile-workspace"><Link href="/expert" className="text-link"><ArrowLeft size={15} /> Quay lại Expert</Link><div className="expert-public-profile-skeleton" role="status" aria-label="Đang tải public profile"><span /><span /><span /><span /></div></div>;
  if (error || !expert) return <div className="unified-workspace expert-public-profile-workspace"><Link href="/expert" className="text-link"><ArrowLeft size={15} /> Quay lại Expert</Link><div className="community-state community-state-error" role="alert"><div><strong>Không thể tải public profile.</strong><p>{error || "Hồ sơ chưa có dữ liệu công khai."}</p></div><button type="button" onClick={() => void load()}><RefreshCw size={14} /> Thử lại</button></div></div>;

  const scopes = Array.isArray(expert.scopes) ? expert.scopes : [];
  const credentials = Array.isArray(expert.credentials) ? expert.credentials : [];
  const publications = Array.isArray(expert.publications) ? expert.publications : [];
  const roles = Array.isArray(expert.roles) ? expert.roles : [];
  const stars = Array.isArray(expert.earnedStars) ? expert.earnedStars : [];
  const verified = expert.verificationSummary?.identity === "VERIFIED";

  return (
    <div className="unified-workspace expert-public-profile-workspace">
      <Link href="/expert" className="text-link"><ArrowLeft size={15} /> Quay lại Expert</Link>
      <header className="expert-public-profile-hero">
        <div className="expert-public-profile-hero-image" aria-hidden="true" />
        <div className="expert-public-profile-identity"><span className="expert-kicker">Public expert profile</span><h1>{expert.name || "Chuyên gia chưa công bố tên"}</h1><p>{expert.bio || "Chưa có tiểu sử công khai."}</p><div className="expert-profile-identity-facts"><span><Building2 size={14} /> {expert.institution || "Chưa công bố tổ chức"}</span><span>{expert.department || "Chưa công bố bộ môn"}</span><span className={verified ? "is-verified" : ""}><ShieldCheck size={14} /> {verified ? "Identity projection verified" : "Identity chưa được xác nhận trong projection"}</span></div></div>
        <figure><img src={V3_MEDIA.profile.expert} alt="Minh họa không gian public profile chuyên gia" loading="eager" /><figcaption>Profile atmosphere</figcaption></figure>
      </header>

      <section className="expert-public-profile-scope" aria-labelledby="expert-public-profile-scope-title"><div><span className="expert-kicker">Scope and qualification</span><h2 id="expert-public-profile-scope-title">Phạm vi được đọc trước danh xưng</h2><p>{expert.authorityBoundaries?.warning || "Ý kiến chuyên gia chỉ có giá trị trong phạm vi dữ liệu công khai được trả về."}</p></div><div className="expert-profile-scope-grid"><div><span>Qualification state</span><strong>{expert.status || "Chưa có trạng thái"}</strong></div><div><span>Reputation state</span><strong>{expert.reputationState || "Chưa có dữ liệu"}</strong></div><div><span>Recorded stars</span><strong>{stars.length}</strong></div></div></section>

      <section className="expert-public-domain-list" aria-labelledby="expert-public-domain-title"><div className="expert-profile-section-heading"><div><span className="expert-kicker">Verified scope projection</span><h2 id="expert-public-domain-title">Domain</h2></div><ShieldCheck size={18} aria-hidden="true" /></div>{scopes.length ? <div className="expert-public-domain-grid">{scopes.map((scope) => <article key={`${scope.domain}-${scope.subdomain || "scope"}`}><span className="expert-domain-level">{scope.level || "Scope"}</span><strong>{domainLabel(scope.domain)}</strong><p>{scope.subdomain || scope.jurisdiction || "Phạm vi con chưa công bố"}</p></article>)}</div> : <div className="community-state"><strong>Chưa có domain công khai.</strong><p>Không suy ra phạm vi từ title, institution hoặc reputation.</p></div>}</section>

      <div className="expert-public-profile-records"><PublicList title="Credentials" items={credentials} empty="Chưa có credential công khai." /><PublicList title="Publications" items={publications} empty="Chưa có publication công khai." /><PublicList title="Roles" items={roles} empty="Chưa có role công khai." /></div>

      <section className="expert-public-profile-activity" aria-labelledby="expert-public-profile-activity-title"><div><span className="expert-kicker">Public activity</span><h2 id="expert-public-profile-activity-title">Recent reviews and contributions</h2><p>Chỉ hiển thị khi API profile trả về activity tương ứng. Hồ sơ hiện không tự tạo review, Community response hoặc Trust case.</p></div><div className="expert-activity-empty"><FileSearch size={18} /><strong>Activity chưa có trong projection.</strong><span>Không có dữ liệu để hiển thị ở đây.</span></div></section>

      <section className="expert-public-profile-actions" aria-label="Cross pillar navigation"><Link href="/community" className="text-link"><MessageSquare size={15} /> Xem Community responses <ArrowRight size={15} /></Link><Link href="/trust" className="text-link"><CheckCircle2 size={15} /> Xem Trust reviews <ArrowRight size={15} /></Link><Link href={`/login?next=%2Fexpert%2Fprofile%2F${encodeURIComponent(expertId)}`} className="primary-action"><BookOpen size={15} /> Đăng nhập để yêu cầu review</Link></section>
    </div>
  );
}
