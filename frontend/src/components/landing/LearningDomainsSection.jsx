"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Binary,
  BookOpen,
  BrainCircuit,
  Cloud,
  Layers,
  Scale,
  ShieldCheck,
} from "lucide-react";

export const DOMAINS = [
  {
    id: "cs-fundamentals",
    title: "Computer Science & Foundations",
    icon: Binary,
    accent: "#65D8FF",
    tag: "Nền tảng",
    topics: ["Cấu trúc dữ liệu nâng cao", "Thuật toán đồ thị", "Mô hình bộ nhớ & Concurrency"],
    description: "Nền tảng toán học và tư duy giải thuật vững chắc, giải quyết vấn đề từ gốc rễ máy tính.",
    href: "/learn?domain=cs",
  },
  {
    id: "fullstack-systems",
    title: "Full-Stack Web Architecture",
    icon: Layers,
    accent: "#756BFF",
    tag: "Sản phẩm",
    topics: ["React 19 Concurrent Features", "Next.js Turbopack", "PostgreSQL & Index Optimization"],
    description: "Thiết kế và vận hành các sản phẩm web chuẩn enterprise, chịu tải lớn và phản hồi tức thì.",
    href: "/learn?domain=fullstack",
  },
  {
    id: "ai-systems",
    title: "AI Systems & Verification",
    icon: BrainCircuit,
    accent: "#A78BFA",
    tag: "Trí tuệ",
    topics: ["RAG có kiểm chứng nguồn", "Adversarial Hallucination Defense", "Fine-tuning & Evaluation"],
    description: "Ứng dụng AI thông minh nhưng có bằng chứng rõ ràng, không bị ảo giác dữ liệu.",
    href: "/learn?domain=ai",
  },
  {
    id: "cloud-distributed",
    title: "Distributed Systems & Cloud",
    icon: Cloud,
    accent: "#38BDF8",
    tag: "Hạ tầng",
    topics: ["Event Sourcing & Kafka", "VPC & Edge Compute", "Zero-Downtime Migration"],
    description: "Quản lý hệ thống phân tán, đảm bảo tính sẵn sàng cao và khả năng phục hồi sau sự cố.",
    href: "/learn?domain=cloud",
  },
  {
    id: "academic-rules",
    title: "Academic Law & Student Rights",
    icon: Scale,
    accent: "#FFB66D",
    tag: "Học vụ",
    topics: ["Quy chế tín chỉ 3116/QĐ", "Điều kiện tốt nghiệp & chuẩn đầu ra", "Học bổng & Phúc khảo"],
    description: "Hiểu đúng quyền lợi, nghĩa vụ và các quy định chính thức để không bỏ lỡ cơ hội học tập.",
    href: "/trust",
  },
];

export default function LearningDomainsSection() {
  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="domains-title"
    >
      <div className="max-w-3xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <BookOpen size={13} />
          <span>Knowledge Domains</span>
        </div>
        <h2
          id="domains-title"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
        >
          Trục Tri Thức Trọng Tâm
        </h2>
        <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
          Được phân chia có hệ thống theo 5 miền tri thức cốt lõi. Mỗi chuyên đề đều đi kèm các bài
          toán thực tế từ trường đại học đến các công ty công nghệ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          return (
            <div
              key={domain.id}
              className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:bg-surface-elevated/40 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${domain.accent}15`, color: domain.accent }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-surface-elevated border border-border-subtle text-text-muted">
                    {domain.tag}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-text-primary group-hover:text-accent-knowledge transition-colors">
                  {domain.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {domain.description}
                </p>

                <div className="mt-6 pt-4 border-t border-border-subtle space-y-1.5">
                  <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider block">
                    Nội dung nổi bật:
                  </span>
                  {domain.topics.map((topic, idx) => (
                    <div key={idx} className="text-xs font-mono text-text-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={domain.href}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-knowledge hover:underline"
                >
                  <span>Khám phá miền tri thức</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
