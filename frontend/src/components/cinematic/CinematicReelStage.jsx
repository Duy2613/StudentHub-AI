"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Maximize2, Radio, Volume2, VolumeX } from "lucide-react";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";

const VIDEO_CHANNELS = [
  {
    id: "hero",
    channel: "CH 01",
    title: "Hiên Tri Thức",
    subtitle: "Hero Overture · Căn phòng thẩm định",
    video: V3_MEDIA.landing.hero.video,
    poster: V3_MEDIA.landing.hero.poster,
    telemetry: "LAT 10.7626° N // RES 3840x2160 // 60 FPS",
    tag: "TỔNG QUAN",
  },
  {
    id: "prism",
    channel: "CH 02",
    title: "Lăng Kính Phản Chiếu",
    subtitle: "Prism Refraction · Tách lọc nhiễu loạn",
    video: V3_MEDIA.landing.trustTransform.video,
    poster: V3_MEDIA.landing.prism,
    telemetry: "SPECTRAL DENSITY 99.4% // 4 NGUỒN ĐỐI SOÁT",
    tag: "BÓC TÁCH MỆNH ĐỀ",
  },
  {
    id: "gemini-verification",
    channel: "CH 03",
    title: "Gemini Verification",
    subtitle: "AI Verification · Gemini advisory evidence",
    video: V3_MEDIA.trust.l4AiVerification.video,
    poster: V3_MEDIA.trust.l4AiVerification.poster,
    telemetry: "GEMINI STRUCTURED OUTPUT // DETERMINISTIC POLICY AUTHORITY",
    tag: "AI VERIFICATION",
  },
  {
    id: "human",
    channel: "CH 04",
    title: "Thẩm Định Chuyên Gia",
    subtitle: "Human Forensic Review · Phê duyệt độc lập",
    video: V3_MEDIA.trust.humanReview.video,
    poster: V3_MEDIA.trust.humanReview.poster,
    telemetry: "1,240 VERIFIED EXPERTS // CHỮ KÝ SỐ MẬT MÃ",
    tag: "HỘI ĐỒNG PHẢN BIỆN",
  },
  {
    id: "community",
    channel: "CH 05",
    title: "Trí Tuệ Cộng Đồng",
    subtitle: "Collective Fellowship · Trao đổi văn minh",
    video: V3_MEDIA.community.hero.video,
    poster: V3_MEDIA.community.hero.poster,
    telemetry: "28,500 PEER REPORTERS // MINH BẠCH HỌC VỤ",
    tag: "TRÍ TUỆ TẬP THỂ",
  },
];

export default function CinematicReelStage() {
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [timecode, setTimecode] = useState("00:00:00:00");
  const videoRef = useRef(null);

  const activeChannel = VIDEO_CHANNELS[activeChannelIndex];

  // Realistic SMPTE Running Timecode generator
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const frames = String(frame % 30).padStart(2, "0");
      const seconds = String(Math.floor((frame / 30) % 60)).padStart(2, "0");
      const minutes = String(Math.floor((frame / 1800) % 60)).padStart(2, "0");
      const hours = String(Math.floor(frame / 108000)).padStart(2, "0");
      setTimecode(`${hours}:${minutes}:${seconds}:${frames}`);
    }, 33.33);
    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section className="relative w-full py-24 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-600/10 via-cyan-600/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Editorial Section Header (Hobro & Zero University Style) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
              <Radio size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-widest text-slate-300 uppercase">
                TRUYỀN PHÁT ĐA KÊNH BẰNG CHỨNG // 4K CINEMATIC REEL
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-sans tracking-tight uppercase leading-none">
              Kho Phim Bằng Chứng{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 block sm:inline">
                trực quan hóa.
              </span>
            </h2>
          </div>
          <p className="text-slate-400 font-serif text-base sm:text-lg max-w-md leading-relaxed">
            Chuyển kênh để quan sát toàn diện cách StudentHub AI vận hành: từ lăng kính bóc tách mệnh đề đến Gemini advisory verification và chuyên gia bảo trợ.
          </p>
        </div>

        {/* Video Cinema Stage Deck */}
        <div className="relative rounded-3xl border border-white/15 bg-space-900 shadow-2xl overflow-hidden group">
          {/* Top Telemetry Ribbon */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-space-950/80 backdrop-blur-md text-xs font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>REC ● LIVE FEED</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="text-slate-300 font-bold">{activeChannel.channel} : {activeChannel.title}</span>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <span className="text-emerald-400 font-bold tracking-wider">{timecode}</span>
              <span className="text-white/20">|</span>
              <span className="text-[11px] text-slate-400">{activeChannel.telemetry}</span>
            </div>
          </div>

          {/* Main Video Screen */}
          <div className="relative aspect-[16/9] w-full bg-black overflow-hidden" data-cursor="EXPAND REEL">
            <video
              ref={videoRef}
              key={activeChannel.video}
              src={activeChannel.video}
              poster={activeChannel.poster}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover filter contrast-105 brightness-95 transition-all duration-700"
            />

            {/* Subtle Vignette & Analog Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-space-950/40 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,8,19,0.7)_100%)] pointer-events-none" />

            {/* Corner Crosshairs */}
            <span className="absolute top-4 left-4 text-xs font-mono text-white/40 pointer-events-none">+</span>
            <span className="absolute top-4 right-4 text-xs font-mono text-white/40 pointer-events-none">+</span>
            <span className="absolute bottom-4 left-4 text-xs font-mono text-white/40 pointer-events-none">+</span>
            <span className="absolute bottom-4 right-4 text-xs font-mono text-white/40 pointer-events-none">+</span>

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-20">
              <div className="p-3 sm:p-4 rounded-2xl bg-space-950/80 border border-white/15 backdrop-blur-xl max-w-lg">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                  {activeChannel.tag}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white font-sans mb-1">
                  {activeChannel.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed">
                  {activeChannel.subtitle}
                </p>
              </div>

              {/* Media Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-3 rounded-xl bg-space-950/80 border border-white/15 hover:border-emerald-400/50 hover:bg-space-900 text-white backdrop-blur-xl transition-all"
                  aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
                  data-cursor={isPlaying ? "PAUSE" : "PLAY"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-3 rounded-xl bg-space-950/80 border border-white/15 hover:border-emerald-400/50 hover:bg-space-900 text-white backdrop-blur-xl transition-all"
                  aria-label={isMuted ? "Bật tiếng video" : "Tắt tiếng video"}
                  data-cursor={isMuted ? "UNMUTE" : "MUTE"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-3 rounded-xl bg-space-950/80 border border-white/15 hover:border-emerald-400/50 hover:bg-space-900 text-white backdrop-blur-xl transition-all hidden sm:flex"
                  aria-label="Xem toàn màn hình"
                  data-cursor="FULLSCREEN"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Channel Selector Ribbon (Hobro-Inspired Staggered Matrix) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-white/10 border-t border-white/10 bg-space-950/60">
            {VIDEO_CHANNELS.map((ch, idx) => {
              const isSelected = idx === activeChannelIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannelIndex(idx)}
                  className={`p-4 text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? "bg-emerald-500/10 text-white"
                      : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                  data-cursor={`SWITCH ${ch.channel}`}
                >
                  {isSelected && (
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                  )}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400">
                      {ch.channel}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-xs font-bold font-sans text-white truncate">
                    {ch.title}
                  </div>
                  <div className="text-[11px] font-serif text-slate-400 truncate mt-0.5">
                    {ch.tag}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
