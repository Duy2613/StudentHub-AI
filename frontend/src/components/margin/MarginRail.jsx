"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import Annotation from "./Annotation";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const DEFAULT_ANNOTATIONS = Object.freeze([
  { mark: "[n]", title: "Nguồn trước lời khuyên", body: "Mỗi kết luận bắt đầu từ một nguồn có thể mở lại." },
  { mark: "✻", title: "Ghi chú của hệ thống", body: "AI tách điều đã biết khỏi điều cần kiểm tra tiếp." },
  { mark: "!!", title: "Được cộng đồng đọc", body: "Tín hiệu xã hội luôn hiển thị phạm vi và trạng thái." },
  { mark: "?", title: "Khoảng chưa chắc", body: "Khi thiếu dữ kiện, hệ thống dừng và nói rõ điều còn thiếu." },
  { mark: "→", title: "Tham chiếu liên quan", body: "Đi đến lớp Trust, Community, Expert hoặc Evidence Passport tương ứng." },
  { mark: "✕", title: "Đính chính", body: "Thay đổi quan trọng giữ lại lịch sử và lý do thay đổi." },
]);

function isCurrent(pathname, href) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

function safeChapter(chapter) {
  if (typeof chapter === "number" && chapter >= 1 && chapter <= 10) return ROMAN[chapter];
  if (typeof chapter === "string" && ROMAN.includes(chapter.toUpperCase())) return chapter.toUpperCase();
  return "I";
}

export default function MarginRail({
  groups = [],
  pathname = "/dashboard",
  chapter = "I",
  chapterLabel = "StudentHub / Margin",
  annotations = DEFAULT_ANNOTATIONS,
  displayName = "Sinh viên",
  mobileOpen = false,
  onMobileToggle,
  onNavigate,
}) {
  const chapterNumber = safeChapter(chapter);
  const visibleAnnotations = (Array.isArray(annotations) ? annotations : DEFAULT_ANNOTATIONS).slice(0, 6);

  const renderNavigation = (compact = false) => (
    <nav aria-label="Điều hướng chính" className={compact ? "margin-mobile-nav" : "margin-navigation"}>
      {groups.map((group) => (
        <div key={group.label} className="margin-nav-group">
          <p className="margin-nav-label">{group.label}</p>
          <div className="margin-nav-items">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { if (compact) onNavigate?.(); }}
                  className={`margin-nav-link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {Icon ? <Icon size={compact ? 16 : 15} aria-hidden="true" /> : null}
                  <span>{item.label}</span>
                  {active ? <ChevronRight size={13} className="margin-nav-chevron" aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="app-sidebar margin-rail hidden md:flex" aria-label="The Margin — điều hướng và chú giải">
        <div className="margin-rail-top">
          <div className="margin-chapter" aria-label={`Chương ${chapterNumber}`}>
            <span className="margin-meta">Chapter</span>
            <strong>{chapterNumber}</strong>
            <span className="margin-chapter-label">{chapterLabel}</span>
          </div>
          {renderNavigation()}
        </div>

        <div className="margin-annotations" aria-label="Chú giải The Margin">
          <p className="margin-nav-label">Annotation lexicon</p>
          {visibleAnnotations.map((annotation, index) => (
            <Annotation key={`${annotation.mark}-${annotation.title || index}`} {...annotation} ordinal={annotation.ordinal || String(index + 1).padStart(2, "0")} />
          ))}
        </div>

        <div className="margin-rail-footer">
          <span className="margin-meta">Signed in as</span>
          <strong title={displayName}>{displayName}</strong>
          <span className="margin-footer-note">Nguồn trước quyết định</span>
        </div>
      </aside>

      <details id="mobile-navigation" className="margin-mobile-strip" open={mobileOpen} onToggle={(event) => onMobileToggle?.(event.currentTarget.open)}>
        <summary>
          <span className="margin-mobile-summary-mark"><Menu size={15} aria-hidden="true" /></span>
          <span><span className="margin-meta">Chapter {chapterNumber}</span><strong>{chapterLabel}</strong></span>
          <span className="margin-mobile-summary-action">Mở Margin</span>
        </summary>
        <div className="margin-mobile-sheet">
          {renderNavigation(true)}
          <div className="margin-mobile-annotations">
            <p className="margin-nav-label">Chú giải</p>
            {visibleAnnotations.map((annotation, index) => (
              <Annotation key={`mobile-${annotation.mark}-${annotation.title || index}`} {...annotation} ordinal={annotation.ordinal || String(index + 1).padStart(2, "0")} />
            ))}
          </div>
        </div>
      </details>
    </>
  );
}

export { DEFAULT_ANNOTATIONS };
