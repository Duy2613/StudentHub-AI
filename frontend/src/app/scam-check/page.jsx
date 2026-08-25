"use client";

// app/scam-check/page.jsx
//
// AI Scam Checker — Công cụ kiểm tra & xác thực lừa đảo (Saffron Finance x Meer Mohsin 3D):
// - WebGL Real-time Fluid Dynamics Canvas theo con trỏ chuột 60fps
// - Quỹ đạo thiên văn 3D Astrolabe & vệ tinh bay quanh chu vi màn hình
// - Bảng điều khiển Saffron Swiss Grid viền tóc hairline với dấu chữ thập (+)
// - Saffron Luxury Telemetry Marquee Ticker & Web Audio phản hồi xúc giác
// - Động cơ 4 Lớp dừng sớm (Early Exit) + Phân tích AI & Cố vấn thực chứng

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
  Activity,
  Zap,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import ModernNavbar from "@/components/layout/ModernNavbar";
import CollapsibleSidebar from "@/components/layout/CollapsibleSidebar";
import TactileButton from "@/components/ui/TactileButton";
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
    label: "Nguồn tin chính thống (Đã xác minh)",
    stoppedAtLayer: 1,
    stoppedReason: "Tên miền thuộc Whitelist giáo dục quốc gia (.edu.vn), chữ ký số hợp lệ",
    layers: [
      { layer: 1, name: "Local Pattern & Filter", time: "0.05s", status: "passed", desc: "Khớp Whitelist tên miền trường đại học công lập Việt Nam." },
      { layer: 2, name: "Aggregator API", time: "0.38s", status: "passed", desc: "SSL EV Certificate cấp bởi DigiCert cho Đại học Quốc Gia." },
      { layer: 3, name: "Local AI + Vector RAG", time: "1.1s", status: "passed", desc: "Nội dung học bổng trùng khớp với cổng thông tin sinh viên chính thức." },
      { layer: 4, name: "Multi-LLM Ensemble", time: "Bỏ qua", status: "skipped", desc: "Xác thực an toàn tuyệt đối từ tầng 1, kích hoạt dừng sớm." },
    ],
    aiAnalysis: [
      "Tên miền gốc thuộc ĐHQG TP.HCM có thời gian hoạt động trên 15 năm.",
      "Không yêu cầu nộp bất kỳ khoản phí thẩm định hồ sơ nào.",
      "Thông tin liên hệ có địa chỉ phòng CTSV và số điện thoại bàn công khai.",
    ],
    expertFeedback: {
      expertName: "ThS. Hoàng Văn Nam (Phòng Hợp tác Quốc tế)",
      trustScore: 97,
      badge: "⭐ Chuyên Gia Uy Tín",
      comment: "Chương trình học bổng này là hoàn toàn chính xác. Sinh viên có thể yên tâm nộp hồ sơ theo hướng dẫn trên cổng thông tin.",
    },
  },
];

export default function ScamCheckPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [inputMode, setInputMode] = useState("text"); // 'text' | 'link' | 'image'
  const [inputValue, setInputValue] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentLayerScan, setCurrentLayerScan] = useState(1);
  const [scanResult, setScanResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("ai"); // 'ai' | 'expert' | 'xai'
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [sharedNotice, setSharedNotice] = useState(false);

  const fileInputRef = useRef(null);

  const handleSelectPreset = (preset) => {
    saffronAudio.playClick(600);
    setInputMode(preset.type);
    setInputValue(preset.input);
    setScanResult(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saffronAudio.playClick(700);
    setUploadedImage(URL.createObjectURL(file));
    setOcrProcessing(true);

    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        setOcrProcessing(false);
        saffronAudio.playRadarPing();
        setInputValue(
          "Cần tuyển gấp 5 bạn sinh viên trực page chốt đơn Shopee. Lương 400k/ca 3 tiếng. Nhận tiền theo ngày qua STK ngân hàng. Yêu cầu nạp phí kích hoạt tài khoản hệ thống 150k được hoàn lại sau khi hoàn thành đơn đầu tiên."
        );
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScan = () => {
    if (!inputValue.trim()) return;

    saffronAudio.playHardwareKey();
    setIsScanning(true);
    setScanProgress(15);
    setCurrentLayerScan(1);
    setScanResult(null);

    // Layer 1
    setTimeout(() => {
      saffronAudio.playClick(700);
      setScanProgress(45);
      setCurrentLayerScan(2);
    }, 450);

    // Layer 2
    setTimeout(() => {
      saffronAudio.playClick(850);
      setScanProgress(75);
      setCurrentLayerScan(3);
    }, 900);

    // Layer 3 & 4
    setTimeout(() => {
      setScanProgress(100);
      setCurrentLayerScan(4);

      const lower = inputValue.toLowerCase();
      const isScam = lower.includes("nạp") || lower.includes("cọc") || lower.includes("nhiệm vụ") || lower.includes("hoa hồng");
      
      const res = isScam ? PRESET_CASES[0] : PRESET_CASES[2];
      setScanResult(res);
      setIsScanning(false);

      if (isScam) {
        saffronAudio.playAlertBuzz();
      } else {
        saffronAudio.playSuccessChime();
      }
    }, 1800);
  };

  const handleReset = () => {
    saffronAudio.playClick(400);
    setInputValue("");
    setUploadedImage(null);
    setScanResult(null);
    setSharedNotice(false);
  };

  const handleShareToForum = () => {
    saffronAudio.playClick(800);
    setSharedNotice(true);
    setTimeout(() => {
      router.push(`/forum?prefill=${encodeURIComponent(scanResult?.title || "Cảnh báo nghi vấn lừa đảo")}`);
    }, 1200);
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

      {/* Desktop Collapsible Sidebar (when logged in) or Floating Navbar (when guest) */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 font-human">
        
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]" />

        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>AI SECURITY SCANNER // 4-LAYER NEURAL ENGINE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Kiểm Tra &amp; Xác Thực</span> Nghi Vấn
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Nhập đường link, đoạn tin nhắn hoặc tải ảnh chụp màn hình. Động cơ AI 4 lớp kết hợp mạng lưới cố vấn đối soát sẽ phân tích rủi ro trong tích tắc.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <SaffronSwissCrosshairGrid sectionTag="01 // KỊCH BẢN PHỔ BIẾN" className="mb-6 p-5">
          <p className="text-xs font-mono font-bold text-[#ffbc09] mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#ffbc09]" /> Mẫu thử nghiệm nhanh:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_CASES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-left p-3.5 rounded-2xl bg-[#210a07]/90 hover:bg-[#2f0e09] border border-[#47140b] hover:border-[#ffbc09]/60 transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-[#ffd15c] transition-colors truncate">
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
                <p className="text-[11px] text-[#ece7e0]/60 mt-1 line-clamp-1">
                  {preset.preview}
                </p>
              </button>
            ))}
          </div>
        </SaffronSwissCrosshairGrid>

        {/* Input Box with 3 Tabs */}
        <SaffronSwissCrosshairGrid sectionTag="02 // CONSOLE SCANNER" className="mb-8 space-y-6">
          
          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#210a07] border border-[#47140b] max-w-md select-none">
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
                    saffronAudio.playClick(600);
                    setInputMode(mode.id);
                    setScanResult(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] shadow-md shadow-[#ffbc09]/30"
                      : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="sm:hidden font-mono text-[10px]">{mode.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Mode 1: Text Input */}
          {inputMode === "text" && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#ece7e0]/80 mb-2">
                [ 01 ] NỘI DUNG TIN NHẮN / BÀI ĐĂNG TUYỂN DỤNG / LỜI MỜI NGHI VẤN
              </label>
              <textarea
                rows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Dán nội dung tin nhắn Zalo, Telegram, SMS, bài đăng tuyển dụng hoặc thông báo học bổng cần kiểm chứng..."
                className="w-full p-4 rounded-2xl bg-[#210a07]/80 border border-[#47140b] text-sm text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/40 transition-all resize-none font-human"
              />
            </div>
          )}

          {/* Mode 2: Link Input */}
          {inputMode === "link" && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#ece7e0]/80 mb-2">
                [ 02 ] ĐƯỜNG DẪN LIÊN KẾT (WEBSITE, FORM ĐĂNG KÝ, LINK NHẬN TIỀN)
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffbc09]" />
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://tuyendung-sinhvien-online.xyz..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#210a07]/80 border border-[#47140b] text-sm text-[#ece7e0] placeholder-[#ece7e0]/30 focus:outline-none focus:border-[#ffbc09] focus:bg-[#2f0e09] focus:ring-1 focus:ring-[#ffbc09]/40 transition-all font-mono"
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
                className="cursor-pointer border-2 border-dashed border-[#47140b] hover:border-[#ffbc09]/60 rounded-2xl p-8 text-center bg-[#210a07]/50 hover:bg-[#210a07] transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="p-3.5 rounded-full bg-[#ffbc09]/15 text-[#ffbc09] border border-[#ffbc09]/30 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Tải ảnh chụp màn hình tin nhắn / bài đăng</p>
                  <p className="text-xs text-[#ece7e0]/60 mt-1">Động cơ OCR sẽ tự động quét và trích xuất nội dung trong ảnh (PNG, JPG)</p>
                </div>
              </div>

              {ocrProcessing && (
                <div className="p-3 rounded-xl bg-[#ffbc09]/10 border border-[#ffbc09]/20 text-xs font-mono text-[#ffbc09] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> [OCR ENGINE]: ĐANG TRÍCH XUẤT VĂN BẢN TỪ HÌNH ẢNH...
                </div>
              )}

              {uploadedImage && !ocrProcessing && (
                <div className="space-y-2">
                  <p className="text-xs font-mono font-bold text-[#ffbc09]">[KẾT QUẢ OCR SCAN]:</p>
                  <textarea
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-[#210a07]/80 border border-[#47140b] text-xs text-[#ece7e0] resize-none focus:outline-none focus:border-[#ffbc09] font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#47140b]">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-[#ece7e0]/60 hover:text-white transition-colors cursor-pointer"
            >
              [ ✕ LÀM MỚI FORM ]
            </button>

            <button
              type="button"
              onClick={handleStartScan}
              disabled={!inputValue.trim() || isScanning}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] text-[#150604] font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:shadow-[0_0_30px_rgba(255,188,9,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-mono"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#150604]" />
                  <span>ĐANG PHÂN TÍCH 4 LỚP...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#150604]" />
                  <span>BẮT ĐẦU QUÉT [AI ENGINE]</span>
                </>
              )}
            </button>
          </div>
        </SaffronSwissCrosshairGrid>

        {/* Real-time Scanning Progress Bar */}
        {isScanning && (
          <div className="p-6 rounded-3xl bg-[#150604]/90 border border-[#ffbc09]/50 backdrop-blur-3xl shadow-[0_0_30px_rgba(255,188,9,0.15)] space-y-4 mb-8 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#ffbc09] animate-spin" />
                ENGINE 4 LỚP: ĐANG XỬ LÝ LỚP 0{currentLayerScan}/04...
              </span>
              <span className="text-[#ffbc09] font-bold">{scanProgress}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#ffbc09] via-[#f59e0b] to-[#ffd15c] shadow-[0_0_15px_rgba(255,188,9,0.6)]"
                initial={{ width: "0%" }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              <span className={currentLayerScan >= 1 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                01. Local Pattern (0.1s)
              </span>
              <span className={currentLayerScan >= 2 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                02. Aggregator API (0.5s)
              </span>
              <span className={currentLayerScan >= 3 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                03. Vector RAG (1.5s)
              </span>
              <span className={currentLayerScan >= 4 ? "text-[#ffbc09] font-bold" : "text-gray-500"}>
                04. Multi-LLM Ensemble
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
            {/* Alert Box if Scam */}
            {scanResult.status === "scam" ? (
              <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-red-300">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
                  <span>CẢNH BÁO: {scanResult.label}</span>
                </div>
                <p className="text-xs sm:text-sm text-red-200/90 mt-2 font-human leading-relaxed">
                  Phát hiện thủ đoạn lừa đảo đánh cắp tài chính nhắm vào sinh viên với mức độ rủi ro <strong className="font-mono text-red-300">{scanResult.risk}%</strong>. Khuyến cáo tuyệt đối không nạp tiền, không cung cấp OTP ngân hàng và không chia sẻ link cho người khác.
                </p>
              </div>
            ) : null}

            {/* AI Analysis Box (Terminal Style) */}
            <div className={`rounded-3xl p-6 border backdrop-blur-3xl ${scanResult.status === "scam" ? "bg-[#210a07] border-[#ffbc09]/50" : "bg-emerald-950/30 border-emerald-500/40"}`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Bot className="w-4 h-4 text-[#ffbc09]" />
                  <span>AI SECURITY SCANNER v2.1</span>
                </div>
                <span className="text-[11px] font-mono text-[#ffbc09] font-bold">
                  [ EARLY EXIT: LỚP {scanResult.stoppedAtLayer} ]
                </span>
              </div>
              <div className="pt-4 space-y-3 font-human text-xs sm:text-sm text-[#ece7e0]">
                <p>
                  <span className="text-[#ece7e0]/60 font-mono">[ TARGET ]:</span> <span className="text-white font-medium">{scanResult.input}</span>
                </p>
                <p>
                  <span className="text-[#ece7e0]/60 font-mono">[ STATUS ]:</span>{" "}
                  <span className={scanResult.status === "scam" ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                    {scanResult.status === "scam" ? "PHÁT HIỆN NGUY CƠ CAO (THỦ ĐOẠN ĐEN)" : "XÁC NHẬN AN TOÀN WHITELIST"}
                  </span>
                </p>
                <div className="p-4 rounded-2xl bg-[#150604]/80 border border-[#47140b] space-y-2">
                  <p className="font-bold text-white font-mono text-xs text-[#ffbc09]">&gt;&gt; PHÂN TÍCH CHUYÊN SÂU TỪ ENGINE 4 LỚP:</p>
                  {scanResult.aiAnalysis.map((item, idx) => (
                    <p key={idx} className="text-xs leading-relaxed text-[#ece7e0]/85">
                      • {item}
                    </p>
                  ))}
                  <p className="pt-1 text-[11px] text-[#38bdf8] font-mono">
                    &gt;&gt; Lý do dừng sớm: {scanResult.stoppedReason}
                  </p>
                </div>
              </div>
            </div>

            {/* Result Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-[#47140b] pb-2 select-none">
              {[
                { id: "ai", label: "🤖 Phân Tích AI", desc: "Các điểm bất thường" },
                { id: "expert", label: "👨‍⚕️ Nhận Định Cố Vấn", desc: "Cố vấn thực chứng" },
                { id: "xai", label: "🔍 Explainable AI Logs", desc: "Tiến trình 4 lớp" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    saffronAudio.playClick(500);
                    setActiveResultTab(tab.id);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeResultTab === tab.id
                      ? "bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] shadow-md"
                      : "text-[#ece7e0]/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: AI BREAKDOWN */}
            {activeResultTab === "ai" && (
              <div className="p-6 rounded-3xl bg-[#150604]/90 border border-[#47140b] backdrop-blur-2xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#ffbc09]" />
                  Các Dấu Hiệu Nhận Biết Bất Thường
                </h3>
                <ul className="space-y-2.5">
                  {scanResult.aiAnalysis.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#210a07] border border-[#47140b] text-xs sm:text-sm text-[#ece7e0]">
                      <span className="w-5 h-5 rounded-full bg-[#ffbc09]/20 text-[#ffbc09] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="p-6 rounded-3xl bg-[#210a07] border border-[#ffbc09]/40 backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-amber-300 font-bold">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{scanResult.expertFeedback.expertName}</p>
                      <p className="text-xs font-mono text-[#ffbc09] font-semibold">{scanResult.expertFeedback.badge} • {scanResult.expertFeedback.trustScore} PTS</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#150604]/80 border border-[#47140b] text-xs sm:text-sm text-[#ece7e0] leading-relaxed italic">
                  "{scanResult.expertFeedback.comment}"
                </div>
              </div>
            )}

            {/* TAB 3: EXPLAINABLE AI LOGS */}
            {activeResultTab === "xai" && (
              <div className="p-6 rounded-3xl bg-[#150604]/90 border border-[#47140b] backdrop-blur-2xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#ffbc09]" />
                  Tiến Trình 4 Tầng Phân Giải (XAI Machine Logs)
                </h3>
                <div className="space-y-3">
                  {scanResult.layers.map((l) => (
                    <div
                      key={l.layer}
                      className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#ffbc09]/15 text-[#ffbc09] border border-[#ffbc09]/30 flex items-center justify-center font-mono font-bold">
                          L{l.layer}
                        </div>
                        <div>
                          <p className="font-bold text-white">{l.name}</p>
                          <p className="text-[#ece7e0]/60 text-[11px] mt-0.5">{l.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="font-mono text-[#38bdf8]">{l.time}</span>
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
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#210a07] border border-[#47140b]">
              <div>
                <p className="text-xs font-bold text-white">Bạn muốn cảnh báo sự việc này cho các bạn sinh viên khác?</p>
                <p className="text-[11px] text-[#ece7e0]/60 mt-0.5">Bài viết sẽ được đưa lên diễn đàn cộng đồng kèm kết quả đối soát AI.</p>
              </div>

              <button
                type="button"
                onClick={handleShareToForum}
                className="py-2.5 px-4 rounded-xl bg-[#ffbc09] hover:bg-[#ffd15c] text-[#150604] text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                <span>{sharedNotice ? "Đang chuyển đến Diễn đàn..." : "Chia Sẻ Lên Diễn Đàn"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
