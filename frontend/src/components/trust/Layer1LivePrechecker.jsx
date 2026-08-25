"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  Link2,
  FileText,
  Image as ImageIcon,
  Upload,
  Zap,
  Search,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Eye,
} from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { screenLayer1 } from "@/lib/ai-trust/layer1/scanner";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";

/**
 * Interactive Live Pre-Checker for Layer 1
 * Provides 0ms instant deterministic pre-checking on the client side
 * and seamlessly dispatches to the backend API /api/ai-trust/screen
 */
export default function Layer1LivePrechecker({
  onScanComplete,
  isScanning = false,
  className = "",
}) {
  const [inputMode, setInputMode] = useState("url"); // 'url' | 'text' | 'image'
  const [inputValue, setInputValue] = useState("");
  const [fileMeta, setFileMeta] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [instantResult, setInstantResult] = useState(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef(null);

  // Debounced 0ms Client Pre-Check
  useEffect(() => {
    if (!inputValue.trim() && !fileMeta) {
      setInstantResult(null);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await screenLayer1({
            type: inputMode,
            content: inputValue,
            metadata: fileMeta || {},
          });
          setInstantResult(res);
        } catch (err) {
          console.error("Client pre-check failed:", err);
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue, inputMode, fileMeta]);

  const handleModeChange = (mode) => {
    saffronAudio.playClick(600);
    setInputMode(mode);
    setInputValue("");
    setFileMeta(null);
    setImagePreview(null);
    setInstantResult(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saffronAudio.playClick(750);
    setImagePreview(URL.createObjectURL(file));

    // Read first 32 bytes for magic bytes inspection
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target.result;
      const uint8 = new Uint8Array(buffer);
      const bytesSlice = Array.from(uint8.slice(0, 32));

      setFileMeta({
        bytes: bytesSlice,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        ocrText: "",
        qrContent: "",
      });
      setInputValue(`[Tệp đính kèm: ${file.name}] (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRunFullScan = async () => {
    if (!inputValue.trim() && !fileMeta) return;

    saffronAudio.playHardwareKey();
    if (onScanComplete) {
      onScanComplete({
        type: inputMode,
        content: inputValue,
        metadata: fileMeta,
        precheck: instantResult,
      });
    }
  };

  const handleReset = () => {
    saffronAudio.playClick(400);
    setInputValue("");
    setFileMeta(null);
    setImagePreview(null);
    setInstantResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`p-5 sm:p-7 rounded-2xl bg-[#0d0403]/90 border border-[#47140b] backdrop-blur-xl ${className}`}>
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-[#2d0d08]">
          {[
            { id: "url", label: "🔗 Đường Dẫn (URL)", icon: Link2 },
            { id: "text", label: "📝 Văn Bản (Text)", icon: FileText },
            { id: "image", label: "🖼️ Hình Ảnh (Image/File)", icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = inputMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleModeChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#ffbc09] text-[#150604] shadow-[0_0_15px_rgba(255,188,9,0.35)]"
                    : "text-[#ece7e0]/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Client Pre-Check Badge */}
        {instantResult && (
          <div className="flex items-center gap-2 font-mono text-[11px] animate-fadeIn">
            <span className="text-[#ece7e0]/50 uppercase tracking-wider">0ms Pre-check:</span>
            {instantResult.status === LAYER_1_STATUS.BLOCK && (
              <span className="px-2 py-0.5 rounded bg-[#ea3810]/20 border border-[#ea3810]/50 text-[#ff6b4a] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> BLOCK
              </span>
            )}
            {instantResult.status === LAYER_1_STATUS.SUSPICIOUS && (
              <span className="px-2 py-0.5 rounded bg-[#ffbc09]/20 border border-[#ffbc09]/50 text-[#ffd15c] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> SUSPICIOUS
              </span>
            )}
            {instantResult.status === LAYER_1_STATUS.PASS && (
              <span className="px-2 py-0.5 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#38f8d4] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> PASS
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input Fields according to mode */}
      <div className="space-y-4">
        {inputMode === "url" && (
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dán link cần thẩm định... (ví dụ: http://hcmute-login.verify-xxx.com, bit.ly/xxx)"
              className="w-full px-4 py-3.5 pl-11 rounded-xl bg-black/60 border border-[#47140b] focus:border-[#ffbc09] focus:ring-1 focus:ring-[#ffbc09] text-sm text-white placeholder:text-[#ece7e0]/30 font-mono transition-all outline-none"
            />
            <Link2 className="w-4 h-4 text-[#ffbc09] absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        )}

        {inputMode === "text" && (
          <div className="relative">
            <textarea
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dán nội dung tin nhắn, thông báo, hoặc đoạn chat cần kiểm tra... (ví dụ: 'Tuyển CTV Shopee nạp cọc 200k nhận hoa hồng...')"
              className="w-full px-4 py-3.5 rounded-xl bg-black/60 border border-[#47140b] focus:border-[#ffbc09] focus:ring-1 focus:ring-[#ffbc09] text-sm text-white placeholder:text-[#ece7e0]/30 font-human transition-all outline-none resize-y min-h-[100px]"
            />
          </div>
        )}

        {inputMode === "image" && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#47140b] hover:border-[#ffbc09]/60 rounded-xl p-6 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.exe,.bat,.apk,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-[#ffbc09] mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs sm:text-sm font-semibold text-white">
                Nhấp để tải ảnh lên hoặc kéo thả tệp vào đây
              </p>
              <p className="text-[11px] text-[#ece7e0]/50 mt-1 font-mono">
                Kiểm tra Magic Bytes, chữ ký định dạng thực tế, QR Code &amp; OCR văn bản
              </p>
            </div>

            {imagePreview && (
              <div className="p-3 rounded-xl bg-black/50 border border-[#2d0d08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-[#47140b]"
                  />
                  <div className="min-w-0 font-mono text-xs">
                    <div className="font-bold text-white truncate">{fileMeta?.fileName}</div>
                    <div className="text-[#ece7e0]/50 text-[10px]">
                      {fileMeta?.mimeType} // {(fileMeta?.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded bg-[#ea3810]/20 hover:bg-[#ea3810]/30 text-[#ff6b4a] text-xs font-mono"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Trigger Row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2d0d08]">
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-[#2d0d08] text-xs font-mono text-[#ece7e0]/60 hover:text-white transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đặt lại</span>
        </button>

        <div className="flex items-center gap-2">
          <TactileButton
            onClick={handleRunFullScan}
            disabled={(!inputValue.trim() && !fileMeta) || isScanning}
            variant="saffron"
            size="md"
            techSuffix="L1"
            className="shadow-[0_0_20px_rgba(255,188,9,0.25)]"
          >
            <Zap className="w-4 h-4 mr-1 text-[#150604]" />
            <span>{isScanning ? "Đang Thẩm Định..." : "Thực Thi Layer 1 Screening"}</span>
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
