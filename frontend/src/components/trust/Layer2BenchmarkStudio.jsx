"use client";

import React, { useState } from "react";
import { Brain, Play, Zap, Search } from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { LAYER_2_STATUS } from "@/lib/ai-trust/layer2/types";
import { LAYER_2_BENCHMARK_CASES } from "@/lib/ai-trust/layer2/benchmarkCases";

export default function Layer2BenchmarkStudio({ onSelectPreset, className = "" }) {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [suiteResults, setSuiteResults] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleRunAll = async () => {
    setIsRunningAll(true);
    saffronAudio.playClick(800);
    const { Layer2SemanticService } = await import("@/lib/ai-trust/layer2/Layer2SemanticService");

    const startTime = performance.now();
    let passed = 0;
    let failed = 0;
    let totalLatency = 0;
    const itemResults = [];

    for (const test of LAYER_2_BENCHMARK_CASES) {
      const result = await Layer2SemanticService.verify({
        type: test.type,
        content: test.content,
        metadata: test.metadata || {},
        layer1Result: test.layer1Result || { status: "PASS", signals: [] },
      });

      totalLatency += result.metrics.executionTimeMs;

      const isStatusMatch = result.status === test.expectedStatus;
      const isClassMatch = !test.expectedClassification || result.classification === test.expectedClassification;
      const hasTasksIfRequired = !test.mustHaveVerificationTasks || result.verificationPackage.verificationTasks.length > 0;

      const isPass = isStatusMatch && isClassMatch && hasTasksIfRequired;

      if (isPass) passed++;
      else failed++;

      itemResults.push({
        ...test,
        resultStatus: result.status,
        resultClassification: result.classification,
        resultConfidence: result.confidence,
        latencyMs: result.metrics.executionTimeMs,
        isPass,
      });
    }

    const total = passed + failed;
    const avgLatency = (totalLatency / total).toFixed(2);
    const accuracy = ((passed / total) * 100).toFixed(1);

    setSuiteResults({
      passed,
      failed,
      total,
      avgLatency,
      accuracy,
      itemResults,
      totalDurationMs: (performance.now() - startTime).toFixed(0),
    });

    setIsRunningAll(false);
    saffronAudio.playCelebration();
  };

  const filteredCases = LAYER_2_BENCHMARK_CASES.filter(
    (c) =>
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.expectedStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-5 sm:p-7 rounded-2xl bg-[#090302]/95 border border-[#ffbc09]/30 backdrop-blur-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#2d0d08]">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#ffbc09]" />
            <h2 className="text-base font-bold text-white font-human tracking-tight">
              Layer 2 Semantic Reasoning Studio
            </h2>
          </div>
          <p className="text-xs text-[#ece7e0]/60 font-mono mt-0.5">
            Thử nghiệm phân tích ngữ nghĩa, ý định, trích xuất phát ngôn sự kiện và phát hiện bẫy ngữ cảnh.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunningAll}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#ea3810] text-black font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-[#ea3810]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Zap className={`w-4 h-4 fill-current ${isRunningAll ? "animate-spin" : ""}`} />
          {isRunningAll ? "Đang Thẩm Định..." : "🚀 Chạy Toàn Bộ Layer 2 Tests"}
        </button>
      </div>

      {/* Results HUD */}
      {suiteResults && (
        <div className="p-4 rounded-xl bg-black/70 border border-[#ffbc09]/30 space-y-3 mb-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Độ Chính Xác</div>
              <div className="text-xl font-bold font-mono text-[#38f8d4] mt-0.5">{suiteResults.accuracy}%</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Kết Quả Đạt</div>
              <div className="text-xl font-bold font-mono text-[#ffbc09] mt-0.5">
                {suiteResults.passed}/{suiteResults.total}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Độ Trễ TB</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">{suiteResults.avgLatency} ms</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Thời Gian</div>
              <div className="text-xl font-bold font-mono text-[#38f8d4] mt-0.5">{suiteResults.totalDurationMs} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Grid of Scenarios */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#ece7e0]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm kịch bản (Giáo dục, Mạo danh, Học bổng, Mâu thuẫn, Sinh trắc học)..."
            className="w-full bg-[#110503] border border-[#3b120a] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredCases.map((item, idx) => {
            const isBlock = item.expectedStatus === LAYER_2_STATUS.BLOCK;
            const isSuspicious = item.expectedStatus === LAYER_2_STATUS.SUSPICIOUS;
            const isNeedsVerif = item.expectedStatus === LAYER_2_STATUS.NEEDS_VERIFICATION;

            const badgeBg = isBlock
              ? "bg-[#ea3810]/15 border-[#ea3810]/40 text-[#ff6b4a]"
              : isSuspicious
              ? "bg-[#ffbc09]/15 border-[#ffbc09]/40 text-[#ffd15c]"
              : isNeedsVerif
              ? "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#38f8d4]"
              : "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#38f8d4]";

            return (
              <div
                key={idx}
                onClick={() => {
                  saffronAudio.playClick(650);
                  if (onSelectPreset) {
                    onSelectPreset({
                      type: item.type,
                      content: item.content,
                      metadata: item.metadata || {},
                      layer1Result: item.layer1Result,
                    });
                  }
                }}
                className="p-3.5 rounded-xl bg-black/40 hover:bg-black/80 border border-[#2d0d08] hover:border-[#ffbc09]/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white truncate font-human group-hover:text-[#ffd15c] transition-colors">
                      {item.category}
                    </span>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${badgeBg}`}>
                      {item.expectedStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#ece7e0]/70 font-human line-clamp-2 leading-relaxed mb-2">
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1e0805] flex items-center justify-between font-mono text-[10px] text-[#ece7e0]/50">
                  <span className="truncate max-w-[180px] text-[#ffbc09]/70">Class: {item.expectedClassification || "BENIGN"}</span>
                  <span className="text-[#ffbc09] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Thử nghiệm <Play className="w-2.5 h-2.5 fill-current" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
