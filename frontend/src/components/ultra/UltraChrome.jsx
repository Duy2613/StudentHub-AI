"use client";

// frontend/src/components/ultra/UltraChrome.jsx
//
// ULTRA CHROME — Lớp "khung" hiển thị toàn cục bám trên mọi trang:
// 1. UltraScrollRail       — thanh tiến trình cuộn phát sáng ở đỉnh trang
// 2. UltraFilmGrain        — lớp nhiễu điện ảnh SVG (không dùng ảnh, 0 request)
// 3. UltraAmbientAura      — 2 khối sáng gradient chuyển động chậm theo theme
// 4. UltraLauncher         — nút nổi mở Command Palette / Studio / Sitemap
// 5. UltraRouteBeacon      — nhãn ngữ cảnh route hiện tại (góc dưới-trái)
//
// Tất cả đều tôn trọng motion level: mức "still" tắt hoàn toàn animation.

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Command, Palette, Orbit, Zap, Activity } from "lucide-react";
import { useUltra } from "./UltraProvider";
import UltraCursor from "./UltraCursor";
import { findRouteByPath, ULTRA_GROUPS } from "@/lib/ultra/routes";

/* ══════════════════ 1. SCROLL RAIL ══════════════════ */
export function UltraScrollRail() {
    const { scrollProgress, motionId } = useUltra();
    if (motionId === "still") return null;

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[900] h-[3px]"
            aria-hidden="true"
        >
            <div
                className="h-full origin-left transition-transform duration-150 ease-out"
                style={{
                    transform: `scaleX(${scrollProgress})`,
                    background:
                        "linear-gradient(90deg, var(--ux-accent-3), var(--ux-accent), var(--ux-accent-2))",
                    boxShadow: "0 0 16px var(--ux-glow)",
                }}
            />
        </div>
    );
}

/* ══════════════════ 2. FILM GRAIN ══════════════════ */
export function UltraFilmGrain() {
    const { grainEnabled, motionId } = useUltra();
    if (!grainEnabled) return null;

    return (
        <div
            className="pointer-events-none fixed inset-0 z-[850] mix-blend-soft-light"
            style={{
                opacity: motionId === "still" ? 0.05 : 0.09,
                animation: motionId === "still" ? "none" : "ux-grain-shift 0.9s steps(3) infinite",
            }}
            aria-hidden="true"
        >
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <filter id="ux-grain-filter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.82"
                        numOctaves="4"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#ux-grain-filter)" />
            </svg>
        </div>
    );
}

/* ══════════════════ 3. AMBIENT AURA ══════════════════ */
export function UltraAmbientAura() {
    const { motionId, motion: level } = useUltra();
    if (motionId === "still") return null;

    const dur = motionId === "performance" ? 40 : 24;

    return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
            <motion.div
                className="absolute -left-[18%] top-[-12%] h-[62vh] w-[62vh] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, var(--ux-glow) 0%, transparent 68%)",
                    filter: `blur(${Math.max(30, level.blur * 3)}px)`,
                }}
                animate={{ x: [0, 90, -40, 0], y: [0, 60, 110, 0], scale: [1, 1.18, 0.94, 1] }}
                transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -right-[16%] bottom-[-14%] h-[56vh] w-[56vh] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, color-mix(in srgb, var(--ux-accent-3) 32%, transparent) 0%, transparent 70%)",
                    filter: `blur(${Math.max(34, level.blur * 3.4)}px)`,
                }}
                animate={{ x: [0, -80, 50, 0], y: [0, -70, -30, 0], scale: [1, 0.9, 1.15, 1] }}
                transition={{ duration: dur * 1.25, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
}

/* ══════════════════ 4. LAUNCHER ══════════════════ */
export function UltraLauncher() {
    const {
        setPaletteOpen,
        setStudioOpen,
        setSitemapOpen,
        fps,
        motionId,
        theme,
    } = useUltra();
    const [expanded, setExpanded] = useState(false);

    const fpsTone = fps >= 50 ? "#10b981" : fps >= 32 ? "#f59e0b" : "#f43f5e";

    const actions = [
        {
            id: "palette",
            icon: Command,
            label: "Command Palette",
            hint: "Ctrl/⌘ K",
            run: () => setPaletteOpen(true),
        },
        {
            id: "studio",
            icon: Palette,
            label: "Theme Studio",
            hint: "Ctrl/⌘ /",
            run: () => setStudioOpen(true),
        },
        {
            id: "sitemap",
            icon: Orbit,
            label: "Sitemap Orbit 3D",
            hint: "⇧?",
            run: () => setSitemapOpen(true),
        },
    ];

    return (
        <aside
            className="fixed right-4 top-1/2 z-[880] -translate-y-1/2"
            aria-label="Điều khiển Ultra"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <div
                className="flex flex-col items-end gap-2 rounded-full border p-2 shadow-[0_16px_50px_rgba(0,0,0,0.7)]"
                style={{
                    borderColor: "var(--ux-border)",
                    background: "color-mix(in srgb, var(--ux-bg-1) 92%, transparent)",
                    backdropFilter: "blur(18px)",
                }}
            >
                {actions.map((a) => {
                    const IconCmp = a.icon;
                    return (
                        <div key={a.id} className="relative flex items-center justify-end">
                            <AnimatePresence>
                                {expanded && (
                                    <motion.span
                                        initial={{ opacity: 0, x: 12, scale: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 10, scale: 0.92 }}
                                        transition={{ type: "spring", stiffness: 480, damping: 34 }}
                                        className="pointer-events-none absolute right-full mr-2 flex items-center gap-2 whitespace-nowrap rounded-xl border px-2.5 py-1.5"
                                        style={{
                                            borderColor: "var(--ux-border)",
                                            background: "var(--ux-bg-2)",
                                        }}
                                    >
                                        <span className="text-[11px] font-bold text-white">{a.label}</span>
                                        <kbd
                                            className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-black"
                                            style={{
                                                borderColor: "var(--ux-border)",
                                                color: "var(--ux-accent-2)",
                                                background: "var(--ux-bg-1)",
                                            }}
                                        >
                                            {a.hint}
                                        </kbd>
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            <button
                                type="button"
                                onClick={a.run}
                                aria-label={a.label}
                                className="flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:scale-110 active:scale-95"
                                style={{
                                    borderColor: "var(--ux-border)",
                                    background: "var(--ux-bg-2)",
                                    color: "var(--ux-accent)",
                                }}
                            >
                                <IconCmp className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}

                {/* FPS / theme micro readout */}
                <div
                    className="mt-0.5 flex h-10 w-10 flex-col items-center justify-center rounded-full border"
                    style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                    title={`${fps} FPS · ${theme.name} · ${motionId}`}
                >
                    <Activity className="h-3 w-3" style={{ color: fpsTone }} />
                    <span
                        className="font-mono text-[9px] font-black leading-none"
                        style={{ color: fpsTone }}
                    >
                        {fps}
                    </span>
                </div>
            </div>
        </aside>
    );
}

/* ══════════════════ 5. ROUTE BEACON ══════════════════ */
export function UltraRouteBeacon() {
    const pathname = usePathname();
    const route = findRouteByPath(pathname);
    const group = route ? ULTRA_GROUPS[route.group] : null;

    return (
        <aside aria-label="Ngữ cảnh trang hiện tại">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-none fixed bottom-4 left-4 z-[870] hidden max-w-[300px] items-center gap-2.5 rounded-2xl border px-3 py-2 md:flex"
                    style={{
                        borderColor: "var(--ux-border)",
                        background: "color-mix(in srgb, var(--ux-bg-1) 88%, transparent)",
                        backdropFilter: "blur(14px)",
                    }}
                >
                    <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                            background: group?.color || "var(--ux-accent)",
                            boxShadow: `0 0 12px ${group?.color || "var(--ux-accent)"}`,
                            animation: "ux-pulse 2.2s ease-in-out infinite",
                        }}
                    />
                    <span className="min-w-0">
                        <span
                            className="block font-mono text-[9px] font-black uppercase tracking-[0.18em]"
                            style={{ color: group?.color || "var(--ux-accent)" }}
                        >
                            {group?.label || "STUDENTHUB AI"}
                        </span>
                        <span className="block truncate text-[11.5px] font-bold text-white/85">
                            {route?.title || pathname}
                        </span>
                    </span>
                    <Zap className="h-3.5 w-3.5 shrink-0 text-white/25" />
                </motion.div>
            </AnimatePresence>
        </aside>
    );
}

/* ══════════════════ AGGREGATE ══════════════════ */
export default function UltraChrome() {
    return (
        <>
            <UltraScrollRail />
            <UltraAmbientAura />
            <UltraFilmGrain />
            <UltraCursor />
            <UltraLauncher />
            <UltraRouteBeacon />
        </>
    );
}
