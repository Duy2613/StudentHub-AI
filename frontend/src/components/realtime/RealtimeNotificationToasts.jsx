"use client";

import React from "react";
import { useRealtime } from "@/components/providers/RealtimeContext";
import { ShieldCheck, AlertTriangle, X, Radio } from "lucide-react";

export default function RealtimeNotificationToasts() {
  const { notifications, dismissNotification } = useRealtime();

  if (!notifications || notifications.length === 0) return null;

  return (
    <aside aria-label="Thông báo thời gian thực" className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => {
        const isAlert = notif.verdict === "FRAUD_DETECTED" || notif.verdict === "HALLUCINATION_FLAGGED";
        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-right-5 fade-in ${
              isAlert
                ? "bg-rose-950/85 border-rose-500/50 shadow-rose-950/50"
                : "bg-[#0e1118]/90 border-teal-500/40 shadow-black/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isAlert ? "bg-rose-400" : "bg-teal-400"
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isAlert ? "bg-rose-500" : "bg-teal-500"
                  }`} />
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-teal-400" />
                  REALTIME EVENT
                </span>
              </div>

              <button
                onClick={() => dismissNotification(notif.id)}
                className="text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors"
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                isAlert ? "bg-rose-500/20 text-rose-300" : "bg-teal-500/20 text-teal-300"
              }`}>
                {isAlert ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-serif font-bold text-[#f6f3eb] truncate">
                  {notif.title}
                </div>
                <div className="text-xs text-zinc-300 line-clamp-2 mt-0.5 font-light">
                  {notif.message}
                </div>

                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    isAlert ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  }`}>
                    {notif.verdict}
                  </span>
                  {notif.score && (
                    <span className="text-zinc-400">
                      Score: <span className="text-white font-bold">{notif.score}</span>
                    </span>
                  )}
                  {notif.domain && (
                    <span className="text-zinc-500 truncate">• {notif.domain}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
