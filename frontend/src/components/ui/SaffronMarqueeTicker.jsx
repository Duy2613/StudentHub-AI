"use client";

// frontend/src/components/ui/SaffronMarqueeTicker.jsx
//
// Saffron Finance x uAvionix Luxury Marquee Ticker
// - Smooth infinite marquee with live telemetry tags
// - Dark Cocoa & Saffron Gold styling with razor-sharp 1px border dividers

import React from "react";
import { ShieldCheck, Zap, Radio, Sparkles, Lock, Star } from "lucide-react";

const TICKER_ITEMS = [
  { id: "01", icon: ShieldCheck, text: "AIRSPACE_NODES: 14,280 ACTIVE", color: "text-[#ffbc09]" },
  { id: "02", icon: Zap, text: "AI_SCAM_INTERCEPT: 99.8% ACCURACY", color: "text-[#38bdf8]" },
  { id: "03", icon: Radio, text: "ACADEMIC_SSO: .EDU +30 PTS BONUS", color: "text-[#10b981]" },
  { id: "04", icon: Lock, text: "ENCRYPTION: AES-256 SQUAWK 7700", color: "text-[#ca56ed]" },
  { id: "05", icon: Star, text: "REPUTATION: 0-100 COMMUNITY VERIFIED", color: "text-[#ffd15c]" },
  { id: "06", icon: Sparkles, text: "DIGITAL_GUARDIAN: 24/7 ACTIVE", color: "text-[#ffbc09]" },
];

export default function SaffronMarqueeTicker({ className = "" }) {
  return (
    <div className={`w-full overflow-hidden border-y border-[#47140b] bg-[#150604]/90 backdrop-blur-xl py-2.5 font-mono select-none ${className}`}>
      <div className="flex w-max animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused]">
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-6 border-r border-[#47140b]/70 text-[11px] font-bold tracking-wider uppercase text-[#ece7e0]/80 whitespace-nowrap"
            >
              <span className="text-[#ece7e0]/40">[ {item.id} ]</span>
              <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
              <span className={item.color}>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
