"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Compass, ChevronDown, ChevronUp } from "lucide-react";

export function GroundedRecommendationStudio({ studentId = "24110001" }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function loadRecs() {
      try {
        setLoading(true);
        const res = await fetch(`/api/intelligence/recommendations?studentId=${studentId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setRecommendations(json.data.recommendations || []);
        }
      } catch (err) {
        console.error("Failed loading recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecs();
  }, [studentId]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 animate-pulse flex items-center justify-center space-x-3 text-neutral-400">
        <Sparkles className="w-5 h-5 animate-spin text-amber-400" />
        <span>Đang tổng hợp khuyến nghị học vụ dựa trên mạng lưới minh chứng xác thực...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl">
        <div className="flex items-center space-x-3 text-amber-400">
          <Compass className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold text-neutral-100">AI Grounded Recommendations & Action Pathways</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Khuyến nghị được xây dựng trên bằng chứng xác thực, giải trình rõ ràng ("Tại sao? Dựa trên minh chứng nào? Có bất định gì?"), không ảo giác hay tạo quyền tự ý.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => {
            const isExpanded = expandedId === rec.recommendationId;
            return (
              <div
                key={rec.recommendationId}
                className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {rec.confidenceBand || "HIGH_CONFIDENCE"} ({(rec.confidence * 100).toFixed(0)}%)
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-800 text-neutral-300">
                        Mức rủi ro: <strong className={rec.risk === "LOW" ? "text-emerald-400" : "text-amber-400"}>{rec.risk}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                      <span>{rec.action}</span>
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleExpand(rec.recommendationId)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700/50 flex items-center space-x-1.5 transition-all shrink-0 self-start"
                  >
                    <span>{isExpanded ? "Thu gọn" : "Xem minh chứng & giải trình"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Primary Rationale */}
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs leading-relaxed text-neutral-300">
                  <strong className="text-amber-400 font-semibold block mb-1">Cơ Sở Khuyến Nghị (Why this?):</strong>
                  {rec.rationale}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-neutral-800 text-xs animate-in fade-in-50 duration-300">
                    {/* Uncertainty & Assumptions */}
                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                      <strong className="text-amber-400 font-semibold block mb-1">Yếu Tố Bất Định & Giả Định (Uncertainty / Assumptions):</strong>
                      <p className="text-neutral-300 leading-relaxed">{rec.uncertaintyExplanation}</p>
                    </div>

                    {/* Alternatives */}
                    {(rec.alternatives || []).length > 0 && (
                      <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
                        <strong className="text-neutral-300 font-semibold block mb-1.5">Phương Án Thay Thế (Viable Alternatives):</strong>
                        <ul className="space-y-1 text-neutral-400">
                          {rec.alternatives.map((alt, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-neutral-500">•</span>
                              <span>{alt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Provenance Footer */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                      <span>Được tạo bởi: <strong>{rec.generatedBy}</strong> (Chỉ lập luận, không tạo quyền)</span>
                      <span>Hết hạn khuyến nghị: {new Date(rec.expiresAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-neutral-500 text-xs">
            Hồ sơ học vụ hiện tại đã tối ưu, chưa phát sinh khuyến nghị can thiệp mới.
          </div>
        )}
      </div>
    </div>
  );
}
