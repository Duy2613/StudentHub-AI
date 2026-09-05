"use client";

import React from "react";
import {
  Award,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  LineChart,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const OUTCOMES = [
  {
    step: "01",
    title: "KNOWLEDGE",
    subtitle: "Hiểu bản chất",
    desc: "Không học vẹt framework. Bạn nắm vững nguyên lý hoạt động của hệ thống từ tầng giao diện đến phần cứng.",
  },
  {
    step: "02",
    title: "CONNECTION",
    subtitle: "Nhìn thấy bức tranh lớn",
    desc: "Bản đồ tri thức giúp bạn hiểu mọi khái niệm kết nối với nhau như thế nào và điều gì là tiền đề cho điều gì.",
  },
  {
    step: "03",
    title: "PRACTICE",
    subtitle: "Thực chiến tư duy",
    desc: "Tự mình giải quyết các bài toán biên: tranh chấp dữ liệu, lỗ hổng bảo mật, và nghẽn tài nguyên.",
  },
  {
    step: "04",
    title: "EVIDENCE",
    subtitle: "Chứng thực bằng chứng",
    desc: "Mọi kỹ năng và kết luận đều đi kèm bằng chứng xác thực, không thể làm giả hay xuyên tạc.",
  },
  {
    step: "05",
    title: "PEOPLE",
    subtitle: "Đồng hành có chiều sâu",
    desc: "Gắn kết cùng cộng đồng sinh viên tài năng và mạng lưới cố vấn chuyên môn minh bạch.",
  },
  {
    step: "06",
    title: "MASTERY",
    subtitle: "Làm chủ sự nghiệp",
    desc: "Trở thành kỹ sư độc lập, tự tin bước ra thị trường lao động toàn cầu với tư duy sắc bén.",
  },
];

export default function OutcomesSection() {
  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="outcomes-heading"
    >
      <div className="max-w-3xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
          <TrendingUp size={13} />
          <span>The Path to Mastery</span>
        </div>
        <h2
          id="outcomes-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
        >
          Hành Trình Chuyển Hóa Năng Lực
        </h2>
        <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
          Sự kết hợp hoàn hảo giữa 6 giá trị cốt lõi: Knowledge → Connection → Practice → Evidence →
          People → Mastery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {OUTCOMES.map((item) => (
          <div
            key={item.step}
            className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-7 shadow-lg space-y-4 hover:bg-surface-elevated/40 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-accent-knowledge font-bold text-base">{item.step}</span>
              <span className="px-2 py-0.5 rounded bg-surface-elevated text-text-muted border border-border-subtle">
                {item.subtitle}
              </span>
            </div>

            <h3 className="text-xl font-bold text-text-primary tracking-wide">{item.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
