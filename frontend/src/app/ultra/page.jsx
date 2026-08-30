"use client";

// frontend/src/app/ultra/page.jsx
//
// ULTRA EXPERIENCE LAB — Trang showcase tổng hợp toàn bộ tầng nâng cấp:
//   Chương 01 — HERO: sân khấu WebGL 6 lớp
//   Chương 02 — THƯ VIỆN HIỆU ỨNG: 13 demo tương tác
//   Chương 03 — BẢN ĐỒ CHỨC NĂNG: 31 trang phân theo 7 nhóm
//   Chương 04 — THEME LIVE PREVIEW: đổi 6 bảng màu tức thì
//   Chương 05 — KIỂM SOÁT HIỆU NĂNG: FPS, mức motion, cheat sheet phím

import React from "react";
import ModernNavbar from "@/components/layout/ModernNavbar";
import UltraHeroSection from "@/components/ultra/sections/UltraHeroSection";
import UltraEffectsGallery from "@/components/ultra/sections/UltraEffectsGallery";
import UltraFeatureAtlas from "@/components/ultra/sections/UltraFeatureAtlas";
import UltraThemeShowcase from "@/components/ultra/sections/UltraThemeShowcase";
import UltraPerformanceLab from "@/components/ultra/sections/UltraPerformanceLab";
import UltraChapterNav from "@/components/ultra/sections/UltraChapterNav";
import { UltraProvider } from "@/components/ultra/UltraProvider";
import UltraChrome from "@/components/ultra/UltraChrome";
import UltraCommandPalette from "@/components/ultra/UltraCommandPalette";
import UltraThemeStudio from "@/components/ultra/UltraThemeStudio";
import UltraSitemapOrbit from "@/components/ultra/UltraSitemapOrbit";
import UltraToastHub from "@/components/ultra/UltraToastHub";
import UltraKeyboardRouter from "@/components/ultra/UltraKeyboardRouter";

export default function UltraLabPage() {
    return (
        <UltraProvider>
            <div
                className="relative min-h-screen font-human ux-scrollbar"
                style={{ background: "var(--ux-bg-0)", color: "var(--ux-text)" }}
            >
                <UltraChrome />
                <UltraKeyboardRouter />
                <header className="overlay-nav-layer">
                    <ModernNavbar />
                </header>

                <UltraChapterNav />

                <main className="relative" id="main-content">
                    <UltraHeroSection />
                    <UltraEffectsGallery />
                    <UltraFeatureAtlas />
                    <UltraThemeShowcase />
                    <UltraPerformanceLab />
                </main>

                <footer
                    className="relative border-t py-10"
                    style={{ borderColor: "var(--ux-border)" }}
                >
                    <div className="layout-safe-container flex flex-col items-center gap-2 text-center">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em]"
                        style={{ color: "var(--ux-accent)" }}>
                        STUDENTHUB AI · ULTRA EXPERIENCE LAYER
                    </p>
                    <p className="text-[12px] text-white/65">
                        Nhấn <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">⌘K</kbd>{" "}
                        để mở Command Palette ·{" "}
                        <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">⌘/</kbd>{" "}
                        Theme Studio ·{" "}
                        <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">⇧?</kbd>{" "}
                        Sitemap 3D
                    </p>
                    </div>
                </footer>
                <UltraCommandPalette />
                <UltraThemeStudio />
                <UltraSitemapOrbit />
                <UltraToastHub />
            </div>
        </UltraProvider>
    );
}
