"use client";

import React, { useState } from "react";
import { Users, MessageSquare, CheckCircle2, AlertTriangle, Scale, History, PlusCircle, ArrowRight, Shield } from "lucide-react";

export function CommunityIntelligenceStudio() {
  const [activeTab, setActiveTab] = useState("claims");

  const sampleClaims = [
    {
      claimId: "claim_math1_prereq",
      statement: "Môn Giải tích 1 (MATH141701) là điều kiện tiên quyết bắt buộc để đăng ký Giải tích 2 trong HK2.",
      originalPost: "Mọi người cho mình hỏi rớt Giải tích 1 HK1 thì HK2 có được đăng ký Giải tích 2 không ạ?",
      topicId: "academic.curriculum.registration",
      consensusPercentage: 88,
      status: "STRONG_CONSENSUS",
      independentContributors: 42,
      majoritySummary: "88% sinh viên xác nhận cổng đăng ký học phần sẽ tự động khóa môn Giải tích 2 nếu chưa qua Giải tích 1.",
      minoritySignal: {
        percentage: 12,
        cohort: "K22 CLC",
        explanation: "12% sinh viên khóa K22 Chất lượng cao ghi nhận được phép học song hành nếu nộp đơn xin bảo lãnh của Khoa."
      },
      hasActiveCorrection: false
    },
    {
      claimId: "claim_toeic_deadline",
      statement: "Thời gian xử lý thẩm định chứng chỉ TOEIC nộp trực tuyến thường mất 7-10 ngày làm việc.",
      originalPost: "Nộp bằng TOEIC xét tốt nghiệp trên portal thì bao lâu mới được duyệt vậy mn?",
      topicId: "academic.certification",
      consensusPercentage: 76,
      status: "MODERATE_CONSENSUS",
      independentContributors: 31,
      majoritySummary: "76% sinh viên xác nhận thời gian xử lý thực tế trung vị là 8 ngày làm việc.",
      minoritySignal: {
        percentage: 24,
        cohort: "Đợt cao điểm tháng 3",
        explanation: "24% sinh viên nộp sát kỳ tốt nghiệp tháng 3 bị kéo dài tới 14 ngày do lượng hồ sơ tăng đột biến."
      },
      hasActiveCorrection: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-emerald-400">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold text-neutral-100">T3 Community Intelligence & Consensus Engine</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Khai phá nhận định thực tế từ cộng đồng sinh viên, bảo tồn góc nhìn thiểu số và loại bỏ thao túng bằng lượt like ảo.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("claims")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "claims"
                  ? "bg-emerald-500 text-neutral-950 font-bold"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Mệnh Đề Thực Tế (Claims)
            </button>
            <button
              onClick={() => setActiveTab("corrections")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "corrections"
                  ? "bg-emerald-500 text-neutral-950 font-bold"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Nhật Ký Đính Chính (Audit)
            </button>
          </div>
        </div>
      </div>

      {/* Claim Cards */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {sampleClaims.map((item) => (
            <div
              key={item.claimId}
              className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-4"
            >
              {/* Claim Statement */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {item.topicId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-100 leading-snug">{item.statement}</h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-neutral-500">Đồng thuận cộng đồng</div>
                  <div className="text-xl font-extrabold text-emerald-400">{item.consensusPercentage}%</div>
                  <div className="text-[11px] text-neutral-500">{item.independentContributors} sinh viên độc lập</div>
                </div>
              </div>

              {/* Original Provenance Snippet */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs">
                <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  Văn Bản Gốc Bảo Lưu Nguồn Gốc (Original Text Provenance):
                </span>
                <p className="text-neutral-300 italic">"{item.originalPost}"</p>
              </div>

              {/* Consensus Breakdown & Minority Signal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đồng Thuận Đa Số ({item.consensusPercentage}%)</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{item.majoritySummary}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Góc Nhìn Thiểu Số ({item.minoritySignal.percentage}% - {item.minoritySignal.cohort})</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{item.minoritySignal.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Corrections Tab */}
      {activeTab === "corrections" && (
        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center space-x-2 text-neutral-300 text-sm font-semibold">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Quy Trình Đính Chính & Kiểm Thảo Bất Biến (Immutable Correction Log)</span>
          </div>
          <p className="text-xs text-neutral-400">
            Mọi đính chính hoặc điều chỉnh số liệu đều được ghi lại vĩnh viễn trong Provenance Graph, không xóa đè lịch sử.
          </p>
          <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="font-bold text-emerald-400">[CORRECTION_ACCEPTED]</span>
              <span>2026-08-25T10:00:00Z</span>
            </div>
            <p className="text-neutral-200">
              <strong>Điều chỉnh:</strong> Cập nhật thời hạn nộp chứng chỉ tiếng Anh đợt 1 từ ngày 10/03 sang ngày 15/03/2026 theo Thông báo số 128/TB-ĐTH.
            </p>
            <div className="text-[11px] text-neutral-500">
              Thẩm định bởi: <strong>Ban Cố Vấn Học Vụ HCMUTE (expert:daotao_01)</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
