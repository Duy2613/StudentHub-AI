"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Camera,
  Cpu,
  UserCheck,
  FileCode,
  Link2,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeCheck,
  Layers,
} from "lucide-react";

export default function ImageForensicsHUD({ mediaForensics, className = "" }) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!mediaForensics || typeof mediaForensics !== "object") return null;

  const {
    version = "IMAGE_FORENSICS_V1",
    status = "COMPLETED",
    summary = {},
    aiGeneration = {},
    deepfake = {},
    manipulation = {},
    metadata = {},
    provenance = {},
    compression = {},
    resampling = {},
    ocr = {},
    visibleUrls = [],
    quality = {},
    providerAgreement = {},
  } = mediaForensics;

  const riskLevel = summary.riskLevel || "LOW";
  const requiresHumanReview = Boolean(summary.requiresHumanReview);

  const isHighRisk = riskLevel === "HIGH" || riskLevel === "CRITICAL";
  const isMediumRisk = riskLevel === "MEDIUM";

  const riskColor = isHighRisk
    ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
    : isMediumRisk
    ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
    : "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";

  // Vietnamese translation mappings
  const genAiTextMap = {
    LIKELY_AI_GENERATED: "Có dấu hiệu hình ảnh được tạo bằng AI",
    POSSIBLY_AI_GENERATED: "Có thể được tạo bằng AI",
    NO_STRONG_AI_SIGNAL: "Chưa phát hiện dấu hiệu mạnh của ảnh tạo bằng AI",
    UNCERTAIN: "Chưa thể xác định",
    UNKNOWN: "Không đủ dữ liệu để đánh giá",
  };

  const deepfakeTextMap = {
    LIKELY_DEEPFAKE: "Có dấu hiệu deepfake trên khuôn mặt",
    POSSIBLY_DEEPFAKE: "Nghi vấn deepfake khuôn mặt",
    NO_STRONG_DEEPFAKE_SIGNAL: "Chưa phát hiện dấu hiệu deepfake mạnh",
    NOT_APPLICABLE: "Không phát hiện khuôn mặt để phân tích",
    UNCERTAIN: "Chưa thể xác định",
    UNKNOWN: "Không đủ dữ liệu để đánh giá",
  };

  const manipTextMap = {
    LIKELY_MANIPULATED: "Có dấu hiệu hình ảnh đã được chỉnh sửa",
    POSSIBLY_MANIPULATED: "Có thể đã qua chỉnh sửa cục bộ",
    NO_STRONG_MANIPULATION_SIGNAL: "Chưa phát hiện dấu hiệu chỉnh sửa mạnh",
    UNCERTAIN: "Chưa thể xác định",
    UNKNOWN: "Chưa đủ dữ liệu / Chưa hỗ trợ",
  };

  return (
    <div
      className={`p-6 sm:p-7 rounded-2xl bg-[#0b0f19]/95 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6 ${className}`}
      data-testid="image-forensics-hud"
    >
      {/* 1. Header Bar: Version, Risk Level, Human Review Flag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                {version}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Phân Tích Pháp Y Hình Ảnh (Media Forensics)
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Đánh giá độc lập: GenAI, Deepfake khuôn mặt, C2PA, EXIF &amp; Văn bản OCR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${riskColor}`}>
            {isHighRisk ? <ShieldAlert className="w-4 h-4" /> : isMediumRisk ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>RỦI RO: {riskLevel}</span>
          </div>
          {requiresHumanReview && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-medium">
              CẦN THẨM ĐỊNH
            </span>
          )}
        </div>
      </div>

      {/* 2. Independent Forensic Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: AI GENERATION */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold uppercase">
              <Cpu className="w-4 h-4" />
              <span>AI Generation</span>
            </div>
            {aiGeneration.providerScore !== null && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                Score: {(aiGeneration.providerScore * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {genAiTextMap[aiGeneration.verdict] || aiGeneration.verdict}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {aiGeneration.reason || "Không có giải thích từ provider."}
            </p>
          </div>
        </div>

        {/* Card 2: DEEPFAKE */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 font-bold uppercase">
              <UserCheck className="w-4 h-4" />
              <span>Deepfake Khuôn Mặt</span>
            </div>
            {deepfake.providerScore !== null && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80">
                Score: {(deepfake.providerScore * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {deepfakeTextMap[deepfake.verdict] || deepfake.verdict}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {deepfake.reason || "Không có giải thích từ provider."}
            </p>
          </div>
          <div className="text-[10px] text-emerald-400/80 italic font-mono pt-1 border-t border-white/5">
            * Lưu ý: Không phát hiện deepfake không khẳng định toàn bộ ảnh là ảnh thật.
          </div>
        </div>

        {/* Card 3: MANIPULATION */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 font-bold uppercase">
              <FileCode className="w-4 h-4" />
              <span>Chỉnh Sửa (Manipulation)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/50">
              {manipulation.status}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {manipTextMap[manipulation.verdict] || manipulation.verdict}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {manipulation.reason}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Metadata, Provenance (C2PA), and OCR Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* EXIF Metadata Card */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Metadata &amp; EXIF</span>
          </div>
          <div className="text-xs space-y-1 font-mono text-slate-300">
            <div>Thiết bị: <span className="text-white font-bold">{metadata.camera?.make || "Không có thông tin"}</span></div>
            <div>Phần mềm: <span className="text-white">{metadata.software?.editorName || "Không phát hiện"}</span></div>
            <div>Thời gian: <span className="text-white">{metadata.timestamps?.creationTime || "Không có"}</span></div>
            <div>GPS: <span className={metadata.hasGps ? "text-cyan-400" : "text-slate-500"}>{metadata.hasGps ? "Có (Đã ẩn)" : "Không"}</span></div>
          </div>
        </div>

        {/* C2PA Provenance Card */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span>Content Credentials (C2PA)</span>
          </div>
          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div>Trạng thái: <span className="text-cyan-300 font-bold">{provenance.c2paStatus}</span></div>
            <div>Xác thực số: <span className={provenance.isVerified ? "text-emerald-400" : "text-amber-400"}>{provenance.isVerified ? "Đã đối soát" : "Chưa đối soát"}</span></div>
            <div className="text-[10px] text-slate-500 italic pt-1">
              Thiếu C2PA là bình thường với ảnh chia sẻ thông thường.
            </div>
          </div>
        </div>

        {/* Visible Text & URLs Card */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-white/70 uppercase">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Văn Bản &amp; URLs Trong Ảnh</span>
          </div>
          <div className="space-y-1 text-xs font-mono text-slate-300">
            <div className="truncate">Văn bản: <span className="text-white">{ocr.text ? `${ocr.text.slice(0, 40)}...` : "Không có"}</span></div>
            <div>Liên kết tìm thấy: <span className="text-cyan-300 font-bold">{visibleUrls.length} URL</span></div>
            {visibleUrls.length > 0 && (
              <div className="text-[10px] text-slate-400 truncate">
                {visibleUrls[0]?.normalizedUrl || visibleUrls[0]?.rawUrl}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mandatory Disclaimer Bar */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>{summary.disclaimer}</span>
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors ml-4 shrink-0"
        >
          <span>{showTechnicalDetails ? "Ẩn chi tiết kỹ thuật" : "Xem chi tiết kỹ thuật"}</span>
          {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 5. Collapsible Technical Details Drawer */}
      {showTechnicalDetails && (
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 space-y-2 overflow-x-auto">
          <div className="text-white font-bold mb-2">Technical Telemetry &amp; Diagnostics</div>
          <pre className="text-[11px] leading-tight text-cyan-300/80">
            {JSON.stringify({
              version,
              status,
              providerAgreement,
              quality,
              compression,
              resampling,
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
