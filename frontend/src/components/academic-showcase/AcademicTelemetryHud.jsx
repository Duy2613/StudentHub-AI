"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Cpu, Database, Compass, Radio } from "lucide-react";
import { useRealtime } from "@/components/providers/RealtimeContext";

export default function AcademicTelemetryHud() {
  const [timeStr, setTimeStr] = useState("--:--:--");
  const { connectionStatus, latency, activeLearners, metrics } = useRealtime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("vi-VN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const telemetryMetrics = [
    {
      icon: ShieldCheck,
      label: "AI TRUST ENGINE",
      value: "REALITY-FIRST V2",
      status: connectionStatus,
      color: "text-teal-400",
    },
    {
      icon: Database,
      label: "OFFICIAL SOURCES",
      value: metrics?.sourcesSynced == null ? "NOT MEASURED" : `${metrics.sourcesSynced} SOURCES [SYNCED]`,
      status: metrics?.sourcesSynced == null ? "NO SAMPLE" : "LIVE",
      color: "text-cyan-400",
    },
    {
      icon: Cpu,
      label: "OOD ABSTENTION",
      value: metrics?.oodDetectionRate == null ? "NOT MEASURED" : `${metrics.oodDetectionRate}% ACCURACY`,
      status: metrics?.oodDetectionRate == null ? "NO SAMPLE" : "ACTIVE",
      color: "text-emerald-400",
    },
    {
      icon: Activity,
      label: "TEVV BENCHMARK",
      value: metrics?.f1Score == null ? "NOT MEASURED" : `F1 = ${metrics.f1Score}`,
      status: metrics?.f1Score == null ? "NO SAMPLE" : "REPORTED",
      color: "text-indigo-400",
    },
    {
      icon: Compass,
      label: "ACADEMIC CLOCK",
      value: `UTC+7 ${timeStr}`,
      status: latency == null ? "NO SAMPLE" : `${latency}ms`,
      color: "text-amber-400",
    },
    {
      icon: Radio,
      label: "STUDENT DIGITAL TWIN",
      value: activeLearners == null ? "NOT MEASURED" : `${activeLearners.toLocaleString()} ACTIVE RUNTIMES`,
      status: activeLearners == null ? "NO SAMPLE" : "SSE LIVE",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="w-full border-b border-white/10 bg-[#070a14]/90 py-2.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6 scrollbar-none">
        {/* HUD Scanner Tag */}
        <div className="flex shrink-0 items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1 border border-white/10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-80"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-teal-300">
            TELEMETRY HUD
          </span>
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="flex items-center gap-6 overflow-x-auto text-[11px] font-mono whitespace-nowrap">
          {telemetryMetrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2 text-gray-300">
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                <span className="text-gray-500 font-semibold">{item.label}:</span>
                <span className="text-white font-medium">{item.value}</span>
                <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] text-gray-400">
                  [{item.status}]
                </span>
                {idx < telemetryMetrics.length - 1 && (
                  <span className="text-gray-700 ml-2">/</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Pulse Indicator */}
        <div className="hidden xl:flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-teal-400">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span>{connectionStatus === "CONNECTED" ? "SYSTEM CONNECTED" : `SYSTEM ${connectionStatus}`}</span>
        </div>
      </div>
    </div>
  );
}
