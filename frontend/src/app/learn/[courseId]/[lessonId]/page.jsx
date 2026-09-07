"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  ChevronLeft,
  Copy,
  NotebookPen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import { markAssurance, measureAssurance } from "@/lib/performance/assurance";

const LessonCompanionPanel = dynamic(() => import("@/components/lesson/LessonCompanionPanel"), {
  ssr: false,
  loading: () => (
    <aside className="lg:col-span-3 sticky top-24 bg-surface-primary border border-border-subtle rounded-2xl p-4 shadow-xl">
      <p className="text-xs text-text-muted">Đang mở AI Tutor & ghi chú…</p>
    </aside>
  ),
});

function LessonCompanionPlaceholder({ onLoad }) {
  return (
    <aside className="lg:col-span-3 sticky top-24 bg-surface-primary border border-border-subtle rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center border-b border-border-subtle pb-3 gap-2">
        <button
          type="button"
          onClick={() => onLoad("ai")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated text-accent-knowledge border border-accent-knowledge/30"
        >
          <BrainCircuit size={14} />
          <span>AI Tutor</span>
        </button>
        <button
          type="button"
          onClick={() => onLoad("notes")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          <NotebookPen size={14} />
          <span>Ghi chú bài học</span>
        </button>
      </div>
      <div className="space-y-3">
        <p className="text-xs text-text-muted leading-relaxed">
          Bộ công cụ AI và ghi chú chỉ mở khi bạn cần, để nội dung bài học được ưu tiên tải trước.
        </p>
        <button
          type="button"
          onClick={() => onLoad("ai")}
          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-text-secondary hover:text-text-primary"
        >
          Mở AI Tutor
        </button>
      </div>
    </aside>
  );
}

const SAMPLE_LESSON_CONTENT = {
  title: "Modern State Architectures & Concurrent React",
  course: "Full-Stack Web Systems",
  courseId: "full-stack",
  readTime: "12 phút đọc",
  summary:
    "Phân tích chuyên sâu về mô hình luồng dữ liệu đơn hướng (unidirectional data flow), state colocation, và cách React 19 Concurrent Features quản lý rendering budget.",
  sections: [
    {
      id: "state-colocation",
      title: "1. Nguyên Lý State Colocation",
      content: `Khi thiết kế ứng dụng web quy mô lớn, sai lầm phổ biến nhất là đưa toàn bộ trạng thái lên Global Store (như Redux hoặc Zustand) ngay từ đầu. Điều này tạo ra Coupling không cần thiết và khiến các component render lại ngoài ý muốn.

Nguyên lý **State Colocation** quy định: Hãy giữ trạng thái ở vị trí gần nhất có thể với nơi nó được sử dụng và biến đổi. Nếu chỉ có một form con cần dữ liệu biểu mẫu, đừng đưa nó lên root context.`,
    },
    {
      id: "concurrent-rendering",
      title: "2. React 19 Concurrent Rendering & Transitions",
      content: `Trong React 19, tác vụ render có thể bị gián đoạn (interruptible). Khi người dùng gõ vào ô tìm kiếm hoặc chuyển tab lớn, việc cập nhật UI không được phép làm đơ thanh cuộn hoặc phản hồi bàn phím.

Sử dụng \`useTransition\` để phân loại trạng thái:
- **Urgent update**: Phản hồi trực tiếp từ người dùng (nhập ký tự, click tab).
- **Transition update**: Tác vụ tính toán nặng hoặc tải danh sách kết quả.`,
      code: `import { useState, useTransition } from "react";

export function SearchFilterList({ items }) {
  const [query, setQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e) {
    const value = e.target.value;
    setQuery(value); // Urgent: giữ ô nhập gõ mượt mà 60 FPS

    startTransition(() => {
      // Non-urgent: tính toán danh sách lọc có thể nhường lượt render
      const results = items.filter((item) =>
        item.title.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(results);
    });
  }

  return (
    <div>
      <input value={query} onChange={handleSearch} placeholder="Tìm kiếm..." />
      {isPending && <span className="text-muted">Đang cập nhật kết quả...</span>}
      <ItemList data={filteredItems} />
    </div>
  );
}`,
    },
    {
      id: "production-invariants",
      title: "3. Các Bất Biến Kiểm Soát (Production Invariants)",
      content: `Trong môi trường production tại StudentHub AI, mọi render pipeline phải tuân thủ 3 bất biến:
1. **Zero Long Tasks**: Không được để bất kỳ hàm render JavaScript nào chạy quá 50ms liên tục trên main thread.
2. **Idempotent Reducers**: State transformations phải hoàn toàn thuần túy (pure), không chứa side effects.
3. **Optimistic Rollback**: Mọi mutation lạc quan phải có cơ chế hoàn tác tức thì khi API trả về lỗi.`,
    },
  ],
};

export default function QuietLessonPage({ params }) {
  const resolvedParams = use(params);
  const [activeSectionId, setActiveSectionId] = useState("state-colocation");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [companionMounted, setCompanionMounted] = useState(false);
  const [companionTab, setCompanionTab] = useState("ai");

  const storageKey = `studenthub.lessonNotes.v1.${resolvedParams.courseId || "full-stack"}.${resolvedParams.lessonId || "lesson-1"}`;

  const loadCompanion = (tab = "ai") => {
    markAssurance("ai-drawer-request", { tab });
    setCompanionTab(tab === "notes" ? "notes" : "ai");
    setCompanionMounted(true);
  };

  const toggleCompanionPanel = () => {
    if (rightPanelOpen) {
      markAssurance("ai-drawer-close-request");
      setRightPanelOpen(false);
      window.requestAnimationFrame(() => {
        markAssurance("ai-drawer-closed");
        measureAssurance("ai-drawer-close-duration", "ai-drawer-close-request", "ai-drawer-closed");
      });
      return;
    }

    markAssurance("ai-drawer-shell-request");
    setRightPanelOpen(true);
  };

  const handleTocActivate = (sectionId) => {
    markAssurance("toc-interaction-start", { sectionId });
    setActiveSectionId(sectionId);
    window.requestAnimationFrame(() => {
      markAssurance("toc-interaction-settled", { sectionId });
      measureAssurance("toc-interaction-duration", "toc-interaction-start", "toc-interaction-settled");
    });
  };

  return (
    <div className="min-h-screen bg-surface-quiet text-text-primary flex flex-col font-sans">
      <AcademicNavbar />

      {/* Lesson Subheader Breadcrumbs */}
      <div className="border-b border-border-subtle bg-bg-primary/80 px-4 sm:px-8 py-3 text-xs font-mono flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
          <Link href="/learn" className="hover:text-text-primary flex items-center gap-1">
            <ArrowLeft size={13} /> {SAMPLE_LESSON_CONTENT.course}
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium">{SAMPLE_LESSON_CONTENT.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-text-muted hidden sm:inline">{SAMPLE_LESSON_CONTENT.readTime}</span>
          <button
            type="button"
            onClick={toggleCompanionPanel}
            aria-label={rightPanelOpen ? "Đóng bảng AI & Ghi chú" : "Mở bảng AI & Ghi chú"}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-primary border border-border-subtle"
          >
            {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
      </div>

      {/* Main Lesson Quiet 3-Column Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Table of Contents (sticky on desktop) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
            Mục lục bài giảng
          </div>
          <nav className="space-y-1 text-sm font-medium" aria-label="Mục lục bài học">
            {SAMPLE_LESSON_CONTENT.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => handleTocActivate(section.id)}
                className={`block px-3 py-2 rounded-lg transition-colors leading-snug ${
                  activeSectionId === section.id
                    ? "bg-surface-primary text-accent-knowledge border-l-2 border-accent-knowledge"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-primary/40"
                }`}
              >
                {section.title}
              </a>
            ))}
          </nav>

          <div className="pt-6 border-t border-border-subtle text-xs text-text-muted space-y-2 font-mono">
            <div className="text-accent-human flex items-center gap-1.5">
              <Sparkles size={12} /> Quiet Performance Zone
            </div>
            <p>GPU ở chế độ nghỉ. Không có hiệu ứng 3D nền để bạn tập trung tiếp thu bài học.</p>
          </div>
        </aside>

        {/* Center Column: Reading Content (approx 65-75ch) */}
        <article
          className={`${
            rightPanelOpen ? "lg:col-span-6" : "lg:col-span-9"
          } max-w-[720px] mx-auto w-full space-y-8`}
        >
          <header className="space-y-3 pb-6 border-b border-border-subtle">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary font-serif leading-tight">
              {SAMPLE_LESSON_CONTENT.title}
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed font-sans">
              {SAMPLE_LESSON_CONTENT.summary}
            </p>
          </header>

          {/* Sections Body */}
          <div className="space-y-12 text-base leading-relaxed text-text-primary/95">
            {SAMPLE_LESSON_CONTENT.sections.map((section) => (
              <section key={section.id} id={section.id} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
                  {section.title}
                </h2>
                <div className="whitespace-pre-line text-text-secondary leading-loose">
                  {section.content}
                </div>

                {section.code && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-border-strong bg-surface-primary shadow-lg">
                    <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border-subtle text-xs font-mono text-text-muted">
                      <span>React TypeScript · Example</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(section.code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 hover:text-text-primary"
                      >
                        <Copy size={12} />
                        <span>{copied ? "Đã chép!" : "Sao chép"}</span>
                      </button>
                    </div>
                    <pre
                      tabIndex={0}
                      aria-label="Đoạn mã ví dụ minh họa"
                      className="p-4 text-xs sm:text-sm font-mono text-cyan-200 overflow-x-auto leading-relaxed scrollbar-thin focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    >
                      <code>{section.code}</code>
                    </pre>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-10 border-t border-border-subtle flex items-center justify-between gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-primary border border-border-subtle text-text-secondary hover:text-text-primary text-sm font-medium"
            >
              <ChevronLeft size={16} /> Quay lại danh sách
            </Link>

            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white font-medium text-sm shadow-md shadow-accent-primary/20 hover:bg-accent-primary/90"
            >
              <span>Thực hành thử thách này</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        {/* Right Column: AI Context Panel & Local Notes (loaded on demand) */}
        {rightPanelOpen && (companionMounted ? (
          <LessonCompanionPanel key={storageKey} storageKey={storageKey} initialTab={companionTab} />
        ) : (
          <LessonCompanionPlaceholder onLoad={loadCompanion} />
        ))}
      </div>
    </div>
  );
}
