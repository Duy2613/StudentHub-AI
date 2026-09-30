"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { markExpertV4Timing } from "@/lib/performance/expertV4Timing";
import styles from "./expert-v4.module.css";

function domainLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function scopesOf(expert) {
  return (Array.isArray(expert?.scopes) ? expert.scopes : []).filter((scope) => typeof scope?.domain === "string" && scope.domain.trim());
}

export default function ExpertPublicDirectory({ experts = [], query = "", domain = "ALL", onQueryChange, onDomainChange, onRetry, loading = false, error = "" }) {
  const domains = useMemo(() => [...new Set(experts.flatMap((expert) => scopesOf(expert).map((scope) => scope.domain)))].sort((left, right) => left.localeCompare(right, "vi")), [experts]);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const filtered = useMemo(() => experts.filter((expert) => {
    const scopes = scopesOf(expert);
    const matchesDomain = domain === "ALL" || scopes.some((scope) => scope.domain === domain);
    const credentials = Array.isArray(expert.credentials) ? expert.credentials : [];
    const publications = Array.isArray(expert.publications) ? expert.publications : [];
    const searchText = [expert.name, expert.title, expert.institution, expert.department, ...scopes.flatMap((scope) => [scope.domain, scope.subdomain]), ...credentials.flatMap((row) => [row.type, row.field, row.issuer]), ...publications.map((row) => row.title)]
      .filter((part) => typeof part === "string")
      .join(" ")
      .toLocaleLowerCase("vi");
    return matchesDomain && (!normalizedQuery || searchText.includes(normalizedQuery));
  }), [experts, domain, normalizedQuery]);

  const emptyMessage = experts.length
    ? "Không tìm thấy hồ sơ khớp với từ khóa và domain đã chọn."
    : "Provider chưa trả về hồ sơ chuyên gia công khai.";

  useEffect(() => {
    markExpertV4Timing("directory.hydration-complete");
  }, []);

  useEffect(() => {
    if (!loading) markExpertV4Timing("directory.usable");
  }, [error, experts.length, loading]);

  return (
    <section className={styles.directory} aria-labelledby="expert-directory-title">
      <div className={styles.directoryHeader}>
        <div><span className={styles.eyebrow}>PUBLIC EXPERTS</span><h2 id="expert-directory-title">Danh bạ chuyên gia</h2><p>Đọc domain, hồ sơ và các dữ liệu công khai có sẵn. Thông tin thiếu được giữ là chưa biết.</p></div>
        <span className={styles.directoryCount} aria-live="polite">{loading ? "Đang tải" : `${filtered.length} hồ sơ`}</span>
      </div>

      <div className={styles.directoryControls}>
        <label className={styles.searchField}><Search size={17} /><span className="sr-only">Tìm hồ sơ chuyên gia</span><input type="search" value={query} onChange={(event) => onQueryChange?.(event.target.value)} placeholder="Tên, domain, tổ chức hoặc công trình" /></label>
        <label className={styles.domainSelect}><span>Domain</span><select value={domain} onChange={(event) => onDomainChange?.(event.target.value)} aria-label="Lọc theo domain"><option value="ALL">Tất cả domain</option>{domains.map((item) => <option key={item} value={item}>{domainLabel(item)}</option>)}</select></label>
      </div>

      {loading && <div className={styles.directoryLoading} role="status"><span /><span /><span /></div>}
      {error && <div className={styles.directoryError} role="alert"><div><strong>Danh bạ hiện không khả dụng.</strong><p>{error}</p></div><button type="button" onClick={onRetry}>Thử lại</button></div>}
      {!loading && !error && filtered.length === 0 && <div className={styles.directoryEmpty}><strong>{emptyMessage}</strong><p>Không tạo hồ sơ mẫu hoặc suy diễn chuyên môn khi dữ liệu không có.</p></div>}

      {!loading && !error && filtered.length > 0 && <ul className={styles.directoryList} aria-label="Hồ sơ chuyên gia công khai">
        {filtered.map((expert) => {
          const scopes = scopesOf(expert);
          const credentials = (Array.isArray(expert.credentials) ? expert.credentials : []).filter((item) => item && (item.type || item.field || item.issuer || item.status)).slice(0, 2);
          const publications = (Array.isArray(expert.publications) ? expert.publications : []).filter((item) => item && item.title).slice(0, 2);
          return <li key={expert.expertId}>
            <article className={styles.directoryItem}>
              <div className={styles.directoryIdentity}>
                <span className={styles.directoryMonogram} aria-hidden="true">{String(expert.name || "CG").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi")}</span>
                <div><h3>{expert.name || "Chưa công bố tên"}</h3>{expert.title && <p className={styles.directoryTitle}>{expert.title}</p>}{expert.institution && <p className={styles.directoryInstitution}>{expert.institution}{expert.department ? ` · ${expert.department}` : ""}</p>}</div>
              </div>
              <p className={styles.directoryBio}>{expert.bio || "Chưa có tiểu sử công khai."}</p>
              <div className={styles.directoryScopes} aria-label="Domain trong hồ sơ">
                <strong><ShieldCheck size={14} /> Domain</strong>
                {scopes.length ? <ul>{scopes.slice(0, 4).map((scope, index) => <li key={`${scope.domain}-${scope.subdomain || index}`}><span>{domainLabel(scope.domain)}{scope.subdomain ? ` · ${scope.subdomain}` : ""}</span>{scope.level && <small>{domainLabel(scope.level)}</small>}</li>)}</ul> : <span className={styles.unknownInline}>Chưa công bố</span>}
              </div>
              {(credentials.length > 0 || publications.length > 0) && <div className={styles.directoryEvidence}>
                {credentials.length > 0 && <span>Credential: {credentials.map((item) => item.type || item.field || item.issuer).filter(Boolean).join(" · ")}</span>}
                {publications.length > 0 && <span>Công trình: {publications.map((item) => item.title).join(" · ")}</span>}
              </div>}
              <Link href={`/expert/profile/${encodeURIComponent(expert.expertId)}`} className={styles.profileLink}>Mở hồ sơ công khai <ArrowRight size={15} /></Link>
            </article>
          </li>;
        })}
      </ul>}
    </section>
  );
}
