"use client";

import React, { useState } from "react";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { Terminal, Radio, ChevronUp, ChevronDown, Activity, Users, X } from "lucide-react";

export default function RealtimeLiveConsole() {
  const {
    connectionStatus,
    latency,
    activeLearners,
    recentEvents,
    presence,
  } = useRealtime();

  const [isOpen, setIsOpen] = useState(false);
  const [filterChannel, setFilterChannel] = useState("all");

  const filteredEvents = recentEvents.filter((ev) => {
    if (filterChannel === "all") return true;
    return ev.channel === filterChannel;
  });

  return (
    <aside aria-label="Console truyền dẫn thời gian thực" className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2 pointer-events-auto">
      {/* Expanded Live Streaming Console Tray */}
      {isOpen && (
        <div className="w-[360px] sm:w-[460px] max-h-[460px] rounded-2xl bg-[#080a0f]/95 border border-white/15 shadow-2xl shadow-black/90 backdrop-blur-xl text-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <span className="font-mono text-xs font-bold tracking-wider text-[#f6f3eb]">
                REALTIME TELEMETRY STREAM
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono text-teal-300">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>{connectionStatus}</span>
                <span>•</span>
                <span>{latency == null ? "—" : `${latency}ms`}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10"
                title="Đóng console"
                aria-label="Đóng console"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metrics Quick Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-white/[0.02] border-b border-white/5 text-center text-xs font-mono">
            <div>
              <div className="text-[10px] text-zinc-400">ACTIVE LEARNERS</div>
              <div className="text-sm font-bold text-teal-300 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                <span>{activeLearners == null ? "—" : activeLearners.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">LATENCY JITTER</div>
              <div className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{latency == null ? "—" : `${latency} ms`}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">LIVE PODS</div>
              <div className="text-sm font-bold text-sky-300 flex items-center justify-center gap-1">
                <Radio className="w-3 h-3" />
                <span>{presence.studyPods == null ? "—" : `${presence.studyPods.length} Pods`}</span>
              </div>
            </div>
          </div>

          {/* Filter Channel Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 bg-black/20 text-[11px] font-mono">
            {["all", "audit", "telemetry", "presence"].map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className={`px-2.5 py-0.5 rounded-lg uppercase transition-all ${
                  filterChannel === ch
                    ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Live Log Stream Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-[11px] max-h-56 select-text">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                Đang lắng nghe luồng SSE từ máy chủ...
              </div>
            ) : (
              filteredEvents.map((ev, i) => {
                const data = ev.data || ev;
                return (
                  <div
                    key={ev.id || i}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span className="text-teal-400 font-bold uppercase">
                        [{ev.channel || "SYSTEM"}] {ev.eventType}
                      </span>
                      <span>
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString("vi-VN") : "00:00:00"}
                      </span>
                    </div>
                    <div className="text-zinc-200 text-xs line-clamp-2">
                      {data.claim || data.message || data.metrics ? `Active: ${data.metrics?.activeLearners ?? "—"}, Latency: ${data.metrics?.avgLatencyMs ?? "—"}ms` : JSON.stringify(data).slice(0, 80)}
                    </div>
                    {data.verdict && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300">
                        <span>Verdict:</span>
                        <span className="font-bold">{data.verdict}</span>
                        {data.score && <span>(Score: {data.score})</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-white/10 bg-black/40 text-[10px] font-mono text-zinc-500">
            Chỉ hiển thị event đã được server commit; console không phát dữ liệu mô phỏng.
          </div>
        </div>
      )}

      {/* Floating Collapsed Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0e1118]/90 hover:bg-[#0e1118] border border-teal-500/30 text-white text-xs font-mono shadow-2xl shadow-black/80 backdrop-blur-md transition-all hover:scale-105"
        title="Bật/Tắt Realtime Live Console"
      >
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
        </div>
        <span className="font-bold text-teal-300">LIVE REALTIME</span>
        <span className="text-zinc-400 hidden sm:inline">• {latency == null ? "—" : `${latency}ms`}</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
      </button>
    </aside>
  );
}
