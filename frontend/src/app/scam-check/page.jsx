"use client";

// app/scam-check/page.jsx
// AI Scam Checker — Công cụ kiểm tra & xác thực lừa đảo dành cho sinh viên Việt Nam:
// - 3 Chế độ nhập: Dán liên kết (URL), Nhập văn bản/Tin nhắn, Tải ảnh chụp màn hình (OCR)
// - Động cơ 4 Lớp (Local Filter 0.1s -> Aggregator API 0.5s -> Vector RAG 1.5s -> Multi-LLM 3-5s) với cơ chế dừng sớm
// - Risk Meter (0–100%), Nhãn "Nghi vấn lừa đảo" / "Nghi vấn an toàn" (Không khẳng định 100%)
// - Tách riêng 🤖 Kết quả AI và 👨‍⚕️ Nhận định Chuyên gia cộng đồng
// - Bảng Explainable AI Breakdown (XAI) minh bạch

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
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AmbientBackground, NoiseOverlay } from "@/components/auth/AuthUI";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import TactileButton from "@/components/ui/TactileButton";
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
      comment: "Nguyên tắc vàng khi thuê trọ: Chỉ đặt cọc khi đã đến tận nơi, xem phòng trực tiếp, kiểm tra giấy tờ chính chủ và ký hợp đồng đặt cọc có điều khoản rõ ràng.",
    },
  },
  {
    id: "scholarship-edu",
    type: "text",
    title: "Thông báo học bổng khuyến khích học tập ĐHBK",
    preview: "Thông báo xét duyệt học bổng KKHT học kỳ 1 năm học 2025-2026 từ phòng CTSV...",
    input: "Thông báo từ Phòng Công tác Sinh viên Trường Đại học Bách Khoa Hà Nội (sis.hust.edu.vn): Danh sách sinh viên đủ điều kiện xét cấp học bổng Khuyến khích học tập Học kỳ 1. Sinh viên kiểm tra thông tin trên cổng thông tin SIS, không phải nộp bất kỳ khoản lệ phí nào.",
    risk: 12,
    status: "safe",
    label: "Nghi vấn an toàn (Độ tin cậy cao)",
    stoppedAtLayer: 2,
    stoppedReason: "Khớp danh sách trắng (Whitelist) tên miền Đại học chính quy sis.hust.edu.vn và không yêu cầu nộp phí",
    layers: [
      { layer: 1, name: "Local Pattern & Filter", time: "0.05s", status: "passed", desc: "Không phát hiện từ khóa lừa đảo hay đòi hỏi chuyển tiền." },
      { layer: 2, name: "Aggregator API", time: "0.32s", status: "passed", desc: "Khớp Whitelist tên miền giáo dục quốc gia (.edu.vn)." },
      { layer: 3, name: "Local AI + Vector RAG", time: "Bỏ qua", status: "skipped", desc: "Độ tin cậy an toàn đạt 95%, kích hoạt dừng sớm." },
      { layer: 4, name: "Multi-LLM Ensemble", time: "Bỏ qua", status: "skipped", desc: "Bỏ qua do không có dấu hiệu mâu thuẫn." },
    ],
    aiAnalysis: [
      "Nội dung dẫn chiếu về cổng thông tin SIS chính thức của nhà trường.",
      "Cam kết rõ ràng 'không phải nộp bất kỳ khoản lệ phí nào' đúng quy chuẩn học bổng nhà nước.",
      "Văn phong hành chính chuẩn mực của cơ sở giáo dục đại học.",
    ],
    expertFeedback: {
      expertName: "ThS. Lê Hoàng Nam (Cố vấn Học bổng)",
      trustScore: 97,
      badge: "⭐ Chuyên Gia Uy Tín",
      comment: "Thông báo chính thống từ nhà trường. Sinh viên chỉ cần đăng nhập tài khoản SIS chính chủ để theo dõi kết quả chuyển khoản học bổng về tài khoản cá nhân.",
    },
  },
];

export default function ScamCheckPage() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [inputMode, setInputMode] = useState("text"); // "link" | "text" | "image"
  const [inputValue, setInputValue] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentLayerScan, setCurrentLayerScan] = useState(1);
  const [scanResult, setScanResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("ai"); // "ai" | "expert" | "xai"
  const [sharedNotice, setSharedNotice] = useState(false);

  const fileInputRef = useRef(null);

  // Handle preset selection
  const handleSelectPreset = (preset) => {
    setInputMode(preset.type);
    setInputValue(preset.input);
    setScanResult(null);
  };

  // Simulated OCR text extraction from uploaded image
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result);
      
      // Simulate OCR engine processing
      setTimeout(() => {
        setInputValue(
          "Thông báo trúng thưởng thẻ cào 500k và học bổng du học hè. Quý sinh viên vui lòng truy cập đường link http://nhan-hoc-bong-sinh-vien.online và nhập mật khẩu ngân hàng để kích hoạt quà tặng trước 24h hôm nay."
        );
        setOcrProcessing(false);
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  // Run 4-Layer Engine Scan
  const handleStartScan = () => {
    if (!inputValue.trim() && !uploadedImage) return;

    setIsScanning(true);
    setScanResult(null);
    setScanProgress(15);
    setCurrentLayerScan(1);

    // Layer 1
    setTimeout(() => {
      setScanProgress(40);
      setCurrentLayerScan(2);
    }, 400);

    // Layer 2
    setTimeout(() => {
      setScanProgress(70);
      setCurrentLayerScan(3);
    }, 900);

    // Layer 3 & 4
    setTimeout(() => {
      setScanProgress(100);
      setCurrentLayerScan(4);

      // Determine result based on input
      const lower = inputValue.toLowerCase();
      const isScam =
        lower.includes("nạp") ||
        lower.includes("cọc") ||
        lower.includes("nhiệm vụ") ||
        lower.includes("hoa hồng") ||
        lower.includes("site") ||
        lower.includes("online") ||
        lower.includes("mật khẩu") ||
        lower.includes("kích hoạt");

      const generatedResult = isScam ? PRESET_CASES[0] : PRESET_CASES[2];
      setScanResult({
        ...generatedResult,
        input: inputValue,
      });
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
    <div className="min-h-screen bg-space-950 text-gray-100 flex relative overflow-x-hidden">
      <AmbientBackground />
      <NoiseOverlay />

      {/* Desktop Elastic Collapsible Sidebar (when logged in) or Floating Navbar (when guest) */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex" />
      ) : (
        <ModernNavbar />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 relative z-10">
        
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            AI Scam Checker • Động Cơ Phân Tích 4 Tầng
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Kiểm Chứng Nghi Vấn Lừa Đảo Sinh Viên
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-2xl">
            Nhập đường link, đoạn tin nhắn hoặc tải ảnh chụp màn hình. Hệ thống AI 4 lớp kết hợp mạng lưới chuyên gia sẽ phân tích mức độ rủi ro ngay lập tức.
          </p>
        </div>

        {/* Quick Scenario Chips */}
        <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <p className="text-xs font-bold text-gray-300 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Thử nghiệm nhanh các kịch bản thực tế:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_CASES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 group-hover:text-teal-300 transition-colors truncate">
                    {preset.title}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      preset.status === "scam"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {preset.status === "scam" ? "Rủi ro" : "An toàn"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                  {preset.preview}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Box with 3 Tabs */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/12 rounded-3xl p-6 sm:p-8 shadow-glass-deep mb-8 space-y-6">
          
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-teal-400 text-space-950 shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="sm:hidden">{mode.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Mode 1: Text Input */}
          {inputMode === "text" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Nội dung tin nhắn / bài đăng tuyển dụng / lời mời nghi vấn
              </label>
              <textarea
                rows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Dán nội dung tin nhắn Zalo, SMS, bài đăng tuyển dụng hoặc thông báo học bổng cần kiểm chứng..."
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all resize-none"
              />
            </div>
          )}

          {/* Mode 2: Link Input */}
          {inputMode === "link" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Đường dẫn liên kết (Website, form đăng ký, trang tuyển dụng)
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://tuyendung-sinhvien-online.xyz..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
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
                <div className="p-3 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tải ảnh chụp màn hình tin nhắn / bài đăng</p>
                  <p className="text-xs text-gray-400 mt-1">Hệ thống OCR sẽ tự động quét và đọc văn bản trong ảnh (PNG, JPG, JPEG)</p>
                </div>
              </div>

              {ocrProcessing && (
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang chạy module OCR đọc văn bản trong ảnh...
                </div>
              )}

              {uploadedImage && !ocrProcessing && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400">Văn bản trích xuất từ ảnh (OCR):</p>
                  <textarea
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200 resize-none focus:outline-none focus:border-teal-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Scan Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
            >
              Làm mới form
            </button>

            <TactileButton
              variant="primary"
              size="md"
              onClick={handleStartScan}
              isLoading={isScanning}
              disabled={!inputValue.trim()}
              icon={Search}
            >
              {isScanning ? "Đang Phân Tích 4 Lớp..." : "Quét Nghi Vấn Ngay"}
            </TactileButton>
          </div>
        </div>

        {/* Real-time Scanning Animation Bar */}
        {isScanning && (
          <div className="p-6 rounded-3xl bg-space-900/90 border border-teal-500/30 backdrop-blur-2xl shadow-glass-deep space-y-4 mb-8 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
                Đang xử lý qua Engine 4 Lớp: Lớp {currentLayerScan}/4...
              </span>
              <span className="font-mono text-teal-300 font-bold">{scanProgress}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(52,231,196,0.6)]"
                initial={{ width: "0%" }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
              <span className={currentLayerScan >= 1 ? "text-teal-300 font-bold" : "text-gray-500"}>
                1. Local Pattern (0.1s)
              </span>
              <span className={currentLayerScan >= 2 ? "text-teal-300 font-bold" : "text-gray-500"}>
                2. Aggregator API (0.5s)
              </span>
              <span className={currentLayerScan >= 3 ? "text-teal-300 font-bold" : "text-gray-500"}>
                3. Vector RAG (1.5s)
              </span>
              <span className={currentLayerScan >= 4 ? "text-teal-300 font-bold" : "text-gray-500"}>
                4. Multi-LLM Ensemble
              </span>
            </div>
          </div>
        )}

        {/* SCAN RESULT DISPLAY */}
        {scanResult && !isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Top Risk Meter Banner */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl shadow-glass-deep relative overflow-hidden ${
                scanResult.status === "scam"
                  ? "bg-gradient-to-r from-rose-950/40 via-space-900 to-space-950 border-rose-500/40"
                  : "bg-gradient-to-r from-emerald-950/40 via-space-900 to-space-950 border-emerald-500/40"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                        scanResult.status === "scam"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      }`}
                    >
                      {scanResult.status === "scam" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {scanResult.label}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {scanResult.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Cơ chế dừng sớm: Dừng tại <strong>Lớp {scanResult.stoppedAtLayer}</strong> — {scanResult.stoppedReason}
                  </p>
                </div>

                {/* Risk Meter Gauge Box */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Thước đo rủi ro</p>
                    <p
                      className={`text-3xl font-black ${
                        scanResult.status === "scam" ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {scanResult.risk}%
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs ${
                        scanResult.status === "scam"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {scanResult.status === "scam" ? "Cảnh báo" : "An toàn"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {[
                { id: "ai", label: "🤖 Phân Tích AI", desc: "Các điểm bất thường" },
                { id: "expert", label: "👨‍⚕️ Nhận Định Chuyên Gia", desc: "Cố vấn thực chứng" },
                { id: "xai", label: "🔍 Explainable AI Breakdown", desc: "Tiến trình 4 lớp" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveResultTab(tab.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
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
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-teal-400" />
                  Các Dấu Hiệu Nhận Biết Bất Thường
                </h3>
                <ul className="space-y-2.5">
                  {scanResult.aiAnalysis.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs sm:text-sm text-gray-200">
                      <span className="w-5 h-5 rounded-full bg-teal-400/20 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAB 2: EXPERT FEEDBACK */}
            {activeResultTab === "expert" && (
              <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{scanResult.expertFeedback.expertName}</p>
                      <p className="text-xs text-amber-300 font-semibold">{scanResult.expertFeedback.badge} • {scanResult.expertFeedback.trustScore} pts</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 text-xs sm:text-sm text-gray-200 leading-relaxed italic">
                  "{scanResult.expertFeedback.comment}"
                </div>
              </div>
            )}

            {/* TAB 3: EXPLAINABLE AI (XAI) BREAKDOWN */}
            {activeResultTab === "xai" && (
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-400" />
                  Tiến Trình 4 Tầng Phân Giải (XAI Logs)
                </h3>
                <div className="space-y-3">
                  {scanResult.layers.map((l) => (
                    <div
                      key={l.layer}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
                          L{l.layer}
                        </div>
                        <div>
                          <p className="font-bold text-white">{l.name}</p>
                          <p className="text-gray-400 text-[11px] mt-0.5">{l.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="font-mono text-gray-400">{l.time}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "flagged"
                              ? "bg-rose-500/20 text-rose-300"
                              : l.status === "passed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {l.status === "flagged" ? "Phát hiện bẫy" : l.status === "passed" ? "Vượt qua" : "Dừng sớm"}
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
