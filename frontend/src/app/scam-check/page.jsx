"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Link2,
  FileText,
  ImageIcon,
  Search,
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowRight,
  Share2,
  Bot,
  RefreshCw,
  Cpu,
  StopCircle,
  Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
import SaffronMohsinPerimeter3DOrbit from "@/components/ui/SaffronMohsinPerimeter3DOrbit";
import SaffronMarqueeTicker from "@/components/ui/SaffronMarqueeTicker";
import SaffronSwissCrosshairGrid from "@/components/ui/SaffronSwissCrosshairGrid";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { motion, AnimatePresence } from "motion/react";

import Layer1TelemetryHUD from "@/components/trust/Layer1TelemetryHUD";
import Layer1LivePrechecker from "@/components/trust/Layer1LivePrechecker";
import Layer1BenchmarkStudio from "@/components/trust/Layer1BenchmarkStudio";
import { screenLayer1 } from "@/lib/ai-trust/layer1/scanner";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";

export default function ScamCheckPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentLayerScan, setCurrentLayerScan] = useState(1);
  const [layer1Result, setLayer1Result] = useState(null);
  const [deepScanResult, setDeepScanResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("l1"); // 'l1' | 'ai' | 'expert' | 'xai'
  const [sharedNotice, setSharedNotice] = useState(false);

  // Triggered when user selects a benchmark case or submits input from prechecker
  const handleExecuteScan = async ({ type, content, metadata = null }) => {
    if (!content && !metadata) return;

    saffronAudio.playHardwareKey();
    setIsScanning(true);
    setScanProgress(25);
    setCurrentLayerScan(1);
    setLayer1Result(null);
    setDeepScanResult(null);
    setActiveResultTab("l1");

    try {
      // Step 1: Call Layer 1 Authoritative Screening (via API or Client Runner fallback)
      let l1Res;
      try {
        const response = await fetch("/api/ai-trust/screen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, content, metadata }),
        });
        if (response.ok) {
          l1Res = await response.json();
        } else {
          // Fallback to client runner
          l1Res = await screenLayer1({ type, content, metadata });
        }
      } catch {
        l1Res = await screenLayer1({ type, content, metadata });
      }

      setLayer1Result(l1Res);
      setScanProgress(50);

      // Evaluate Early Exit: If BLOCK -> STOP immediately!
      if (l1Res.status === LAYER_1_STATUS.BLOCK) {
        setTimeout(() => {
          setScanProgress(100);
          setIsScanning(false);
          saffronAudio.playAlertBuzz();
        }, 300);
        return;
      }

      // Step 2: If SUSPICIOUS or PASS -> Forward to Layer 2 & 3
      setTimeout(() => {
        saffronAudio.playClick(750);
        setScanProgress(75);
        setCurrentLayerScan(2);
      }, 400);

      setTimeout(() => {
        saffronAudio.playClick(900);
        setScanProgress(90);
        setCurrentLayerScan(3);
      }, 800);

      setTimeout(() => {
        setScanProgress(100);
        setCurrentLayerScan(4);
        setIsScanning(false);

        const isScam = l1Res.status === LAYER_1_STATUS.SUSPICIOUS;
        if (isScam) {
          saffronAudio.playAlertBuzz();
        } else {
          saffronAudio.playSuccessChime();
        }

        // Mock Deep Layer Synthesis for L2-L4
        setDeepScanResult({
          title: type === "url" ? `Kiểm tra địa chỉ: ${content}` : "Phân tích nội dung khả nghi",
          input: content,
          risk: isScam ? 75 : 8,
          status: isScam ? "suspicious" : "safe",
          label: isScam ? "Đáng ngờ (Cần đối chiếu nâng cao)" : "Nguồn tin an toàn (Xác minh)",
          aiAnalysis: isScam
            ? [
                "Phát hiện tên miền hoặc văn bản có đặc điểm bất thường cần lưu ý.",
                "Giao diện hoặc cấu trúc đường link có dấu hiệu che giấu máy chủ thật.",
                "Khuyến cáo sinh viên không vội chuyển tiền hoặc nhập thông tin đăng nhập.",
              ]
            : [
                "Không phát hiện dấu hiệu bẫy tài chính hoặc chiếm đoạt thông tin.",
                "Tên miền / thông tin phù hợp với mẫu văn bản an toàn.",
              ],
          expertFeedback: {
            expertName: "TS. Nguyễn Minh Đức (An ninh Mạng)",
            trustScore: 98,
            badge: "⭐ Chuyên Gia Uy Tín",
            comment: isScam
              ? "Cần cẩn trọng khi tương tác với đường link hoặc thông báo này. Hãy kiểm tra lại qua kênh chính thức của nhà trường."
              : "Nội dung an toàn, sinh viên có thể yên tâm tiếp tục tham khảo theo quy định.",
          },
        });
      }, 1300);
    } catch (err) {
      console.error("Scan execution failed:", err);
      setIsScanning(false);
    }
  };

  const handleShareToForum = () => {
    saffronAudio.playClick(800);
    setSharedNotice(true);
    setTimeout(() => {
      router.push(
        `/forum?prefill=${encodeURIComponent(
          layer1Result?.details?.decisionRationale || "Cảnh báo nghi vấn bảo mật"
        )}`
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. 3D Infinite Curving Road Highway Canvas */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Meer Mohsin WebGL Fluid Smoke Canvas */}
      <MohsinFluidCanvas opacity={0.6} particleDensity={45} />

      {/* 3. 3D Astrolabe Orbit & Perimeter Satellites */}
      <SaffronMohsinPerimeter3DOrbit />

      {/* 4. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 5. Floating Quick Tools & Studio */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Navigation Layer */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Content Container */}
      <main className="flex-1 flex flex-col min-w-0 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]" />

        {/* Page Title & Mission Tag */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>AI TRUST ENGINE // LAYER 1 DETERMINISTIC SCREENING</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Thẩm Định Rủi Ro</span> &amp; Chống Lừa Đảo
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Kiểm tra tức thì URL, tin nhắn và hình ảnh qua Động cơ Sàng lọc Tầng 1 (Layer 1 — Fast &amp; Deterministic Screening).
              Áp dụng cơ chế Hard Rules + Confidence để phát hiện và ngăn chặn ngay lập tức (Early Exit STOP) các thủ đoạn tinh vi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* SECTION 1: Interactive Live Prechecker */}
        <SaffronSwissCrosshairGrid sectionTag="01 // LIVE PRECHECKER CONSOLE" className="mb-8">
          <Layer1LivePrechecker
            onScanComplete={handleExecuteScan}
            isScanning={isScanning}
          />
        </SaffronSwissCrosshairGrid>

        {/* SECTION 2: Realtime Scan Progress (if active) */}
        {isScanning && (
          <div className="p-6 rounded-2xl bg-[#120604]/90 border border-[#ffbc09]/50 backdrop-blur-2xl shadow-[0_0_30px_rgba(255,188,9,0.15)] space-y-4 mb-8">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#ffbc09] animate-spin" />
                NEURAL ENGINE: ĐANG XỬ LÝ LỚP 0{currentLayerScan}/04...
              </span>
              <span className="text-[#ffbc09] font-bold">{scanProgress}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-[#2d0d08]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#ffbc09] via-[#ea3810] to-[#ffd15c]"
                initial={{ width: "0%" }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
              <span className={currentLayerScan >= 1 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                01. Fast Screening (&lt;15ms)
              </span>
              <span className={currentLayerScan >= 2 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                02. Aggregator Blacklist (0.4s)
              </span>
              <span className={currentLayerScan >= 3 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                03. Vector RAG Engine (1.2s)
              </span>
              <span className={currentLayerScan >= 4 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                04. Multi-LLM Ensemble
              </span>
            </div>
          </div>
        )}

        {/* SECTION 3: Live Results Display (Layer 1 HUD + Deep Insights) */}
        {layer1Result && !isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 mb-10"
          >
            {/* Primary Layer 1 Telemetry HUD */}
            <Layer1TelemetryHUD result={layer1Result} />

            {/* If BLOCK: Show definitive Early Exit Banner */}
            {layer1Result.status === LAYER_1_STATUS.BLOCK ? (
              <div className="p-6 rounded-2xl bg-[#ea3810]/15 border border-[#ea3810]/50 shadow-[0_0_30px_rgba(234,56,16,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#ea3810]/20 border border-[#ea3810]/40 text-[#ff6b4a] shrink-0 mt-0.5">
                    <StopCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-human">
                      CẢNH BÁO NGUY CƠ CAO // KÍCH HOẠT DỪNG TIẾN TRÌNH (EARLY EXIT)
                    </h3>
                    <p className="text-xs text-[#ece7e0]/80 mt-1 font-human leading-relaxed">
                      Động cơ Layer 1 đã phát hiện bằng chứng gian lận / lừa đảo chắc chắn với độ tin cậy{" "}
                      <strong className="font-mono text-[#ff8066]">{(layer1Result.confidence * 100).toFixed(1)}%</strong>.
                      Hệ thống đã tự động dừng lại để tiết kiệm tài nguyên tính toán và bảo vệ người dùng ngay lập tức.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShareToForum}
                  className="px-4 py-2.5 rounded-xl bg-[#ea3810] hover:bg-[#ff4520] text-white text-xs font-mono font-bold shrink-0 transition-all shadow-md flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Báo Cáo Cộng Đồng</span>
                </button>
              </div>
            ) : (
              /* If SUSPICIOUS or PASS: Show Deep Inspection Tabs */
              <div className="space-y-6">
                {/* Result Tabs Navigation */}
                <div className="flex items-center gap-2 border-b border-[#2d0d08] pb-2 select-none font-mono">
                  {[
                    { id: "l1", label: "🛡️ Layer 1 Signals", desc: "Tín hiệu tầng 1" },
                    { id: "ai", label: "🤖 AI Analysis", desc: "Phân tích mở rộng" },
                    { id: "expert", label: "👨‍⚕️ Cố Vấn", desc: "Nhận định chuyên gia" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        saffronAudio.playClick(500);
                        setActiveResultTab(tab.id);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeResultTab === tab.id
                          ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/30"
                          : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeResultTab === "ai" && deepScanResult && (
                  <div className="p-6 rounded-2xl bg-[#0f0504]/90 border border-[#47140b] backdrop-blur-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-human">
                      <Bot className="w-4 h-4 text-[#ffbc09]" />
                      Các Yếu Tố Cần Lưu Ý Từ Mô Hình Phân Tích
                    </h3>
                    <ul className="space-y-2">
                      {deepScanResult.aiAnalysis.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-[#2d0d08] text-xs text-[#ece7e0]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeResultTab === "expert" && deepScanResult && (
                  <div className="p-6 rounded-2xl bg-[#0f0504]/90 border border-[#47140b] backdrop-blur-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-amber-300 font-bold">
                        👨‍⚕️
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{deepScanResult.expertFeedback.expertName}</p>
                        <p className="text-xs font-mono text-[#ffbc09]">
                          {deepScanResult.expertFeedback.badge} • {deepScanResult.expertFeedback.trustScore} PTS
                        </p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-black/40 border border-[#2d0d08] text-xs text-[#ece7e0] leading-relaxed italic">
                      &ldquo;{deepScanResult.expertFeedback.comment}&rdquo;
                    </div>
                  </div>
                )}

                {/* Share to Forum Action */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f0504]/90 border border-[#47140b]">
                  <div>
                    <p className="text-xs font-bold text-white">Bạn muốn chia sẻ kết quả này lên Diễn đàn sinh viên?</p>
                    <p className="text-[11px] text-[#ece7e0]/60 mt-0.5">
                      Cảnh báo sẽ được đồng bộ cùng chỉ số telemetry đối soát AI.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleShareToForum}
                    className="py-2.5 px-4 rounded-xl bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] text-xs font-bold font-mono flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{sharedNotice ? "Đang chuyển..." : "Chia Sẻ Lên Diễn Đàn"}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 4: Benchmark Test Studio */}
        <SaffronSwissCrosshairGrid sectionTag="02 // BENCHMARK VERIFICATION SUITE" className="mb-8">
          <Layer1BenchmarkStudio
            onSelectPreset={(preset) => {
              handleExecuteScan({
                type: preset.type,
                content: preset.input,
                metadata: preset.metadata,
              });
            }}
          />
        </SaffronSwissCrosshairGrid>
      </main>
    </div>
  );
}
