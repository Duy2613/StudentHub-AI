"use client";

import React from "react";
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Link2,
  FileText,
  ImageIcon,
  ArrowRight,
  Terminal,
  Play,
} from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import { LAYER_1_STATUS } from "@/lib/ai-trust/layer1/types";

export const LAYER_1_BENCHMARKS = [
  {
    id: "phishing-school-portal",
    type: "url",
    title: "Domain giả mạo cổng trường ĐH kèm bẫy OTP",
    input: "http://hcmute-login.verify-portal.xyz/student-otp",
    expectedStatus: LAYER_1_STATUS.BLOCK,
    expectedReason: "deceptive_subdomain + unencrypted_http + suspicious_tld",
    description: "Tên miền phụ mạo danh HCMUTE trên TLD .xyz không có SSL",
    metadata: null,
  },
  {
    id: "job-deposit-scam",
    type: "text",
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
    id: "shortened-unknown-link",
    type: "url",
    title: "Đường link rút gọn bit.ly ẩn danh",
    input: "http://bit.ly/nhan-hoc-bong-sinh-vien-2026",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: "shortened_url + unencrypted_http",
    description: "Link rút gọn che giấu máy chủ đích, không đủ bằng chứng để hard-block",
    metadata: null,
  },
  {
    id: "rental-deposit-site",
    type: "url",
    title: "Web trọ giá rẻ bắt đặt cọc giữ chỗ",
    input: "https://phongtro-giare-bk.site/dat-coc",
    expectedStatus: LAYER_1_STATUS.SUSPICIOUS,
    expectedReason: "suspicious_tld + phishing_path_pattern",
    description: "Đuôi .site kèm path đặt cọc cần đối chiếu sâu với Layer 2",
    metadata: null,
  },
  {
    id: "legit-vnu-scholarship",
    type: "url",
    title: "Thông báo học bổng ĐHQG TP.HCM chính thống",
    input: "https://vnuhcm.edu.vn/tin-tuc-sinh-vien/hoc-bong-trao-doi-2026",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: "whitelisted_domain",
    description: "Tên miền giáo dục quốc gia .edu.vn nằm trong Whitelist chính thức",
    metadata: null,
  },
  {
    id: "legit-academic-text",
    type: "text",
    title: "Tài liệu học tập cấu trúc dữ liệu",
    input: "Tài liệu hướng dẫn thực hành môn Cấu trúc dữ liệu và Giải thuật. Sinh viên tham khảo thuật toán QuickSort và MergeSort để làm bài tập tuần 4.",
    expectedStatus: LAYER_1_STATUS.PASS,
    expectedReason: "clean_evaluation",
    description: "Văn bản học thuật chuẩn không có bất kỳ dấu hiệu rủi ro nào",
    metadata: null,
  },
];

/**
 * Interactive Benchmark Studio for Layer 1 Testing
 */
export default function Layer1BenchmarkStudio({ onSelectPreset, className = "" }) {
  return (
    <div className={`p-5 sm:p-7 rounded-2xl bg-[#0a0302]/95 border border-[#47140b] backdrop-blur-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#2d0d08]">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#ffbc09]" />
            <h2 className="text-base font-bold text-white font-human tracking-tight">
              Layer 1 Test Benchmark Suite
            </h2>
          </div>
          <p className="text-xs text-[#ece7e0]/60 font-mono mt-0.5">
            8 Kịch bản kiểm thử chuẩn thực tế (Hard Blocks, Suspicious Routing &amp; Whitelist Pass)
          </p>
        </div>
        <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#ffbc09]/10 border border-[#ffbc09]/30 text-[#ffbc09] font-bold self-start sm:self-auto">
          DETERMINISTIC VERIFICATION
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LAYER_1_BENCHMARKS.map((item) => {
          const isBlock = item.expectedStatus === LAYER_1_STATUS.BLOCK;
          const isSuspicious = item.expectedStatus === LAYER_1_STATUS.SUSPICIOUS;
          const isPass = item.expectedStatus === LAYER_1_STATUS.PASS;

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
                <span className="truncate max-w-[180px]">#{item.expectedReason}</span>
                <span className="text-[#ffbc09] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Kiểm thử <Play className="w-2.5 h-2.5 fill-current" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
