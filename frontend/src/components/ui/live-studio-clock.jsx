"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

/**
 * LiveStudioClock: Inspired by the Lumora Studio live local clock chip.
 * Displays local time (H:MM am/pm) with live ticking seconds/minutes and localized date.
 */
export default function LiveStudioClock({ className = "" }) {
  const [timeStr, setTimeStr] = useState("9:41am");
  const [dateStr, setDateStr] = useState("12 March, 2026");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const meridiem = hours >= 12 ? "pm" : "am";
      hours = hours % 12 || 12;
      setTimeStr(`${hours}:${minutes}${meridiem}`);

      const months = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
      ];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md text-xs text-slate-300 ${className}`}
      title="Thời gian thực hệ thống"
    >
      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      <span className="font-mono font-bold text-white tabular-nums">{timeStr}</span>
      <span className="text-white/20">•</span>
      <span className="text-slate-400 font-medium hidden sm:inline">{dateStr}</span>
    </div>
  );
}
