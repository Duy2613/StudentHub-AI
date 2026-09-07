"use client";

import React from "react";
import Link from "next/link";
import { useBackground, ACADEMIC_CINEMA_FILMS } from "@/components/providers/BackgroundContext";
import { Film, ArrowUpRight, Radio, Sparkles, CheckCircle2 } from "lucide-react";

export default function AcademicFeatureBackgroundMatrix() {
  const { activeFilm, setActiveFilm } = useBackground();

  return (
    <section className="relative w-full py-20 px-4 md:px-8 border-t border-white/10 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-mono tracking-widest text-teal-300 mb-4">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>8 CORE DASHBOARDS × 8 REALTIME LOOPING BACKGROUNDS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif tracking-tight text-[#f6f3eb]">
              Hệ Thống Video Nền Realtime Theo Từng Feature
            </h2>
            <p className="text-sm md:text-base text-zinc-400 mt-2 max-w-2xl font-light">
              Mỗi trang dashboard và phân hệ học thuật của StudentHub AI đều được gắn một video điện ảnh 8 giây lặp vô tận tương ứng với bản chất học thuật và thẩm mỹ của trang đó.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono text-zinc-300 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NỀN ĐANG CHẠY:</span>
            <span className="text-amber-300 font-bold">{activeFilm.num} {activeFilm.title}</span>
          </div>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACADEMIC_CINEMA_FILMS.map((film) => {
            const isCurrentlyActive = activeFilm.id === film.id;
            const primaryRoute = film.targetRoutes[0] || "/";

            return (
              <div
                key={film.id}
                className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl group ${
                  isCurrentlyActive
                    ? "bg-[#0e1118]/90 border-amber-400/80 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/30"
                    : "bg-[#080a0f]/80 border-white/10 hover:border-white/25 hover:bg-[#0e1118]/85"
                }`}
              >
                {/* Card Top: Film ID & Active Status */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isCurrentlyActive
                          ? "bg-amber-400 text-black font-extrabold"
                          : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      FILM {film.num} • 8.00s LOOP
                    </span>

                    {isCurrentlyActive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTIVE BG
                      </span>
                    )}
                  </div>

                  {/* Feature Title */}
                  <h3 className="text-base font-serif text-[#f6f3eb] group-hover:text-amber-200 transition-colors font-semibold mb-1">
                    {film.assignedFeature}
                  </h3>

                  {/* Film Name */}
                  <div className="text-xs font-mono text-teal-400 mb-3 flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    <span>{film.title}</span>
                  </div>

                  {/* Aesthetic Rationale */}
                  <p className="text-xs text-zinc-400 leading-relaxed font-light mb-4 line-clamp-3">
                    {film.mood}
                  </p>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveFilm(film)}
                    className={`text-[11px] font-mono py-1.5 px-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                      isCurrentlyActive
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
                    }`}
                    title="Kích hoạt video nền này cho toàn trang ngay lập tức"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isCurrentlyActive ? "Đang phát nền" : "Xem Nền Này"}</span>
                  </button>

                  <Link
                    href={primaryRoute}
                    className="text-[11px] font-mono py-1.5 px-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center gap-1 transition-all group/link font-semibold"
                    title={`Chuyển đến trang ${primaryRoute} để xem video nền hoạt động`}
                  >
                    <span>Vào trang</span>
                    <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
