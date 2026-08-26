"use client";

import React, { useState } from "react";
import { 
  Users, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  Layers, 
  Activity, 
  AlertTriangle, 
  Send,
  Building2,
  HelpCircle,
  ThumbsUp,
  Filter,
  ShieldX
} from "lucide-react";

export function CommunityExperienceStudio({ initialPosts = [], initialConsensus = null }) {
  const [posts, setPosts] = useState(initialPosts);
  const [consensus, setConsensus] = useState(initialConsensus);
  const [selectedTopic, setSelectedTopic] = useState("TOEIC_SUBMISSION_TIME");

  // Post Submission Sandbox
  const [newContent, setNewContent] = useState("");
  const [newCohort, setNewCohort] = useState("K22");
  const [newDuration, setNewDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const fetchTopicData = async (topic) => {
    setSelectedTopic(topic);
    try {
      const [resPosts, resConsensus] = await Promise.all([
        fetch(`/api/intelligence/community/posts?topic=${topic}`),
        fetch(`/api/intelligence/community/consensus?topic=${topic}`)
      ]);
      const dataPosts = await resPosts.json();
      const dataConsensus = await resConsensus.json();
      if (dataPosts.success) setPosts(dataPosts.posts);
      if (dataConsensus.success) setConsensus(dataConsensus.consensus);
    } catch (err) {
      console.error("Fetch topic data error:", err);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/intelligence/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          authorCohort: newCohort,
          topic: selectedTopic,
          procedureDurationDays: Number(newDuration) || null
        })
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts([data.post, ...posts]);
        setNewContent("");
        // refresh consensus
        const cRes = await fetch(`/api/intelligence/community/consensus?topic=${selectedTopic}`);
        const cData = await cRes.json();
        if (cData.success) setConsensus(cData.consensus);
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 text-slate-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> STUDENTHUB INTELLIGENCE OS • PHASE T3
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Community Experience Studio <span className="text-amber-400 font-mono text-xl">V1</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Lớp dữ liệu trải nghiệm thực tế từ sinh viên: Đo lường thời gian xử lý thủ tục trung vị,
              khai phá điểm nghẽn (edge-cases) và lá chắn chống thao túng thông tin (Astroturfing & Sockpuppets).
            </p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
            <div className="text-xs text-slate-400 font-mono">BẤT BIẾN CỐT LÕI</div>
            <div className="text-sm font-bold text-amber-400">COMMUNITY ≠ OFFICIAL POLICY</div>
          </div>
        </div>
      </div>

      {/* Topic Switcher Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
        {[
          { id: "TOEIC_SUBMISSION_TIME", label: "⏱️ Thời Gian Duyệt TOEIC" },
          { id: "PREREQUISITE_WAIVER_PRACTICE", label: "📋 Đơn Vượt Tiên Quyết" },
          { id: "SUMMER_SEMESTER_REGISTRATION", label: "☀️ Đăng Ký Học Kỳ Hè" },
          { id: "GRADUATION_DEFENSE_PREREQS", label: "🎓 Xét Khóa Luận Tốt Nghiệp" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => fetchTopicData(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedTopic === t.id
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Consensus & Turnaround Metrics Widget */}
      {consensus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> TÍN HIỆU ĐỒNG THUẬN CỘNG ĐỒNG
            </span>
            <div className="text-base font-bold text-white flex items-center gap-2">
              {consensus.consensusSignal === "STRONG_EXPERIENCE_CONSENSUS" ? (
                <span className="text-emerald-400 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Đồng thuận mạnh (≥ 3 SV)
                </span>
              ) : consensus.consensusSignal === "SUSPECTED_COORDINATION" ? (
                <span className="text-rose-400 flex items-center gap-1.5 text-sm">
                  <ShieldAlert className="w-4 h-4" /> Cảnh báo thao túng
                </span>
              ) : (
                <span className="text-slate-400 text-sm">Ý kiến / Tin đồn đơn lẻ</span>
              )}
            </div>
            <p className="text-xs text-slate-400">{consensus.summary}</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" /> THỜI GIAN XỬ LÝ TRUNG VỊ
            </span>
            <div className="text-3xl font-extrabold font-mono text-cyan-300">
              {consensus.medianProcedureDays !== null ? `${consensus.medianProcedureDays} Ngày` : "N/A"}
            </div>
            <p className="text-xs text-slate-500">Dựa trên {consensus.independentAccountsCount} báo cáo sinh viên độc lập</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> ĐIỂM NGHẼN & LƯU Ý (EDGE-CASES)
            </span>
            <div className="text-sm text-slate-300">
              {consensus.edgeCases && consensus.edgeCases.length > 0 ? (
                <span className="text-amber-300 font-semibold">{consensus.edgeCases.length} lưu ý thực tế được ghi nhận</span>
              ) : (
                <span className="text-slate-500">Chưa ghi nhận điểm nghẽn nghiêm trọng</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Tránh các lỗi scan mờ, nộp trễ hạn hoặc sai mẫu đơn.</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Experience Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Real-World Experience Timeline & Posts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" /> Trải Nghiệm Sinh Viên Ghi Nhận ({posts.length})
            </h2>
            <span className="text-xs font-mono text-slate-500">ĐÃ ẨN DANH AN TOÀN (SALTED HASH)</span>
          </div>

          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.postId} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {p.authorHash}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Khóa {p.authorCohort}</span>
                  </div>
                  {p.procedureDurationDays && (
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      ⏱️ {p.procedureDurationDays} ngày
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{p.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-500">
                  <span className="font-mono">Loại: {p.contentType}</span>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-400" /> {p.upvotes} hữu ích
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Submit Experience Sandbox & Invariant Disclaimers */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handlePostSubmit} className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" /> Đóng Góp Trải Nghiệm Thực Tế
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">NỘI DUNG TRẢI NGHIỆM / LƯU Ý</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Chia sẻ kinh nghiệm làm thủ tục, thời gian chờ, hoặc điểm cần lưu ý..."
                rows={3}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">KHÓA SINH VIÊN</label>
                <select
                  value={newCohort}
                  onChange={(e) => setNewCohort(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                >
                  <option value="K21">K21 (Năm 4 / Tốt Nghiệp)</option>
                  <option value="K22">K22 (Năm 3)</option>
                  <option value="K23">K23 (Năm 2)</option>
                  <option value="K24">K24 (Tân Sinh Viên)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">SỐ NGÀY XỬ LÝ (NẾU CÓ)</label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
            >
              {submitting ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi Báo Cáo Trải Nghiệm (Ẩn Danh Tự Động)
            </button>
          </form>

          {/* Official Policy Discrepancy Note */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Phân Định Quy Chế vs Thực Tế
            </div>
            <p className="text-slate-400 leading-relaxed">
              Dữ liệu cộng đồng phản ánh <strong>thực tiễn vận hành</strong> (Operational reality) để sinh viên chủ động trừ hao thời gian. Khi có mâu thuẫn giữa tin đồn và văn bản ban hành, <strong>Văn Bản Phòng Đào Tạo luôn là nguồn chân lý pháp lý duy nhất</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
