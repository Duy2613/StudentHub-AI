"use client";

import React from "react";
import dynamic from "next/dynamic";
import V3_MEDIA from "@/lib/media/v3MediaRegistry";
import { Compass, Network, Sparkles, BookOpen } from "lucide-react";
import CinematicPillarTrackers from "./CinematicPillarTrackers";

const KnowledgeAtlas3D = dynamic(
  () => import("@/components/spatial/KnowledgeAtlas3D"),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden border border-white/10 bg-space-950/80 backdrop-blur-xl flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={V3_MEDIA.landing.atlas}
          alt="Knowledge Atlas Preview"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
            LIVING KNOWLEDGE ATLAS // REALTIME TOPOLOGY
          </span>
        </div>
      </div>
    ),
  }
);

export default function KnowledgeAtlasSection() {
  return (
    <section className="relative w-full py-28 px-6 lg:px-12 bg-space-950 border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-4">
              <Compass size={14} />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase">
                CHƯƠNG 05 // KHÔNG GIAN TRI THỨC HỌC ĐƯỜNG
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Mạng lưới tri thức sống động,{" "}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300">
                kết nối từng quyết định.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-slate-300 font-serif text-base sm:text-lg leading-relaxed">
              Không phải bảng dữ liệu khô cứng. Tri thức học vụ tại StudentHub là một trường không gian liên kết: quy chế viện trường, học bổng, và kinh nghiệm đối soát của hàng ngàn sinh viên.
            </p>
          </div>
        </div>

        {/* 3D Interactive Topology Display */}
        <div className="w-full h-[520px] mb-12 shadow-2xl">
          <KnowledgeAtlas3D />
        </div>

        {/* 3 Interactive Cinematic Trackers */}
        <div className="mt-12">
          <CinematicPillarTrackers />
        </div>
      </div>
    </section>
  );
}
