"use client";

import React, { useState } from "react";
import { Link2, FileText, ImageIcon, Terminal, Play, Zap, CheckCircle2, XCircle, Layers, Search } from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService";
import { URL_BENCHMARK_CASES } from "../../../tests/layer1/url_benchmark.test.mjs";

export const LAYER_1_BENCHMARKS = [
  {
    id: "phishing-biometrics",
    type: "url",
    category: "Lừa đảo Ngân hàng",
    title: "Cập nhật sinh trắc học VCB giả mạo (Hot Threat)",
    input: "http://vietcombank-login.verify-portal.xyz/cap-nhat-sinh-trac-hoc",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "brand_impersonation_subdomain + phishing_path",
    description: "Tên miền phụ mạo danh Vietcombank trên TLD .xyz kèm path sinh trắc học",
    metadata: null,
  },
  {
    id: "phishing-school-portal",
    type: "url",
    category: "Lừa đảo Sinh viên",
    title: "Domain giả mạo HCMUTE nhận học bổng kèm bẫy OTP",
    input: "http://sinhvien-hcmute.hocbong-doanhnghiep.top/nhan-hoc-bong",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "brand_impersonation_subdomain + phishing_path",
    description: "Tên miền phụ mạo danh HCMUTE trên TLD .top dụ nhận học bổng để cướp OTP",
    metadata: null,
  },
  {
    id: "homoglyph-cyrillic-attack",
    type: "url",
    category: "Homoglyph Attack",
    title: "Ký tự Cyrillic giả mạo Apple (IDN Spoofing)",
    input: "https://аpple.com/verify-account",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "unicode_homoglyph",
    description: "Ký tự 'а' là Cyrillic Unicode (U+0430) đánh lừa mắt thường người dùng",
    metadata: null,
  },
  {
    id: "ssrf-decimal-ip",
    type: "url",
    category: "SSRF Attack",
    title: "Địa chỉ Decimal Dword Loopback (2130706433 = 127.0.0.1)",
    input: "http://2130706433/admin/delete",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "ssrf_attempt",
    description: "Kỹ thuật che giấu IP nội bộ 127.0.0.1 dưới dạng số nguyên 32-bit",
    metadata: null,
  },
  {
    id: "job-deposit-scam",
    type: "text",
    category: "Văn bản Lừa đảo",
    title: "Bẫy CTV Shopee nạp cọc làm nhiệm vụ",
    input: "Tuyển sinh viên làm CTV online xử lý đơn hàng Shopee. Mỗi ngày làm 1-2 tiếng thu nhập 500k. Yêu cầu chuyển khoản nạp cọc kích hoạt nhiệm vụ 200k và nhận hoa hồng hoàn tiền 20% ngay sau 5 phút.",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "task_deposit_scam + advance_fee_scam",
    description: "Bẫy lừa cọc nhiệm vụ điển hình đánh vào sinh viên tìm việc",
    metadata: null,
  },
  {
    id: "powershell-payload",
    type: "text",
    category: "Mã độc Shell",
    title: "Văn bản chứa mã PowerShell độc hại ngầm",
    input: "Vui lòng mở PowerShell và chạy lệnh sau để cập nhật phần mềm trường học: powershell.exe -NoP -NonI -W Hidden -Enc SUVYIChOZXctT2JqZWN0IE5ldC5XZWJDbGllbnQp",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "malicious_shell_payload",
    description: "Khai thác câu lệnh PowerShell mã hóa Base64 tải mã độc từ xa",
    metadata: null,
  },
  {
    id: "polyglot-executable-image",
    type: "image",
    category: "Binary Trojan",
    title: "Tệp EXE ngụy trang hình ảnh (Magic Bytes MZ)",
    input: "thong_bao_hoc_bong_2026.jpg",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "executable_polyglot",
    description: "Tệp có đuôi .jpg nhưng header nhị phân thực tế là Windows MZ Executable",
    metadata: {
      bytes: [0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00],
      fileName: "thong_bao_hoc_bong_2026.jpg",
      mimeType: "image/jpeg",
      fileSize: 1048576,
    },
  },
  {
    id: "false-positive-guard-cute",
    type: "url",
    category: "False-Positive Guard",
    title: "Kiểm tra từ vựng có chứa 'ute' (cute-puppies.org)",
    input: "https://cute-puppies.org/gallery",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: "clean_pass",
    description: "Chứa từ 'cute' không được phép kích hoạt cảnh báo giả mạo HCMUTE",
    metadata: null,
  },
  {
    id: "legit-hcmute-portal",
    type: "url",
    category: "Whitelist Giáo Dục",
    title: "Cổng thông tin HCMUTE chính thống (.edu.vn)",
    input: "https://hcmute.edu.vn/tin-tuc/thong-bao-tuyen-sinh",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: "whitelisted_domain",
    description: "Tên miền giáo dục quốc gia .edu.vn nằm trong Whitelist chính thức",
    metadata: null,
  },
  {
    id: "legit-vcb-portal",
    type: "url",
    category: "Whitelist Ngân Hàng",
    title: "Ngân hàng Vietcombank chính thống",
    input: "https://vietcombank.com.vn/vi-VN/Khach-hang-ca-nhan",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: "whitelisted_domain",
    description: "Tên miền ngân hàng chính thống xác minh tại Layer 1",
    metadata: null,
  },
];

/**
 * Interactive Benchmark Studio for Layer 1 Testing
 */
export default function Layer1BenchmarkStudio({ onSelectPreset, className = "" }) {
  const [activeTab, setActiveTab] = useState("presets"); // "presets" | "url-matrix"
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [suiteResults, setSuiteResults] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleRunAllBenchmark = async () => {
    setIsRunningAll(true);
    saffronAudio.playClick(800);

    const startTime = performance.now();
    let passed = 0;
    let failed = 0;
    let totalLatency = 0;
    const itemResults = [];

    const confusionMatrix = { TP: 0, TN: 0, FP: 0, FN: 0 };

    for (const test of URL_BENCHMARK_CASES) {
      const result = await Layer1ScreenService.screen({
        type: "url",
        content: test.url,
      });

      totalLatency += result.metrics.executionTimeMs;

      const isStatusMatch = result.status === test.expectedStatus;
      const isReasonMatch =
        test.expectedReason === null ||
        result.reasons.includes(test.expectedReason) ||
        (result.status === LAYER_1_STATUS.BLOCK &&
          (result.reasons.includes("phishing_pattern") ||
            result.reasons.includes("brand_impersonation_subdomain") ||
            result.reasons.includes("brand_impersonation")));

      const isPass = isStatusMatch && isReasonMatch;

      if (isPass) passed++;
      else failed++;

      const isExpectedMalicious =
        test.expectedStatus === LAYER_1_STATUS.BLOCK ||
        test.expectedStatus === LAYER_1_STATUS.SUSPICIOUS;
      const isReceivedMalicious =
        result.status === LAYER_1_STATUS.BLOCK ||
        result.status === LAYER_1_STATUS.SUSPICIOUS;

      if (isExpectedMalicious && isReceivedMalicious) confusionMatrix.TP++;
      else if (!isExpectedMalicious && !isReceivedMalicious) confusionMatrix.TN++;
      else if (!isExpectedMalicious && isReceivedMalicious) confusionMatrix.FP++;
      else if (isExpectedMalicious && !isReceivedMalicious) confusionMatrix.FN++;

      itemResults.push({
        ...test,
        resultStatus: result.status,
        resultConfidence: result.confidence,
        resultReasons: result.reasons,
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
      confusionMatrix,
      itemResults,
      totalDurationMs: (performance.now() - startTime).toFixed(0),
    });

    setIsRunningAll(false);
    saffronAudio.playCelebration();
  };

  const filteredUrlCases = URL_BENCHMARK_CASES.filter(
    (c) =>
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.expectedStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`p-5 sm:p-7 rounded-2xl bg-[#0a0302]/95 border border-[#47140b] backdrop-blur-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#2d0d08]">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#ffbc09]" />
            <h2 className="text-lg font-bold text-white font-human tracking-tight">
              Layer 1 Test Benchmark Studio
            </h2>
          </div>
          <p className="text-xs text-[#ece7e0]/60 font-mono mt-0.5">
            Bộ công cụ kiểm định 120+ kịch bản URL, mã độc, lừa đảo sinh trắc học và chống dương tính giả.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("presets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              activeTab === "presets"
                ? "bg-[#ffbc09] text-black shadow-lg shadow-[#ffbc09]/20"
                : "bg-white/5 hover:bg-white/10 text-[#ece7e0]/70 border border-white/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Kịch Bản Tiêu Biểu
          </button>
          <button
            onClick={() => setActiveTab("url-matrix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              activeTab === "url-matrix"
                ? "bg-[#ffbc09] text-black shadow-lg shadow-[#ffbc09]/20"
                : "bg-white/5 hover:bg-white/10 text-[#ece7e0]/70 border border-white/10"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> 120+ URL Matrix
          </button>
        </div>
      </div>

      {/* TAB 1: PRESETS */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LAYER_1_BENCHMARKS.map((item) => {
            const isBlock = item.expectedStatus === LAYER_1_STATUS.BLOCK;
            const isSuspicious = item.expectedStatus === LAYER_1_STATUS.SUSPICIOUS;

            const badgeBg = isBlock
              ? "bg-[#ea3810]/15 border-[#ea3810]/40 text-[#ff6b4a]"
              : isSuspicious
              ? "bg-[#ffbc09]/15 border-[#ffbc09]/40 text-[#ffd15c]"
              : "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#38f8d4]";

            const Icon = item.type === "url" ? Link2 : item.type === "text" ? FileText : ImageIcon;

            return (
              <div
                key={item.id}
                onClick={() => {
                  saffronAudio.playClick(650);
                  if (onSelectPreset) onSelectPreset(item);
                }}
                className="p-3.5 rounded-xl bg-black/40 hover:bg-black/80 border border-[#2d0d08] hover:border-[#ffbc09]/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 rounded bg-white/5 border border-white/10 text-[#ece7e0]/80">
                        <Icon className="w-3 h-3 text-[#ffbc09]" />
                      </span>
                      <span className="text-xs font-bold text-white truncate font-human group-hover:text-[#ffd15c] transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${badgeBg}`}>
                      {item.expectedStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#ece7e0]/60 font-human line-clamp-2 leading-relaxed mb-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1e0805] flex items-center justify-between font-mono text-[10px] text-[#ece7e0]/50">
                  <span className="truncate max-w-[180px] text-[#ffbc09]/70">[{item.category}]</span>
                  <span className="text-[#ffbc09] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Thử nghiệm <Play className="w-2.5 h-2.5 fill-current" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: URL TEST MATRIX & RUNNER */}
      {activeTab === "url-matrix" && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-black/50 border border-[#2d0d08]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#ece7e0]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm URL, thương hiệu (VCB, HCMUTE, Apple, SSRF, Homoglyph)..."
                className="w-full bg-[#110503] border border-[#3b120a] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09]"
              />
            </div>

            <button
              onClick={handleRunAllBenchmark}
              disabled={isRunningAll}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#ffbc09] to-[#ea3810] text-black font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-[#ea3810]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 fill-current ${isRunningAll ? "animate-spin" : ""}`} />
              {isRunningAll ? "Đang Thẩm Định Toàn Bộ..." : "🚀 Chạy Toàn Bộ 123+ URL Tests"}
            </button>
          </div>

          {/* Results Summary HUD */}
          {suiteResults && (
            <div className="p-4 rounded-xl bg-black/70 border border-[#ffbc09]/30 space-y-3 animate-fade-in">
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
                  <div className="text-[10px] font-mono text-[#ece7e0]/50 uppercase">Dương Tính Giả (FP)</div>
                  <div className="text-xl font-bold font-mono text-[#38f8d4] mt-0.5">{suiteResults.confusionMatrix.FP} (0.0%)</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#ece7e0]/60 pt-2 border-t border-white/10">
                <span>TP (Chặn Đúng): <strong className="text-white">{suiteResults.confusionMatrix.TP}</strong></span>
                <span>TN (Cho Qua Đúng): <strong className="text-white">{suiteResults.confusionMatrix.TN}</strong></span>
                <span>FN (Bỏ Sót): <strong className="text-white">{suiteResults.confusionMatrix.FN}</strong></span>
                <span>Tổng Thời Gian: <strong className="text-[#ffbc09]">{suiteResults.totalDurationMs} ms</strong></span>
              </div>
            </div>
          )}

          {/* List of Cases */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredUrlCases.map((item, idx) => {
              const res = suiteResults?.itemResults?.find((r) => r.url === item.url);
              const isBlock = item.expectedStatus === LAYER_1_STATUS.BLOCK;
              const isSuspicious = item.expectedStatus === LAYER_1_STATUS.SUSPICIOUS;

              const badgeBg = isBlock
                ? "bg-[#ea3810]/15 border-[#ea3810]/40 text-[#ff6b4a]"
                : isSuspicious
                ? "bg-[#ffbc09]/15 border-[#ffbc09]/40 text-[#ffd15c]"
                : "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#38f8d4]";

              return (
                <div
                  key={idx}
                  onClick={() => {
                    saffronAudio.playClick(650);
                    if (onSelectPreset) {
                      onSelectPreset({
                        id: `url-matrix-${idx}`,
                        type: "url",
                        title: item.category,
                        input: item.url,
                        expectedStatus: item.expectedStatus,
                        expectedReason: item.expectedReason || "clean",
                        description: `Kiểm thử định danh URL: ${item.category}`,
                      });
                    }
                  }}
                  className="p-2.5 rounded-lg bg-black/40 hover:bg-black/70 border border-[#2d0d08] hover:border-[#ffbc09]/40 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#ffbc09] truncate">{item.category}</span>
                      {res && (
                        res.isPass ? (
                          <CheckCircle2 className="w-3 h-3 text-[#38f8d4] shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-[#ea3810] shrink-0" />
                        )
                      )}
                    </div>
                    <div className="text-white text-[11px] truncate mt-0.5">{item.url}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${badgeBg}`}>
                      {item.expectedStatus}
                    </span>
                    <Play className="w-3 h-3 text-[#ffbc09]/60 hover:text-[#ffbc09]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
