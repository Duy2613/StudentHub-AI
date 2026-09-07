"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Maximize2, Sparkles, Layers, Sliders, Eye, Film, Compass, CheckCircle2 } from "lucide-react";

export const CINEMATIC_FILMS = [
  {
    id: "film01_campus_atlas",
    num: "01",
    title: "The Living Campus Atlas",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "35mm Anamorphic Prime",
    cameraMove: "Slow Dolly-Out with Subtle Parallax",
    palette: ["#0e1118", "#f6f3eb", "#528ab9", "#e8b055"],
    mood: "Discovery • Intelligence • Possibility • Global Learning",
    safeZone: "Upper-Left & Center-Left (Hero Typography Zone)",
    concept: "Ivory academic paper map transforms into a 3D topographic knowledge landscape of layered paper, frosted glass, and living fiber-optic pathways connecting research nodes.",
    mp4: "/videos/academic/film01_campus_atlas.mp4",
    webp: "/videos/academic/film01_campus_atlas.webp",
    poster: "/images/academic/film01_campus_atlas.jpg",
  },
  {
    id: "film02_trust_engine",
    num: "02",
    title: "The Trust Engine",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "50mm T1.5 Macro Cine",
    cameraMove: "Forward Glide & Spatial Layering",
    palette: ["#080a0f", "#38bdda", "#f6f3eb", "#232a34"],
    mood: "Trust • Verification • Evidence • Precision",
    safeZone: "Right-Third (Web Interface & Metric Zone)",
    concept: "Archival manuscript suspended in dark editorial space; floating evidence slides connect via gossamer cyan filaments as false links dissolve into gentle dust motes.",
    mp4: "/videos/academic/film02_trust_engine.mp4",
    webp: "/videos/academic/film02_trust_engine.webp",
    poster: "/images/academic/academic_hero_portal.jpg",
  },
  {
    id: "film03_collective_intelligence",
    num: "03",
    title: "Collective Intelligence",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "40mm Cine Lens",
    cameraMove: "Slow Continuous Forward Travel",
    palette: ["#080a0f", "#f6f3eb", "#528ab9", "#e8b055"],
    mood: "Community • Shared Intelligence • Human Knowledge Amplified",
    safeZone: "Center-Left (Interface Copy Zone)",
    concept: "Single luminous point branches into hundreds of floating notebook fragments, sketches, and mathematical forms flowing as an intelligent organic constellation.",
    mp4: "/videos/academic/film03_collective_intelligence.mp4",
    webp: "/videos/academic/film03_collective_intelligence.webp",
    poster: "/images/academic/academic_ai_copilot.jpg",
  },
  {
    id: "film04_expert_network",
    num: "04",
    title: "Expert Trust Network",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "65mm Portrait Cine",
    cameraMove: "Slow Lateral Tracking Dolly",
    palette: ["#0e1118", "#e8b055", "#528ab9", "#38bdda"],
    mood: "Authority • Mentorship • Scholarship • Heritage",
    safeZone: "Upper-Right (Expert Badge & Profile Zone)",
    concept: "Infinite library book stacks fading into darkness; floating crystal spheres representing academic disciplines connect through open illuminated manuscripts.",
    mp4: "/videos/academic/film04_expert_network.mp4",
    webp: "/videos/academic/film04_expert_network.webp",
    poster: "/images/academic/academic_expert_mentorship.jpg",
  },
  {
    id: "film05_question_understanding",
    num: "05",
    title: "From Question to Understanding",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "35mm Spherical",
    cameraMove: "360-Degree Continuous Gentle Orbit",
    palette: ["#232a34", "#f6f3eb", "#e8b055", "#38bdda"],
    mood: "Curiosity • Reasoning • Clarity • Breakthrough",
    safeZone: "Left Half (Headline & Problem Statement Zone)",
    concept: "Chaotic tangled graphite lines and fragmented debris gradually respond to invisible logic, aligning into an exquisite crystalline knowledge polyhedra.",
    mp4: "/videos/academic/film05_question_understanding.mp4",
    webp: "/videos/academic/film05_question_understanding.webp",
    poster: "/images/academic/academic_quantum_lab.jpg",
  },
  {
    id: "film06_deep_work",
    num: "06",
    title: "Academic Deep Work",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "85mm Macro Cine T1.8",
    cameraMove: "Intimate Surface Glide & Subtle Breeze",
    palette: ["#161311", "#e8b055", "#f6f3eb", "#528ab9"],
    mood: "Focus • Discipline • Calm Intelligence • Quiet Study",
    safeZone: "Upper Half / Top-Left (Heading & Focus Mode Zone)",
    concept: "Dark walnut desk at dawn; sunbeams illuminate drifting dust motes while faint mathematical diagrams momentarily hover above an open textured notebook page.",
    mp4: "/videos/academic/film06_deep_work.mp4",
    webp: "/videos/academic/film06_deep_work.webp",
    poster: "/images/academic/academic_campus_sanctuary.jpg",
  },
  {
    id: "film07_knowledge_time",
    num: "07",
    title: "Knowledge Through Time",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "28mm Anamorphic Ultra-Wide",
    cameraMove: "Continuous Seamless Strata Track",
    palette: ["#080a0f", "#e8b055", "#2eaf88", "#38bdda"],
    mood: "Legacy • Progress • Civilization • Future Intelligence",
    safeZone: "Generous Upper-Third (Timeline Navigation Zone)",
    concept: "Macro camera glides across the physical evolution of knowledge: manuscript parchment → Gutenberg print → blueprint → microchip → AI tensor lattice.",
    mp4: "/videos/academic/film07_knowledge_time.mp4",
    webp: "/videos/academic/film07_knowledge_time.webp",
    poster: "/images/academic/academic_library_commons.jpg",
  },
  {
    id: "film08_knowledge_horizon",
    num: "08",
    title: "The Knowledge Horizon",
    duration: "8.00s",
    fps: 24,
    aspect: "16:9 Master",
    lens: "24mm Architectural Cine",
    cameraMove: "Outward Column Reveal & Horizon Glide",
    palette: ["#080a0f", "#528ab9", "#e8b055", "#f6f3eb"],
    mood: "Ambition • Boundless Progress • Quiet Optimism",
    safeZone: "Vast Open Sky (Master Call-to-Action Zone)",
    concept: "Monumental university observatory above morning clouds at dawn; constellations of academic fields trace across the sky as the camera steps past a dark column.",
    mp4: "/videos/academic/film08_knowledge_horizon.mp4",
    webp: "/videos/academic/film08_knowledge_horizon.webp",
    poster: "/images/academic/film01_campus_atlas.jpg",
  },
];

export default function AcademicCinemaTheater() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [useWebpFallback, setUseWebpFallback] = useState(false);
  const videoRef = useRef(null);

  const activeFilm = CINEMATIC_FILMS[selectedIdx];

  // High-precision 8-second playback loop tracker
  useEffect(() => {
    let animId;
    let startTime = performance.now();

    const updateTimeline = (now) => {
      if (isPlaying) {
        const elapsed = ((now - startTime) / 1000) % 8.0;
        setCurrentTime(elapsed);
      }
      animId = requestAnimationFrame(updateTimeline);
    };

    animId = requestAnimationFrame(updateTimeline);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, selectedIdx]);

  const currentFrame = Math.floor((currentTime / 8.0) * 192);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = pos * 8.0;
    setCurrentTime(targetSec);
    if (videoRef.current) {
      videoRef.current.currentTime = targetSec;
    }
  };

  return (
    <section className="relative w-full py-24 px-4 md:px-8 bg-[#080a0f] border-t border-white/10 text-white overflow-hidden">
      {/* Background Subtle Ambience */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-950/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest text-sky-400 mb-4">
              <Film className="w-3.5 h-3.5" />
              <span>CINEMATIC ARCHIVE • 8 MASTER FILMS (8.00s @ 24FPS)</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif tracking-tight text-[#f6f3eb]">
              Academic Cinematic Universe
            </h2>
            <p className="text-sm md:text-base text-zinc-400 mt-2 max-w-2xl font-light">
              Tuyển tập 8 tác phẩm điện ảnh nghệ thuật thị giác độc quyền của StudentHub AI. Kết hợp tri thức hàn lâm, công nghệ biên tập cao cấp, và thiết kế không gian cho giao diện học thuật.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md self-start md:self-auto">
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Format Standard</div>
              <div className="text-sm font-semibold text-white">4K UHD • 16:9 • 24.00 FPS</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Master Cycle</div>
              <div className="text-sm font-semibold text-amber-400">8.000s Seamless Loop</div>
            </div>
          </div>
        </div>

        {/* Master Cinema Stage */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-white/15 bg-black shadow-2xl shadow-black/80">
          {/* Top Video Telemetry Overlay */}
          <div className="absolute top-0 inset-x-0 z-30 p-4 md:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                FILM {activeFilm.num} / 08
              </span>
              <span className="font-serif text-lg md:text-xl text-[#f6f3eb] drop-shadow-md">
                {activeFilm.title}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-zinc-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>REC 180° SHUTTER</span>
              </div>
              <div className="bg-black/40 px-2.5 py-1 rounded border border-white/10">
                FRAME {String(currentFrame).padStart(3, "0")} / 192
              </div>
            </div>
          </div>

          {/* 16:9 Video Canvas Frame */}
          <div className="relative w-full aspect-video bg-[#080a0f] flex items-center justify-center overflow-hidden group">
            {useWebpFallback ? (
              <img
                src={activeFilm.webp}
                alt={activeFilm.title}
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <video
                ref={videoRef}
                key={activeFilm.id}
                src={activeFilm.mp4}
                poster={activeFilm.poster}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setUseWebpFallback(true)}
                className="w-full h-full object-cover select-none"
              />
            )}

            {/* Negative Space & Safe Zones Overlay */}
            {showSafeZones && (
              <div className="absolute inset-0 z-20 pointer-events-none border-2 border-dashed border-sky-400/40 bg-sky-950/10 backdrop-blur-[1px]">
                {/* Rule of Thirds Lines */}
                <div className="absolute top-1/3 inset-x-0 h-px bg-white/20 border-t border-dashed border-white/30" />
                <div className="absolute top-2/3 inset-x-0 h-px bg-white/20 border-t border-dashed border-white/30" />
                <div className="absolute left-1/3 inset-y-0 w-px bg-white/20 border-l border-dashed border-white/30" />
                <div className="absolute left-2/3 inset-y-0 w-px bg-white/20 border-l border-dashed border-white/30" />

                {/* Safe Zone Indicator Badge */}
                <div className="absolute bottom-16 left-6 max-w-sm p-3.5 rounded-xl bg-black/85 border border-sky-400/50 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SAFE EDITORIAL READING ZONE</span>
                  </div>
                  <div className="text-xs text-zinc-200">
                    {activeFilm.safeZone}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Khu vực đảm bảo độ tương phản cao và độ nhiễu thấp để hiển thị văn bản, tiêu đề và nút CTA.
                  </div>
                </div>
              </div>
            )}

            {/* Center Subtle Watermark-Free Badge */}
            <div className="absolute bottom-14 right-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono text-zinc-400">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>{activeFilm.lens} • {activeFilm.cameraMove}</span>
            </div>
          </div>

          {/* Scrubber & Video Controls Bar */}
          <div className="relative z-30 px-4 md:px-8 py-4 bg-[#0e1118]/95 border-t border-white/10 backdrop-blur-md">
            {/* Timeline Progress Bar (Interactive Scrub) */}
            <div
              onClick={handleSeek}
              className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden group/timeline mb-4"
            >
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-400 rounded-full"
                style={{ width: `${(currentTime / 8.0) * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-black opacity-0 group-hover/timeline:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / 8.0) * 100}%` }}
              />
            </div>

            {/* Bottom Control Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Play / Pause / Time */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                </button>

                <div className="font-mono text-sm tracking-wider text-zinc-200">
                  <span className="text-sky-400 font-semibold">
                    00:0{currentTime.toFixed(2)}
                  </span>{" "}
                  / <span className="text-zinc-500">00:08.00</span>
                </div>
              </div>

              {/* Toggles & Options */}
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setShowSafeZones(!showSafeZones)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all ${
                    showSafeZones
                      ? "bg-sky-500/20 border-sky-400 text-sky-300"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editorial Safe Zones</span>
                </button>

                <button
                  onClick={() => setUseWebpFallback(!useWebpFallback)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all ${
                    useWebpFallback
                      ? "bg-amber-500/20 border-amber-400 text-amber-300"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                  title="Chuyển đổi giữa định dạng MP4 và WebP Animation"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{useWebpFallback ? "WebP Loop" : "MP4 Engine"}</span>
                </button>

                {/* Color Palette Swatches */}
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-mono text-zinc-400 mr-1">PALETTE:</span>
                  {activeFilm.palette.map((c, i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Film Concept & Director's Vision Card */}
        <div className="mt-8 p-6 md:p-8 rounded-2xl bg-[#0e1118]/80 border border-white/10 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
                Concept & Spatial Metaphor • Film {activeFilm.num}
              </div>
              <h3 className="text-xl md:text-2xl font-serif text-[#f6f3eb] mb-3">
                {activeFilm.title}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed font-light mb-4">
                {activeFilm.concept}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-400">
                <span className="text-sky-400 font-bold">EMOTIONAL MOOD:</span>
                <span>{activeFilm.mood}</span>
              </div>
            </div>

            <div className="space-y-3 md:border-l md:border-white/10 md:pl-6 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block">CAMERA MOTION</span>
                <span className="text-zinc-200 font-semibold">{activeFilm.cameraMove}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">OPTICAL SPECIFICATION</span>
                <span className="text-zinc-200 font-semibold">{activeFilm.lens}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">TYPOGRAPHY OVERLAY TARGET</span>
                <span className="text-amber-300 font-semibold">{activeFilm.safeZone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 8-Film Thumbnail Navigation Carousel */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              Select Film Sequence (1 to 8)
            </h4>
            <span className="text-xs font-mono text-zinc-500">
              Use arrow keys or click to switch films
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CINEMATIC_FILMS.map((film, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={film.id}
                  onClick={() => {
                    setSelectedIdx(idx);
                    setCurrentTime(0);
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                    }
                  }}
                  className={`relative group rounded-xl overflow-hidden border text-left transition-all p-2 flex flex-col justify-between aspect-[16/11] ${
                    isSelected
                      ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-amber-400 text-black"
                          : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {film.num}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">8.00s</span>
                  </div>

                  <div className="mt-2">
                    <div
                      className={`text-xs font-serif line-clamp-2 leading-tight ${
                        isSelected ? "text-amber-300 font-semibold" : "text-zinc-200"
                      }`}
                    >
                      {film.title}
                    </div>
                  </div>

                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
