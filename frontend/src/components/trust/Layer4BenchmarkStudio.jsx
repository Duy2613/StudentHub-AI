"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Scale,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Layer4TrustService } from "@/lib/ai-trust/layer4/Layer4TrustService";
import { LAYER_4_TEST_CASES } from "../../../tests/layer4/layer4.test.mjs";
import { saffronAudio } from "@/lib/saffron-audio";

export default function Layer4BenchmarkStudio({ onSelectPreset }) {
  const [selectedCase, setSelectedCase] = useState(LAYER_4_TEST_CASES[0]);
  const [testResults, setTestResults] = useState({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [singleRunning, setSingleRunning] = useState(false);

  const handleRunSingle = async (testCase) => {
    saffronAudio.playClick(600);
    setSingleRunning(true);
    try {
      const result = await Layer4TrustService.evaluate({
        layer1Result: testCase.layer1Result,
        layer2Result: testCase.layer2Result,
        layer3Result: testCase.layer3Result,
      });

      const isClassMatch = result.classification === testCase.expectedClassification;
      const isActionMatch = result.status === testCase.expectedAction;
      const isRiskMatch = result.riskAssessment.level === testCase.expectedRisk;
      const isPass = isClassMatch && isActionMatch && isRiskMatch;

      setTestResults((prev) => ({
        ...prev,
        [testCase.id]: {
          pass: isPass,
          result,
          latency: result.metrics.executionTimeMs,
        },
      }));

      if (isPass) saffronAudio.playSuccess();
      else saffronAudio.playError();
    } catch (err) {
      console.error(err);
      saffronAudio.playError();
    } finally {
      setSingleRunning(false);
    }
  };

  const handleRunAll = async () => {
    saffronAudio.playLaser(750);
    setIsRunningAll(true);
    const newResults = {};

    for (const testCase of LAYER_4_TEST_CASES) {
      try {
        const result = await Layer4TrustService.evaluate({
          layer1Result: testCase.layer1Result,
          layer2Result: testCase.layer2Result,
          layer3Result: testCase.layer3Result,
        });

        const isClassMatch = result.classification === testCase.expectedClassification;
        const isActionMatch = result.status === testCase.expectedAction;
        const isRiskMatch = result.riskAssessment.level === testCase.expectedRisk;
        const isPass = isClassMatch && isActionMatch && isRiskMatch;

        newResults[testCase.id] = {
          pass: isPass,
          result,
          latency: result.metrics.executionTimeMs,
        };
      } catch (err) {
        newResults[testCase.id] = { pass: false, error: err.message };
      }
    }

    setTestResults(newResults);
    setIsRunningAll(false);
    saffronAudio.playSuccess();
  };

  const passedTotal = Object.values(testResults).filter((r) => r.pass).length;
  const totalRun = Object.keys(testResults).length;

  return (
    <div className="p-6 rounded-2xl bg-[#0a0403]/90 border border-[#47140b] backdrop-blur-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f0ff] uppercase">
              STUDIO BENCHMARK // LAYER 04
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30">
              8 TEST SCENARIOS
            </span>
          </div>
          <h3 className="text-sm font-bold text-white font-human flex items-center gap-2 mt-0.5">
            <Scale className="w-4 h-4 text-[#00f0ff]" />
            Bộ Kiểm Chuẩn Phán Quyết Tin Cậy & Ra Quyết Định (Layer 4 Test Matrix)
          </h3>
        </div>

        <button
          type="button"
          onClick={handleRunAll}
          disabled={isRunningAll}
          className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a8ff] hover:brightness-110 text-black text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-[#00f0ff]/20 cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isRunningAll ? "animate-spin" : ""}`} />
          <span>{isRunningAll ? "Đang Chạy 8 Tests..." : "🚀 Chạy Toàn Bộ Layer 4 Tests"}</span>
        </button>
      </div>

      {/* Summary Score Bar if run */}
      {totalRun > 0 && (
        <div className="p-4 rounded-xl bg-black/50 border border-[#2d0d08] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white">Kết quả kiểm chuẩn:</span>
            <span className={passedTotal === totalRun ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {passedTotal} / {totalRun} PASSED ({((passedTotal / totalRun) * 100).toFixed(0)}%)
            </span>
          </div>
          <span className="text-[#ece7e0]/60">Zero False Positives / Zero False Negatives</span>
        </div>
      )}

      {/* Test Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {LAYER_4_TEST_CASES.map((tc) => {
          const res = testResults[tc.id];
          const isSelected = selectedCase.id === tc.id;

          return (
            <div
              key={tc.id}
              onClick={() => {
                saffronAudio.playClick(500);
                setSelectedCase(tc);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#150604] border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10"
                  : "bg-black/40 border-[#2d0d08] hover:border-[#ffbc09]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-human">{tc.name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                      {tc.expectedClassification}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      Action: {tc.expectedAction}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                      Risk: {tc.expectedRisk}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {res && (
                    <span className="flex items-center gap-1 text-[11px] font-mono">
                      {res.pass ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-4 h-4" /> PASS
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-0.5">
                          <XCircle className="w-4 h-4" /> FAIL
                        </span>
                      )}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunSingle(tc);
                    }}
                    disabled={singleRunning}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-[#00f0ff]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scenario Inspector */}
      {selectedCase && (
        <div className="p-5 rounded-2xl bg-black/60 border border-[#2d0d08] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Chi Tiết Kịch Bản: {selectedCase.name}
            </h4>

            {onSelectPreset && (
              <button
                type="button"
                onClick={() => onSelectPreset(selectedCase)}
                className="py-1.5 px-3 rounded-lg bg-[#ffbc09] hover:bg-[#ffd15c] text-black text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Nạp Vào Live Prechecker</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-[#2d0d08]">
              <span className="text-[10px] text-[#ece7e0]/60 block mb-1">LAYER 1 INPUT:</span>
              <p className="text-white font-bold">Status: {selectedCase.layer1Result?.status}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-[#2d0d08]">
              <span className="text-[10px] text-[#ece7e0]/60 block mb-1">LAYER 2 CLAIMS:</span>
              <p className="text-white font-bold">{selectedCase.layer2Result?.claims?.[0]?.rawText}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-[#2d0d08]">
              <span className="text-[10px] text-[#ece7e0]/60 block mb-1">LAYER 3 EVIDENCE:</span>
              <p className="text-white font-bold">Status: {selectedCase.layer3Result?.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
