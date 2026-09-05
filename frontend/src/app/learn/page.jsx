import React from "react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Clock,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Learn | StudentHub AI",
  description: "Khám phá các chuyên đề học thuật từ cơ sở lý thuyết đến kiến trúc thực tế.",
};

const COURSES = [
  {
    id: "full-stack",
    title: "Full-Stack Web Systems & High-Scale Architecture",
    domain: "Application",
    level: "Trung cấp - Nâng cao",
    duration: "14 tuần",
    lessonCount: 24,
    description: "Từ HTTP, REST/GraphQL đến cơ sở dữ liệu PostgreSQL, tối ưu truy vấn, cache và phân tán.",
    prerequisites: ["Lập trình cơ bản", "Cấu trúc dữ liệu"],
    badge: "Trọng tâm",
  },
  {
    id: "ai-systems",
    title: "AI Systems Engineering & Grounded Intelligence",
    domain: "Intelligence",
    level: "Nâng cao",
    duration: "10 tuần",
    lessonCount: 18,
    description: "Xây dựng hệ thống AI có khả năng kiểm chứng nguồn tin, chống hallucination và phòng thủ prompt injection.",
    prerequisites: ["Python", "Đại số tuyến tính"],
    badge: "Xu hướng",
  },
  {
    id: "security-rls",
    title: "Security Engineering, RLS & Zero-Trust Auth",
    domain: "Reliability",
    level: "Chuyên sâu",
    duration: "8 tuần",
    lessonCount: 14,
    description: "Phòng vệ tấn công BOLA/IDOR, session durability, Row Level Security và xác thực dựa trên bằng chứng.",
    prerequisites: ["Full-Stack cơ bản", "SQL"],
    badge: "Tiêu chuẩn",
  },
  {
    id: "system-design",
    title: "Distributed System Design & Resilience",
    domain: "Architecture",
    level: "Chuyên sâu",
    duration: "12 tuần",
    lessonCount: 20,
    description: "CAP Theorem, phân vùng dữ liệu, event-driven streaming, và thiết kế hệ thống chịu tải cao.",
    prerequisites: ["Hệ điều hành", "Mạng máy tính"],
    badge: "Cốt lõi",
  },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <AcademicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            <BookOpen size={13} />
            <span>Curriculum & Knowledge Tracks</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
            Chương Trình Học Thuật
          </h1>
          <p className="mt-3 text-base sm:text-lg text-text-secondary max-w-2xl">
            Các chuyên đề được thiết kế theo chuẩn kỹ sư sản xuất thực thụ, kết hợp giữa lý thuyết
            nền tảng và khả năng vận hành thực tế.
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:bg-surface-elevated/40 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-accent-knowledge px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {course.domain}
                  </span>
                  <span className="text-xs font-mono text-accent-human bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                    {course.badge}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-text-primary group-hover:text-accent-knowledge transition-colors">
                  {course.title}
                </h2>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {course.description}
                </p>

                <div className="mt-6 pt-4 border-t border-border-subtle flex flex-wrap items-center gap-4 text-xs font-mono text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} /> {course.duration}
                  </span>
                  <span>·</span>
                  <span>{course.lessonCount} bài học</span>
                  <span>·</span>
                  <span>Cấp độ: {course.level}</span>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={`/learn/${course.id}/lesson-1`}
                  className="w-full py-3 px-4 rounded-xl bg-surface-elevated hover:bg-accent-primary hover:text-white border border-border-subtle text-text-primary text-sm font-medium flex items-center justify-center gap-2 transition-all group-hover:border-accent-primary"
                >
                  <span>Khám phá giáo trình & bài học</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
