"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Zap, Users, Database, ArrowRight, CheckCircle2, Star, Clock, MessageSquare } from "lucide-react";

import Interactive3DBlockCard from "@/components/ui/Interactive3DBlockCard";

export default function IglooEcosystemShowcase() {
  const [activeTab, setActiveTab] = useState("scam");
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <section className="py-24 relative z-10 overflow-hidden" id="ecosystem">
      <div className="layout-safe-container space-y-16">
        
        {/* Section Header with Dual Typography: Inter (Human) + JetBrains Mono (Machine) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2">
              <span className="igloo-pill-badge">
                <span className="w-2 h-2 rounded-full bg-cyan-400 igloo-radar-beacon" />
                <span>ECOSYSTEM MATRIX • DIGITAL GUARDIAN</span>
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
              <span className="font-human font-black">Hệ Sinh Thái Phòng Vệ Số</span>
              <br />
              <span className="font-serif-editorial italic font-normal text-gradient-primary">
                cho Sinh Viên Toàn Quốc.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 font-human leading-relaxed">
              Tích hợp 4 trụ cột công nghệ AI, mạng lưới thẩm định chuyên gia và diễn đàn tiếng nói sinh viên trên cùng một nền tảng mở.
            </p>
          </div>

          {/* Machine Telemetry Live Status */}
          <div className="flex items-center gap-4 bg-space-900/80 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-xl font-machine text-xs shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-400">NETWORK:</span>
              <span className="text-emerald-400 font-bold">ONLINE (0.1s LATENCY)</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/10" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-gray-400">THREAT FEED:</span>
              <span className="text-cyan-300 font-bold">24/7 ACTIVE</span>
            </div>
          </div>
        </div>

        {/* 4-Pillar Interactive Bento Grid (Igloo Inc Signature Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Bento Card 1: 4-Layer AI Neural Sentinel (7 cols) */}
          <div className="lg:col-span-7">
            <Interactive3DBlockCard
              glowColor="rgba(56, 189, 248, 0.4)"
              maxTilt={8}
              depth={35}
              className="h-full"
            >
              <div
                onMouseMove={handleMouseMove}
                className="igloo-hologram-card p-7 sm:p-9 flex flex-col justify-between h-full min-h-[460px] relative group"
              >
                <div
                  className="igloo-hologram-glare"
                  style={{
                    transform: `translate(${(mousePos.x - 0.5) * 40}px, ${(mousePos.y - 0.5) * 40}px)`,
                  }}
                />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-machine text-[11px] text-cyan-300 uppercase tracking-widest block font-bold">
                          PILLAR 01 • NEURAL SCANNER
                        </span>
                        <h3 className="text-xl sm:text-2xl font-human font-bold text-white">
                          AI Scam Engine 4 Lớp
                        </h3>
                      </div>
                    </div>

                    <span className="igloo-pill-badge">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      0.1s - 1.5s EARLY EXIT
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed">
                    Xác thực tức thì các đường link đáng ngờ, tin nhắn nạp cọc việc làm và ảnh chụp màn hình bằng công nghệ OCR kết hợp đối sánh Vector RAG 1.000+ mẫu lừa đảo.
                  </p>

                  {/* Machine Lookbook Terminal Preview Box */}
                  <div className="ai-analysis-box danger mt-4">
                    <div className="ai-header font-machine">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>AI SECURITY SCANNER v2.8</span>
                      <span className="ml-auto text-[10px] text-rose-400 font-bold">[THREAT DETECTED]</span>
                    </div>
                    <div className="ai-content font-machine text-xs space-y-1.5">
                      <p><span className="label">Target:</span> shopee-ctv-tuyendung-online.vip</p>
                      <p><span className="label">Status:</span> <span className="status-danger">PHÁT HIỆN NGUY CƠ CAO (96%)</span></p>
                      <div className="details">
                        &gt;&gt; Phân tích: Yêu cầu nạp cọc 200k duyệt đơn. Trùng khớp 98.2% mẫu lừa đảo tài chính Ponzi.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 relative z-10">
                  <span className="font-machine text-xs text-gray-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Hỗ trợ Link • Text • Ảnh OCR
                  </span>

                  <Link
                    href="/trust"
                    className="btn-scan text-xs py-2 px-4 group"
                  >
                    <span>Kiểm tra ngay</span>
                    <span className="tech-suffix">[AI MODE]</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Interactive3DBlockCard>
          </div>

          {/* Bento Card 2: Proof-of-Trust Specialist Network (5 cols) */}
          <div className="lg:col-span-5">
            <Interactive3DBlockCard
              glowColor="rgba(245, 158, 11, 0.4)"
              maxTilt={8}
              depth={35}
              className="h-full"
            >
              <div
                onMouseMove={handleMouseMove}
                className="igloo-hologram-card p-7 sm:p-9 flex flex-col justify-between h-full min-h-[460px] relative group"
              >
                <div
                  className="igloo-hologram-glare"
                  style={{
                    transform: `translate(${(mousePos.x - 0.5) * 40}px, ${(mousePos.y - 0.5) * 40}px)`,
                  }}
                />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-machine text-[11px] text-amber-300 uppercase tracking-widest block font-bold">
                          PILLAR 02 • PROOF OF TRUST
                        </span>
                        <h3 className="text-xl font-human font-bold text-white">
                          Mạng Lưới Chuyên Gia
                        </h3>
                      </div>
                    </div>

                    <span className="igloo-pill-badge warn">
                      <Star className="w-3 h-3 text-amber-400" />
                      0 - 100 PTS
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed">
                    Hội đồng thẩm định độc lập gồm Luật sư, Kỹ sư An ninh mạng và Cố vấn học bổng đối soát thực chứng mọi báo cáo phức tạp.
                  </p>

                  {/* Trust Meter Widget */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between font-machine text-xs">
                      <span className="text-gray-400">Xác thực Email .edu.vn:</span>
                      <span className="text-teal-300 font-bold">+30 ĐIỂM UY TÍN</span>
                    </div>

                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div className="bg-gradient-to-r from-amber-500 via-teal-400 to-cyan-400 h-full rounded-full w-[88%]" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-machine text-gray-400">
                      <span>Tier: Sinh viên uy tín</span>
                      <span className="text-amber-300 font-bold">88/100 Điểm</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                  <span className="font-machine text-xs text-gray-400">
                    Cơ chế Vote Uy Tín minh bạch
                  </span>

                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors font-human"
                  >
                    <span>Xem bảng xếp hạng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Interactive3DBlockCard>
          </div>

          {/* Bento Card 3: Campus Voice & Anti-Scam Shield DAO (6 cols) */}
          <div className="lg:col-span-6">
            <Interactive3DBlockCard
              glowColor="rgba(99, 102, 241, 0.4)"
              maxTilt={8}
              depth={35}
              className="h-full"
            >
              <div
                onMouseMove={handleMouseMove}
                className="igloo-hologram-card p-7 sm:p-9 flex flex-col justify-between h-full min-h-[380px] relative group"
              >
                <div
                  className="igloo-hologram-glare"
                  style={{
                    transform: `translate(${(mousePos.x - 0.5) * 40}px, ${(mousePos.y - 0.5) * 40}px)`,
                  }}
                />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-machine text-[11px] text-indigo-300 uppercase tracking-widest block font-bold">
                          PILLAR 03 • CAMPUS VOICE
                        </span>
                        <h3 className="text-lg sm:text-xl font-human font-bold text-white">
                          Diễn Đàn Sinh Viên Thực Chứng
                        </h3>
                      </div>
                    </div>

                    <span className="igloo-pill-badge">
                      <Users className="w-3 h-3" />
                      COMMUNITY
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed">
                    Không gian chia sẻ review thật về Nhà trọ, Quán ăn, Trường học. Cơ chế tách biệt hoàn toàn giữa lượt "Vote Uy Tín" và "Like Hữu Ích".
                  </p>

                  <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 font-human text-xs space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Cảnh báo cọc phòng trọ ảo ngõ 27 Tạ Quang Bửu
                    </p>
                    <p className="text-gray-300 text-[11px] font-machine">
                      96% Uy Tín • 48 lượt thẩm định • Luật sư Thu Hà xác nhận
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/10 flex items-center justify-between relative z-10">
                  <span className="font-machine text-xs text-gray-400">
                    Lọc theo tên trường Đại học
                  </span>
                  <Link
                    href="/community"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors font-human"
                  >
                    <span>Vào diễn đàn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Interactive3DBlockCard>
          </div>

          {/* Bento Card 4: National Intelligence Whitelist & Blacklist Radar (6 cols) */}
          <div className="lg:col-span-6">
            <Interactive3DBlockCard
              glowColor="rgba(52, 231, 196, 0.4)"
              maxTilt={8}
              depth={35}
              className="h-full"
            >
              <div
                onMouseMove={handleMouseMove}
                className="igloo-hologram-card p-7 sm:p-9 flex flex-col justify-between h-full min-h-[380px] relative group"
              >
                <div
                  className="igloo-hologram-glare"
                  style={{
                    transform: `translate(${(mousePos.x - 0.5) * 40}px, ${(mousePos.y - 0.5) * 40}px)`,
                  }}
                />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-machine text-[11px] text-teal-300 uppercase tracking-widest block font-bold">
                          PILLAR 04 • INTELLIGENCE RADAR
                        </span>
                        <h3 className="text-lg sm:text-xl font-human font-bold text-white">
                          Cơ Sở Dữ Liệu An Toàn Số
                        </h3>
                      </div>
                    </div>

                    <span className="igloo-pill-badge success">
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                      .EDU.VN WHITELIST
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 font-human leading-relaxed">
                    Tự động đối soát danh sách đen lừa đảo quốc gia và danh sách trắng các cổng thông tin đào tạo chính thống thuộc hệ thống giáo dục Việt Nam.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1 font-machine text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-teal-500/20">
                      <span className="text-[10px] text-gray-400 block uppercase">Whitelist Domain</span>
                      <span className="text-sm font-bold text-teal-300">100% .edu.vn</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-rose-500/20">
                      <span className="text-[10px] text-gray-400 block uppercase">Blacklist Mẫu Lừa</span>
                      <span className="text-sm font-bold text-rose-400">1.000+ Cases</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/10 flex items-center justify-between relative z-10">
                  <span className="font-machine text-xs text-gray-400">
                    Cập nhật thời gian thực
                  </span>
                  <Link
                    href="/trust"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-teal-200 transition-colors font-human"
                  >
                    <span>Khám phá Radar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Interactive3DBlockCard>
          </div>

        </div>

        {/* Bottom Network Live Metrics Counter (Igloo Stat Banner) */}
        <div className="igloo-stat-card igloo-border-pulse grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="igloo-stat-number">1,240+</div>
            <div className="igloo-stat-label">Vụ lừa đảo đã phát hiện</div>
          </div>

          <div className="space-y-1">
            <div className="igloo-stat-number">&lt; 0.1s</div>
            <div className="igloo-stat-label">Thời gian phản hồi lớp 1</div>
          </div>

          <div className="space-y-1">
            <div className="igloo-stat-number">98.4%</div>
            <div className="igloo-stat-label">Độ chính xác đối soát</div>
          </div>

          <div className="space-y-1">
            <div className="igloo-stat-number">100%</div>
            <div className="igloo-stat-label">Miễn phí cho sinh viên</div>
          </div>
        </div>

      </div>
    </section>
  );
}
