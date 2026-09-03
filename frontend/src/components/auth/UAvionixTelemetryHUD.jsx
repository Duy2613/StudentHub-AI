"use client";

// frontend/src/components/auth/UAvionixTelemetryHUD.jsx
//
// Aerospace Avionics Telemetry HUD & Threat Intercept Stream (Inspired by uAvionix - usavionix.com)
// - Live cycling security stream for Vietnam Student Academic Airspace
// - SQUAWK 7700 Encryption Cipher, 4-Layer Anti-Scam Threat Radar, Latency Monitor
// - Sound feedback toggle button integrated with saffronAudio engine

import React, { useState, useEffect } from "react";
import { Radio, Volume2, VolumeX, Activity } from "lucide-react";
import { saffronAudio } from "@/lib/audio/saffronAudio";
import LiveStudioClock from "@/components/ui/live-studio-clock";

const TELEMETRY_STREAM = [
  { label: "BOOT_SEQUENCE", value: "DIGITAL GUARDIAN v3.4 [ONLINE]", status: "safe" },
  { label: "SCAM_INTERCEPT", value: "4-LAYER NEURAL RADAR [ACTIVE]", status: "safe" },
  { label: "TRANSPONDER", value: "SQUAWK 7700 [AES-256 SECURED]", status: "gold" },
  { label: "ACADEMIC_AIRSPACE", value: "VN_STUDENT_MESH [14,280 NODES]", status: "cyan" },
  { label: "COORD_LOCK", value: "HN: 21.0285°N / HCM: 106.6297°E", status: "mono" },
  { label: "THREAT_STATUS", value: "0 BREACHES // 100% SHIELDED", status: "safe" },
];

export default function UAvionixTelemetryHUD({ className = "" }) {
  const [streamIndex, setStreamIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [ping, setPing] = useState(18);

  useEffect(() => {
    setIsMuted(saffronAudio.getMutedState());

    // Cycle through telemetry stream items
    const interval = setInterval(() => {
      setStreamIndex((prev) => (prev + 1) % TELEMETRY_STREAM.length);
    }, 3200);

    // Minor ping variation for realism
    const pingInterval = setInterval(() => {
      setPing(Math.floor(Math.random() * 8) + 16);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearInterval(pingInterval);
    };
  }, []);

  const handleToggleAudio = () => {
    const muted = saffronAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      saffronAudio.playClick(900);
    }
  };

  const currentStream = TELEMETRY_STREAM[streamIndex];

  return (
    <div className={`w-full font-mono text-[11px] select-none ${className}`}>
      {/* Top Aerospace Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 sm:px-6 bg-[#150604]/80 backdrop-blur-xl border-y border-[#47140b]/70 text-[#ece7e0]/80">
        
        {/* Left: Active Transponder & Threat Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2f0e09] border border-[#ffbc09]/30 text-[#ffbc09] text-[10px] font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffbc09] animate-pulse" />
            <span>SQUAWK // 7700</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <Radio className="w-3.5 h-3.5 text-[#38bdf8] animate-spin" style={{ animationDuration: "12s" }} />
            <span className="text-[#ece7e0]/60">RADAR:</span>
            <span className="text-[#38bdf8] font-semibold transition-all duration-300">
              {currentStream.label} ➔ {currentStream.value}
            </span>
          </div>
        </div>

        {/* Right: Live Clock, Ping Telemetry & Sound Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-[#47140b] text-[10px] text-[#ece7e0]/70">
            <Activity className="w-3 h-3 text-[#10b981]" />
            <span>PING: {ping}ms</span>
          </div>

          <LiveStudioClock className="text-[10px]" />

          {/* Sound Synthesizer Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isMuted ? "Bật âm thanh tương tác Web Audio" : "Tắt âm thanh tương tác"}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#210a07] hover:bg-[#2f0e09] border border-[#ffbc09]/30 hover:border-[#ffbc09]/60 text-[#ffbc09] transition-all hover:scale-105 active:scale-95 cursor-pointer text-[10px]"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">AUDIO OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#ffbc09]" />
                <span className="text-[#ffbc09] font-bold">AUDIO ON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
