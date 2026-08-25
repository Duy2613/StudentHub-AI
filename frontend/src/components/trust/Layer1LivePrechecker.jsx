"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
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
  XCircle,
  RefreshCw,
  Eye,
  ScanLine
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
  const [cameraFacing, setCameraFacing] = useState("environment"); // 'environment' | 'user'

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const liveScanIntervalRef = useRef(null);

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
    
    // Set immediate non-null metadata to prevent NaN KB or layout shifts
    const initialMeta = {
      fileName: file.name || `snapshot_${Date.now()}.jpg`,
      mimeType: file.type || "image/jpeg",
      fileSize: file.size || 1024,
      ocrText: "",
      qrContent: "",
    };
    setFileMeta(initialMeta);
    setOcrLoading(true);

    try {
      // 1. Multimodal OCR & Fast QR Extraction (Bounded execution)
      const extraction = await OcrService.extract(file);

      const finalMeta = {
        ...initialMeta,
        bytes: extraction.magicBytes,
        ocrText: extraction.text || "",
        qrContent: extraction.qrContent || "",
        ocrConfidence: extraction.confidence,
        executionTimeMs: extraction.executionTimeMs,
      };

      setFileMeta(finalMeta);
      setOcrText(extraction.text || "");
      setQrDetected(extraction.qrContent || null);
      
      const effectiveText = extraction.text || (extraction.qrContent ? `[QR Code]: ${extraction.qrContent}` : `[Tệp ảnh: ${finalMeta.fileName}]`);
      setInputValue(effectiveText);
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

  // Camera Capture Management with Live QR Scanner
  const startCamera = useCallback(async (facing = "environment") => {
    saffronAudio.playClick(800);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setCameraFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Start live QR scanning loop (every 350ms)
      liveScanIntervalRef.current = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const qr = OcrService.scanQrCode(videoRef.current);
            if (qr && !qrDetected) {
              setQrDetected(qr);
              saffronAudio.playLaser(1100);
            }
          } catch {
            // Ignore scan frames
          }
        }
      }, 350);
    } catch (err) {
      console.warn("Camera access failed:", err);
      alert("Không thể mở camera. Vui lòng cho phép quyền truy cập máy ảnh trong trình duyệt.");
    }
  }, [qrDetected]);

  const stopCamera = () => {
    if (liveScanIntervalRef.current) {
      clearInterval(liveScanIntervalRef.current);
      liveScanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    startCamera(nextFacing);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    saffronAudio.playLaser(950);

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(async (blob) => {
      stopCamera();
      if (blob) {
        const file = new File([blob], `camera_snapshot_${Date.now()}.jpg`, { type: "image/jpeg" });
        await processImageFile(file);
      }
    }, "image/jpeg", 0.90);
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

  const getStatusBadge = () => {
    if (!instantResult) return null;
    const status = instantResult.status;

    if (status === LAYER_1_STATUS.BLOCK) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[11px] font-mono font-bold animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>PHÁT HIỆN MÃ ĐỘC / LỪA ĐẢO TRỰC TIẾP (BLOCK)</span>
        </div>
      );
    }
    if (status === LAYER_1_STATUS.SUSPICIOUS) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[11px] font-mono font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>DẤU HIỆU ĐÁNG NGỜ — CẦN THẨM ĐỊNH ĐA LỚP</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[11px] font-mono font-bold">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>AN TOÀN SƠ BỘ — LAYER 1 PASS</span>
      </div>
    );
  };

  return (
    <div className={`p-5 rounded-2xl bg-[#150604] border border-[#ffbc09]/40 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffbc09_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2d0d08] relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbc09] animate-ping" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            LAYER 1 PRE-CHECKER // KIỂM ĐỊNH TỨC THÌ (0ms DETERMINISTIC)
          </h3>
        </div>

        {/* Live Pre-check Verdict Pill */}
        <div>{getStatusBadge()}</div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 mt-4 relative z-10">
        {[
          { id: "url", label: "Đường Dẫn (URL)", icon: Link2 },
          { id: "text", label: "Văn Bản (Text)", icon: FileText },
          { id: "image", label: "Hình Ảnh & Camera", icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = inputMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleModeChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#ffbc09] text-[#150604] shadow-lg shadow-[#ffbc09]/20"
                  : "bg-black/40 text-[#ece7e0]/60 hover:text-white border border-[#2d0d08]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Workspaces */}
      <div className="mt-4 relative z-10 space-y-3">
        {inputMode === "url" && (
          <div>
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dán đường dẫn cần kiểm tra (ví dụ: https://hcmute-edu.online, https://tinnhiemmang.vn...)"
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-[#47140b] text-sm text-white placeholder:text-[#ece7e0]/30 font-mono outline-none focus:border-[#ffbc09] transition-colors"
            />
          </div>
        )}

        {inputMode === "text" && (
          <div>
            <textarea
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Dán tin nhắn Zalo, email, thông báo học bổng, bài tuyển CTV bán thời gian hoặc kịch bản cuộc gọi đe dọa..."
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-[#47140b] text-sm text-white placeholder:text-[#ece7e0]/30 font-mono outline-none focus:border-[#ffbc09] transition-colors resize-none"
            />
          </div>
        )}

        {inputMode === "image" && (
          <div className="space-y-3">
            {/* Live Camera View */}
            {isCameraActive ? (
              <div className="space-y-3 p-3.5 rounded-2xl bg-black/80 border border-[#ffbc09]/50 relative">
                <div className="h-64 sm:h-72 w-full bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  
                  {/* Camera Reticle HUD */}
                  <div className="absolute inset-0 border-2 border-dashed border-[#ffbc09]/40 m-6 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#ffbc09]">
                      <span className="flex items-center gap-1"><ScanLine className="w-3.5 h-3.5 animate-pulse" /> LIVE OCR SCANNER</span>
                      <span>FACING: {cameraFacing.toUpperCase()}</span>
                    </div>
                    {qrDetected && (
                      <div className="self-center px-3 py-1 bg-emerald-500/80 text-black text-xs font-mono font-bold rounded-lg shadow-lg animate-bounce">
                        ✓ ĐÃ KHÓA MÃ QR
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-2 rounded-xl bg-black/60 border border-[#47140b] text-xs font-mono text-[#ece7e0]/70 hover:text-white"
                    >
                      Hủy Camera
                    </button>
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-2 rounded-xl bg-black/60 border border-[#47140b] text-[#ece7e0]/70 hover:text-white"
                      title="Đổi camera trước / sau"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

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
                  onClick={() => startCamera("environment")}
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
              <div className="p-3.5 rounded-xl bg-black/60 border border-[#ffbc09]/40 flex items-center gap-3 text-xs font-mono text-[#ffd15c]">
                <Loader2 className="w-4 h-4 animate-spin text-[#ffbc09]" />
                <span>⚡ Đang trích xuất OCR Tiếng Việt &amp; quét mã QR siêu tốc...</span>
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
                      className="w-14 h-14 object-cover rounded-lg border border-[#47140b] shrink-0"
                    />
                    <div className="min-w-0 font-mono text-xs">
                      <div className="font-bold text-white truncate">{fileMeta?.fileName || "Ảnh đã chọn"}</div>
                      <div className="text-[#ece7e0]/50 text-[10px]">
                        {fileMeta?.mimeType || "image/jpeg"} • {((fileMeta?.fileSize || 1024) / 1024).toFixed(1)} KB
                      </div>
                      {qrDetected && (
                        <div className="text-[#38f8d4] text-[10.5px] font-bold flex items-center gap-1 mt-0.5 truncate">
                          <QrCode className="w-3 h-3 shrink-0" /> QR: {qrDetected}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1 rounded bg-[#ea3810]/20 hover:bg-[#ea3810]/30 text-[#ff6b4a] text-xs font-mono cursor-pointer shrink-0"
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
          className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-[#2d0d08] text-xs font-mono text-[#ece7e0]/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
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
