"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  BookOpen,
  Laptop,
  Home,
  Bike,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Loader2,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Tag,
  PhoneCall,
  Copy,
  Check,
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

const CATEGORIES = [
  { id: "ALL", label: "Tất Cả Món Đồ", icon: ShoppingBag },
  { id: "GIAO_TRINH", label: "Giáo Trình & Sách", icon: BookOpen },
  { id: "THIET_BI_DIEN_TU", label: "Máy Tính & Điện Tử", icon: Laptop },
  { id: "DO_GIA_DUNG", label: "Đồ Dùng KTX", icon: Home },
  { id: "XE_MAY_XE_DAP", label: "Xe Đạp & Xe Máy", icon: Bike },
];

export default function MarketplacePage() {
  const { session, profile } = useAuth();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("GIAO_TRINH");
  const [newPrice, setNewPrice] = useState("");
  const [newOriginalPrice, setNewOriginalPrice] = useState("");
  const [newCondition, setNewCondition] = useState("GOOD_90");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected item modal / detail
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedContact, setCopiedContact] = useState(false);

  // Fetch Marketplace Items
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/marketplace/items?${params.toString()}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data?.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.warn("Fetch marketplace items error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle Post New Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || !newLocation.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);
    saffronAudio.playClick(800);

    const isExpert = profile?.role === "expert";
    const catObj = CATEGORIES.find((c) => c.id === newCategory);

    const payload = {
      title: newTitle.trim(),
      category: newCategory,
      categoryName: catObj ? catObj.label : "Giáo trình & Sách",
      price: Number(newPrice),
      originalPrice: Number(newOriginalPrice || newPrice),
      condition: newCondition,
      conditionLabel:
        newCondition === "LIKE_NEW_99"
          ? "Như mới 99%"
          : newCondition === "GOOD_90"
          ? "Còn tốt 90%"
          : "Đã qua sử dụng 80%",
      sellerName: profile?.fullName || session?.user?.email?.split("@")[0] || "Sinh viên StudentHub",
      sellerRole: isExpert ? "expert" : "student",
      sellerTrustScore: profile?.trustScore || (isExpert ? 98 : 80),
      sellerEduVerified: Boolean(profile?.email?.endsWith(".edu") || profile?.email?.endsWith(".edu.vn")),
      campusLocation: newLocation.trim(),
      description: newDescription.trim(),
    };

    try {
      const res = await fetch("/api/marketplace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success && data?.item) {
        setItems((prev) => [data.item, ...prev]);
        setIsModalOpen(false);
        setNewTitle("");
        setNewPrice("");
        setNewOriginalPrice("");
        setNewLocation("");
        setNewDescription("");
        saffronAudio.playSuccessChime();
      }
    } catch (err) {
      console.warn("Create marketplace item error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070403] text-gray-100 flex relative overflow-x-hidden selection:bg-[#ffbc09] selection:text-[#150604]">
      {/* 1. Aerospace Mission Control Backdrop */}
      <AeroMissionControlBackdrop
        sectorTag="SECTOR_10_BETA // TRUST_ESCROW_MARKETPLACE"
        gridDensity={52}
        showRadarRings={false}
      />

      {/* 2. Interactive WebGL Fluid Smoke Trail */}
      <MohsinFluidCanvas opacity={0.35} particleDensity={35} />

      {/* 3. Film Grain Noise Overlay */}
      <NoiseOverlay />

      {/* 4. Floating Quick Tools */}
      <FloatingDock />
      <BackgroundsAndEffectsStudio />

      {/* Navigation */}
      {session ? (
        <CollapsibleSidebar className="hidden md:flex relative z-40" />
      ) : (
        <header className="overlay-nav-layer">
          <ModernNavbar />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 layout-safe-container pt-24 sm:pt-28 pb-40 relative z-10 min-w-0 font-human">
        {/* Top Marquee Telemetry Ticker */}
        <SaffronMarqueeTicker className="mb-8 rounded-2xl border border-[#47140b]/60" />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffbc09]/15 border border-[#ffbc09]/30 text-[#ffbc09] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ffbc09] animate-ping" />
              <span>PEER-TO-PEER TRUST ESCROW // ZERO SCAM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span className="text-[#ffd15c]">Sàn Pass Đồ &amp; Giáo Trình</span> Bảo Chứng Uy Tín
            </h1>
            <p className="text-xs sm:text-sm text-[#ece7e0]/80 mt-2 max-w-2xl font-normal leading-relaxed">
              Mua bán, pass lại giáo trình, laptop, đồ dùng KTX an toàn giữa sinh viên các trường. Giao dịch bảo chứng bằng điểm uy tín (Trust Score) và giao dịch trực tiếp tại cổng trường.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <IglooSoundAmbiencePill />
            <button
              type="button"
              onClick={() => {
                saffronAudio.playClick(600);
                setIsModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ffbc09] to-[#f59e0b] text-[#150604] font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,188,9,0.35)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>ĐĂNG BÁN MÓN ĐỒ</span>
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  setSelectedCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#ffbc09] text-[#150604] border-[#ffbc09] shadow-lg shadow-[#ffbc09]/20 scale-105"
                    : "bg-[#150604] text-[#ece7e0]/70 border-[#47140b] hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-[#ece7e0]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm giáo trình Giải tích, Casio 580, tủ lạnh mini, xe đạp theo cổng trường..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#150604] border border-[#47140b] rounded-2xl text-xs sm:text-sm text-white placeholder-[#ece7e0]/40 focus:outline-none focus:border-[#ffbc09] font-mono"
            />
          </div>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/60 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#ffbc09] animate-spin" />
            <span>Đang tải danh sách đồ pass bảo chứng...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#150604] border border-[#47140b] text-xs font-mono text-[#ece7e0]/50">
            Chưa có món đồ nào trong danh mục này. Hãy là người đầu tiên đăng pass!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[#150604] border border-[#47140b] hover:border-[#ffbc09]/60 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category & Safety Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-[#210a07] text-[#ffd15c] border border-[#47140b]">
                      {item.categoryName}
                    </span>

                    <span className="text-[10.5px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      BẢO CHỨNG UY TÍN
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#ffd15c] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Price Row */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[#ffd15c] font-mono">
                      {item.price.toLocaleString("vi-VN")} đ
                    </span>
                    {item.originalPrice > item.price && (
                      <span className="text-xs text-[#ece7e0]/40 line-through font-mono">
                        {item.originalPrice.toLocaleString("vi-VN")} đ
                      </span>
                    )}
                  </div>

                  {/* Condition Tag */}
                  <div className="inline-block px-2 py-0.5 rounded bg-black/40 border border-[#47140b] text-[11px] font-mono text-[#38bdf8]">
                    Tình trạng: {item.conditionLabel}
                  </div>

                  {/* Campus Location */}
                  <p className="text-xs font-mono text-[#ece7e0]/80 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#ffbc09] shrink-0" />
                    <span>{item.campusLocation}</span>
                  </p>

                  <p className="text-xs text-[#ece7e0]/70 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Seller Trust Dossier */}
                <div className="pt-3 border-t border-[#47140b] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#ffbc09]/20 border border-[#ffbc09]/40 flex items-center justify-center text-[#ffbc09] text-[10px] font-mono font-bold">
                      SV
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {item.sellerName}
                      </span>
                      <span className="text-[10px] font-mono text-[#ffbc09]">
                        Trust: {item.sellerTrustScore} PTS
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(500);
                      setSelectedItem(item);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#210a07] border border-[#47140b] text-xs font-mono font-bold text-white hover:border-[#ffbc09] transition-all cursor-pointer"
                  >
                    Xem Chi Tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <span className="text-xs font-mono font-bold text-[#ffbc09]">
                  HỒ SƠ GIAO DỊCH AN TOÀN // ITEM #{selectedItem.id}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white leading-snug">
                  {selectedItem.title}
                </h3>

                <div className="p-4 rounded-2xl bg-[#210a07] border border-[#47140b] space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#ece7e0]/60">GIÁ PASS:</span>
                    <span className="text-xl font-black text-[#ffd15c]">{selectedItem.price.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#ece7e0]/60">ĐỊA ĐIỂM GIAO DỊCH:</span>
                    <span className="text-white font-bold">{selectedItem.campusLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#ece7e0]/60">NGƯỜI BÁN:</span>
                    <span className="text-emerald-400 font-bold">{selectedItem.sellerName} ({selectedItem.sellerTrustScore} PTS)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10.5px] font-mono text-[#ece7e0]/60 uppercase block">
                    MÔ TẢ CHI TIẾT VÀ TÌNH TRẠNG:
                  </span>
                  <p className="text-xs text-[#ece7e0]/80 leading-relaxed font-human whitespace-pre-line">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1 font-human">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>QUY TẮC GIAO DỊCH AN TOÀN STUDENTHUB:</span>
                  </div>
                  <p>
                    Hẹn gặp trực tiếp tại Cổng trường hoặc Phòng Quản lý KTX để kiểm tra đồ và thanh toán tiền mặt. <strong>TUYỆT ĐỐI KHÔNG CHUYỂN TIỀN CỌC TRƯỚC</strong> cho bất kỳ ai.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      saffronAudio.playClick(400);
                      const contactInfo = `[StudentHub] Hẹn giao dịch món đồ: ${selectedItem.title} - Giá ${selectedItem.price.toLocaleString("vi-VN")}đ tại ${selectedItem.campusLocation}`;
                      navigator.clipboard.writeText(contactInfo);
                      setCopiedContact(true);
                      setTimeout(() => setCopiedContact(false), 2000);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-all"
                  >
                    {copiedContact ? <Check className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                    <span>{copiedContact ? "Đã sao chép thông tin hẹn gặp!" : "Liên Hệ Hẹn Gặp Cổng Trường"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE ITEM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[#150604] border border-[#ffbc09]/50 shadow-2xl space-y-4 font-human"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#47140b]">
                <h3 className="text-base font-bold text-white font-mono">
                  ĐĂNG TIN PASS ĐỒ BẢO CHỨNG // CAMPUS MARKET
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-[#ece7e0]/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    TÊN MÓN ĐỒ / GIÁO TRÌNH (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Pass Giáo trình Triết học Mác - Lênin mới 95%..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                      DANH MỤC (*)
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c.id !== "ALL").map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                      GIÁ PASS (VNĐ) (*)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="90000"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    ĐỊA ĐIỂM GIAO DỊCH TRỰC TIẾP TẠI TRƯỜNG (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cổng A HCMUTE hoặc Sảnh KTX Khu B..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#ffbc09] mb-1">
                    MÔ TẢ CHI TIẾT MÓN ĐỒ (*)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Nêu rõ tình trạng sách/máy, bao test ra sao..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-3 bg-[#210a07] border border-[#47140b] rounded-xl text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-transparent border border-[#47140b] text-xs font-mono text-[#ece7e0]/70"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#ffbc09] text-[#150604] font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    {isSubmitting ? "ĐANG ĐĂNG..." : "ĐĂNG BÁN NGAY"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
