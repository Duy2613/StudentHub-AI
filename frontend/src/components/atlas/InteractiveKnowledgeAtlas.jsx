"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Compass,
  ListTree,
  Lock,
  Network,
  Sparkles,
} from "lucide-react";
import ProgressiveKnowledgeUniverse from "../canvas/ProgressiveKnowledgeUniverse";
import { KNOWLEDGE_DOMAINS } from "../canvas/knowledgeUniverseData";
import { markAssurance, measureAssurance } from "@/lib/performance/assurance";

/**
 * Authoritative learning graph ontology details for each node
 */
export const ATLAS_NODE_DATA = {
  frontend: {
    id: "frontend",
    title: "Frontend Engineering",
    domain: "Application",
    status: "IN_PROGRESS",
    progress: 68,
    lessonCount: 12,
    practiceCount: 8,
    projectCount: 2,
    prerequisites: [],
    dependents: ["ai", "system-design"],
    recommendedNext: "Modern State Architectures & Concurrent React",
    description:
      "Nắm vững luồng dữ liệu, rendering cycle, tối ưu hóa giao diện người dùng và thiết kế hệ thống tương tác hiện đại.",
  },
  backend: {
    id: "backend",
    title: "APIs & Backend Logic",
    domain: "Application",
    status: "COMPLETED",
    progress: 100,
    lessonCount: 14,
    practiceCount: 12,
    projectCount: 3,
    prerequisites: [],
    dependents: ["database", "security", "ai", "cloud"],
    recommendedNext: "Distributed Message Queues & Event Streams",
    description:
      "Kiến trúc REST/GraphQL, concurrency an toàn, pipeline xử lý dữ liệu và đảm bảo tính nhất quán của hệ thống phân tán.",
  },
  database: {
    id: "database",
    title: "Database & Storage",
    domain: "Data & Storage",
    status: "IN_PROGRESS",
    progress: 55,
    lessonCount: 10,
    practiceCount: 6,
    projectCount: 2,
    prerequisites: ["backend"],
    dependents: ["system-design"],
    recommendedNext: "Indexing, B-Trees & Query Optimization",
    description:
      "Mô hình hóa dữ liệu quan hệ, ACID guarantees, WAL journal, cache read-through và thiết kế schema mở rộng.",
  },
  security: {
    id: "security",
    title: "Security & RLS",
    domain: "Reliability",
    status: "RECOMMENDED",
    progress: 0,
    lessonCount: 8,
    practiceCount: 5,
    projectCount: 1,
    prerequisites: ["backend", "database"],
    dependents: ["system-design"],
    recommendedNext: "Row Level Security (RLS) & Zero-Trust Auth",
    description:
      "Bảo vệ BOLA/IDOR, session durability, cryptographic proof, và ma trận phân quyền thực thể sinh viên.",
  },
  ai: {
    id: "ai",
    title: "AI Systems & Reasoning",
    domain: "Intelligence",
    status: "READY",
    progress: 15,
    lessonCount: 10,
    practiceCount: 7,
    projectCount: 2,
    prerequisites: ["frontend", "backend"],
    dependents: [],
    recommendedNext: "Epistemic Grounding & Adversarial Counter-Proof",
    description:
      "RAG có căn cứ nguồn, phân tách sự thật và ý kiến, kiểm tra hallucination và phòng thủ prompt injection.",
  },
  "system-design": {
    id: "system-design",
    title: "Distributed System Design",
    domain: "Architecture",
    status: "LOCKED",
    progress: 0,
    lessonCount: 16,
    practiceCount: 8,
    projectCount: 3,
    prerequisites: ["database", "security"],
    dependents: ["devops"],
    recommendedNext: "CAP Theorem, Partitioning & Replicated State",
    description:
      "Thiết kế hệ thống chịu tải cao, failover tự động, event sourcing và giảm thiểu blast radius khi có sự cố.",
  },
  cloud: {
    id: "cloud",
    title: "Cloud & Compute",
    domain: "Platform",
    status: "READY",
    progress: 25,
    lessonCount: 8,
    practiceCount: 4,
    projectCount: 1,
    prerequisites: ["backend"],
    dependents: ["devops"],
    recommendedNext: "Serverless Edge Functions & Object Storage",
    description:
      "Hạ tầng đám mây, network VPC, compute containerization và quản lý tài nguyên tối ưu chi phí.",
  },
  devops: {
    id: "devops",
    title: "CI/CD & Reliability",
    domain: "Reliability",
    status: "LOCKED",
    progress: 0,
    lessonCount: 7,
    practiceCount: 4,
    projectCount: 1,
    prerequisites: ["cloud", "system-design"],
    dependents: [],
    recommendedNext: "Automated Blue/Green Deployments & Rollbacks",
    description:
      "Pipeline kiểm thử tự động, container orchestration, telemetry metrics và SLA monitoring.",
  },
  embedded: {
    id: "embedded",
    title: "Embedded & Edge IoT",
    domain: "Hardware",
    status: "ELECTIVE",
    progress: 0,
    lessonCount: 6,
    practiceCount: 3,
    projectCount: 1,
    prerequisites: [],
    dependents: ["backend"],
    recommendedNext: "Microcontroller Firmware & Hardware Sensors",
    description:
      "Lập trình phần cứng thời gian thực, giao tiếp I2C/SPI, và đồng bộ dữ liệu cảm biến về nền tảng đám mây.",
  },
};

const DOMAIN_CATEGORIES = [
  "Tất cả",
  "Application",
  "Data & Storage",
  "Intelligence",
  "Architecture",
  "Reliability",
];

export default function InteractiveKnowledgeAtlas({ className = "" }) {
  const [selectedNodeId, setSelectedNodeId] = useState("frontend");
  const [activeTab, setActiveTab] = useState("spatial"); // "spatial" | "semantic"
  const [filterDomain, setFilterDomain] = useState("Tất cả");

  const handleTabChange = (nextTab) => {
    markAssurance("atlas-tab-request", { tab: nextTab });
    setActiveTab(nextTab);
    window.requestAnimationFrame(() => {
      markAssurance("atlas-tab-interactive", { tab: nextTab });
      measureAssurance("atlas-tab-duration", "atlas-tab-request", "atlas-tab-interactive");
    });
  };

  const handleFilterChange = (nextDomain) => {
    markAssurance("atlas-filter-request", { domain: nextDomain });
    setFilterDomain(nextDomain);
    window.requestAnimationFrame(() => {
      markAssurance("atlas-filter-interactive", { domain: nextDomain });
      measureAssurance("atlas-filter-duration", "atlas-filter-request", "atlas-filter-interactive");
    });
  };

  const selectedNode = selectedNodeId ? ATLAS_NODE_DATA[selectedNodeId] : null;

  const filteredNodes = useMemo(() => {
    return KNOWLEDGE_DOMAINS.filter((domain) => {
      if (filterDomain === "Tất cả") return true;
      return domain.domain === filterDomain;
    });
  }, [filterDomain]);

  return (
    <section
      id="knowledge-atlas"
      className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 ${className}`}
      aria-label="Bản đồ tri thức liên kết (Knowledge Atlas)"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wide uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-3">
            <Network size={13} className="text-cyan-400" />
            <span>Learning Ontology & Dependencies</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary">
            Knowledge Atlas
          </h2>
          <p className="mt-2 text-base sm:text-lg text-text-secondary max-w-2xl">
            Khám phá quan hệ phụ thuộc giữa các khối kiến thức. Bạn biết mình đang ở đâu,
            cần chuẩn bị gì và bước tiếp theo là gì.
          </p>
        </div>

        {/* View Mode Switcher (WCAG 2.2 AA compliant) */}
        <div className="flex items-center gap-2 bg-surface-primary border border-border-subtle p-1.5 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange("spatial")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "spatial"
                ? "bg-accent-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={activeTab === "spatial"}
          >
            <Compass size={15} />
            <span>Không gian 3D</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("semantic")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "semantic"
                ? "bg-accent-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={activeTab === "semantic"}
          >
            <ListTree size={15} />
            <span>Danh sách ngữ nghĩa</span>
          </button>
        </div>
      </div>

      {/* Domain Filters */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none"
        role="tablist"
        aria-label="Lọc khối kiến thức"
      >
        {DOMAIN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={filterDomain === cat}
            onClick={() => handleFilterChange(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all border ${
              filterDomain === cat
                ? "bg-surface-elevated border-accent-knowledge text-accent-knowledge"
                : "bg-surface-primary/60 border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Atlas Canvas / Tree Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
        {/* Left / Center Viewport (Spatial or Semantic List) */}
        <div className="lg:col-span-8 bg-surface-primary border border-border-subtle rounded-2xl overflow-hidden shadow-2xl relative min-h-[480px]">
          {activeTab === "spatial" ? (
            <ProgressiveKnowledgeUniverse
              activeNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              className="w-full h-full"
              loadStrategy="visible"
            />
          ) : (
            /* Semantic Tree / List Representation for full keyboard and screen-reader accessibility */
            <div
              className="p-6 space-y-4 max-h-[560px] overflow-y-auto focus:outline-none"
              tabIndex={0}
              aria-label="Danh sách các lĩnh vực tri thức"
            >
              {filteredNodes.map((item) => {
                const node = ATLAS_NODE_DATA[item.id];
                const isSelected = item.id === selectedNodeId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNodeId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedNodeId(item.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${item.label} (${node.domain}) - Tiến độ ${node.progress}%`}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-surface-elevated border-accent-primary ring-1 ring-accent-primary"
                        : "bg-surface-primary border-border-subtle hover:border-border-strong hover:bg-surface-elevated/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-text-primary text-base">
                          {node.title}
                        </h3>
                        <p className="text-xs text-text-muted font-mono mt-0.5">
                          {node.domain} · {node.lessonCount} bài học · {node.projectCount} đồ án
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {node.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Đã hoàn thành
                        </span>
                      )}
                      {node.status === "IN_PROGRESS" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Clock size={12} /> Đang học {node.progress}%
                        </span>
                      )}
                      {node.status === "LOCKED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                          <Lock size={12} /> Khóa
                        </span>
                      )}
                      {node.status === "READY" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Sparkles size={12} /> Sẵn sàng
                        </span>
                      )}
                      {node.status === "RECOMMENDED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <BrainCircuit size={12} /> Khuyến nghị
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Node Inspector Drawer / Card */}
        <div className="lg:col-span-4 bg-surface-primary border border-border-subtle rounded-2xl p-6 shadow-xl relative">
          {selectedNode ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-accent-knowledge px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {selectedNode.domain}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    ID: {selectedNode.id}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mt-3">
                  {selectedNode.title}
                </h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Progress metric */}
              <div className="bg-surface-elevated/60 border border-border-subtle p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Mức độ hoàn thiện</span>
                  <span className="text-text-primary font-bold">{selectedNode.progress}%</span>
                </div>
                <div className="w-full bg-surface-primary h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selectedNode.progress}%`,
                      backgroundColor:
                        selectedNode.progress === 100
                          ? "#45D69A"
                          : selectedNode.progress > 0
                          ? "#65D8FF"
                          : "#727C8E",
                    }}
                  />
                </div>
              </div>

              {/* Prerequisites & Dependents */}
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-text-muted uppercase tracking-wider block mb-1">
                    Tiền đề cần học trước (Prerequisites):
                  </span>
                  {selectedNode.prerequisites.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.prerequisites.map((preId) => (
                        <button
                          key={preId}
                          type="button"
                          onClick={() => setSelectedNodeId(preId)}
                          className="px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border-subtle hover:text-text-primary"
                        >
                          {ATLAS_NODE_DATA[preId]?.title || preId}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-400">Không có tiền đề bắt buộc (Foundation)</span>
                  )}
                </div>

                <div>
                  <span className="text-text-muted uppercase tracking-wider block mb-1">
                    Mục tiêu mở khóa tiếp theo:
                  </span>
                  <p className="text-text-primary font-sans text-xs bg-surface-elevated/40 p-2.5 rounded-lg border border-border-subtle">
                    {selectedNode.recommendedNext}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href={`/learn?domain=${encodeURIComponent(selectedNode.domain)}`}
                  className="w-full py-3 px-4 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20"
                >
                  <span>Bắt đầu học chuyên đề này</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted text-sm">
              Chọn một khối kiến thức để xem chi tiết lộ trình và các điều kiện phụ thuộc.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
