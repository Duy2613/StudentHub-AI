"use client";

import React, { useState, useEffect } from "react";
import { Radio, AlertTriangle, Users, Sparkles, RefreshCw, Send } from "lucide-react";

export function SocialSignalRadar() {
  const [warnings, setWarnings] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warnRes, sigRes] = await Promise.all([
        fetch("/api/intelligence/social/early-warnings"),
        fetch("/api/intelligence/social/signals")
      ]);
      const warnJson = await warnRes.json();
      const sigJson = await sigRes.json();

      if (warnJson.success) setWarnings(warnJson.data || []);
      if (sigJson.success) setSignals(sigJson.data || []);
    } catch (err) {
      console.error("Failed loading radar signals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostSignal = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/intelligence/social/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostText,
          author: "Sinh viên K24",
          sourceClassification: "COMMUNITY"
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewPostText("");
        loadData();
      }
    } catch (err) {
      console.error("Post signal failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSignalBadgeColor = (type) => {
    switch (type) {
      case "OFFICIAL_STATEMENT":
      case "ANNOUNCEMENT":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "WARNING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "CORRECTION":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "RUMOR":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 text-cyan-400">
          <Radio className="w-7 h-7 animate-pulse" />
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Social Signal Radar & Early Warning Fabric</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Hệ thống giám sát tín hiệu thực tế, cảnh báo nghẽn mạng & đối soát tính xác thực từ mạng xã hội và cộng đồng.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700/60 flex items-center space-x-2 self-start sm:self-center transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới radar</span>
        </button>
      </div>

      {/* 1. Early Warnings Banner */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Cảnh Báo Vận Hành Đang Diễn Ra ({warnings.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warnings.map((w) => (
              <div
                key={w.warningId}
                className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{w.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {w.status}
                  </span>
                </div>
                <p className="text-neutral-300 leading-relaxed">{w.summary}</p>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-amber-500/20">
                  <span>{w.distinctReporterCount} sinh viên độc lập báo cáo</span>
                  <span className="text-amber-400 font-semibold">Độ tin cậy: {Math.round(w.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Submit Community Report */}
      <form onSubmit={handlePostSignal} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
        <label className="text-xs font-bold text-neutral-300 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Gửi báo cáo / ý kiến thực tế từ cộng đồng</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Ví dụ: Cổng online.hcmute.edu.vn đang bị nghẽn lúc lưu môn Giải tích 1..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={submitting || !newPostText.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </div>
      </form>

      {/* 3. Ingested Social Signal Stream */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Luồng Tín Hiệu Xã Hội Đã Chuẩn Hóa & Đối Soát ({signals.length})</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-500">Đang đồng bộ tín hiệu từ mạng xã hội...</div>
        ) : signals.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">Chưa có tín hiệu mới nào được ghi nhận.</div>
        ) : (
          <div className="space-y-3">
            {signals.map((sig) => (
              <div
                key={sig.contentId}
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-neutral-200">{sig.author?.authorName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSignalBadgeColor(sig.claimCandidate?.signalType)}`}>
                      {sig.claimCandidate?.signalType || "SIGNAL"}
                    </span>
                    {sig.coordination?.isCoordinated && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        POTENTIAL_COORDINATION
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {new Date(sig.publishedAt).toLocaleTimeString("vi-VN")}
                  </span>
                </div>

                <p className="text-neutral-300 leading-relaxed">{sig.rawText}</p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/60">
                  <div className="flex items-center space-x-3">
                    <span>Chất lượng tín hiệu: <strong className="text-cyan-400">{Math.round((sig.quality?.compositeScore || 0.6) * 100)}%</strong></span>
                    <span>Độc lập: <strong className="text-neutral-300">{sig.duplication?.isDuplicate ? "Trùng lặp cụm" : "Nguồn độc lập"}</strong></span>
                  </div>
                  <span className="text-neutral-500 font-mono text-[10px]">{sig.contentId}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
