"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  MessageSquareCode,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const TUTOR_ACTIONS = [
  { id: "hint", label: "Gợi ý phân tầng", icon: Lightbulb, query: "Give me a hint" },
  { id: "why", label: "Hỏi tôi lý do (Socratic)", icon: HelpCircle, query: "Ask me why" },
  { id: "review", label: "Đánh giá suy luận", icon: CheckCircle2, query: "Review my reasoning" },
  { id: "mistakes", label: "Cạm bẫy thường gặp", icon: MessageSquareCode, query: "Show common mistakes" },
  { id: "compare", label: "So sánh giải pháp", icon: Scale, query: "Compare concepts" },
];

const SAMPLE_DEMOS = {
  hint: {
    title: "Gợi ý mức 1 (Không lộ đáp án)",
    text: "Hãy xem xét vòng đời render của React: Khi state thay đổi ở component cha, toàn bộ cây component con sẽ render lại trừ khi bạn dùng React.memo hoặc colocate state xuống đúng component con cần dùng.",
    epistemicType: "AI_GENERATED_EXPLANATION",
  },
  why: {
    title: "Câu hỏi gợi mở Socratic",
    text: "Tại sao bạn lại chọn lưu JWT token trong localStorage thay vì HttpOnly Cookie? Sự khác biệt về nguy cơ tấn công XSS và CSRF giữa hai cách tiếp cận này là gì?",
    epistemicType: "AI_GENERATED_EXPLANATION",
  },
  review: {
    title: "Đánh giá giả thuyết của bạn",
    text: "Suy luận của bạn về Race Condition là chính xác. Tuy nhiên, việc chỉ dùng client-side debouncing là chưa đủ an toàn vì kẻ tấn công có thể bỏ qua giao diện web để gửi API requests đồng thời trực tiếp lên máy chủ.",
    epistemicType: "AI_GENERATED_EXPLANATION",
  },
  mistakes: {
    title: "Cạm bẫy thiết kế phổ biến",
    text: "Sai lầm phổ biến nhất trong microservices là chia nhỏ cơ sở dữ liệu quá sớm khi chưa hiểu rõ transaction boundaries, dẫn đến distributed transactions phức tạp và không nhất quán dữ liệu.",
    epistemicType: "AI_GENERATED_EXPLANATION",
  },
  compare: {
    title: "So sánh Optimistic UI vs Pessimistic UI",
    text: "Optimistic UI: Cập nhật giao diện ngay lập tức trước khi server phản hồi (Trải nghiệm siêu mượt, nhưng cần rollback logic khi lỗi).\nPessimistic UI: Chờ server phản hồi thành công mới cập nhật UI (An toàn, nhưng tạo cảm giác có độ trễ).",
    epistemicType: "AI_GENERATED_EXPLANATION",
  },
};

export default function AiTutorSection() {
  const [activeActionId, setActiveActionId] = useState("hint");

  const currentDemo = SAMPLE_DEMOS[activeActionId];

  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="ai-tutor-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Philosophy & Epistemic Boundaries */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BrainCircuit size={13} />
            <span>Epistemic AI Mentor</span>
          </div>

          <h2
            id="ai-tutor-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
          >
            AI Trợ Giảng Ngữ Cảnh: <br />
            <span className="text-accent-human">Hỗ Trợ Tư Duy, Không Làm Thay.</span>
          </h2>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            StudentHub AI không phải là một chatbot trả lời sẵn tất cả. AI đóng vai trò người phản
            biện Socratic: đặt câu hỏi, chỉ ra giả định sai, gợi ý phân tầng và nhắc nhở bạn kiểm
            chứng nguồn tin.
          </p>

          {/* Epistemic Boundary Matrix (Section 44) */}
          <div className="pt-4 border-t border-border-subtle space-y-3 text-xs font-mono">
            <span className="text-text-muted uppercase tracking-wider block">
              Ranh giới nhận thức minh bạch (Epistemic Separation):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-text-primary">Giáo trình chính thức</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-text-primary">Giải thích do AI sinh ra</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-text-primary">Ý kiến cộng đồng</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-text-primary">Bằng chứng xác thực (Trust)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Tutor Action Showcase */}
        <div className="lg:col-span-6 bg-surface-primary border border-border-strong rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted">Hành động ngữ cảnh</span>
            <span className="text-xs font-mono text-purple-400 flex items-center gap-1">
              <Sparkles size={12} /> Interactive Preview
            </span>
          </div>

          {/* Action Chips */}
          <div className="flex flex-wrap gap-2">
            {TUTOR_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = action.id === activeActionId;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setActiveActionId(action.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono transition-all border ${
                    isActive
                      ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20"
                      : "bg-surface-elevated text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong"
                  }`}
                >
                  <Icon size={14} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Response Terminal / Card */}
          <div className="rounded-2xl border border-border-strong bg-surface-elevated/70 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono border-b border-border-subtle pb-2">
              <span className="text-purple-300 font-semibold">{currentDemo.title}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                AI_GENERATED
              </span>
            </div>

            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line font-sans">
              {currentDemo.text}
            </p>
          </div>

          <div className="text-[11px] font-mono text-text-muted text-center">
            AI hoạt động cục bộ trong bài học hoặc phòng thực hành, đồng bộ theo tiến độ của bạn.
          </div>
        </div>
      </div>
    </section>
  );
}
