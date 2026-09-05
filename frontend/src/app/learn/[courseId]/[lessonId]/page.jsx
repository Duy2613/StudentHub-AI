"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileCode2,
  HelpCircle,
  Lightbulb,
  MessageSquareCode,
  NotebookPen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";

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
  const [activePanelTab, setActivePanelTab] = useState("ai"); // "ai" | "notes"
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponses, setAiResponses] = useState([
    {
      role: "assistant",
      text: "Xin chào! Tôi là AI Tutor đồng hành cùng bài học này. Bạn có thể hỏi tôi về cú pháp useTransition, cách áp dụng State Colocation vào dự án thực tế, hoặc các cạm bẫy hiệu năng thường gặp.",
    },
  ]);

  const storageKey = `studenthub.lessonNotes.v1.${resolvedParams.courseId || "full-stack"}.${resolvedParams.lessonId || "lesson-1"}`;

  // Load saved notes locally without leaking sensitive data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setNotes(saved);
    } catch {
      // safe fallback
    }
  }, [storageKey]);

  const handleSaveNotes = (value) => {
    setNotes(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // safe fallback
    }
  };

  const handleAskAi = (question) => {
    if (!question.trim()) return;
    const q = question.trim();
    setAiQuestion("");
    setAiResponses((prev) => [
      ...prev,
      { role: "user", text: q },
      {
        role: "assistant",
        text: `[Góc nhìn học thuật]: Về câu hỏi "${q}" — Trong React 19, cốt lõi là không để tính toán dữ liệu lớn chặn UI phản hồi. Bằng cách tách biệt urgent input và concurrent transition, trình duyệt luôn ưu tiên frame người dùng đang tương tác.`,
      },
    ]);
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
            onClick={() => setRightPanelOpen((prev) => !prev)}
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
                onClick={() => setActiveSectionId(section.id)}
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

        {/* Right Column: AI Context Panel & Local Notes (Collapsible) */}
        {rightPanelOpen && (
          <aside className="lg:col-span-3 sticky top-24 bg-surface-primary border border-border-subtle rounded-2xl p-4 shadow-xl space-y-4">
            {/* Panel Tabs */}
            <div className="flex items-center border-b border-border-subtle pb-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePanelTab("ai")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activePanelTab === "ai"
                    ? "bg-surface-elevated text-accent-knowledge border border-accent-knowledge/30"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <BrainCircuit size={14} />
                <span>AI Tutor</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePanelTab("notes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activePanelTab === "notes"
                    ? "bg-surface-elevated text-accent-human border border-accent-human/30"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <NotebookPen size={14} />
                <span>Ghi chú bài học</span>
              </button>
            </div>

            {/* AI Tutor Chat Tab */}
            {activePanelTab === "ai" ? (
              <div className="space-y-4">
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
                  {aiResponses.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl ${
                        msg.role === "assistant"
                          ? "bg-surface-elevated text-text-primary border border-border-subtle leading-relaxed"
                          : "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-medium"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border-subtle space-y-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-text-muted">
                    <button
                      type="button"
                      onClick={() => handleAskAi("Giải thích đơn giản hơn cho người mới?")}
                      className="whitespace-nowrap px-2 py-0.5 rounded bg-surface-elevated hover:text-text-primary border border-border-subtle"
                    >
                      Giải thích đơn giản
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskAi("Lỗi phổ biến nhất khi dùng useTransition?")}
                      className="whitespace-nowrap px-2 py-0.5 rounded bg-surface-elevated hover:text-text-primary border border-border-subtle"
                    >
                      Cạm bẫy phổ biến
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAi(aiQuestion);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Hỏi AI về bài học này..."
                      className="w-full bg-surface-elevated px-3 py-2 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none border border-border-subtle focus:border-accent-primary"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg bg-accent-primary text-white text-xs font-medium hover:bg-accent-primary/90 flex-shrink-0"
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* Local Notes Tab */
              <div className="space-y-3">
                <p className="text-xs text-text-muted leading-relaxed">
                  Ghi chú lưu trực tiếp trên trình duyệt của bạn cho bài học này.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => handleSaveNotes(e.target.value)}
                  placeholder="Viết ghi chú, công thức hoặc câu hỏi cần xem lại..."
                  aria-label="Ghi chú bài học cá nhân"
                  rows={14}
                  className="w-full bg-surface-elevated p-3 rounded-xl text-xs font-mono text-text-primary border border-border-subtle focus:outline-none focus:border-accent-human resize-none"
                />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
