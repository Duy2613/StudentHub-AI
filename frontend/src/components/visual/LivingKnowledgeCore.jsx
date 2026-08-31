"use client";

import React, { useState, useMemo } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Compass, Layers, ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";
import { useReducedMotionState } from "./ReducedMotionBoundary";

// --- VISUAL TOKENS ---
const CORE_COLORS = {
  graphite: "#0F1115",
  ivory: "#EAE6DC",
  mint: "#64FFDA",
  mintBright: "#A2ECD6",
  danger: "#C62828",
  amber: "#FFB300",
  unknown: "rgba(234, 230, 220, 0.4)",
  lineSubtle: "rgba(234, 230, 220, 0.1)",
  lineMedium: "rgba(234, 230, 220, 0.22)",
};

// --- SVG TEXTURE ASSETS ---
const BlueprintGridSVG = ({ opacity = 0.12, variant = "default" }) => (
  <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none" style={{ opacity }}>
    <defs>
      <pattern id={`grid-${variant}`} width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke={CORE_COLORS.ivory} strokeWidth="0.5" strokeOpacity="0.8" />
        <circle cx="24" cy="24" r="0.75" fill={CORE_COLORS.mint} fillOpacity="0.6" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#grid-${variant})`} />
    {/* Architectural measurement ticks and crosshairs */}
    <line x1="50%" y1="0" x2="50%" y2="100%" stroke={CORE_COLORS.ivory} strokeWidth="0.75" strokeDasharray="6 6" strokeOpacity="0.4" />
    <line x1="0" y1="50%" x2="100%" y2="50%" stroke={CORE_COLORS.ivory} strokeWidth="0.75" strokeDasharray="6 6" strokeOpacity="0.4" />
    {/* Compass ticks in corners */}
    <circle cx="15%" cy="20%" r="16" fill="none" stroke={CORE_COLORS.ivory} strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.3" />
    <circle cx="85%" cy="80%" r="16" fill="none" stroke={CORE_COLORS.ivory} strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.3" />
  </svg>
);

export function LivingKnowledgeCore({
  activeLayerIndex = null,
  overrideState = null,
  showDevControls = false,
  className = ""
}) {
  const isReduced = useReducedMotionState();
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [inputUrl, setInputUrl] = useState("https://hcmute.edu.vn/thong-bao-xet-tot-nghiep-k24");

  // Derive coreState deterministically from external props without setState in useEffect
  const coreState = useMemo(() => {
    if (overrideState) return overrideState;
    if (activeLayerIndex === 0) return "scanning";
    if (activeLayerIndex === 1) return "tracing";
    if (activeLayerIndex === 2) return "aligning";
    if (activeLayerIndex === 3) return "safe";
    return "idle";
  }, [activeLayerIndex, overrideState]);

  // Mouse Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], isReduced ? ["0deg", "0deg"] : ["2deg", "-2deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], isReduced ? ["0deg", "0deg"] : ["-2deg", "2deg"]);

  const handleMouseMove = (e) => {
    if (isReduced || coreState === "aligning" || selectedClaim !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  // --- ANIMATION VARIANTS (3D Z-TRANSITIONS) ---
  const evidenceLayerVariants = {
    idle: { translateZ: isReduced ? 0 : -220, opacity: 0.35, rotateZ: 0, x: 0 },
    scanning: { translateZ: isReduced ? 0 : -220, opacity: 0.4, rotateZ: 0, x: 0 },
    tracing: { translateZ: isReduced ? 0 : -220, opacity: 0.85, rotateZ: 0, x: 0 },
    aligning: {
      translateZ: isReduced ? 0 : -120,
      opacity: 1,
      rotateZ: 0,
      x: 0,
      transition: { type: "spring", stiffness: 45, damping: 18 }
    },
    safe: {
      translateZ: isReduced ? 0 : -120,
      opacity: 1,
      rotateZ: 0,
      x: 0,
      transition: { type: "spring", stiffness: 50, damping: 20 }
    },
    suspicious: {
      translateZ: isReduced ? 0 : -160,
      opacity: 0.88,
      rotateZ: isReduced ? 0 : 0.6,
      x: isReduced ? 0 : -6,
      transition: { type: "spring", stiffness: 120, damping: 16 }
    },
    dangerous: {
      translateZ: isReduced ? 0 : -140,
      opacity: 1,
      rotateZ: isReduced ? 0 : -1.5,
      x: isReduced ? 0 : [0, -3, 3, -1, 1, 0],
      transition: { type: "spring", stiffness: 220, damping: 12 }
    },
    unknown: {
      translateZ: isReduced ? 0 : -240,
      opacity: 0.45,
      rotateZ: 0,
      x: 0,
      transition: { duration: 0.6 }
    }
  };

  const filamentVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }
  };

  const claims = [
    {
      id: "claim-1",
      code: "CLM_01",
      text: "Hạn nộp hồ sơ xét TN đợt 2: 30/06/2026",
      zone: "OFFICIAL",
      status: "VERIFIED_TRUE",
    },
    {
      id: "claim-2",
      code: "CLM_02",
      text: "Chuẩn tiếng Anh áp dụng: TOEIC 650+ (QĐ 3116)",
      zone: "EXPERT",
      status: "VERIFIED_TRUE",
    },
    {
      id: "claim-3",
      code: "CLM_03",
      text: "Nộp bổ sung qua biểu mẫu Google Forms bên ngoài",
      zone: "COMMUNITY",
      status: "SUSPICIOUS_ANOMALY",
    }
  ];

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>

      {/* 1. DEV / TEST HARNESS SCENARIO CONTROLS (Rendered only when showDevControls is explicitly true) */}
      {showDevControls && process.env.NODE_ENV !== "production" && (
        <div className="w-full max-w-2xl mb-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-space-950/80 border border-white/10 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 text-xs font-mono text-app-muted">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="uppercase tracking-wider">Harness State:</span>
            <strong className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/5 text-gray-300 border border-white/10">
              {coreState.toUpperCase()}
            </strong>
          </div>
        </div>
      )}

      {/* 2. 3D OPTICAL STAGE CONTAINER */}
      <div
        className="relative w-full max-w-4xl h-[420px] sm:h-[480px] rounded-3xl overflow-hidden border border-white/10 bg-[#07090e] shadow-2xl"
        style={{ perspective: isReduced ? "none" : "1500px", perspectiveOrigin: "50% 50%" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      >
        {/* Optical Ambient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-[#07090e]/60 pointer-events-none z-20" />
        <div className="absolute inset-0 bg-radial-gradient from-teal-500/5 via-transparent to-transparent pointer-events-none z-20" />

        {/* The rotating 3D assembly holding all 4 physical layers */}
        <motion.div
          className="w-full h-full relative"
          style={{
            transformStyle: isReduced ? "flat" : "preserve-3d",
            rotateX,
            rotateY
          }}
          transition={{ type: "spring", stiffness: 90, damping: 26 }}
        >

          {/* ========================================================================= */}
          {/* LAYER 4: AMBIENT CAMPUS BLUEPRINT (Depth: -400px) */}
          {/* ========================================================================= */}
          <motion.div
            className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none"
            style={{
              transform: isReduced ? "none" : "translateZ(-400px)",
              opacity: coreState === "aligning" || coreState === "safe" ? 0.28 : coreState === "unknown" ? 0.08 : 0.15
            }}
            transition={{ duration: 0.8 }}
          >
            <BlueprintGridSVG opacity={0.06} variant="campus" />
            <div className="flex items-center justify-between text-[10px] font-mono text-app-muted tracking-widest uppercase">
              <span className="flex items-center gap-1.5"><Compass size={12} /> HCMUTE_CAMPUS_SPATIAL_INDEX // 10.8505° N, 106.7719° E</span>
              <span>DATUM: QĐ_3116_2025_REF</span>
            </div>

            <div className="flex justify-center items-center opacity-30">
              <div className="text-center space-y-1">
                <span className="font-mono text-5xl font-black tracking-tighter text-white/40 block">ARCHITECTURAL KNOWLEDGE ARRAY</span>
                <span className="text-[11px] font-mono tracking-widest text-teal-300/60 uppercase">Zero-Trust Evidence Plane</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-white/20">
              <span>LAYER_04 · AMBIENT_DATUM</span>
              <span>DEPTH: -400PX</span>
            </div>
          </motion.div>


          {/* ========================================================================= */}
          {/* LAYER 3: EVIDENCE STRUCTURE (Depth: -220px -> -120px on alignment) */}
          {/* ========================================================================= */}
          <motion.div
            className="absolute inset-4 rounded-2xl border border-white/10 bg-[#0c0f17]/40 backdrop-blur-[2px] flex justify-between p-6 pointer-events-none"
            variants={evidenceLayerVariants}
            initial="idle"
            animate={coreState}
          >
            <BlueprintGridSVG opacity={0.14} variant="evidence" />

            {/* Red Moiré Pattern when Dangerous (Structural Collision) */}
            {coreState === "dangerous" && (
              <div
                className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-screen"
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(198, 40, 40, 0.25) 8px, rgba(198, 40, 40, 0.25) 16px)"
                }}
              />
            )}

            {/* Amber Offset Caution when Suspicious */}
            {coreState === "suspicious" && (
              <div
                className="absolute inset-0 bg-amber-500/5 pointer-events-none"
                style={{
                  backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255, 179, 0, 0.12) 20px, rgba(255, 179, 0, 0.12) 22px)"
                }}
              />
            )}

            {/* Align Mint Channel Glow when Safe */}
            {coreState === "safe" && (
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-teal-400/20 to-teal-500/10 pointer-events-none border border-teal-400/40 shadow-inner" />
            )}

            {/* Unknown Wireframe Hollow State */}
            {coreState === "unknown" && (
              <div className="absolute inset-0 border border-dashed border-white/10 bg-transparent" />
            )}

            {/* 3 Structural Evidence Zones */}
            {/* Zone A: Official Regulations (Rigid Temple-Like Columns) */}
            <div className="w-[30%] h-full rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-teal-300 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  01 · OFFICIAL_ARCHIVE
                </span>
                <p className="text-[11px] text-app-muted leading-tight">QĐ 3116/2025 · FIT Curriculum</p>
              </div>
              <div className="space-y-1.5 py-4">
                <div className="h-1.5 w-full bg-white/10 rounded" />
                <div className="h-1.5 w-4/5 bg-white/10 rounded" />
                <div className="h-1.5 w-3/5 bg-teal-400/30 rounded" />
              </div>
              <span className="text-[9px] font-mono text-app-muted">PROVENANCE: STATUTORY_ROOT</span>
            </div>

            {/* Zone B: Expert Authority (Interconnected Lattice Network) */}
            <div className="w-[34%] h-full rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-blue-300 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  02 · EXPERT_CORRIDOR
                </span>
                <p className="text-[11px] text-app-muted leading-tight">ORCID Verified · Faculty Review</p>
              </div>
              <div className="grid grid-cols-3 gap-2 py-4">
                <div className="h-8 rounded bg-blue-500/10 border border-blue-500/20" />
                <div className="h-8 rounded bg-blue-500/10 border border-blue-500/20" />
                <div className="h-8 rounded bg-blue-500/10 border border-blue-500/20" />
              </div>
              <span className="text-[9px] font-mono text-app-muted">AUTHORITY: SCOPE_BOUNDED</span>
            </div>

            {/* Zone C: Community Signals (Pointillist Collective Cloud) */}
            <div className="w-[30%] h-full rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  03 · COMMUNITY_COMMONS
                </span>
                <p className="text-[11px] text-app-muted leading-tight">Operational Turnaround Friction</p>
              </div>
              <div className="flex flex-wrap gap-1.5 py-4">
                <span className="w-2 h-2 rounded-full bg-amber-400/40" />
                <span className="w-2 h-2 rounded-full bg-amber-400/60" />
                <span className="w-2 h-2 rounded-full bg-amber-400/30" />
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                <span className="w-2 h-2 rounded-full bg-amber-400/20" />
                <span className="w-2 h-2 rounded-full bg-amber-400/50" />
              </div>
              <span className="text-[9px] font-mono text-app-muted">SIGNAL: HEURISTIC_ONLY</span>
            </div>
          </motion.div>


          {/* ========================================================================= */}
          {/* LAYER 2.5: CONNECTION CANVAS (Depth: -170px) */}
          {/* ========================================================================= */}
          <motion.svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ transform: isReduced ? "none" : "translateZ(-170px)" }}
          >
            {["tracing", "aligning", "safe", "suspicious", "dangerous", "unknown"].includes(coreState) && (
              <>
                {/* Filament 1: Claim 1 -> Official Archive */}
                <motion.line
                  x1="30%"
                  y1="45%"
                  x2="20%"
                  y2="50%"
                  stroke={
                    coreState === "dangerous" ? CORE_COLORS.danger :
                    coreState === "suspicious" ? CORE_COLORS.amber :
                    coreState === "unknown" ? CORE_COLORS.unknown :
                    CORE_COLORS.mint
                  }
                  strokeWidth="1.5"
                  strokeDasharray={coreState === "unknown" ? "2 6" : "none"}
                  variants={filamentVariants}
                  initial="hidden"
                  animate="visible"
                />

                {/* Filament 2: Claim 2 -> Expert Corridor */}
                <motion.line
                  x1="50%"
                  y1="55%"
                  x2="50%"
                  y2="50%"
                  stroke={
                    coreState === "dangerous" ? CORE_COLORS.danger :
                    coreState === "suspicious" ? CORE_COLORS.amber :
                    coreState === "unknown" ? CORE_COLORS.unknown :
                    CORE_COLORS.mint
                  }
                  strokeWidth="1.5"
                  strokeDasharray={coreState === "unknown" ? "2 6" : "none"}
                  variants={filamentVariants}
                  initial="hidden"
                  animate="visible"
                />

                {/* Filament 3: Claim 3 -> Community Friction (Dashed Uncertainty) */}
                <motion.line
                  x1="70%"
                  y1="45%"
                  x2="80%"
                  y2="50%"
                  stroke={coreState === "dangerous" ? CORE_COLORS.danger : CORE_COLORS.amber}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  variants={filamentVariants}
                  initial="hidden"
                  animate="visible"
                />
              </>
            )}
          </motion.svg>


          {/* ========================================================================= */}
          {/* LAYER 2: CLAIM PLANE (Depth: -80px) */}
          {/* ========================================================================= */}
          <motion.div
            className="absolute inset-6 rounded-2xl border border-white/10 pointer-events-auto flex items-center justify-around px-8"
            style={{
              transform: isReduced ? "none" : "translateZ(-80px)",
              opacity: ["tracing", "aligning", "safe", "suspicious", "dangerous", "unknown"].includes(coreState) ? 1 : 0
            }}
            transition={{ duration: 0.6 }}
          >
            <BlueprintGridSVG opacity={0.08} variant="claim" />

            {/* Interactive Claim Shards */}
            {["tracing", "aligning", "safe", "suspicious", "dangerous", "unknown"].includes(coreState) && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
                {claims.map((claim) => {
                  const isSelected = selectedClaim === claim.id;
                  const isDimmed = selectedClaim !== null && !isSelected;

                  return (
                    <motion.button
                      key={claim.id}
                      type="button"
                      onClick={() => setSelectedClaim(isSelected ? null : claim.id)}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{
                        scale: isSelected ? 1.05 : 1,
                        opacity: isDimmed ? 0.35 : 1
                      }}
                      transition={{ duration: 0.3 }}
                      className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer max-w-[240px] ${
                        isSelected
                          ? "bg-teal-400/20 border-teal-400 shadow-lg shadow-teal-500/20"
                          : "bg-[#0c0f17]/90 border-white/15 hover:border-teal-400/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono text-teal-300 font-bold">{claim.code}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-app-muted">{claim.zone}</span>
                      </div>
                      <p className="text-xs text-app-primary leading-tight line-clamp-2">{claim.text}</p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>


          {/* ========================================================================= */}
          {/* LAYER 1: INPUT LENS (Depth: 0px — Disappears/Fractures on Scan) */}
          {/* ========================================================================= */}
          <AnimatePresence>
            {(coreState === "idle" || coreState === "scanning") && (
              <motion.div
                className="absolute inset-0 bg-[#07090e]/95 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center p-8 z-30"
                style={{ transform: isReduced ? "none" : "translateZ(0px)" }}
                exit={{
                  opacity: 0,
                  scale: 1.08,
                  filter: isReduced ? "none" : "blur(8px)",
                  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
                }}
              >
                <div className="max-w-md w-full space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-400/10 border border-teal-500/30 text-teal-300 flex items-center justify-center mx-auto mb-2">
                    <Layers size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-app-primary">Deconstruct & Align Knowledge Input</h3>
                  <p className="text-xs text-app-muted leading-relaxed">
                    Đưa văn bản, thông báo hoặc đường dẫn vào lăng kính quang học để giải mã thành các mệnh đề kiểm chứng.
                  </p>

                  <div className="relative pt-2">
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://..."
                      aria-label="Đường dẫn thông báo học vụ để kiểm chứng"
                      className="w-full bg-space-950/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-app-primary font-mono focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* The Optical Scanner Bar */}
                {coreState === "scanning" && (
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_24px_#64FFDA]"
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 1.1, ease: "easeInOut", repeat: 1 }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>

      {/* 3. VERDICT HUD FOOTER STATUS (4 DISTINCT SEMANTIC STATES) */}
      <div className="w-full max-w-4xl mt-3 flex items-center justify-between text-[11px] font-mono text-app-muted px-3">
        <span className="flex items-center gap-1.5">
          {coreState === "safe" && <ShieldCheck size={13} className="text-teal-300" />}
          {coreState === "suspicious" && <AlertTriangle size={13} className="text-amber-300" />}
          {coreState === "dangerous" && <ShieldAlert size={13} className="text-red-400" />}
          {coreState === "unknown" && <HelpCircle size={13} className="text-gray-400" />}
          <span>METAPHOR: OPTICAL_ALIGNMENT_ARRAY</span>
        </span>
        <span className="font-semibold">
          {coreState === "safe" ? "STATUS: ALIGNED_COHERENT_TRUTH" :
           coreState === "suspicious" ? "STATUS: PARTIAL_OFFSET_SUSPICIOUS" :
           coreState === "dangerous" ? "STATUS: STRUCTURAL_INTERFERENCE_JAM" :
           coreState === "unknown" ? "STATUS: INCOMPLETE_GEOMETRY_UNKNOWN" :
           coreState === "aligning" ? "STATUS: MAGNETIC_CONVERGENCE..." :
           coreState === "tracing" ? "STATUS: PROVENANCE_FILAMENTS_ACTIVE" :
           "STATUS: STANDBY_READY"}
        </span>
      </div>
    </div>
  );
}

export default LivingKnowledgeCore;
