import React from "react";
import AcademicNavbar from "@/components/layout/AcademicNavbar";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  FolderKanban,
  GitBranch,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Projects | StudentHub AI",
  description: "Bộ sưu tập đồ án kỹ thuật chất lượng cao và bằng chứng thực thi xác thực.",
};

const PROJECTS = [
  {
    id: "proj-1",
    title: "StudentHub AI Evidence Fusion Engine",
    category: "Full-Stack & Security",
    difficulty: "Chuyên sâu",
    summary:
      "Công cụ tổng hợp và giải quyết xung đột đa tầng giữa quy chế học vụ chính thức, kinh nghiệm thực tế của sinh viên và phân tích chuyên môn.",
    techStack: ["Next.js 16", "PostgreSQL", "RLS", "Turbopack", "Zod"],
    stars: 128,
    evidenceLevel: "LEVEL_4_VERIFIED",
    verifiedBy: "Hội Đồng Học Vụ",
    link: "/cases",
  },
  {
    id: "proj-2",
    title: "Real-Time Campus Academic Radar & Forecasting",
    category: "Data & Intelligence",
    difficulty: "Nâng cao",
    summary:
      "Hệ thống mô phỏng tiến độ tốt nghiệp theo thời gian thực dựa trên 150+ tín chỉ và dự báo rủi ro học phần học kỳ kế tiếp.",
    techStack: ["React 19", "Postgres Pool", "TypeScript", "Tailwind v4"],
    stars: 94,
    evidenceLevel: "LEVEL_3_VERIFIED",
    verifiedBy: "Khoa CNTT",
    link: "/academic",
  },
  {
    id: "proj-3",
    title: "Zero-Trust Transactional Security Outbox",
    category: "Distributed Systems",
    difficulty: "Chuyên sâu",
    summary:
      "Mô hình Outbox Pattern bất biến ngăn chặn mất mát sự kiện bảo mật và đảm bảo Exactly-Once delivery trong hệ thống phân tán.",
    techStack: ["Node.js", "SQL Migrations", "Cryptographic Signing"],
    stars: 76,
    evidenceLevel: "LEVEL_4_VERIFIED",
    verifiedBy: "Security Fabric Lab",
    link: "/trust",
  },
  {
    id: "proj-4",
    title: "Living Evidence Passport & Skill Cryptography",
    category: "Identity & Trust",
    difficulty: "Nâng cao",
    summary:
      "Hồ sơ kỹ năng động dựa trên bằng chứng minh bạch, tích hợp chữ ký mật mã bảo vệ quyền riêng tư của sinh viên.",
    techStack: ["JWT/JWKS", "Postgres RLS", "Web Crypto API"],
    stars: 62,
    evidenceLevel: "LEVEL_3_VERIFIED",
    verifiedBy: "Cộng Đồng Kỹ Sư",
    link: "/cases",
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <AcademicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            <FolderKanban size={13} />
            <span>Capstone Showcase & Verified Work</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
            Đồ Án & Công Trình Kỹ Thuật
          </h1>
          <p className="mt-3 text-base sm:text-lg text-text-secondary max-w-2xl">
            Các dự án quy mô thực tế được sinh viên và nhóm nghiên cứu triển khai, có kèm bằng chứng
            xác thực hiệu năng và độ tin cậy.
          </p>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROJECTS.map((proj) => (
            <div
              key={proj.id}
              className="bg-surface-primary border border-border-subtle hover:border-border-strong rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:bg-surface-elevated/40 group shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-accent-knowledge px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {proj.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                    <ShieldCheck size={13} />
                    <span>{proj.evidenceLevel}</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-text-primary group-hover:text-accent-knowledge transition-colors leading-snug">
                  {proj.title}
                </h2>

                <p className="text-sm text-text-secondary leading-relaxed">
                  {proj.summary}
                </p>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {proj.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-surface-elevated text-text-muted border border-border-subtle"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                  Xác thực bởi: <strong className="text-text-secondary">{proj.verifiedBy}</strong>
                </span>

                <Link
                  href={proj.link}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-knowledge hover:underline"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
