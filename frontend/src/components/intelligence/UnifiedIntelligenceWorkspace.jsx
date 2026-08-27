"use client";

/**
 * StudentHub AI — Unified Intelligence Workspace (T1–T4)
 * Connected Academic Intelligence Fabric: Trust, Experts, Community Claims, and Evidence Fusion.
 */

import React, { useState } from "react";
import {
  Brain,
  ShieldCheck,
  Award,
  Users,
  Layers,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles
} from "lucide-react";

export default function UnifiedIntelligenceWorkspace() {
  const [activeTab, setActiveTab] = useState("t4_fusion");
  const [expertSearch, setExpertSearch] = useState("");

  const experts = [
    {
      id: "EXP_DR_MINH_AI",
      name: "TS. Nguyễn Văn Minh",
      title: "Trưởng Bộ Môn Trí Tuệ Nhân Tạo",
      institution: "HCMUTE",
      department: "Khoa CNTT",
      status: "VERIFIED_EXPERT",
      scopes: ["AI_ML", "COMPUTER_VISION", "EDTECH"],
      publicationsCount: 14,
      reputationScore: 94,
      verifiedEmail: "minhnv@hcmute.edu.vn"
    },
    {
      id: "EXP_DR_TRIET_EMBEDDED",
      name: "TS. Lê Hoàng Triết",
      title: "Phó Trưởng Bộ Môn Kỹ Thuật Máy Tính",
      institution: "HCMUTE",
      department: "Khoa CNTT",
      status: "VERIFIED_EXPERT",
      scopes: ["EMBEDDED_SYSTEMS", "IOT_ARCHITECTURE"],
      publicationsCount: 9,
      reputationScore: 91,
      verifiedEmail: "trietlh@hcmute.edu.vn"
    }
  ];

  const fusedEvidences = [
    {
      id: "FUSION_01",
      topic: "Đăng Ký Học Phần Bổ Sung & Chuyển Lớp",
      statutoryRule: "Quy chế Đào tạo tín chỉ Điều 12: Thời hạn điều chỉnh thời khóa biểu là 7 ngày đầu học kỳ.",
      operationalTruth: "Phòng Đào Tạo thường mở đợt phụ tại bàn tiếp sinh viên nhà A1 đến hết tuần 2.",
      confidence: 0.94,
      contradictionType: "OPERATIONAL_EXPANSION",
      provenanceCount: 4,
      sources: ["QĐ 1422/QĐ-ĐHSPKT", "Thông báo PDT 2026", "Diễn đàn SV HCMUTE"]
    },
    {
      id: "FUSION_02",
      topic: "Chuẩn Đầu Ra Tiếng Anh Xét Tốt Nghiệp K24",
      statutoryRule: "Bắt buộc chứng chỉ quốc tế TOEIC 650+ hoặc tương đương trước khi đăng ký làm Khóa Luận.",
      operationalTruth: "Sinh viên có thể nộp bản điện tử tra cứu trực tuyến trước, nộp bản gốc khi bảo vệ.",
      confidence: 0.98,
      contradictionType: "CONSISTENT_WITH_PROCEDURAL_NUANCE",
      provenanceCount: 5,
      sources: ["Quy định Chuẩn đầu ra Ngoại ngữ 2024", "Xác nhận Khoa CNTT"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <section className="p-6 rounded-3xl bg-[#120704] border border-[#3d1910] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">T1–T4 Intelligence Fabric</h1>
            <p className="text-xs text-gray-400">Mạng lưới Tri Thức & Bằng Chứng Học Vụ Đa Tầng Hợp Nhất</p>
          </div>
        </div>
      </section>

      {/* 2. Layer Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2d120a] pb-2">
        <button
          onClick={() => setActiveTab("t4_fusion")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "t4_fusion" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          T4: Hợp Nhất Bằng Chứng & Mâu Thuẫn
        </button>
        <button
          onClick={() => setActiveTab("t2_experts")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "t2_experts" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          T2: Mạng Lưới Chuyên Gia Xác Thực
        </button>
        <button
          onClick={() => setActiveTab("t1_trust")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "t1_trust" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          T1: Đồ Thị Tín Nhiệm Theo Chủ Đề
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "t4_fusion" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] text-xs text-gray-400 leading-relaxed">
            💡 <strong className="text-white">Nguyên Lý Hợp Nhất T4:</strong> Ưu tiên văn bản quy chế pháp lý từ Ban Giám Hiệu / Phòng Đào Tạo làm căn cứ pháp lý cao nhất, đồng thời lưu giữ các chi tiết vận hành thực tế được cộng đồng và chuyên gia xác nhận.
          </div>

          <div className="space-y-4">
            {fusedEvidences.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-[#120704] border border-[#2d120a] hover:border-amber-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.topic}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      Độ tin cậy: {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#180905] border border-[#2d120a] space-y-1">
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">📜 Căn Cứ Quy Chế Chính Thức:</span>
                    <p className="text-xs text-gray-200">{item.statutoryRule}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#180905] border border-[#2d120a] space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">⚡ Thực Tế Vận Hành Xác Nhận:</span>
                    <p className="text-xs text-gray-200">{item.operationalTruth}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#200e08] text-[11px] text-gray-500 font-mono">
                  <span>Nguồn: {item.sources.join(" • ")}</span>
                  <span>{item.provenanceCount} mắt xích truy nguyên</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "t2_experts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experts.map((exp) => (
              <div key={exp.id} className="p-5 rounded-2xl bg-[#120704] border border-[#2d120a] hover:border-amber-500/30 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{exp.name}</h4>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{exp.title} • {exp.department}</p>
                    <p className="text-[11px] font-mono text-amber-400/90 mt-0.5">{exp.institution}</p>
                  </div>
                  <div className="text-center px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                    {exp.reputationScore} PTS
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {exp.scopes.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-[#180905] text-gray-300 font-mono text-[10px] border border-[#2d120a]">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#200e08] flex items-center justify-between text-xs text-gray-400">
                  <span className="font-mono">{exp.publicationsCount} công trình / bài báo</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Đã xác minh qua email EDU</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "t1_trust" && (
        <div className="p-6 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-4">
          <h3 className="text-sm font-bold text-white">Đồ Thị Tín Nhiệm Theo Chủ Đề Của Bạn (T1)</h3>
          <p className="text-xs text-gray-400">
            Điểm tín nhiệm được tính toán độc lập theo từng lĩnh vực chuyên môn, có tính đến chu kỳ suy giảm (half-life decay) theo thời gian.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-[#180905] border border-[#2d120a] text-center space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Trí Tuệ Nhân Tạo (AI/ML)</span>
              <p className="text-xl font-bold font-mono text-amber-400">0.88</p>
              <span className="text-[10px] text-emerald-400 font-mono">Tín nhiệm cao</span>
            </div>
            <div className="p-4 rounded-xl bg-[#180905] border border-[#2d120a] text-center space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Kỹ Thuật Lập Trình</span>
              <p className="text-xl font-bold font-mono text-white">0.92</p>
              <span className="text-[10px] text-emerald-400 font-mono">Đóng góp tích cực</span>
            </div>
            <div className="p-4 rounded-xl bg-[#180905] border border-[#2d120a] text-center space-y-1">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Quy Chế Tín Chỉ</span>
              <p className="text-xl font-bold font-mono text-gray-300">0.75</p>
              <span className="text-[10px] text-amber-400 font-mono">Đang tích lũy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
