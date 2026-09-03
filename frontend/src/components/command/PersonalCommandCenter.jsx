"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Calendar, Sparkles, Award, Users, Clock, HelpCircle, ChevronRight } from "lucide-react";
import { PersonalAcademicBriefing } from "./PersonalAcademicBriefing";

export function PersonalCommandCenter({ initialData = null }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/personalization/command-center");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed loading command center data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, [initialData]);

  if (loading) {
    return (
      <div className="p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 animate-pulse flex flex-col items-center justify-center space-y-4 text-neutral-400">
        <Sparkles className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="text-sm font-medium">Đang tổng hợp Bản sao số học vụ & Trung tâm Điều phối cá nhân hóa...</span>
      </div>
    );
  }

  const twin = data?.digitalTwinSummary || {};
  const nextAction = data?.nextBestAction || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Welcome & Digital Twin Telemetry */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-neutral-950 border border-neutral-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                BẢN SAO SỐ HỌC VỤ CHÍNH QUY
              </span>
              <span className="text-xs text-neutral-400">• MSSV: {twin.studentId || "24110001"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Xin chào, {twin.fullName || "Sinh viên HCMUTE"}
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 max-w-2xl">
              Hệ thống đã đối soát tự động tiến độ học tập, quy chế đào tạo hiện hành và tổng hợp kế hoạch học vụ tối ưu cho bạn hôm nay.
            </p>
          </div>

          {/* Academic Progress Meter */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 min-w-[240px] space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Tiến độ tích lũy:</span>
              <span className="font-extrabold text-cyan-400">{twin.earnedCredits || 48} / 132 TC</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${twin.completionPercentage || 36}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>GPA: <strong className="text-emerald-400">{twin.cgpa || "3.42"}</strong></span>
              <span>Xếp loại: <strong className="text-neutral-300">{twin.academicStanding || "Xuất Sắc"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Hyper-Personalized Academic Briefing */}
      <PersonalAcademicBriefing />

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: What matters now & Next Best Action */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grounded AI Recommended Next Best Action */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800/90 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Hành Động Khuyến Nghị Tối Ưu Nhất (Next Best Action)</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {nextAction.confidenceLabel} ({(nextAction.confidence * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-neutral-100">{nextAction.title}</h3>
              <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">{nextAction.description}</p>
            </div>

            {/* Explainable Why Am I Seeing This */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-xs space-y-1.5">
              <div className="flex items-center space-x-1.5 text-neutral-400 font-semibold text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tại sao tôi nhận được khuyến nghị này? (Why me & Why now?)</span>
              </div>
              <p className="text-neutral-300">{nextAction.whyAmISeeingThis}</p>
              <div className="text-[11px] text-neutral-500 pt-1">
                Minh chứng đối ứng: <strong>{nextAction.supportingEvidence}</strong>
              </div>
            </div>

            {/* Alternatives */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-neutral-500">Phương án dự phòng:</span>
              {(nextAction.alternatives || []).map((alt, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-neutral-800/70 text-neutral-300 border border-neutral-700/50">
                  {alt}
                </span>
              ))}
            </div>
          </div>

          {/* Today's Schedule & Academic Timeslots */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-neutral-300 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Lịch Học & Hoạt Động Hôm Nay</span>
              </div>
              <Link href="/dashboard" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium">
                <span>Toàn bộ thời khóa biểu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {(data?.todaySchedule || []).map((slot) => (
                <div
                  key={slot.slotId}
                  className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 font-mono font-bold shrink-0 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-0.5" />
                      <span className="text-[10px]">{slot.time}</span>
                    </div>
                    <div>
                      <div className="font-bold text-neutral-100 text-sm">
                        {slot.courseCode} — {slot.courseName}
                      </div>
                      <div className="text-neutral-400 mt-0.5">
                        Phòng: <strong className="text-neutral-200">{slot.room}</strong> • Giảng viên: {slot.instructor}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-center">
                    SẮP DIỄN RA
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Relevant Experts, Community Signals & Fast Deep Links */}
        <div className="space-y-6">
          {/* Matched Verified Experts */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Chuyên Gia Phù Hợp (T2 Lens)</span>
              </div>
              <Link href="/expert" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Tra cứu thêm
              </Link>
            </div>

            <div className="space-y-3">
              {(data?.personalizedExperts || []).map((exp) => (
                <div key={exp.expertId} className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-neutral-200">{exp.fullName}</div>
                      <div className="text-[11px] text-neutral-400">{exp.title} • {exp.department}</div>
                    </div>
                    <span className="text-[11px] font-extrabold text-indigo-400">{exp.domainMatchPercentage}% khớp</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 italic">{exp.whyMatched}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Community Signal Ticker */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Tín Hiệu Cộng Đồng (T3 Lens)</span>
              </div>
              <Link href="/community" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                Xem chi tiết
              </Link>
            </div>

            {(data?.communitySignals || []).map((sig) => (
              <div key={sig.signalId} className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2 text-xs">
                <div className="font-bold text-neutral-200">{sig.headline}</div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Đồng thuận: <strong className="text-emerald-400">{sig.consensusPercentage}%</strong></span>
                  <span>{sig.participantCount} sinh viên tham gia</span>
                </div>
                <p className="text-[11px] text-neutral-500">{sig.whyRelevant}</p>
              </div>
            ))}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-neutral-900/70 to-neutral-950 border border-neutral-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Truy Cập Nhanh 4 Thấu Kính Trí Tuệ
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/trust" className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-cyan-500/40 block text-neutral-300 hover:text-cyan-300 font-medium transition-all">
                🛡️ T1 Trust Lens
              </Link>
              <Link href="/expert" className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-indigo-500/40 block text-neutral-300 hover:text-indigo-300 font-medium transition-all">
                🎓 T2 Expert Lens
              </Link>
              <Link href="/community" className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-emerald-500/40 block text-neutral-300 hover:text-emerald-300 font-medium transition-all">
                👥 T3 Community
              </Link>
              <Link href="/trust" className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-purple-500/40 block text-neutral-300 hover:text-purple-300 font-medium transition-all">
                🧩 T4 Evidence
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
