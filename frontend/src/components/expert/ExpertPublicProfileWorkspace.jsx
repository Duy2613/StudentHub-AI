"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, CalendarDays, CircleHelp, ExternalLink, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiRequest } from "@/lib/api/runtimeClient";
import { apiErrorMessage } from "@/lib/api/runtimeError";
import { createSecureId } from "@/lib/security/secureId";
import { markExpertV4Timing } from "@/lib/performance/expertV4Timing";
import RequestExpertReviewSheet from "./RequestExpertReviewSheet";
import styles from "./expert-v4.module.css";

function domainLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function PublicRecords({ title, records, kind }) {
  return (
    <section className={styles.profileSection} aria-labelledby={`expert-profile-${kind}`}>
      <div className={styles.profileSectionHeading}>
        <span className={styles.eyebrow}>{kind === "credentials" ? "CREDENTIALS" : "SELECTED WORK"}</span>
        <h2 id={`expert-profile-${kind}`}>{title}</h2>
      </div>
      {records.length ? <ul className={styles.recordList}>
        {records.map((record, index) => {
          const key = `${record.title || record.type || record.field || kind}-${index}`;
          const doi = typeof record.doi === "string" && /^10\.\d{4,9}\//.test(record.doi) ? record.doi : null;
          return <li key={key}>
            <strong>{record.title || record.type || record.field || "Public record"}</strong>
            <span>{[record.venue, record.issuer, record.field, record.domain].filter(Boolean).join(" · ") || "Mô tả chưa được công bố"}</span>
            <div className={styles.recordMeta}>
              {record.year && <span><CalendarDays size={13} /> {record.year}</span>}
              {record.issuedYear && <span><CalendarDays size={13} /> Cấp năm {record.issuedYear}</span>}
              {record.status && <span><ShieldCheck size={13} /> Trạng thái: {String(record.status).replaceAll("_", " ")}</span>}
              {doi && <a href={`https://doi.org/${encodeURIComponent(doi)}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> DOI {doi}</a>}
            </div>
          </li>;
        })}
      </ul> : <p className={styles.unknownCopy}>Chưa có dữ liệu công khai trong hồ sơ này.</p>}
    </section>
  );
}

export default function ExpertPublicProfileWorkspace() {
  const params = useParams();
  const expertId = typeof params?.expertId === "string" ? params.expertId : "";
  const { isAuthenticated } = useAuth();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoFixture, setDemoFixture] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    markExpertV4Timing("profile.hydration-complete");
  }, []);

  const load = useCallback(async (signal) => {
    if (!expertId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiRequest(`/api/expert/profile/${encodeURIComponent(expertId)}`, {
        signal,
        requestId: createSecureId("expert-public-profile"),
      });
      const isDemoFixture = payload?.meta?.sourceState === "DEMO_FIXTURE";
      setDemoFixture(isDemoFixture);
      if (isDemoFixture && process.env.NODE_ENV === "production") {
        setExpert(null);
        setError("Development fixture profiles are not available in production.");
        return;
      }
      setExpert(payload?.expert || null);
      if (!payload?.expert) setError("Hồ sơ không có dữ liệu công khai.");
    } catch (caught) {
      if (caught?.code !== "ABORTED") setError(apiErrorMessage(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [expertId]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) void load(controller.signal);
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort("expert-public-profile-unmounted");
    };
  }, [load]);

  useEffect(() => {
    if (!loading) markExpertV4Timing("profile.usable");
  }, [error, expert, loading]);

  if (loading) return <div className={`unified-workspace ${styles.profile}`}><Link href="/expert" className={styles.backLink}><ArrowLeft size={15} /> Danh bạ chuyên gia</Link><div className={styles.profileSkeleton} role="status" aria-label="Đang tải hồ sơ"><span /><span /><span /></div></div>;
  if (error || !expert) return <div className={`unified-workspace ${styles.profile}`}><Link href="/expert" className={styles.backLink}><ArrowLeft size={15} /> Danh bạ chuyên gia</Link><div className={styles.profileError} role="alert"><strong>Không thể tải hồ sơ công khai.</strong><p>{error || "Hồ sơ chưa có dữ liệu."}</p><button type="button" onClick={() => void load()}>Thử lại</button></div></div>;

  const scopes = Array.isArray(expert.scopes) ? expert.scopes : [];
  const credentials = Array.isArray(expert.credentials) ? expert.credentials : [];
  const publications = Array.isArray(expert.publications) ? expert.publications : [];
  const outsideScopes = Array.isArray(expert.authorityBoundaries?.outOfScopeDomains) ? expert.authorityBoundaries.outOfScopeDomains : [];
  const meaningfulRoles = (Array.isArray(expert.roles) ? expert.roles : []).filter((role) =>
    role && (role.organization || role.validFrom || role.validUntil)
    && !["DOMAIN_VERIFIED_EXPERT", "MEMBER"].includes(String(role.roleTitle || "").toUpperCase()));

  return (
    <div className={`unified-workspace ${styles.profile}`}>
      <Link href="/expert" className={styles.backLink}><ArrowLeft size={15} /> Danh bạ chuyên gia</Link>

      {demoFixture && <p className={styles.demoEvidence} role="note"><CircleHelp size={16} /> DEVELOPMENT FIXTURE — hồ sơ mẫu chỉ để xem giao diện; không phải người dùng thật, không phải bằng chứng xác thực và không nhận yêu cầu.</p>}

      <header className={styles.profileHeader}>
        <div className={styles.profileMonogram} aria-hidden="true">{String(expert.name || "CG").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi")}</div>
        <div>
          <span className={styles.eyebrow}>HỒ SƠ CHUYÊN GIA CÔNG KHAI</span>
          <h1>{expert.name || "Chưa công bố tên"}</h1>
          {expert.title && <p className={styles.profileTitle}>{expert.title}</p>}
          <p className={styles.profileBio}>{expert.bio || "Chưa có tiểu sử công khai."}</p>
          <div className={styles.identityMetadata}>
            {expert.institution && <span><Building2 size={15} /> {expert.institution}{expert.department ? ` · ${expert.department}` : ""}</span>}
            {!expert.institution && <span>Đơn vị công tác: chưa có dữ liệu công khai</span>}
            <span className={styles.identityBoundary}><ShieldCheck size={15} /> Phạm vi được đọc theo domain có trong hồ sơ; danh xưng không mở rộng thẩm quyền.</span>
          </div>
        </div>
      </header>

      <section className={styles.profileSection} aria-labelledby="expert-profile-can-evaluate">
        <div className={styles.profileSectionHeading}>
          <span className={styles.eyebrow}>SCOPE</span>
          <h2 id="expert-profile-can-evaluate">Có thể đánh giá trong phạm vi đã công bố</h2>
          <p>{expert.authorityBoundaries?.warning || "Ý kiến chuyên gia không thay thế kết luận Trust hoặc văn bản có thẩm quyền."}</p>
        </div>
        {scopes.length ? <ul className={styles.scopeList}>
          {scopes.map((scope, index) => <li key={`${scope.domain || "scope"}-${scope.subdomain || index}`}>
            <span className={styles.scopeMark}><GraduationCap size={17} /></span>
            <span><strong>{domainLabel(scope.domain) || "Domain chưa có tên"}</strong><small>{scope.subdomain || scope.jurisdiction || "Phạm vi con chưa được công bố"}</small></span>
            {scope.level && <span className={styles.scopeLevel}>{domainLabel(scope.level)}</span>}
          </li>)}
        </ul> : <p className={styles.unknownCopy}>Chưa có domain công khai. Không suy ra chuyên môn từ chức danh hoặc đơn vị.</p>}
      </section>

      <section className={`${styles.profileSection} ${styles.outsideScope}`} aria-labelledby="expert-profile-outside-scope">
        <div className={styles.profileSectionHeading}>
          <span className={styles.eyebrow}>BOUNDARY</span>
          <h2 id="expert-profile-outside-scope">Ngoài phạm vi đã khai báo</h2>
        </div>
        {outsideScopes.length ? <ul className={styles.outsideList}>{outsideScopes.map((item) => <li key={item}>{domainLabel(item)}</li>)}</ul>
          : <p className={styles.unknownCopy}>Chưa có khai báo ngoài phạm vi trong projection này. Không suy ra phạm vi ngoài từ domain bị thiếu.</p>}
      </section>

      <div className={styles.profileRecords}>
        <PublicRecords title="Credential công khai" records={credentials} kind="credentials" />
        <PublicRecords title="Công trình và bài viết" records={publications} kind="publications" />
      </div>

      {meaningfulRoles.length > 0 && <PublicRecords title="Vai trò công khai" records={meaningfulRoles} kind="roles" />}

      <section className={styles.profileSection} aria-labelledby="expert-profile-assessments">
        <div className={styles.profileSectionHeading}><span className={styles.eyebrow}>ASSESSMENTS</span><h2 id="expert-profile-assessments">Đánh giá đã công bố</h2></div>
        <p className={styles.unknownCopy}>Chưa có projection đánh giá công khai trong hợp đồng API này.</p>
      </section>

      <section className={styles.availabilityRow} aria-label="Trạng thái nhận yêu cầu">
        <div><span className={styles.eyebrow}>AVAILABILITY</span><strong>Chưa có trạng thái công khai</strong><p>Hồ sơ không công bố lịch, sức chứa hoặc cam kết nhận việc.</p></div>
        {demoFixture ? <span>Không thể gửi yêu cầu tới hồ sơ fixture.</span>
          : isAuthenticated ? <button type="button" onClick={() => setRequestOpen(true)}><BookOpen size={16} /> Bắt đầu từ hồ sơ Trust của bạn</button>
          : <Link href={`/login?next=${encodeURIComponent(`/expert/profile/${expertId}`)}`}><ArrowUpRight size={15} /> Đăng nhập để bắt đầu yêu cầu</Link>}
      </section>

      <nav className={styles.profileNavigation} aria-label="Liên kết ba trụ cột">
        <Link href="/community">Mở Community <ArrowUpRight size={14} /></Link>
        <Link href="/trust">Mở Trust <ArrowUpRight size={14} /></Link>
      </nav>

      {requestOpen && !demoFixture && <RequestExpertReviewSheet onClose={() => setRequestOpen(false)} />}
    </div>
  );
}
