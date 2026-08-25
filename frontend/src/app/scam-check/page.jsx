"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Share2,
  Bot,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import AeroMissionControlBackdrop from "@/components/ui/AeroMissionControlBackdrop";
import MohsinFluidCanvas from "@/components/ui/MohsinFluidCanvas";
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
import Layer2SemanticHUD from "@/components/trust/Layer2SemanticHUD";
import Layer2BenchmarkStudio from "@/components/trust/Layer2BenchmarkStudio";
import Layer3EvidenceHUD from "@/components/trust/Layer3EvidenceHUD";
import Layer3BenchmarkStudio from "@/components/trust/Layer3BenchmarkStudio";
import Layer4TrustVerdictHUD from "@/components/trust/Layer4TrustVerdictHUD";
import Layer4BenchmarkStudio from "@/components/trust/Layer4BenchmarkStudio";
import { screenLayer1 } from "@/lib/ai-trust/layer1/scanner";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";
import { Layer2SemanticService } from "@/lib/ai-trust/layer2/Layer2SemanticService";
import { LAYER_2_STATUS } from "@/lib/ai-trust/layer2/types";
import { Layer3EvidenceService } from "@/lib/ai-trust/layer3/Layer3EvidenceService";
import { LAYER_3_STATUS } from "@/lib/ai-trust/layer3/types";
import { Layer4TrustService } from "@/lib/ai-trust/layer4/Layer4TrustService";
import { FINAL_CLASSIFICATION, RECOMMENDED_ACTION, SECURITY_RISK_LEVEL } from "@/lib/ai-trust/layer4/types";

export default function ScamCheckPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentLayerScan, setCurrentLayerScan] = useState(1);
  const [layer1Result, setLayer1Result] = useState(null);
  const [layer2Result, setLayer2Result] = useState(null);
  const [layer3Result, setLayer3Result] = useState(null);
  const [layer4Result, setLayer4Result] = useState(null);
  const [deepScanResult, setDeepScanResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("l1"); // 'l1' | 'l2' | 'l3' | 'l4' | 'ai' | 'expert'
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState("l1"); // 'l1' | 'l2' | 'l3' | 'l4'
  const [sharedNotice, setSharedNotice] = useState(false);

  // Triggered when user selects a benchmark case or submits input from prechecker
  const handleExecuteScan = async ({
    type,
    content,
    metadata = null,
    layer1Result: forcedL1 = null,
    claims = null,
    candidateSources = null,
  }) => {
    if (!content && !metadata && !claims) return;

    saffronAudio.playHardwareKey();
    setIsScanning(true);
    setScanProgress(15);
    setCurrentLayerScan(1);
    setLayer1Result(null);
    setLayer2Result(null);
    setLayer3Result(null);
    setLayer4Result(null);
    setDeepScanResult(null);
    setActiveResultTab("l1");

    try {
      // Step 1: Call Layer 1 Authoritative Screening
      let l1Res = forcedL1;
      if (!l1Res) {
        try {
          const response = await fetch("/api/ai-trust/screen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, content, metadata }),
          });
          if (response.ok) {
            l1Res = await response.json();
          } else {
            l1Res = await screenLayer1({ type, content, metadata });
          }
        } catch {
          l1Res = await screenLayer1({ type, content, metadata });
        }
      }

      setLayer1Result(l1Res);
      setScanProgress(30);

      // Evaluate Layer 1 Early Exit: If BLOCK -> STOP immediately!
      if (l1Res.status === LAYER_1_STATUS.BLOCK) {
        // Even on early block, run Layer 4 to produce auditable decision
        const l4Block = await Layer4TrustService.evaluate({
          layer1Result: l1Res,
          layer2Result: null,
          layer3Result: null,
        });
        setLayer4Result(l4Block);
        setTimeout(() => {
          setScanProgress(100);
          setIsScanning(false);
          setActiveResultTab("l4");
          saffronAudio.playAlertBuzz();
        }, 300);
        return;
      }

      // Step 2: Layer 2 Semantic & Contextual Verification
      saffronAudio.playClick(750);
      setScanProgress(55);
      setCurrentLayerScan(2);

      let l2Res;
      try {
        const l2Response = await fetch("/api/ai-trust/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, content, metadata, layer1Result: l1Res }),
        });
        if (l2Response.ok) {
          l2Res = await l2Response.json();
        } else {
          l2Res = await Layer2SemanticService.verify({ type, content, metadata, layer1Result: l1Res });
        }
      } catch {
        l2Res = await Layer2SemanticService.verify({ type, content, metadata, layer1Result: l1Res });
      }

      setLayer2Result(l2Res);
      setScanProgress(70);

      // Evaluate Layer 2 Early Exit: If BLOCK -> STOP!
      if (l2Res.status === LAYER_2_STATUS.BLOCK) {
        const l4Block = await Layer4TrustService.evaluate({
          layer1Result: l1Res,
          layer2Result: l2Res,
          layer3Result: null,
        });
        setLayer4Result(l4Block);
        setTimeout(() => {
          setScanProgress(100);
          setIsScanning(false);
          setActiveResultTab("l4");
          saffronAudio.playAlertBuzz();
        }, 300);
        return;
      }

      // Step 3: Layer 3 External Evidence & Source Verification
      saffronAudio.playClick(850);
      setScanProgress(85);
      setCurrentLayerScan(3);

      let l3Res;
      try {
        const l3Response = await fetch("/api/ai-trust/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claims: claims || l2Res.claims,
            candidateSources: candidateSources || l2Res.verificationPackage?.candidateSources,
            layer2Result: l2Res,
          }),
        });
        if (l3Response.ok) {
          l3Res = await l3Response.json();
        } else {
          l3Res = await Layer3EvidenceService.verify({
            claims: claims || l2Res.claims,
            candidateSources: candidateSources || l2Res.verificationPackage?.candidateSources,
            layer2Result: l2Res,
          });
        }
      } catch {
        l3Res = await Layer3EvidenceService.verify({
          claims: claims || l2Res.claims,
          candidateSources: candidateSources || l2Res.verificationPackage?.candidateSources,
          layer2Result: l2Res,
        });
      }

      setLayer3Result(l3Res);

      // Step 4: Layer 4 Final Trust Reasoning
      saffronAudio.playLaser(900);
      setScanProgress(95);
      setCurrentLayerScan(4);

      let l4Res;
      try {
        const l4Response = await fetch("/api/ai-trust/reasoning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer1Result: l1Res,
            layer2Result: l2Res,
            layer3Result: l3Res,
          }),
        });
        if (l4Response.ok) {
          l4Res = await l4Response.json();
        } else {
          l4Res = await Layer4TrustService.evaluate({
            layer1Result: l1Res,
            layer2Result: l2Res,
            layer3Result: l3Res,
          });
        }
      } catch {
        l4Res = await Layer4TrustService.evaluate({
          layer1Result: l1Res,
          layer2Result: l2Res,
          layer3Result: l3Res,
        });
      }

      setLayer4Result(l4Res);

      setTimeout(() => {
        setScanProgress(100);
        setIsScanning(false);
        setActiveResultTab("l4");

        const isThreat =
          l4Res.status === RECOMMENDED_ACTION.BLOCK ||
          l4Res.status === RECOMMENDED_ACTION.RESTRICT ||
          l4Res.riskAssessment?.level === SECURITY_RISK_LEVEL.CRITICAL ||
          l4Res.riskAssessment?.level === SECURITY_RISK_LEVEL.HIGH;

        if (isThreat) {
          saffronAudio.playAlertBuzz();
        } else {
          saffronAudio.playSuccessChime();
        }

        // Deep Layer Synthesis
        setDeepScanResult({
          title: type === "url" ? `Kiểm tra địa chỉ: ${content}` : "Phân tích nội dung khả nghi",
          input: content,
          risk: isThreat ? 85 : 8,
          status: isThreat ? "suspicious" : "safe",
          label: l4Res.userExplanation?.verdictTitle || "Phán Quyết Hoàn Tất",
          aiAnalysis: [
            l4Res.userExplanation?.why,
            `Bằng chứng Layer 3: ${l3Res.status} (Độ hoàn thiện: ${(l3Res.verificationCompleteness * 100).toFixed(0)}%, Cụm nguồn: ${l3Res.sourceIndependence?.totalClusters || 0})`,
            l4Res.userExplanation?.riskSummary,
          ],
          expertFeedback: {
            expertName: "TS. Nguyễn Minh Đức (An ninh Mạng)",
            trustScore: 98,
            badge: "⭐ Chuyên Gia Uy Tín",
            comment: l4Res.userExplanation?.recommendedActionNote || "Sinh viên có thể tham khảo theo thông báo.",
          },
        });
      }, 400);
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
      {/* 1. High-End Aerospace Aviation Terminal Backdrop (Clean & Non-overlapping) */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_07_ALPHA // AIRSPACE_THREAT_RADAR"
        gridDensity={52}
        showRadarRings={true}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail (Subtle & Non-Obtrusive) */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools & Studio */}
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

      {/* Main Content Container (No Overlap / Pure Precision Flow) */}
      <main className="flex-1 flex flex-col min-w-0 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

        {/* Page Title & Mission Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>AI TRUST ENGINE // LAYER 1 DETERMINISTIC SCREENING</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-human">
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

        {/* SECTION 1: Interactive Live Prechecker Console */}
        <SaffronSwissCrosshairGrid sectionTag="01 // LIVE PRECHECKER CONSOLE" className="mb-8">
          <Layer1LivePrechecker
            onScanComplete={handleExecuteScan}
            isScanning={isScanning}
          />
        </SaffronSwissCrosshairGrid>

        {/* SECTION 2: Realtime Scan Progress (if active) */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 rounded-2xl bg-[#120604]/90 border border-[#ffbc09]/50 backdrop-blur-2xl shadow-[0_0_30px_rgba(255,188,9,0.15)] space-y-4 mb-8"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION 3: Telemetry HUD & Multi-Tabbed Result Cards */}
        {layer1Result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mb-8"
          >
            {/* Layer 1 Telemetry HUD */}
            <Layer1TelemetryHUD
              result={layer1Result}
              onShareToForum={handleShareToForum}
            />

            {/* Sub-Tabs for Extended Insights (L1 - L4) */}
            <div className="flex items-center gap-2 border-b border-[#47140b] pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  saffronAudio.playClick(600);
                  setActiveResultTab("l1");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeResultTab === "l1"
                    ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                    : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                }`}
              >
                [01] LAYER 1 VERDICT
              </button>

              {layer2Result && (
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(620);
                    setActiveResultTab("l2");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeResultTab === "l2"
                      ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                      : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  [02] LAYER 2 SEMANTIC
                </button>
              )}

              {layer3Result && (
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(640);
                    setActiveResultTab("l3");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeResultTab === "l3"
                      ? "bg-[#00f0ff] text-[#150604] shadow-md shadow-[#00f0ff]/20"
                      : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  [03] LAYER 3 EVIDENCE
                </button>
              )}

              {layer4Result && (
                <button
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(680);
                    setActiveResultTab("l4");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeResultTab === "l4"
                      ? "bg-gradient-to-r from-[#ffbc09] to-[#ffd15c] text-[#150604] shadow-lg shadow-[#ffbc09]/30"
                      : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  [04] LAYER 4 FINAL VERDICT
                </button>
              )}

              {deepScanResult && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(660);
                      setActiveResultTab("ai");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeResultTab === "ai"
                        ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                        : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    [05] AI DEEP RAG
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(700);
                      setActiveResultTab("expert");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeResultTab === "expert"
                        ? "bg-[#ffbc09] text-[#150604] shadow-md shadow-[#ffbc09]/20"
                        : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    [06] EXPERT OPINION
                  </button>
                </>
              )}
            </div>

            {/* TAB CONTENT: LAYER 1 */}
            {activeResultTab === "l1" && layer1Result && (
              <Layer1TelemetryHUD
                result={layer1Result}
                onShareToForum={handleShareToForum}
              />
            )}

            {/* TAB CONTENT: LAYER 2 */}
            {activeResultTab === "l2" && layer2Result && (
              <Layer2SemanticHUD
                result={layer2Result}
              />
            )}

            {/* TAB CONTENT: LAYER 3 */}
            {activeResultTab === "l3" && layer3Result && (
              <Layer3EvidenceHUD
                result={layer3Result}
              />
            )}

            {/* TAB CONTENT: LAYER 4 */}
            {activeResultTab === "l4" && layer4Result && (
              <Layer4TrustVerdictHUD
                result={layer4Result}
              />
            )}

            {/* TAB CONTENT: AI DEEP RAG */}
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

            {/* TAB CONTENT: EXPERT OPINION */}
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

            {/* Share to Forum Action Banner */}
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
          </motion.div>
        )}

        {/* SECTION 4: Benchmark Preset Verification Studio */}
        <SaffronSwissCrosshairGrid sectionTag="02 // MULTI-LAYER BENCHMARK SUITE" className="mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveBenchmarkTab("l1")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  activeBenchmarkTab === "l1"
                    ? "bg-[#ffbc09] text-black shadow-lg shadow-[#ffbc09]/20"
                    : "bg-white/5 hover:bg-white/10 text-[#ece7e0]/70 border border-white/10"
                }`}
              >
                🛡️ Layer 1 Sàng Lọc Nhanh (120+ Tests)
              </button>
              <button
                onClick={() => setActiveBenchmarkTab("l2")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  activeBenchmarkTab === "l2"
                    ? "bg-[#ffbc09] text-black shadow-lg shadow-[#ffbc09]/20"
                    : "bg-white/5 hover:bg-white/10 text-[#ece7e0]/70 border border-white/10"
                }`}
              >
                🧠 Layer 2 Phân Tích Ngữ Nghĩa (14+ Tests)
              </button>
              <button
                onClick={() => setActiveBenchmarkTab("l3")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  activeBenchmarkTab === "l3"
                    ? "bg-[#00f0ff] text-black shadow-lg shadow-[#00f0ff]/20"
                    : "bg-white/5 hover:bg-white/10 text-[#ece7e0]/70 border border-white/10"
                }`}
              >
                🔍 Layer 3 Đối Soát Nguồn Tin (8+ Tests)
              </button>
              <button
                onClick={() => setActiveBenchmarkTab("l4")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  activeBenchmarkTab === "l4"
                    ? "bg-gradient-to-r from-[#ffbc09] to-[#ffd15c] text-black shadow-lg shadow-[#ffbc09]/30"
                    : "bg-white/5 hover:bg-white/10 text-[#ece7e0]/70 border border-white/10"
                }`}
              >
                ⚖️ Layer 4 Thẩm Định Cuối (8+ Tests)
              </button>
            </div>

            {activeBenchmarkTab === "l1" && (
              <Layer1BenchmarkStudio
                onSelectPreset={(preset) => {
                  handleExecuteScan({
                    type: preset.type,
                    content: preset.input,
                    metadata: preset.metadata,
                  });
                }}
              />
            )}

            {activeBenchmarkTab === "l2" && (
              <Layer2BenchmarkStudio
                onSelectPreset={(preset) => {
                  handleExecuteScan({
                    type: preset.type,
                    content: preset.content,
                    metadata: preset.metadata,
                    layer1Result: preset.layer1Result,
                  });
                }}
              />
            )}

            {activeBenchmarkTab === "l3" && (
              <Layer3BenchmarkStudio
                onSelectPreset={(preset) => {
                  handleExecuteScan({
                    type: preset.type || "text",
                    content: preset.content,
                    claims: preset.claims,
                    candidateSources: preset.candidateSources,
                  });
                }}
              />
            )}

            {activeBenchmarkTab === "l4" && (
              <Layer4BenchmarkStudio
                onSelectPreset={(preset) => {
                  handleExecuteScan({
                    type: "text",
                    content: preset.layer2Result?.claims?.[0]?.rawText || preset.name,
                    layer1Result: preset.layer1Result,
                    claims: preset.layer2Result?.claims,
                  });
                }}
              />
            )}
          </div>
        </SaffronSwissCrosshairGrid>
      </main>
    </div>
  );
}
