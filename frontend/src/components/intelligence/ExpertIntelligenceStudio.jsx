"use client";

import React, { useState, useEffect, useRef } from "react";
import { Award, Search, CheckCircle, ExternalLink, ShieldCheck, X, AlertTriangle, Loader2 } from "lucide-react";
import { safeExternalUrl } from "@/lib/security/safeExternalUrl.js";

export function ExpertIntelligenceStudio() {
  const [topicQuery, setTopicQuery] = useState("Giải tích 1");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const didInitialSearch = useRef(false);

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
    if (didInitialSearch.current) return undefined;
    didInitialSearch.current = true;
    const timer = setTimeout(() => { void searchExperts(topicQuery); }, 0);
    return () => clearTimeout(timer);
  }, [topicQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (topicQuery.trim()) {
      searchExperts(topicQuery.trim());
    }
  };

  const openExpertDetail = async (expertId) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const res = await fetch(`/api/intelligence/experts/${encodeURIComponent(expertId)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Không tải được hồ sơ chuyên gia.");
      setSelectedExpert(json.data);
    } catch (err) {
      setDetailError(err.message || "Không thể tải hồ sơ chuyên gia.");
    } finally {
      setDetailLoading(false);
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
                <button
                  key={match.expertId}
                  type="button"
                  onClick={() => openExpertDetail(match.expertId)}
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
                      <div className="text-[10px] text-neutral-500 mt-1">Mở hồ sơ kiểm chứng →</div>
                    </div>
                  </div>

                  {/* 5-Signal Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-neutral-800/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
                      <span className="text-neutral-500 block text-[11px]">Độ chính xác lịch sử:</span>
                      <span className="font-bold text-emerald-400">{sig.historicalAccuracyPercentage}%</span>
                      <small className="block text-[10px] text-neutral-500">{sig.historyConfidenceLabel}</small>
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
                </button>
              );
            })
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-neutral-500 text-xs">
              Không tìm thấy chuyên gia nào có thẩm quyền phù hợp với chủ đề đã chọn.
            </div>
          )}
        </div>
      )}

      {detailLoading && (
        <div className="p-6 rounded-2xl bg-neutral-900/70 border border-indigo-500/30 flex items-center justify-center gap-3 text-neutral-300">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Đang đối soát danh tính, vai trò và bằng chứng…
        </div>
      )}

      {detailError && <div role="alert" className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-200">{detailError}</div>}

      {selectedExpert && <ExpertDetailDrawer data={selectedExpert} onClose={() => setSelectedExpert(null)} />}
    </div>
  );
}

function ExpertDetailDrawer({ data, onClose }) {
  const { expert, reliability } = data;
  const summary = expert.verificationSummary || {};
  const boundaries = expert.authorityBoundaries || {};
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md p-4 sm:p-8 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Hồ sơ ${expert.name}`}>
      <div className="max-w-3xl mx-auto rounded-3xl bg-neutral-950 border border-indigo-400/30 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider"><ShieldCheck className="w-4 h-4" /> Hồ sơ kiểm chứng đa tín hiệu</div><h3 className="mt-2 text-2xl font-bold text-white">{expert.name}</h3><p className="mt-1 text-sm text-neutral-400">{expert.title} · {expert.department} · {expert.institution}</p></div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10" aria-label="Đóng hồ sơ"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[["Hạng bằng chứng", summary.evidenceGrade || "—"], ["Định danh", summary.identity || "—"], ["Vai trò", summary.affiliation || "—"], ["Xung đột", summary.activeConflicts ?? 0]].map(([label, value]) => <div key={label} className="p-3 rounded-xl bg-white/[0.04] border border-white/10"><p className="text-[10px] text-neutral-500 uppercase">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"><h4 className="text-sm font-bold text-emerald-300">Bằng chứng đã kiểm tra</h4><ul className="mt-3 space-y-2 text-xs text-neutral-300"><li>• {summary.verifiedCredentials || 0} credential đã xác minh</li><li>• {summary.groundedPublications || 0} công bố có DOI/provenance</li><li>• Nghiên cứu gần nhất: {summary.latestResearchYear || "chưa rõ"}</li><li>• Lần kiểm tra: {summary.lastCheckedAt || "chưa ghi nhận"}</li></ul></section>
          <section className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20"><h4 className="text-sm font-bold text-indigo-300">Lịch sử độ tin cậy</h4><p className="mt-3 text-2xl font-extrabold text-white">{Math.round((reliability?.historicalAccuracy || 0) * 100)}%</p><p className="mt-1 text-xs text-neutral-400">{reliability?.reliabilityLabel || "Chưa đủ lịch sử đánh giá"}</p><p className="mt-3 text-xs text-neutral-400">{reliability?.totalClaims || 0} claims · {reliability?.confirmedClaims || 0} xác nhận · {reliability?.disputedClaims || 0} tranh chấp</p></section>
        </div>
        <section className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20"><h4 className="flex items-center gap-2 text-sm font-bold text-amber-300"><AlertTriangle className="w-4 h-4" /> Ranh giới không được vượt qua</h4><p className="mt-2 text-xs leading-5 text-neutral-300">{boundaries.warning || "Chuyên môn không tự tạo ra thẩm quyền hành chính."}</p><div className="mt-3 flex flex-wrap gap-2">{(boundaries.establishedDomains || []).map((domain) => <span key={domain} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px]">Đã xác lập · {domain}</span>)}{(boundaries.outOfScopeDomains || []).map((domain) => <span key={domain} className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 text-[11px]">Ngoài phạm vi · {domain}</span>)}</div></section>
        {safeExternalUrl(expert.directoryUrl) && <a href={safeExternalUrl(expert.directoryUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"><ExternalLink className="w-3.5 h-3.5" /> Mở nguồn hồ sơ công khai</a>}
      </div>
    </div>
  );
}
