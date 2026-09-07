"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import Annotation from "./Annotation";
import CinematicTaskBackdrop from "@/components/ui/CinematicTaskBackdrop";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const TOOL_FILM_MAP = Object.freeze({
  "/trust": { id: "film02_trust_engine", num: "02", name: "Trust Engine" },
  "/community": { id: "film03_collective_intelligence", num: "03", name: "Community" },
  "/expert": { id: "film04_expert_network", num: "04", name: "Experts" },
  "/cases": { id: "film07_knowledge_time", num: "07", name: "Evidence Lab" },
  "/learn": { id: "film05_question_understanding", num: "05", name: "Learn" },
  "/roadmap": { id: "film06_deep_work", num: "06", name: "Roadmap" },
  "/practice": { id: "film05_question_understanding", num: "05", name: "Practice" },
  "/projects": { id: "film01_campus_atlas", num: "01", name: "Projects" },
  "/dashboard": { id: "film08_knowledge_horizon", num: "08", name: "Dashboard" },
  "/profile": { id: "film08_knowledge_horizon", num: "08", name: "Profile" },
  "/settings": { id: "film08_knowledge_horizon", num: "08", name: "Settings" },
});

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
              const filmInfo = TOOL_FILM_MAP[item.href] || TOOL_FILM_MAP["/dashboard"];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { if (compact) onNavigate?.(); }}
                  className={`margin-nav-link relative group overflow-hidden ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <CinematicTaskBackdrop
                    filmId={filmInfo.id}
                    opacity={active ? 0.32 : 0.0}
                    hoverOpacity={0.45}
                    rounded="rounded-lg"
                  />
                  <span className="relative z-10 flex items-center gap-2 w-full">
                    {Icon ? <Icon size={compact ? 16 : 15} aria-hidden="true" /> : null}
                    <span>{item.label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/50 border border-white/10 text-slate-400 group-hover:text-emerald-300 ml-auto mr-0.5 transition-colors">
                      {filmInfo.num}
                    </span>
                    {active ? <ChevronRight size={13} className="margin-nav-chevron shrink-0" aria-hidden="true" /> : null}
                  </span>
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
