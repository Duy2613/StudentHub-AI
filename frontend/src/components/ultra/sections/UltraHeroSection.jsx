"use client";

// frontend/src/components/ultra/sections/UltraHeroSection.jsx
//
// Chương 01 — HERO: sân khấu WebGL 6 lớp + tiêu đề tách ký tự + HUD telemetry sống.

import React from "react";
import Link from "next/link";
import { ArrowRight, Command, Sparkles, Cpu, Layers, Activity } from "lucide-react";
import UltraHeroScene from "../UltraHeroScene";
import { UltraReveal, UltraSplitText, UltraCounter, UltraScramble } from "../UltraMotionKit";
import { useUltra } from "../UltraProvider";
import { ULTRA_ROUTES } from "@/lib/ultra/routes";

const STATS = [
    { label: "Lớp phân tích AI", value: 4, suffix: "", icon: Layers },
    { label: "Route trong atlas", value: ULTRA_ROUTES.length, suffix: "", icon: Cpu },
    { label: "Demo tương tác", value: 12, suffix: "", icon: Sparkles },
    { label: "Điểm tin cậy tối đa", value: 100, suffix: "", icon: Activity },
];

export default function UltraHeroSection() {
    const { setPaletteOpen, fps, theme, motion: level } = useUltra();

    return (
        <section
            id="ultra-hero"
            className="relative flex min-h-[100svh] items-center overflow-hidden"
        >
            {/* Sân khấu WebGL */}
            <div className="absolute inset-0 z-0">
                <UltraHeroScene height="100%" />
            </div>

            {/* Lưới nền */}
            <div className="ux-grid-bg pointer-events-none absolute inset-0 z-[1] opacity-60" />

            {/* Vignette */}
            <div
                className="pointer-events-none absolute inset-0 z-[2]"
                style={{
                    background:
                        "radial-gradient(ellipse 78% 68% at 50% 50%, transparent 32%, var(--ux-bg-0) 96%)",
                }}
            />

            <div className="layout-safe-container relative z-10 py-24">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Eyebrow */}
                    <UltraReveal delay={0.05}>
                        <span
                            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                            style={{
                                borderColor: "color-mix(in srgb, var(--ux-accent) 45%, transparent)",
                                background: "var(--ux-glow-soft)",
                                color: "var(--ux-accent)",
                            }}
                        >
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                    background: "var(--ux-accent)",
                                    animation: "ux-pulse 1.8s ease-in-out infinite",
                                }}
                            />
                            ULTRA EXPERIENCE LAB · V1
                        </span>
                    </UltraReveal>

                    {/* Tiêu đề */}
                    <h1 className="mt-6 text-[2.6rem] font-black leading-[1.02] tracking-tighter text-white sm:text-6xl lg:text-7xl">
                        <UltraSplitText text="Trải nghiệm" className="block" />
                        <span className="ux-text-accent mt-1 block">
                            <UltraSplitText text="đẳng cấp tối đa" />
                        </span>
                    </h1>

                    {/* Mô tả */}
                    <UltraReveal delay={0.35}>
                        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-base">
                            Toàn bộ hệ thống StudentHub AI được nâng cấp với{" "}
                            <strong className="text-white">sân khấu WebGL 6 lớp</strong>,{" "}
                            <strong className="text-white">6 bảng màu điện ảnh</strong> đổi tức thì,{" "}
                            <strong className="text-white">Command Palette ⌘K</strong>, con trỏ magnetic,
                            và <strong className="text-white">12 demo motion tương tác</strong> tự thích ứng
                            hiệu năng máy bạn.
                        </p>
                    </UltraReveal>

                    {/* CTA */}
                    <UltraReveal delay={0.5}>
                        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setPaletteOpen(true)}
                                className="ux-btn ux-btn-primary ux-sheen"
                                data-ux-cursor="MỞ PALETTE"
                            >
                                <Command className="h-4 w-4" />
                                Mở Command Palette
                                <kbd className="ml-1 rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px] font-black">
                                    ⌘K
                                </kbd>
                            </button>

                            <Link href="#ultra-effects" className="ux-btn" data-ux-cursor="XEM HIỆU ỨNG">
                                <Sparkles className="h-4 w-4" style={{ color: "var(--ux-accent)" }} />
                                Khám phá motion lab
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </UltraReveal>

                    {/* Telemetry HUD */}
                    <UltraReveal delay={0.66}>
                        <div
                            className="ux-scan mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl border sm:grid-cols-4"
                            style={{ borderColor: "var(--ux-border)", background: "var(--ux-border)" }}
                        >
                            {STATS.map((s) => {
                                const IconCmp = s.icon;
                                return (
                                    <div
                                        key={s.label}
                                        className="flex flex-col items-center gap-1.5 px-4 py-5"
                                        style={{ background: "color-mix(in srgb, var(--ux-bg-1) 92%, transparent)" }}
                                    >
                                        <IconCmp
                                            className="h-3.5 w-3.5"
                                            style={{ color: "var(--ux-accent)" }}
                                        />
                                        <span className="font-mono text-2xl font-black leading-none text-white">
                                            <UltraCounter value={s.value} suffix={s.suffix} />
                                        </span>
                                        <span className="text-center font-mono text-[9px] font-bold uppercase leading-tight tracking-wider text-white/40">
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </UltraReveal>

                    {/* Live readout */}
                    <UltraReveal delay={0.78}>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 font-mono text-[10px] uppercase tracking-wider text-white/35">
                            <span>
                                THEME: <span style={{ color: "var(--ux-accent)" }}>{theme.name}</span>
                            </span>
                            <span>
                                MOTION: <span style={{ color: "var(--ux-accent)" }}>{level.name}</span>
                            </span>
                            <span>
                                FPS:{" "}
                                <span
                                    style={{
                                        color: fps >= 50 ? "#10b981" : fps >= 32 ? "#f59e0b" : "#f43f5e",
                                    }}
                                >
                                    {fps}
                                </span>
                            </span>
                            <span className="hidden sm:inline">
                                <UltraScramble text="RENDER PIPELINE ONLINE" />
                            </span>
                        </div>
                    </UltraReveal>
                </div>
            </div>

            {/* Chỉ dẫn cuộn */}
            <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
                <div
                    className="flex flex-col items-center gap-1.5"
                    style={{ animation: "ux-float-y 2.6s ease-in-out infinite" }}
                >
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">
                        CUỘN ĐỂ KHÁM PHÁ
                    </span>
                    <span
                        className="h-8 w-[1px]"
                        style={{
                            background:
                                "linear-gradient(180deg, var(--ux-accent), transparent)",
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
