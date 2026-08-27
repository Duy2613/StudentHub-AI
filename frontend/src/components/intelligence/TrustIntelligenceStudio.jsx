"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, AlertTriangle, History, Info, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

export function TrustIntelligenceStudio({ subjectId = "student:24110001" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("academic.curriculum");

  useEffect(() => {
    async function loadTrust() {
      try {
        setLoading(true);
        const res = await fetch(`/api/intelligence/trust/${encodeURIComponent(subjectId)}?topic=${encodeURIComponent(selectedTopic)}`);
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
        }
      } catch (err) {
        console.error("Failed to load trust profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTrust();
  }, [subjectId, selectedTopic]);

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 animate-pulse flex items-center justify-center space-x-3 text-neutral-400">
        <ShieldCheck className="w-6 h-6 animate-spin text-cyan-400" />
        <span>Đang giải mã ma trận tin cậy đa chiều (T1 Trust Intelligence)...</span>
      </div>
    );
  }

  const d = profile?.trustProfile?.dimensions || {};
  const exp = profile?.explanation || {};

  return (
    <div className="space-y-6">
      {/* Header Profile Summary */}
      <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-neutral-100">{subjectId}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {profile?.trustProfile?.overallLevel || "HIGH"}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">
                Điểm tin cậy tổng hợp: <span className="font-semibold text-cyan-300">{((profile?.trustProfile?.compositeScore || 0) * 100).toFixed(1)}/100</span> (Không sáp nhập mờ ảo)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {["academic.curriculum", "academic.tuition", "general"].map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTopic === topic
                    ? "bg-cyan-500 text-neutral-950 font-bold shadow-lg shadow-cyan-500/20"
                    : "bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 border border-neutral-700/50"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Traceable Explanation Callout */}
        <div className="mt-5 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Giải Trình Minh Bạch (Explainable Rationale)</h4>
              <p className="text-sm text-neutral-300 mt-1 leading-relaxed">
                {exp.textSummary || "Chủ thể có lịch sử đóng góp minh chứng đầy đủ và danh tính chính quy."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Distinct Trust Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Identity Trust (Danh tính)", score: d.identityTrust, desc: "Xác thực email trường & MSSV chính quy" },
          { label: "Behavior Trust (Hành vi)", score: d.behaviorTrust, desc: "Không vi phạm tiêu chuẩn & không bị báo cáo" },
          { label: "Contribution Trust (Đóng góp)", score: d.contributionTrust, desc: "Tỷ lệ đính kèm minh chứng kiểm chứng" },
          { label: "Evidence Trust (Minh chứng)", score: d.evidenceTrust, desc: "Chất lượng thẩm định nguồn độc lập" },
          { label: "Academic Trust (Học vụ)", score: d.academicTrust, desc: "Trạng thái ghi danh & hồ sơ chính thức" },
          { label: "Community Trust (Cộng đồng)", score: d.communityTrust, desc: "Mức độ đồng thuận và xác nhận từ bạn bè" },
          { label: "Expertise Trust (Chuyên môn)", score: d.expertiseTrust, desc: "Điểm chuyên môn theo chủ đề tương ứng" },
          { label: "Consistency Trust (Nhất quán)", score: d.consistencyTrust, desc: "Lịch sử không bị rút lại hoặc phủ nhận" },
          { label: "Integrity Signals (Liêm chính)", score: d.integrityTrust, desc: "Khiên chống thao túng phiếu & Sybil" }
        ].map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">{item.label}</span>
              <span className="text-sm font-bold text-cyan-400">{((item.score || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, (item.score || 0) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Strong Signals & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tín Hiệu Mạnh Then Chốt (Strong Signals)</span>
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-neutral-300">
            {(exp.strongSignals || []).map((s, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Điểm Lưu Ý & Hạn Chế (Weaknesses / Bounds)</span>
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-neutral-300">
            {(exp.weaknesses || []).length > 0 ? (
              exp.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))
            ) : (
              <li className="text-neutral-500 italic">Không phát hiện điểm rủi ro hoặc hạn chế nào.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
