"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

function initials(name) {
  return String(name || "Chuyên gia")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CG";
}

function domainLabel(domain) {
  return String(domain || "").replaceAll("_", " ");
}

function verificationLabel(expert) {
  return expert?.verificationSummary?.identity || (expert?.isVerified ? "VERIFIED" : "UNVERIFIED");
}

function scopeList(expert) {
  return (expert?.scopes || []).map((scope) => scope.domain).filter(Boolean);
}

function ExpertFacts({ expert }) {
  const scopes = scopeList(expert);
  return (
    <dl className="expert-public-facts">
      <div><dt>Domain</dt><dd>{scopes.length ? scopes.map(domainLabel).join(", ") : "Chưa công bố"}</dd></div>
      <div><dt>Qualification</dt><dd>{verificationLabel(expert)}</dd></div>
      <div><dt>Reputation</dt><dd>{expert?.reputationState || "Chưa có dữ liệu uy tín công khai"}</dd></div>
    </dl>
  );
}

export default function ExpertPublicDirectory({ experts = [], selected = null, query = "", domain = "ALL", onQueryChange, onDomainChange, onSelect, onRetry, loading = false, error = "" }) {
  const domains = useMemo(() => [...new Set(experts.flatMap(scopeList))], [experts]);
  const normalized = query.trim().toLocaleLowerCase("vi");
  const filtered = experts.filter((expert) => {
    const matchesDomain = domain === "ALL" || scopeList(expert).includes(domain);
    const searchable = `${expert.name || ""} ${expert.title || ""} ${expert.institution || ""} ${scopeList(expert).join(" ")}`.toLocaleLowerCase("vi");
    return matchesDomain && (!normalized || searchable.includes(normalized));
  });
  const featured = selected && filtered.some((expert) => expert.expertId === selected.expertId) ? selected : filtered[0] || null;

  return (
    <section className="expert-public-directory" aria-labelledby="expert-directory-title" id="expert-directory">
      <div className="expert-directory-heading">
        <div><span className="expert-kicker">Public directory</span><h2 id="expert-directory-title">Tìm người đúng chuyên môn</h2><p>Danh bạ chỉ hiển thị projection công khai từ provider. Không có bảng xếp hạng authority toàn cục.</p></div>
        <span className="expert-directory-count"><ShieldCheck size={14} /> {filtered.length} hồ sơ</span>
      </div>
      <div className="expert-directory-toolbar">
        <label className="unified-search"><Search size={16} /><span className="sr-only">Tìm chuyên gia</span><input value={query} onChange={(event) => onQueryChange?.(event.target.value)} placeholder="Tìm theo tên, trường hoặc lĩnh vực..." /></label>
        <select value={domain} onChange={(event) => onDomainChange?.(event.target.value)} aria-label="Lọc lĩnh vực chuyên gia"><option value="ALL">Tất cả lĩnh vực</option>{domains.map((item) => <option key={item} value={item}>{domainLabel(item)}</option>)}</select>
      </div>
      {loading && <div className="expert-directory-skeleton" role="status" aria-label="Đang tải danh bạ"><span /><span /><span /></div>}
      {error && <div className="community-state community-state-error expert-directory-error" role="alert"><div><strong>Không thể tải mạng lưới chuyên gia.</strong><p>{error}</p></div>{onRetry && <button type="button" onClick={onRetry}>Thử lại <ArrowRight size={14} /></button>}</div>}
      {!loading && !error && filtered.length === 0 && <div className="expert-directory-empty"><div className="expert-directory-empty-copy"><span className="expert-kicker">Public directory</span><strong>Chưa có hồ sơ chuyên gia khả dụng.</strong><p>Không dựng hồ sơ thay thế khi provider chưa trả về dữ liệu công khai.</p></div><div className="expert-directory-empty-media"><img src={V3_MEDIA.shared.emptyExpertFallback} alt="Không gian chờ cho hồ sơ chuyên gia công khai" loading="lazy" /><img src={V3_MEDIA.profile.expert} alt="Minh họa cấu trúc public profile chuyên gia" loading="lazy" /></div></div>}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="expert-directory-feature-layout">
            <article className="expert-featured-card">
              <figure><img src={V3_MEDIA.profile.expert} alt="Minh họa không gian hồ sơ chuyên gia" loading="lazy" /><figcaption>Selected public profile</figcaption></figure>
              <div className="expert-featured-copy"><span className="expert-kicker">Featured expert</span><h3>{featured?.name || "Hồ sơ chưa có tên"}</h3><p>{featured?.bio || "Chưa có tiểu sử công khai."}</p><ExpertFacts expert={featured} /><div className="expert-featured-actions"><button type="button" className="secondary-action" onClick={() => onSelect?.(featured)}>Chọn hồ sơ</button><Link href={`/expert/profile/${encodeURIComponent(featured.expertId)}`} className="text-link">Mở public profile <ArrowRight size={15} /></Link></div></div>
            </article>
            <div className="expert-domain-clusters" aria-labelledby="expert-domain-clusters-title"><div><span className="expert-kicker">Domain clusters</span><h3 id="expert-domain-clusters-title">Các phạm vi đang có</h3></div>{domains.length ? domains.map((item) => { const count = filtered.filter((expert) => scopeList(expert).includes(item)).length; return <button type="button" key={item} onClick={() => onDomainChange?.(item)} className={domain === item ? "is-active" : ""}><span>{domainLabel(item)}</span><strong>{count}</strong></button>; }) : <p>Chưa có domain công khai.</p>}</div>
          </div>
          <div className="expert-public-list" aria-label="Danh sách chuyên gia công khai">
            {filtered.map((expert) => {
              const verified = verificationLabel(expert) === "VERIFIED";
              return <article className={`expert-card expert-public-card ${selected?.expertId === expert.expertId ? "is-selected" : ""}`} key={expert.expertId}><button type="button" onClick={() => onSelect?.(expert)} aria-label={`Chọn hồ sơ ${expert.name || "chuyên gia"}`}><span className="expert-public-avatar">{initials(expert.name)}</span><span className="expert-public-copy"><strong>{expert.name || "Hồ sơ chưa có tên"}</strong><small>{expert.title || "Chuyên gia công khai"}</small><span>{expert.institution || "Chưa công bố tổ chức"}</span><span className="expert-domain-list">{scopeList(expert).length ? scopeList(expert).slice(0, 3).map((item) => <em key={item}><CheckCircle2 size={12} /> {domainLabel(item)}</em>) : <em>Chưa công bố domain</em>}</span></span><Building2 size={16} aria-hidden="true" /><span className={`expert-verification-state ${verified ? "is-verified" : ""}`}>{verified ? "Verified" : "Scope pending"}</span></button><Link href={`/expert/profile/${encodeURIComponent(expert.expertId)}`} className="expert-card-profile-link">Public profile <ArrowRight size={13} /></Link></article>;
            })}
          </div>
        </>
      )}
    </section>
  );
}
