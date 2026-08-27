"use client";

import React, { useState, useEffect } from "react";
import { Award, Search, CheckCircle, AlertOctagon, BookOpen, Clock, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";

export function ExpertIntelligenceStudio() {
  const [topicQuery, setTopicQuery] = useState("Giải tích 1");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchExperts = async (topic) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/intelligence/experts?topic=${encodeURIComponent(topic)}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      }
    } catch (err) {
      console.error("Failed searching experts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchExperts(topicQuery);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (topicQuery.trim()) {
      searchExperts(topicQuery.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400">
              <Award className="w-6 h-6" />
              <h2 className="text-xl font-bold text-neutral-100">T2 Expert Intelligence & Scope Boundaries</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Khám phá và xếp hạng chuyên gia theo thẩm quyền kiểm định chính quy, không phụ thuộc vào độ nổi tiếng hay lượt like.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={topicQuery}
                onChange={(e) => setTopicQuery(e.target.value)}
                placeholder="Tìm chủ đề chuyên môn (ví dụ: Giải tích 1, Xử lý ảnh)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950/80 border border-neutral-700/80 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shrink-0"
            >
              Tra Cứu
            </button>
          </form>
        </div>

        {/* Quick Topic Chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-800/80">
          <span className="text-[11px] text-neutral-500 self-center">Chủ đề mẫu:</span>
          {["Giải tích 1", "Trí tuệ nhân tạo", "Học máy", "Xử lý ảnh", "Kiến trúc máy tính"].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setTopicQuery(chip);
                searchExperts(chip);
              }}
              className="px-2.5 py-1 rounded-lg text-xs bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Results Feed */}
      {loading ? (
        <div className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 animate-pulse flex items-center justify-center space-x-3 text-neutral-400">
          <Award className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Đang đối soát thẩm quyền chuyên môn và lịch sử độ chính xác...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Kết quả tra cứu chuyên gia ({results?.totalMatched || 0} chuyên gia phù hợp)
            </span>
          </div>

          {(results?.topMatches || []).length > 0 ? (
            results.topMatches.map((match) => {
              const sig = match.signals || {};
              return (
                <div
                  key={match.expertId}
                  className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-indigo-500/40 transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-neutral-100">{match.fullName}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            {match.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{sig.verificationLabel}</span>
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          {match.department} • {match.institution}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-neutral-500">Độ khớp chuyên môn</div>
                      <div className="text-lg font-extrabold text-indigo-400">{sig.domainMatchPercentage}%</div>
                    </div>
                  </div>

                  {/* 5-Signal Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-neutral-800/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-neutral-500 block text-[11px]">Độ chính xác lịch sử:</span>
                      <span className="font-bold text-emerald-400">{sig.historicalAccuracyPercentage}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-neutral-500 block text-[11px]">Chất lượng minh chứng:</span>
                      <span className="font-bold text-cyan-400">{sig.evidenceQualityPercentage}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-neutral-500 block text-[11px]">Độ tươi mới công bố:</span>
                      <span className="font-bold text-neutral-200">{sig.freshnessLabel}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-neutral-500 block text-[11px]">Xung đột lợi ích:</span>
                      <span className={`font-bold ${sig.hasConflictOfInterest ? "text-amber-400" : "text-emerald-400"}`}>
                        {sig.hasConflictOfInterest ? "CÓ TÍN HIỆU" : "KHÔNG"}
                      </span>
                    </div>
                  </div>

                  {/* Domain tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-neutral-500 mr-1">Phạm vi công nhận:</span>
                    {(match.matchedDomains || []).map((dom, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[11px] bg-neutral-800/80 text-neutral-300 border border-neutral-700/50">
                        {dom}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-neutral-500 text-xs">
              Không tìm thấy chuyên gia nào có thẩm quyền phù hợp với chủ đề đã chọn.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
