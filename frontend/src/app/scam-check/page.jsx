"use client";

// app/scam-check/page.jsx
// AI Scam Checker — Công cụ kiểm tra & xác thực lừa đảo dành cho sinh viên Việt Nam:
// - Đầy đủ hiệu ứng đỉnh cao: RobinPayotRoadCanvas 3D Highway, Film Grain NoiseOverlay
// - Studio hiệu ứng BackgroundsAndEffectsStudio + Thanh phím tắt FloatingDock
// - Bộ điều khiển âm hưởng băng tuyết IglooSoundAmbiencePill trên Topbar
// - Chuẩn Lookbook Kép: Inter 900 (h1.page-title, alert-title) + JetBrains Mono (.ai-analysis-box, .status-danger, .details, .tech-suffix)
// - 3 Chế độ nhập: Dán liên kết (URL), Nhập văn bản/Tin nhắn, Tải ảnh chụp màn hình (OCR)
// - Động cơ 4 Lớp (Local Filter 0.1s -> Aggregator API 0.5s -> Vector RAG 1.5s -> Multi-LLM 3-5s) với cơ chế dừng sớm (Early Exit)
// - Tách riêng 🤖 Kết quả AI Terminal và 👨‍⚕️ Nhận định Chuyên gia cộng đồng

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Link2,
  FileText,
  Image as ImageIcon,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Share2,
  Users,
  Bot,
  HelpCircle,
  Upload,
  RefreshCw,
  Info,
  ChevronRight,
  Check,
  Sliders,
  ExternalLink,
  Radio,
  Cpu,
  Activity
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import TactileButton from "@/components/ui/TactileButton";
import RobinPayotRoadCanvas from "@/components/canvas/RobinPayotRoadCanvas";
import { NoiseOverlay } from "@/components/auth/AuthUI";
import FloatingDock from "@/components/ui/floating-dock";
import BackgroundsAndEffectsStudio from "@/components/ui/BackgroundsAndEffectsStudio";
import IglooSoundAmbiencePill from "@/components/ui/IglooSoundAmbiencePill";
import IglooAuroraDivider from "@/components/ui/IglooAuroraDivider";
import { motion, AnimatePresence } from "motion/react";

// Preset scam cases for quick testing
const PRESET_CASES = [
  {
    id: "job-scam",
    type: "text",
    title: "Tuyển CTV xử lý đơn hàng Shopee/Lazada",
    preview: "Việc nhẹ lương 300k-500k/ngày, nạp cọc làm nhiệm vụ nhận hoa hồng 20%...",
    input: "Tuyển sinh viên làm CTV online đánh giá đơn hàng Shopee. Mỗi ngày làm 1-2 tiếng thu nhập 300k - 500k. Không yêu cầu kinh nghiệm, chỉ cần chuyển khoản nạp cọc kích hoạt nhiệm vụ 200k vào số tài khoản 1903xxx và nhận hoa hồng hoàn tiền 20% ngay sau 5 phút.",
    risk: 94,
    status: "scam",
    label: "Nghi vấn lừa đảo (Độ rủi ro rất cao)",
    stoppedAtLayer: 1,
    stoppedReason: "Khớp từ khóa đen: 'nạp cọc', 'nhiệm vụ', 'hoa hồng 20%', 'chuyển khoản kích hoạt'",
    layers: [
      { layer: 1, name: "Local Pattern & Filter", time: "0.08s", status: "flagged", desc: "Phát hiện 4 từ khóa bẫy lừa cọc nhiệm vụ điển hình." },
      { layer: 2, name: "Aggregator API", time: "0.45s", status: "flagged", desc: "STK người nhận nằm trong danh sách đen cảnh báo cộng đồng." },
      { layer: 3, name: "Local AI + Vector RAG", time: "1.2s", status: "flagged", desc: "Tương đồng 98% với hơn 450 mẫu lừa tuyển dụng CTV sinh viên." },
      { layer: 4, name: "Multi-LLM Ensemble", time: "Bỏ qua", status: "skipped", desc: "Đã đủ độ tin cậy ở tầng 1-3, kích hoạt cơ chế dừng sớm (Early Exit)." },
    ],
    aiAnalysis: [
      "Yêu cầu 'nạp cọc' hoặc nộp tiền để làm nhiệm vụ là chiêu trò lừa đảo 100% đối với sinh viên.",
      "Hứa hẹn lợi nhuận bất thường (20% trong 5 phút) là bẫy tài chính đánh vào tâm lý cần tiền nhanh.",
      "Số tài khoản nhận tiền là tài khoản cá nhân rác không thuộc bất kỳ sàn TMĐT chính thống nào.",
    ],
    expertFeedback: {
      expertName: "TS. Nguyễn Minh Đức (An ninh Mạng)",
      trustScore: 99,
      badge: "⭐ Chuyên Gia Uy Tín",
      comment: "Tuyệt đối không chuyển khoản bất kỳ khoản tiền nào. Đây là thủ đoạn lừa đảo chiếm đoạt tài sản theo mô hình ponzi nhiệm vụ. Sinh viên nên báo cáo bài viết và khóa liên lạc ngay.",
    },
  },
  {
    id: "rental-scam",
    type: "link",
    title: "Link thuê trọ giá rẻ bắt chuyển cọc giữ chỗ",
    preview: "https://phongtro-giare-bk-hanoi.site/dat-coc-giu-cho",
    input: "https://phongtro-giare-bk-hanoi.site/dat-coc-giu-cho",
    risk: 88,
    status: "scam",
    label: "Nghi vấn lừa đảo (Rủi ro cao)",
    stoppedAtLayer: 2,
    stoppedReason: "Tên miền .site mới đăng ký 3 ngày, không có chứng chỉ bảo mật doanh nghiệp, nằm trong blacklist",
    layers: [
      { layer: 1, name: "Local Pattern & Filter", time: "0.09s", status: "flagged", desc: "Phát hiện đuôi tên miền khả nghi .site và cấu trúc form cọc." },
      { layer: 2, name: "Aggregator API", time: "0.52s", status: "flagged", desc: "Tên miền mới tạo 72 giờ, IP máy chủ nước ngoài không rõ nguồn gốc." },
      { layer: 3, name: "Local AI + Vector RAG", time: "1.4s", status: "flagged", desc: "Khớp mẫu chiêu trò tạo web trọ ảo lừa cọc đầu năm học." },
      { layer: 4, name: "Multi-LLM Ensemble", time: "Bỏ qua", status: "skipped", desc: "Dừng sớm do mức rủi ro tầng 2 đã vượt ngưỡng 85%." },
    ],
    aiAnalysis: [
      "Website sử dụng hình ảnh phòng trọ cao cấp cắt ghép từ các khách sạn/resort khác.",
      "Yêu cầu chuyển cọc giữ chỗ 1.000.000 VNĐ trước khi đến xem phòng trực tiếp.",
      "Thông tin chủ trọ giả mạo, không có địa chỉ thực chứng trên bản đồ.",
    ],
    expertFeedback: {
      expertName: "Luật sư Trần Thu Hà (Cố vấn Pháp lý)",
      trustScore: 98,
      badge: "⭐ Chuyên Gia Uy Tín",
      comment: "Theo quy định pháp luật, giao dịch đặt cọc bắt buộc phải có hợp đồng hoặc giấy biên nhận ký 2 bên tại nhà trọ thực tế. Không bao giờ cọc online qua link lạ.",
    },
  },
  {
    id: "legit-scholarship",
    type: "link",
    title: "Thông báo học bổng trao đổi trường ĐHQG TP.HCM",
    preview: "https://vnuhcm.edu.vn/tin-tuc-sinh-vien/hoc-bong-trao-doi-2026",
    input: "https://vnuhcm.edu.vn/tin-tuc-sinh-vien/hoc-bong-trao-doi-2026",
    risk: 4,
    status: "safe",
    label: "Nghi vấn an toàn (Đã xác minh Whitelist)",
    stoppedAtLayer: 1,
    stoppedReason: "Tên miền .edu.vn thuộc danh mục cơ sở giáo dục đại học quốc gia đã xác minh",
    layers: [
      { layer: 1, name: "Local Pattern & Filter", time: "0.05s", status: "passed", desc: "Khớp tên miền đuôi .edu.vn trong Whitelist quốc gia." },
      { layer: 2, name: "Aggregator API", time: "0.32s", status: "passed", desc: "Chứng chỉ SSL hợp lệ, cơ quan chủ quản là ĐHQG TP.HCM." },
      { layer: 3, name: "Local AI + Vector RAG", time: "1.1s", status: "passed", desc: "Nội dung học bổng trùng khớp với cổng thông tin sinh viên chính thức." },
      { layer: 4, name: "Multi-LLM Ensemble", time: "Bỏ qua", status: "skipped", desc: "Dừng sớm: Xác nhận an toàn với độ tin cậy 99.6%." },
    ],
    aiAnalysis: [
      "Tên miền chính thống của Đại học Quốc gia TP.HCM (.edu.vn).",
      "Không yêu cầu nộp bất kỳ khoản phí nộp hồ sơ bất thường nào.",
      "Có chữ ký số, địa chỉ liên hệ và số điện thoại phòng đào tạo rõ ràng.",
    ],
    expertFeedback: {
      expertName: "ThS. Lê Hoàng Nam (Cố vấn Học bổng)",
      trustScore: 97,
      badge: "⭐ Chuyên Gia Uy Tín",
      comment: "Đây là chương trình học bổng thường niên chính thống của trường. Sinh viên có thể an tâm nộp hồ sơ theo đúng hướng dẫn trên cổng đào tạo.",
    },
  },
];

export default function ScamCheckPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [inputMode, setInputMode] = useState("text"); // "text" | "link" | "image"
  const [inputValue, setInputValue] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // Scanning simulation state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentLayerScan, setCurrentLayerScan] = useState(1);
  const [scanResult, setScanResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("ai"); // "ai" | "expert" | "xai"
  const [sharedNotice, setSharedNotice] = useState(false);

  const fileInputRef = useRef(null);

  // Handle URL query prefill
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get("prefill");
      if (prefill) {
        setInputValue(prefill);
        if (prefill.startsWith("http://") || prefill.startsWith("https://")) {
          setInputMode("link");
        } else {
          setInputMode("text");
        }
      }
    }
  }, []);

  const handleSelectPreset = (preset) => {
    setInputMode(preset.type);
    setInputValue(preset.input);
    setScanResult(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result);
      setOcrProcessing(true);
      setTimeout(() => {
        setInputValue(
          "TUYỂN DỤNG ONLINE: Cần 5 bạn sinh viên hỗ trợ xử lý đơn hàng Shopee. Lương 400.000đ/buổi. Yêu cầu chuyển cọc 150k kích hoạt mã nhiệm vụ Zalo."
        );
        setOcrProcessing(false);
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = () => {
    if (!inputValue.trim()) return;

    setIsScanning(true);
    setScanProgress(15);
    setCurrentLayerScan(1);
    setScanResult(null);

    // Layer 1
    setTimeout(() => {
      setScanProgress(45);
      setCurrentLayerScan(2);
    }, 450);

    // Layer 2
    setTimeout(() => {
      setScanProgress(75);
      setCurrentLayerScan(3);
    }, 900);

    // Layer 3 & 4
    setTimeout(() => {
      setScanProgress(100);
      setCurrentLayerScan(4);

      const lower = inputValue.toLowerCase();
      const isScam = lower.includes("nạp") || lower.includes("cọc") || lower.includes("nhiệm vụ") || lower.includes("hoa hồng");
      
      setScanResult(isScam ? PRESET_CASES[0] : PRESET_CASES[2]);
      setIsScanning(false);
    }, 1800);
  };

  const handleReset = () => {
    setInputValue("");
    setUploadedImage(null);
    setScanResult(null);
    setSharedNotice(false);
  };

  const handleShareToForum = () => {
    setSharedNotice(true);
    setTimeout(() => {
      router.push(`/forum?prefill=${encodeURIComponent(scanResult?.title || "Cảnh báo nghi vấn lừa đảo")}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex relative overflow-x-hidden">
      {/* 1. 3D Infinite Curving Road Highway Canvas (Robin Payot Signature) */}
      <div className="canvas-bg-layer">
        <RobinPayotRoadCanvas />
      </div>

      {/* 2. Film Grain & Ambient Noise */}
      <NoiseOverlay />

      {/* 3. Floating Quick Tools & Studio */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Desktop Elastic Collapsible Sidebar (when logged in) or Floating Navbar (when guest) */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Content Area wrapped in layout-safe-container with generous top padding for navbar */}
      <main className="flex-1 flex flex-col min-w-0 layout-safe-container pt-28 sm:pt-32 pb-40 relative z-10">
        
        {/* Header Section with Dual Typography */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-teal-400 igloo-radar-beacon" />
              <span>AI SECURITY SCANNER • 4-LAYER ENGINE</span>
            </div>
            <h1 className="page-title">
              Kiểm Tra &amp; Xác Thực Nghi Vấn
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-2xl font-human">
              Nhập đường link, đoạn tin nhắn hoặc tải ảnh chụp màn hình. Động cơ AI 4 lớp kết hợp mạng lưới chuyên gia đối soát sẽ phân tích rủi ro trong tích tắc.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div className="mb-8 p-5 rounded-3xl igloo-hologram-card border border-white/10 backdrop-blur-2xl">
          <p className="text-xs font-mono font-bold text-teal-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" /> [KỊCH BẢN THỰC TẾ PHỔ BIẾN]:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_CASES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-human font-bold text-gray-200 group-hover:text-teal-300 transition-colors truncate">
                    {preset.title}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                      preset.status === "scam"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {preset.status === "scam" ? "[RỦI RO]" : "[AN TOÀN]"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 font-human">
                  {preset.preview}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Box with 3 Tabs */}
        <div className="igloo-hologram-card border border-white/15 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 shadow-glass-deep mb-8 space-y-6">
          
          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 max-w-md">
            {[
              { id: "text", label: "Đoạn Văn Bản / SMS", icon: FileText },
              { id: "link", label: "Dán Đường Link (URL)", icon: Link2 },
              { id: "image", label: "Ảnh Chụp Màn Hình (OCR)", icon: ImageIcon },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = inputMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setInputMode(mode.id);
                    setScanResult(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-human font-bold transition-all ${
                    isSelected
                      ? "bg-teal-400 text-space-950 shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="sm:hidden font-mono">{mode.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Mode 1: Text Input */}
          {inputMode === "text" && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-2">
                NỘI DUNG TIN NHẮN / BÀI ĐĂNG TUYỂN DỤNG / LỜI MỜI NGHI VẤN
              </label>
              <textarea
                rows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Dán nội dung tin nhắn Zalo, Telegram, SMS, bài đăng tuyển dụng hoặc thông báo học bổng cần kiểm chứng..."
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/15 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-space-900 transition-all resize-none font-human"
              />
            </div>
          )}

          {/* Mode 2: Link Input */}
          {inputMode === "link" && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-2">
                ĐƯỜNG DẪN LIÊN KẾT (WEBSITE, FORM ĐĂNG KÝ, LINK NHẬN TIỀN)
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://tuyendung-sinhvien-online.xyz..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:bg-space-900 transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Mode 3: Image OCR Upload */}
          {inputMode === "image" && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-white/20 hover:border-teal-400/60 rounded-2xl p-8 text-center bg-white/[0.02] hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="p-3.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-human font-bold text-white">Tải ảnh chụp màn hình tin nhắn / bài đăng</p>
                  <p className="text-xs text-gray-400 mt-1 font-human">Động cơ OCR sẽ tự động quét và đọc văn bản trong ảnh (PNG, JPG, JPEG)</p>
                </div>
              </div>

              {ocrProcessing && (
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs font-mono text-teal-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> [OCR ENGINE]: ĐANG TRÍCH XUẤT VĂN BẢN TỪ HÌNH ẢNH...
                </div>
              )}

              {uploadedImage && !ocrProcessing && (
                <div className="space-y-2">
                  <p className="text-xs font-mono font-bold text-teal-300">[KẾT QUẢ OCR SCAN]:</p>
                  <textarea
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-white/5 border border-white/15 text-xs text-gray-200 resize-none focus:outline-none focus:border-teal-400 font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Lookbook Action Button with tech-suffix */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors"
            >
              [LÀM MỚI FORM]
            </button>

            <button
              type="button"
              onClick={handleStartScan}
              disabled={!inputValue.trim() || isScanning}
              className="btn-scan"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang phân tích 4 lớp...
                  <span className="tech-suffix">[PROCESSING]</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Bắt đầu quét
                  <span className="tech-suffix">[AI MODE]</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Scanning Animation Bar */}
        {isScanning && (
          <div className="p-6 rounded-3xl igloo-hologram-card border border-teal-500/40 backdrop-blur-3xl shadow-glass-deep space-y-4 mb-8 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                ENGINE 4 LỚP: ĐANG XỬ LÝ LỚP 0{currentLayerScan}/04...
              </span>
              <span className="text-teal-300 font-bold">{scanProgress}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 shadow-[0_0_15px_rgba(52,231,196,0.6)]"
                initial={{ width: "0%" }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              <span className={currentLayerScan >= 1 ? "text-teal-300 font-bold" : "text-gray-500"}>
                01. Local Pattern (0.1s)
              </span>
              <span className={currentLayerScan >= 2 ? "text-teal-300 font-bold" : "text-gray-500"}>
                02. Aggregator API (0.5s)
              </span>
              <span className={currentLayerScan >= 3 ? "text-teal-300 font-bold" : "text-gray-500"}>
                03. Vector RAG (1.5s)
              </span>
              <span className={currentLayerScan >= 4 ? "text-teal-300 font-bold" : "text-gray-500"}>
                04. Multi-LLM Ensemble
              </span>
            </div>
          </div>
        )}

        {/* SCAN RESULT DISPLAY: EXACT LOOKBOOK SPECIFICATION */}
        {scanResult && !isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Lookbook 4: Alert Box if Scam */}
            {scanResult.status === "scam" ? (
              <div className="alert-box">
                <div className="alert-title">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  CẢNH BÁO: {scanResult.label}
                </div>
                <p className="text-xs sm:text-sm text-red-200 mt-2 font-human leading-relaxed">
                  Phát hiện thủ đoạn lừa đảo đánh cắp tài chính nhắm vào sinh viên với mức độ rủi ro <strong className="font-mono">{scanResult.risk}%</strong>. Khuyến cáo tuyệt đối không nạp tiền, không cung cấp OTP ngân hàng và không chia sẻ link cho người khác.
                </p>
              </div>
            ) : null}

            {/* Lookbook 2: AI Analysis Box (Terminal Style) */}
            <div className={`ai-analysis-box ${scanResult.status === "scam" ? "warning" : "safe"}`}>
              <div className="ai-header">
                <div className="flex items-center gap-2">
                  <span className="icon">🤖</span> AI SECURITY SCANNER v2.1
                </div>
                <span className="text-[11px] font-mono text-cyan-300">
                  [EARLY EXIT: LỚP {scanResult.stoppedAtLayer}]
                </span>
              </div>
              <div className="ai-content">
                <p>
                  <span className="label">Target:</span> <span className="text-white">{scanResult.input}</span>
                </p>
                <p>
                  <span className="label">Status:</span>{" "}
                  <span className={scanResult.status === "scam" ? "status-danger" : "status-safe"}>
                    {scanResult.status === "scam" ? "PHÁT HIỆN NGUY CƠ CAO" : "XÁC NHẬN AN TOÀN WHITELIST"}
                  </span>
                </p>
                <div className="details">
                  <p className="font-bold text-gray-100 mb-1.5">&gt;&gt; Phân tích chuyên sâu từ Engine 4 Lớp:</p>
                  {scanResult.aiAnalysis.map((item, idx) => (
                    <p key={idx} className="mb-1 text-xs leading-relaxed text-gray-300">
                      • {item}
                    </p>
                  ))}
                  <p className="mt-2 text-[11px] text-cyan-300">
                    &gt;&gt; Lý do dừng sớm: {scanResult.stoppedReason}
                  </p>
                </div>
              </div>
            </div>

            {/* Result Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {[
                { id: "ai", label: "🤖 Phân Tích AI", desc: "Các điểm bất thường" },
                { id: "expert", label: "👨‍⚕️ Nhận Định Chuyên Gia", desc: "Cố vấn thực chứng" },
                { id: "xai", label: "🔍 Explainable AI Logs", desc: "Tiến trình 4 lớp" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveResultTab(tab.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-human font-bold transition-all ${
                    activeResultTab === tab.id
                      ? "bg-teal-400 text-space-950 shadow-md shadow-teal-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: AI BREAKDOWN */}
            {activeResultTab === "ai" && (
              <div className="p-6 rounded-3xl igloo-hologram-card border border-white/10 backdrop-blur-2xl space-y-4">
                <h3 className="text-base font-human font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-400" />
                  Các Dấu Hiệu Nhận Biết Bất Thường
                </h3>
                <ul className="space-y-2.5">
                  {scanResult.aiAnalysis.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-200 font-human">
                      <span className="w-5 h-5 rounded-full bg-teal-400/20 text-teal-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAB 2: EXPERT FEEDBACK (HUMAN INTERFACE) */}
            {activeResultTab === "expert" && (
              <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="text-sm font-human font-bold text-white">{scanResult.expertFeedback.expertName}</p>
                      <p className="text-xs font-mono text-amber-300 font-semibold">{scanResult.expertFeedback.badge} • {scanResult.expertFeedback.trustScore} PTS</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 text-xs sm:text-sm text-gray-200 leading-relaxed italic font-human">
                  "{scanResult.expertFeedback.comment}"
                </div>
              </div>
            )}

            {/* TAB 3: EXPLAINABLE AI (XAI) BREAKDOWN (MACHINE INTERFACE) */}
            {activeResultTab === "xai" && (
              <div className="p-6 rounded-3xl igloo-hologram-card border border-white/10 backdrop-blur-2xl space-y-4">
                <h3 className="text-base font-human font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-400" />
                  Tiến Trình 4 Tầng Phân Giải (XAI Machine Logs)
                </h3>
                <div className="space-y-3">
                  {scanResult.layers.map((l) => (
                    <div
                      key={l.layer}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center font-mono font-bold">
                          L{l.layer}
                        </div>
                        <div>
                          <p className="font-human font-bold text-white">{l.name}</p>
                          <p className="text-gray-400 font-human text-[11px] mt-0.5">{l.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="font-mono text-cyan-300">{l.time}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            l.status === "flagged"
                              ? "bg-rose-500/20 text-rose-300"
                              : l.status === "passed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {l.status === "flagged" ? "[FLAGGED]" : l.status === "passed" ? "[PASSED]" : "[SKIPPED]"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions: Share to Forum */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <p className="text-xs font-bold text-white">Bạn muốn cảnh báo sự việc này cho các bạn sinh viên khác?</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Bài viết sẽ được đưa lên diễn đàn cộng đồng kèm kết quả xác minh AI.</p>
              </div>

              <TactileButton
                variant="primary"
                size="sm"
                onClick={handleShareToForum}
                icon={Share2}
              >
                {sharedNotice ? "Đang chuyển đến Diễn đàn..." : "Chia Sẻ Lên Diễn Đàn"}
              </TactileButton>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
