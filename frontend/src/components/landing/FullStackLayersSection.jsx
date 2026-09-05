"use client";

import React, { useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Radio,
  Server,
  ShieldAlert,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const FULL_STACK_LAYERS = [
  // APPLICATION (01 - 02)
  {
    num: "01",
    name: "Frontend",
    macro: "APPLICATION",
    icon: Globe,
    summary: "React 19, Next.js App Router, Turbopack, Tailwind v4, WebGL canvas progressive enhancement.",
    curriculumScope: "React 19 Server Components, micro-frontends, WebGL rendering pipelines, WCAG 2.2 AA accessibility architecture.",
    platformScope: "Triển khai trên StudentHub: Next.js 16 App Router, Turbopack, Vanilla CSS Design System, Three.js 3D Universe.",
    lessonCount: 24,
    practiceCount: 16,
    status: "READY",
  },
  {
    num: "02",
    name: "APIs & Backend Logic",
    macro: "APPLICATION",
    icon: Server,
    summary: "Edge runtime routes, ProviderGateway architecture, typed request envelopes, idempotent handlers.",
    curriculumScope: "Kiến trúc ProviderGateway, typed envelopes, RPC patterns, idempotent API request handlers.",
    platformScope: "Triển khai trên StudentHub: Edge Runtime Handlers, Next.js API Proxy, Type-safe Payload validation.",
    lessonCount: 28,
    practiceCount: 20,
    status: "READY",
  },

  // DATA & IDENTITY (03 - 04)
  {
    num: "03",
    name: "Database & Storage",
    macro: "DATA & IDENTITY",
    icon: Database,
    summary: "PostgreSQL pools, RLS policies, durable transactional outbox, WAL journal & schema migrations.",
    curriculumScope: "Mô hình hóa dữ liệu, B-Trees indexing, WAL journal internals, database replication topologies.",
    platformScope: "Triển khai trên StudentHub: PostgreSQL trên Supabase với Row Level Security (RLS) và transactional durability.",
    lessonCount: 22,
    practiceCount: 14,
    status: "READY",
  },
  {
    num: "04",
    name: "Authentication & Permissions",
    macro: "DATA & IDENTITY",
    icon: Lock,
    summary: "Supabase JWT/JWKS verification, durable session exchange, zero-trust role-based authorization.",
    curriculumScope: "Chuẩn OAuth2/OIDC, Zero-Trust authorization, RBAC/ABAC matrices, cryptographic session proofs.",
    platformScope: "Triển khai trên StudentHub: Supabase JWT/JWKS verification, HttpOnly durable cookie exchange, Role-based guard.",
    lessonCount: 18,
    practiceCount: 12,
    status: "READY",
  },

  // DELIVERY & PLATFORM (05 - 07)
  {
    num: "05",
    name: "Hosting & Deployment",
    macro: "DELIVERY & PLATFORM",
    icon: Globe,
    summary: "Vercel production preview bindings, edge CDN distribution, immutable deployment hashing.",
    curriculumScope: "Anycast routing, immutable deployment hashing, edge CDN distribution, atomic instant rollbacks.",
    platformScope: "Triển khai trên StudentHub: Vercel Edge Network, preview build isolation, Git-driven CI deployment.",
    lessonCount: 12,
    practiceCount: 8,
    status: "READY",
  },
  {
    num: "06",
    name: "Cloud & Compute",
    macro: "DELIVERY & PLATFORM",
    icon: Cpu,
    summary: "Serverless execution budgets, isolated worker runtimes, bounded memory lifecycle management.",
    curriculumScope: "Kubernetes container orchestration, serverless execution budgets, isolated worker threads, memory caps.",
    platformScope: "Triển khai trên StudentHub: Vercel Serverless Function runtimes với giới hạn memory & timeout nghiêm ngặt.",
    lessonCount: 16,
    practiceCount: 10,
    status: "READY",
  },
  {
    num: "07",
    name: "CI/CD & Version Control",
    macro: "DELIVERY & PLATFORM",
    icon: Terminal,
    summary: "Discovered quality gates, Playwright browser test matrices, automated bundle size regression checks.",
    curriculumScope: "Trunk-based development, multi-stage test pipelines, automated bundle size regression & Playwright suites.",
    platformScope: "Triển khai trên StudentHub: GitHub Actions CI workflow, strict Typecheck, ESLint, Security Fabric regression gates.",
    lessonCount: 14,
    practiceCount: 9,
    status: "READY",
  },

  // PRODUCTION RELIABILITY (08 - 13)
  {
    num: "08",
    name: "Security & RLS",
    macro: "PRODUCTION RELIABILITY",
    icon: ShieldAlert,
    summary: "BOLA/PII protection, 10-vector attack simulation, tool firewall, client-side secret exposure guards.",
    curriculumScope: "Phòng chống BOLA/IDOR, 10-vector attack simulation, tool firewalls, secret leakage prevention.",
    platformScope: "Triển khai trên StudentHub: StudentHub SecurityFabric edge interceptor, PII redaction, CSP strict headers.",
    lessonCount: 20,
    practiceCount: 15,
    status: "READY",
  },
  {
    num: "09",
    name: "Rate Limiting",
    macro: "PRODUCTION RELIABILITY",
    icon: Zap,
    summary: "Sliding window rate limiters, client IP & subject throttling, burst quota defense.",
    curriculumScope: "Thuật toán Token Bucket, Leaky Bucket, Sliding Window phân tán trên Redis/Upstash cluster.",
    platformScope: "Triển khai trên StudentHub: Sliding window in-memory limiter theo client IP & user subject tại SecurityFabric.",
    lessonCount: 10,
    practiceCount: 6,
    status: "READY",
  },
  {
    num: "10",
    name: "Caching & CDN",
    macro: "PRODUCTION RELIABILITY",
    icon: HardDrive,
    summary: "Stale-While-Revalidate headers, Redis mutex locking, cache stampede prevention.",
    curriculumScope: "Mô hình Multi-tier cache, Redis distributed mutex lock, chống cache stampede & thundering herd.",
    platformScope: "Triển khai trên StudentHub: Next.js Cache, Vercel Edge CDN Stale-While-Revalidate headers.",
    lessonCount: 12,
    practiceCount: 8,
    status: "READY",
  },
  {
    num: "11",
    name: "Load Balancing & Scaling",
    macro: "PRODUCTION RELIABILITY",
    icon: Radio,
    summary: "Connection pooling, backpressure handling, graceful degradation, circuit breaker patterns.",
    curriculumScope: "Layer 4 vs Layer 7 Load Balancing, Consistent Hashing, Circuit Breaker state machines, Backpressure.",
    platformScope: "Triển khai trên StudentHub: Vercel Edge Anycast routing toàn cầu kết hợp graceful degradation phía client.",
    lessonCount: 14,
    practiceCount: 8,
    status: "READY",
  },
  {
    num: "12",
    name: "Error Tracking & Logs",
    macro: "PRODUCTION RELIABILITY",
    icon: Activity,
    summary: "Structured security audit events, correlation IDs, OpenTelemetry traces, non-blocking telemetry.",
    curriculumScope: "OpenTelemetry distributed tracing spans, log aggregation pipelines dung lượng lớn, MTTR alerting.",
    platformScope: "Triển khai trên StudentHub: Security Audit Event Ledger lưu vết giao dịch nhạy cảm với Correlation ID.",
    lessonCount: 16,
    practiceCount: 10,
    status: "READY",
  },
  {
    num: "13",
    name: "Availability & Recovery",
    macro: "PRODUCTION RELIABILITY",
    icon: CheckCircle2,
    summary: "Failover strategies, point-in-time database restore, immutable audit logs, disaster drills.",
    curriculumScope: "Kiến trúc Active-Active Multi-Region, Chaos Engineering drills, tự động hóa failover database qua DNS.",
    platformScope: "Triển khai trên StudentHub: Sao lưu định kỳ tự động cơ sở dữ liệu Supabase, kịch bản khôi phục và preview cô lập.",
    lessonCount: 15,
    practiceCount: 8,
    status: "READY",
  },
];

const MACRO_GROUPS = [
  { id: "ALL", label: "Toàn bộ 13 Tầng" },
  { id: "APPLICATION", label: "01-02: Application" },
  { id: "DATA & IDENTITY", label: "03-04: Data & Identity" },
  { id: "DELIVERY & PLATFORM", label: "05-07: Delivery & Platform" },
  { id: "PRODUCTION RELIABILITY", label: "08-13: Production Reliability" },
];

export default function FullStackLayersSection() {
  const [selectedMacro, setSelectedMacro] = useState("ALL");
  const [activeLayerNum, setActiveLayerNum] = useState("08");

  const filteredLayers = FULL_STACK_LAYERS.filter((layer) => {
    if (selectedMacro === "ALL") return true;
    return layer.macro === selectedMacro;
  });

  const activeLayer = FULL_STACK_LAYERS.find((l) => l.num === activeLayerNum) || FULL_STACK_LAYERS[7];

  return (
    <section
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 border-b border-border-subtle"
      aria-labelledby="layers-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wide bg-accent-primary/10 text-accent-primary border border-accent-primary/20 mb-3">
            <Layers size={13} />
            <span>Canonical Production Architecture</span>
          </div>
          <h2
            id="layers-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary"
          >
            13 Tầng Sản Xuất Full-Stack
          </h2>
          <p className="mt-3 text-base sm:text-lg text-text-secondary max-w-2xl">
            Không chỉ học giao diện hay máy chủ tách rời. Bạn sẽ làm chủ toàn bộ chuỗi mắt xích từ
            Frontend đến Độ tin cậy (Reliability) và Bảo mật (Security).
          </p>
        </div>

        {/* Macro filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist">
          {MACRO_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={selectedMacro === group.id}
              onClick={() => setSelectedMacro(group.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all border ${
                selectedMacro === group.id
                  ? "bg-surface-elevated border-accent-knowledge text-accent-knowledge"
                  : "bg-surface-primary border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      {/* 13 Layers Interactive Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Layers List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredLayers.map((layer) => {
            const Icon = layer.icon;
            const isSelected = layer.num === activeLayerNum;
            return (
              <div
                key={layer.num}
                onClick={() => setActiveLayerNum(layer.num)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveLayerNum(layer.num);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Tầng ${layer.num}: ${layer.name}`}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-surface-elevated border-accent-primary ring-1 ring-accent-primary"
                    : "bg-surface-primary border-border-subtle hover:border-border-strong hover:bg-surface-elevated/40"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-sm font-bold text-accent-knowledge px-2 py-1 rounded bg-surface-primary border border-border-subtle">
                    {layer.num}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-primary text-sm sm:text-base truncate">
                      {layer.name}
                    </h3>
                    <p className="text-xs text-text-muted font-mono truncate">{layer.macro}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-text-muted flex-shrink-0">
                  <span className="hidden sm:inline">{layer.lessonCount} bài học</span>
                  <ArrowRight
                    size={14}
                    className={`transition-transform ${
                      isSelected ? "text-accent-primary translate-x-1" : "text-text-muted"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Layer Inspector & Detail (5 cols sticky) */}
        <div className="lg:col-span-5 sticky top-24 bg-surface-primary border border-border-strong rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-accent-knowledge px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
              Tầng {activeLayer.num} · {activeLayer.macro}
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} /> Sẵn sàng thực hành
            </span>
          </div>

          <h3 className="text-2xl font-bold text-text-primary">{activeLayer.name}</h3>

          <div className="space-y-3">
            {/* Epistemic Split 1: Curriculum / Educational Scope */}
            <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border-subtle text-xs">
              <div className="flex items-center gap-2 text-accent-knowledge font-mono font-semibold uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-knowledge" />
                <span>Chuyên đề đào tạo (Learn / Concept)</span>
              </div>
              <p className="text-text-secondary leading-relaxed">
                {activeLayer.curriculumScope || activeLayer.summary}
              </p>
            </div>

            {/* Epistemic Split 2: Live Platform Implementation */}
            <div className="p-3 rounded-xl bg-surface-elevated/30 border border-border-subtle text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Thực thi trên nền tảng (Current Implementation)</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                {activeLayer.platformScope || "Tương thích kiến trúc sản xuất StudentHub."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle">
              <div className="text-text-muted">Bài giảng lý thuyết</div>
              <div className="text-lg font-bold text-text-primary mt-1">
                {activeLayer.lessonCount} bài
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle">
              <div className="text-text-muted">Thực hành giải quyết</div>
              <div className="text-lg font-bold text-accent-knowledge mt-1">
                {activeLayer.practiceCount} tình huống
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <Link
              href={`/learn?layer=${activeLayer.num}`}
              className="w-full py-3 px-4 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20"
            >
              <span>Vào chuyên đề tầng {activeLayer.num}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
