"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, NotebookPen } from "lucide-react";
import { markAssurance, measureAssurance } from "@/lib/performance/assurance";

markAssurance("ai-drawer-module-ready");

const INITIAL_RESPONSE = {
  role: "assistant",
  text: "Xin chào! Tôi là AI Tutor đồng hành cùng bài học này. Bạn có thể hỏi tôi về cú pháp useTransition, cách áp dụng State Colocation vào dự án thực tế, hoặc các cạm bẫy hiệu năng thường gặp.",
};

export default function LessonCompanionPanel({ storageKey, initialTab = "ai" }) {
  useEffect(() => {
    markAssurance("ai-drawer-interactive");
    measureAssurance("ai-drawer-open-duration", "ai-drawer-request", "ai-drawer-interactive");
  }, []);

  const [activePanelTab, setActivePanelTab] = useState(initialTab === "notes" ? "notes" : "ai");
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(storageKey) || "";
    } catch {
      return "";
    }
  });
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponses, setAiResponses] = useState([INITIAL_RESPONSE]);

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
    setAiResponses((previous) => [
      ...previous,
      { role: "user", text: q },
      {
        role: "assistant",
        text: `[Góc nhìn học thuật]: Về câu hỏi "${q}" — Trong React 19, cốt lõi là không để tính toán dữ liệu lớn chặn UI phản hồi. Bằng cách tách biệt urgent input và concurrent transition, trình duyệt luôn ưu tiên frame người dùng đang tương tác.`,
      },
    ]);
  };

  return (
    <aside className="lg:col-span-3 sticky top-24 bg-surface-primary border border-border-subtle rounded-2xl p-4 shadow-xl space-y-4">
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

      {activePanelTab === "ai" ? (
        <div className="space-y-4">
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
            {aiResponses.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`p-3 rounded-xl ${
                  message.role === "assistant"
                    ? "bg-surface-elevated text-text-primary border border-border-subtle leading-relaxed"
                    : "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-medium"
                }`}
              >
                {message.text}
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
              onSubmit={(event) => {
                event.preventDefault();
                handleAskAi(aiQuestion);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(event) => setAiQuestion(event.target.value)}
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
        <div className="space-y-3">
          <p className="text-xs text-text-muted leading-relaxed">
            Ghi chú lưu trực tiếp trên trình duyệt của bạn cho bài học này.
          </p>
          <textarea
            value={notes}
            onChange={(event) => handleSaveNotes(event.target.value)}
            placeholder="Viết ghi chú, công thức hoặc câu hỏi cần xem lại..."
            aria-label="Ghi chú bài học cá nhân"
            rows={14}
            className="w-full bg-surface-elevated p-3 rounded-xl text-xs font-mono text-text-primary border border-border-subtle focus:outline-none focus:border-accent-human resize-none"
          />
        </div>
      )}
    </aside>
  );
}
