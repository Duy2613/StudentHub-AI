"use client";

// app/whiteboard/page.jsx
// Interactive Whiteboard: Bảng vẽ kỹ thuật số toàn màn hình

import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Bot,
  FileText,
  Share2,
  Sliders,
  Maximize2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

// Dynamic import Tldraw without SSR
const WhiteboardCanvas = dynamic(
  () => import("@/components/whiteboard/WhiteboardCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-space-950 text-gray-300">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-semibold text-gray-400">Đang khởi tạo không gian Whiteboard...</p>
      </div>
    ),
  }
);

export default function WhiteboardPage() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <div className="h-screen w-screen bg-space-950 text-white flex flex-col overflow-hidden select-none">
      
      {/* Top Floating Mini Header */}
      <header className="h-14 border-b border-white/10 bg-space-900/90 backdrop-blur-xl px-4 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Bảng điều khiển
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Sliders className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                Digital Whiteboard <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">TLDRAW PRO</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Quick Nav Switches */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/ai-mentor")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" /> AI Mentor
          </button>

          <button
            onClick={() => router.push("/workspace")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" /> Workspace
          </button>

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert("Đã sao chép liên kết bảng vẽ Whiteboard!");
              }
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Chia sẻ Whiteboard"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#121212]">
        <WhiteboardCanvas />
      </div>

    </div>
  );
}
