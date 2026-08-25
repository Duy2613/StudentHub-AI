"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  Link2,
  FileText,
  Image as ImageIcon,
  Upload,
  Zap,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Camera,
  QrCode,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import TactileButton from "@/components/ui/TactileButton";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { screenLayer1 } from "@/lib/ai-trust/layer1/scanner";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";
import { OcrService } from "@/lib/ai-trust/vision/OcrService";

/**
 * Interactive Live Pre-Checker for Layer 1
 * Provides 0ms instant deterministic pre-checking on the client side,
 * live camera frame capture, real-time Vietnamese OCR text extraction, QR code decoding,
 * and seamless dispatching to the 4-Layer AI Trust Pipeline.
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

  // OCR & Camera State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [qrDetected, setQrDetected] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Debounced 0ms Client Pre-Check
  useEffect(() => {
    const effectiveContent = inputMode === "image" ? (ocrText || inputValue) : inputValue;
    if (!effectiveContent.trim() && !fileMeta) {
      setInstantResult(null);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await screenLayer1({
            type: inputMode,
            content: effectiveContent,
            metadata: {
              ...(fileMeta || {}),
              ocrText: ocrText || fileMeta?.ocrText || "",
              qrContent: qrDetected || fileMeta?.qrContent || "",
            },
          });
          setInstantResult(res);
        } catch (err) {
          console.error("Client pre-check failed:", err);
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue, inputMode, fileMeta, ocrText, qrDetected]);

  const handleModeChange = (mode) => {
    saffronAudio.playClick(600);
    stopCamera();
    setInputMode(mode);
    setInputValue("");
    setFileMeta(null);
    setImagePreview(null);
    setOcrText("");
    setQrDetected(null);
    setInstantResult(null);
  };

  const processImageFile = async (file) => {
    if (!file) return;

    saffronAudio.playClick(750);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setOcrLoading(true);

    try {
      // 1. Multimodal OCR & QR Extraction
      const extraction = await OcrService.extract(file);

      const meta = {
        bytes: extraction.magicBytes,
        fileName: file.name || "camera_capture.jpg",
        mimeType: file.type || "image/jpeg",
        fileSize: file.size || 1024,
        ocrText: extraction.text || "",
        qrContent: extraction.qrContent || "",
        ocrConfidence: extraction.confidence,
      };

      setFileMeta(meta);
      setOcrText(extraction.text || "");
      setQrDetected(extraction.qrContent || null);
      setInputValue(extraction.text ? extraction.text : `[Tệp ảnh: ${meta.fileName}]`);
      saffronAudio.playSuccessChime();
    } catch (err) {
      console.error("OCR Extraction failed:", err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Camera Capture Management
  const startCamera = async () => {
    saffronAudio.playClick(800);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      alert("Không thể mở máy ảnh. Vui lòng cho phép quyền truy cập camera trong trình duyệt.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    saffronAudio.playLaser(950);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      stopCamera();
      if (blob) {
        const file = new File([blob], `snapshot_${Date.now()}.jpg`, { type: "image/jpeg" });
        await processImageFile(file);
      }
    }, "image/jpeg", 0.92);
  };

  const handleRunFullScan = async () => {
    const effectiveContent = inputMode === "image" ? (ocrText || inputValue) : inputValue;
    if (!effectiveContent.trim() && !fileMeta) return;

    saffronAudio.playHardwareKey();
    if (onScanComplete) {
      onScanComplete({
        type: inputMode,
        content: effectiveContent,
        metadata: {
          ...(fileMeta || {}),
          ocrText: ocrText || fileMeta?.ocrText || "",
          qrContent: qrDetected || fileMeta?.qrContent || "",
        },
        precheck: instantResult,
      });
    }
  };

  const handleReset = () => {
    saffronAudio.playClick(400);
    stopCamera();
    setInputValue("");
    setFileMeta(null);
    setImagePreview(null);
    setOcrText("");
    setQrDetected(null);
    setInstantResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`p-5 sm:p-7 rounded-2xl bg-[#0d0403]/90 border border-[#47140b] backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] ${className}`}>
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-[#2d0d08]">
          {[
            { id: "url", label: "🔗 Đường Dẫn (URL)", icon: Link2 },
            { id: "text", label: "📝 Văn Bản (Text)", icon: FileText },
            { id: "image", label: "🖼️ Hình Ảnh & Camera", icon: ImageIcon },
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
              <span className="px-2.5 py-0.5 rounded-full bg-[#ea3810]/20 border border-[#ea3810]/50 text-[#ff6b4a] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> PHÁT HIỆN NGUY HIỂM (BLOCK)
              </span>
            )}
            {instantResult.status === LAYER_1_STATUS.SUSPICIOUS && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/50 text-[#ffd15c] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> NGHI VẤN (SUSPICIOUS)
              </span>
            )}
            {instantResult.status === LAYER_1_STATUS.PASS && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#38f8d4] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> AN TOÀN SƠ BỘ (PASS)
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
              placeholder="Dán link cần thẩm định... (ví dụ: https://github.com/Duy2613/StudentHub-AI, vcb-portal.vip, bit.ly/xxx)"
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
              placeholder="Dán nội dung tin nhắn, bài đăng, hoặc thông báo cần kiểm tra... (ví dụ: 'Cần tuyển CTV Shopee nạp tiền cọc...', 'HCMUTE trao học bổng 20tr nộp lệ phí 500k...')"
              className="w-full px-4 py-3.5 rounded-xl bg-black/60 border border-[#47140b] focus:border-[#ffbc09] focus:ring-1 focus:ring-[#ffbc09] text-sm text-white placeholder:text-[#ece7e0]/30 font-human transition-all outline-none resize-y min-h-[100px]"
            />
          </div>
        )}

        {inputMode === "image" && (
          <div className="space-y-3">
            {/* Live Camera Stream Modal View */}
            {isCameraActive ? (
              <div className="p-4 rounded-xl bg-black/80 border border-[#ffbc09]/50 space-y-3 animate-fadeIn">
                <div className="relative rounded-lg overflow-hidden border border-[#47140b] bg-black aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-dashed border-[#ffbc09]/40 m-6 rounded-lg pointer-events-none" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-black/60 border border-[#47140b] text-xs font-mono text-[#ece7e0]/70 hover:text-white"
                  >
                    Hủy Camera
                  </button>
                  <TactileButton onClick={takeSnapshot} variant="saffron" size="sm">
                    <Camera className="w-4 h-4 mr-1 text-[#150604]" />
                    <span>Chụp Ảnh Này</span>
                  </TactileButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#47140b] hover:border-[#ffbc09]/60 rounded-xl p-5 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.exe,.apk,.zip"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-7 h-7 text-[#ffbc09] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Tải ảnh màn hình / tài liệu
                  </p>
                  <p className="text-[10.5px] text-[#ece7e0]/50 mt-0.5 font-mono">
                    PNG, JPG, WebP, PDF &amp; APK
                  </p>
                </div>

                {/* Camera Trigger Box */}
                <div
                  onClick={startCamera}
                  className="border-2 border-dashed border-[#47140b] hover:border-[#ffbc09]/60 rounded-xl p-5 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
                >
                  <Camera className="w-7 h-7 text-[#ffd15c] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Chụp trực tiếp từ Camera
                  </p>
                  <p className="text-[10.5px] text-[#ece7e0]/50 mt-0.5 font-mono">
                    Chụp ảnh thông báo hoặc màn hình
                  </p>
                </div>
              </div>
            )}

            {/* OCR Processing State */}
            {ocrLoading && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-[#ffbc09]/30 flex items-center gap-3 text-xs font-mono text-[#ffd15c] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#ffbc09]" />
                <span>Đang trích xuất OCR Tiếng Việt &amp; quét mã QR từ hình ảnh...</span>
              </div>
            )}

            {/* Image Preview & Extracted OCR Box */}
            {imagePreview && (
              <div className="space-y-3 p-3.5 rounded-xl bg-black/50 border border-[#2d0d08]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-[#47140b]"
                    />
                    <div className="min-w-0 font-mono text-xs">
                      <div className="font-bold text-white truncate">{fileMeta?.fileName}</div>
                      <div className="text-[#ece7e0]/50 text-[10px]">
                        {fileMeta?.mimeType} • {(fileMeta?.fileSize / 1024).toFixed(1)} KB
                      </div>
                      {qrDetected && (
                        <div className="text-[#38f8d4] text-[10.5px] font-bold flex items-center gap-1 mt-0.5">
                          <QrCode className="w-3 h-3" /> Đã quét mã QR: {qrDetected}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1 rounded bg-[#ea3810]/20 hover:bg-[#ea3810]/30 text-[#ff6b4a] text-xs font-mono"
                  >
                    Xóa ảnh
                  </button>
                </div>

                {/* Extracted Text Area */}
                <div>
                  <label className="block text-[11px] font-mono text-[#ffd15c] font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#ffbc09]" />
                    Văn bản trích xuất từ ảnh (OCR):
                  </label>
                  <textarea
                    rows={3}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="Văn bản bóc tách từ ảnh sẽ xuất hiện tại đây..."
                    className="w-full px-3 py-2 rounded-lg bg-black/70 border border-[#47140b] text-xs text-white placeholder:text-[#ece7e0]/30 font-mono outline-none focus:border-[#ffbc09]"
                  />
                </div>
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
            disabled={(!inputValue.trim() && !ocrText.trim() && !fileMeta) || isScanning || ocrLoading}
            variant="saffron"
            size="md"
            techSuffix="4L"
            className="shadow-[0_0_20px_rgba(255,188,9,0.25)]"
          >
            <Zap className="w-4 h-4 mr-1 text-[#150604]" />
            <span>{isScanning ? "Đang Thẩm Định 4 Lớp..." : "Thực Thi Kiểm Định Toàn Diện"}</span>
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
