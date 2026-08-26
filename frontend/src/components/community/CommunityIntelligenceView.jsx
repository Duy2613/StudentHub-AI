"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  MessageSquareQuote, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  Activity,
  Layers,
  FileCheck2,
  Filter,
  AlertOctagon,
  CopyCheck
} from "lucide-react";

export function CommunityIntelligenceView({ initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedTopic, setSelectedTopic] = useState("TOEIC_SUBMISSION");
  const [consensus, setConsensus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConsensus(selectedTopic);
  }, [selectedTopic]);

  const fetchConsensus = async (topic) => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/experience/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setConsensus(data.evaluation);
      }
    } catch (err) {
      console.error("Error fetching consensus:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(p => p.topic === selectedTopic);

  const getSignalBadge = (signal) => {
    switch (signal) {
      case "STRONG_EXPERIENCE_CONSENSUS":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"><CheckCircle2 className="w-3.5 h-3.5" /> ĐỒNG THUẬN TRẢI NGHIỆM MẠNH</span>;
      case "MODERATE_COMMUNITY_SIGNAL":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"><TrendingUp className="w-3.5 h-3.5" /> TÍN HIỆU CỘNG ĐỒNG VỪA</span>;
      case "SUSPECTED_COORDINATION":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 border border-rose-500/40 text-rose-300 animate-pulse"><AlertOctagon className="w-3.5 h-3.5" /> PHÁT HIỆN SPAM / ASTROTURFING</span>;
      case "WEAK_ANECDOTE":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500/40 text-amber-300"><Clock className="w-3.5 h-3.5" /> TRẢI NGHIỆM ĐƠN LẺ (ANECDOTE)</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-400">TIN ĐỒN CHƯA XÁC THỰC</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> STUDENTHUB INTELLIGENCE OS • PHASE T3
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Community & Forum Intelligence <span className="text-indigo-400 font-mono text-xl">V1</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Lớp trải nghiệm thực tế của sinh viên (Real-World Experience Layer), tính toán đồng thuận mốc thời gian,
              khai phá edge-case thực tế và chống thao túng điều phối copy-paste (Astroturfing Defense).
            </p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
            <div className="text-xs text-slate-400 font-mono">BẤT BIẾN CỐT LÕI</div>
            <div className="text-sm font-bold text-indigo-400">COMMUNITY ≠ OFFICIAL POLICY</div>
          </div>
        </div>
      </div>

      {/* Topic Switcher & Insights */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono text-slate-400">CHỦ ĐỀ THỦ TỤC THỰC TẾ:</span>
          <div className="flex gap-2">
            {["TOEIC_SUBMISSION", "GRADUATION_PROJECT"].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTopic === t
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {t === "TOEIC_SUBMISSION" ? "Nộp & Hậu Kiểm Chứng Chỉ TOEIC" : "Bảo Vệ Đồ Án Tốt Nghiệp"}
              </button>
            ))}
          </div>
        </div>

        {consensus && (
          <div className="flex items-center gap-4">
            {consensus.medianProcedureDays && (
              <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Thời gian thực tế: </span>
                <span className="font-bold text-indigo-400">{consensus.medianProcedureDays} ngày</span>
              </div>
            )}
            {getSignalBadge(consensus.consensusSignal)}
          </div>
        )}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Feed of Verified Real-World Experiences */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-indigo-400" /> Nhật Ký Trải Nghiệm Sinh Viên ({filteredPosts.length})
          </h2>

          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.postId}
                className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-indigo-300">
                      {post.authorCohort} • {post.authorId}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
                      {post.contentType}
                    </span>
                  </div>
                  {post.procedureDurationDays && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.procedureDurationDays} ngày
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {post.content}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900">
                  <span>Hữu ích: {post.upvotes} sinh viên</span>
                  <span>{new Date(post.timestamp).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Experience Consensus & Astroturfing Guard */}
        <div className="lg:col-span-5 space-y-6">
          {consensus ? (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-6 space-y-5">
              <div>
                <span className="text-xs font-mono text-slate-400">TỔNG QUAN ĐỒNG THUẬN TRẢI NGHIỆM</span>
                <h3 className="text-base font-bold text-white mt-1">{consensus.summary}</h3>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center">
                  <div className="text-2xl font-bold font-mono text-white">{consensus.independentAccountsCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Sinh viên độc lập</div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center">
                  <div className="text-2xl font-bold font-mono text-indigo-400">{consensus.provenanceClustersCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Cụm xuất xứ nội dung</div>
                </div>
              </div>

              {/* Astroturfing Guard Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> KHIÊN CHỐNG SPAM & THAO TÚNG
                  </span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {consensus.manipulationRisk === "NONE" ? "AN TOÀN" : "CẢNH BÁO"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hệ thống phân cụm hash nội dung và phát hiện các mẫu sao chép đồng loạt để loại bỏ astroturfing và tài khoản ảo (sockpuppets).
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300">
                💡 <strong>Kinh nghiệm thực tế:</strong> Thông tin trên phản ánh thực tế triển khai của sinh viên các khóa trước, giúp bạn dự trù thời gian chính xác hơn.
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-12 text-center text-xs text-slate-500">
              Đang tải dữ liệu đồng thuận trải nghiệm...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
