"use client";

// frontend/src/components/ultra/sections/UltraPerformanceLab.jsx
//
// Chương 05 — PHÒNG THÍ NGHIỆM HIỆU NĂNG:
// - Đồ thị FPS thời gian thực (sparkline SVG tự vẽ, 60 mẫu trượt)
// - 4 mức motion với mô tả tác động cụ thể lên số hạt / WebGL / blur
// - Bảng khả năng thiết bị (WebGL, số nhân CPU, RAM, devicePixelRatio, reduced-motion)
// - Cheat sheet phím tắt đầy đủ
// - Công tắc accessibility

import React, { useEffect, useState } from "react";
import {
    Activity,
    Gauge,
    Cpu,
    MonitorSmartphone,
    Keyboard,
    Accessibility,
    Film,
    MousePointer2,
    Volume2,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { UltraReveal, UltraCounter } from "../UltraMotionKit";
import UltraMagneticCard from "../UltraMagneticCard";
import { useUltra } from "../UltraProvider";
import { ULTRA_SHORTCUTS, ULTRA_ROUTES } from "@/lib/ultra/routes";

/* ── Sparkline FPS ── */
function FpsGraph({ fps }) {
    const [history, setHistory] = useState(() => Array(60).fill(60));

    useEffect(() => {
        const timer = setTimeout(() => setHistory((prev) => [...prev.slice(1), fps]), 0);
        return () => clearTimeout(timer);
    }, [fps]);

    const w = 100;
    const h = 34;
    const max = 70;
    const path = history
        .map((v, i) => {
            const x = (i / (history.length - 1)) * w;
            const y = h - (Math.min(v, max) / max) * h;
            return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ");

    const area = `${path} L${w},${h} L0,${h} Z`;
    const tone = fps >= 50 ? "#10b981" : fps >= 32 ? "#f59e0b" : "#f43f5e";

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="ux-fps-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={tone} stopOpacity="0.34" />
                    <stop offset="100%" stopColor={tone} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Đường tham chiếu 60/30 FPS */}
            <line x1="0" y1={h - (60 / max) * h} x2={w} y2={h - (60 / max) * h}
                stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" strokeDasharray="2 2" />
            <line x1="0" y1={h - (30 / max) * h} x2={w} y2={h - (30 / max) * h}
                stroke="rgba(244,63,94,0.2)" strokeWidth="0.4" strokeDasharray="2 2" />
            <path d={area} fill="url(#ux-fps-fill)" />
            <path d={path} fill="none" stroke={tone} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

/* ── Bảng khả năng thiết bị ── */
function DeviceCaps() {
    const [caps, setCaps] = useState(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let webgl = false;
        let renderer = "—";
        try {
            const c = document.createElement("canvas");
            const gl = c.getContext("webgl2") || c.getContext("webgl");
            webgl = !!gl;
            if (gl) {
                const dbg = gl.getExtension("WEBGL_debug_renderer_info");
                if (dbg) renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "—";
            }
        } catch {
            webgl = false;
        }

        const timer = setTimeout(() => setCaps({
            webgl,
            renderer: String(renderer).slice(0, 42),
            cores: navigator.hardwareConcurrency || null,
            memory: navigator.deviceMemory || navigator.deviceMemory === 0 ? navigator.deviceMemory : null,
            dpr: Number((window.devicePixelRatio || 1).toFixed(2)),
            reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            touch: window.matchMedia("(pointer: coarse)").matches,
            viewport: `${window.innerWidth}×${window.innerHeight}`,
        }), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!caps) {
        return (
            <p className="font-mono text-[11px] text-white/35">Đang dò khả năng thiết bị…</p>
        );
    }

    const rows = [
        { label: "WebGL", value: caps.webgl ? "Hỗ trợ" : "Không", ok: caps.webgl },
        { label: "GPU Renderer", value: caps.renderer, ok: true },
        { label: "Nhân CPU", value: caps.cores ? `${caps.cores} luồng` : "Không rõ", ok: !!caps.cores },
        { label: "Pixel Ratio", value: `${caps.dpr}×`, ok: true },
        { label: "Khung nhìn", value: caps.viewport, ok: true },
        { label: "Con trỏ", value: caps.touch ? "Cảm ứng" : "Chuột (fine)", ok: true },
        {
            label: "Reduced Motion",
            value: caps.reduced ? "BẬT (đã tôn trọng)" : "Tắt",
            ok: true,
        },
    ];

    return (
        <ul className="space-y-1.5">
            {rows.map((r) => (
                <li
                    key={r.label}
                    className="flex items-center justify-between gap-3 border-b pb-1.5 last:border-0"
                    style={{ borderColor: "var(--ux-border)" }}
                >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                        {r.label}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                        {r.ok ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                        ) : (
                            <XCircle className="h-3 w-3 shrink-0 text-rose-400" />
                        )}
                        <span className="truncate font-mono text-[10.5px] font-bold text-white/75">
                            {r.value}
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default function UltraPerformanceLab() {
    const {
        fps,
        motionId,
        setMotionId,
        motionLevels,
        motion: level,
        grainEnabled,
        setGrainEnabled,
        cursorEnabled,
        setCursorEnabled,
        soundEnabled,
        setSoundEnabled,
        autoDegraded,
    } = useUltra();

    const tone = fps >= 50 ? "#10b981" : fps >= 32 ? "#f59e0b" : "#f43f5e";
    const particleCount = Math.round(1800 * level.particleScale);

    const toggles = [
        {
            id: "grain",
            icon: Film,
            label: "Film Grain",
            checked: grainEnabled,
            set: setGrainEnabled,
        },
        {
            id: "cursor",
            icon: MousePointer2,
            label: "Con Trỏ Ultra",
            checked: cursorEnabled,
            set: setCursorEnabled,
        },
        {
            id: "sound",
            icon: Volume2,
            label: "Âm Thanh UI",
            checked: soundEnabled,
            set: setSoundEnabled,
        },
    ];

    return (
        <section id="ultra-performance" className="relative py-24 sm:py-32">
            <div className="layout-safe-container">
                <UltraReveal>
                    <div className="mb-11 max-w-2xl">
                        <span
                            className="font-mono text-[10px] font-black uppercase tracking-[0.24em]"
                            style={{ color: "var(--ux-accent)" }}
                        >
                            CHƯƠNG 05 — HIỆU NĂNG & TRỢ NĂNG
                        </span>
                        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                            Đẹp mà <span className="ux-text-accent">không nặng máy</span>
                        </h2>
                        <p className="mt-4 text-[14.5px] leading-relaxed text-white/55">
                            Hệ thống đo FPS mỗi giây. Nếu FPS dưới 32 liên tục 4 giây, tầng Ultra tự động
                            hạ một bậc hiệu ứng để giữ độ mượt — bạn không cần làm gì cả.
                        </p>
                    </div>
                </UltraReveal>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* FPS monitor */}
                    <UltraReveal className="lg:col-span-2">
                        <UltraMagneticCard as="div" className="h-full p-6" intensity={6} depth={16}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-[15px] font-black text-white">
                                        <Activity className="h-4 w-4" style={{ color: tone }} />
                                        Đồ Thị FPS Thời Gian Thực
                                    </h3>
                                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">
                                        60 mẫu trượt · cập nhật mỗi giây
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span
                                        className="font-mono text-4xl font-black leading-none"
                                        style={{ color: tone }}
                                    >
                                        {fps}
                                    </span>
                                    <span className="ml-1 font-mono text-[10px] font-bold text-white/35">
                                        FPS
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <FpsGraph fps={fps} />
                            </div>

                            <div
                                className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4"
                                style={{ borderColor: "var(--ux-border)" }}
                            >
                                {[
                                    { k: "Hạt 3D đang render", v: particleCount, suffix: "" },
                                    { k: "Blur backdrop", v: level.blur, suffix: "px" },
                                    {
                                        k: "Parallax",
                                        v: Math.round(level.parallax * 100),
                                        suffix: "%",
                                    },
                                    {
                                        k: "WebGL nặng",
                                        v: level.enableHeavy3D ? 1 : 0,
                                        text: level.enableHeavy3D ? "BẬT" : "TẮT",
                                    },
                                ].map((s) => (
                                    <div key={s.k}>
                                        <span className="block font-mono text-lg font-black text-white">
                                            {s.text ? (
                                                s.text
                                            ) : (
                                                <UltraCounter value={s.v} suffix={s.suffix} duration={0.9} />
                                            )}
                                        </span>
                                        <span className="mt-0.5 block font-mono text-[9px] uppercase leading-tight tracking-wider text-white/35">
                                            {s.k}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {autoDegraded && (
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5">
                                    <Gauge className="h-4 w-4 shrink-0 text-amber-400" />
                                    <p className="text-[12px] text-amber-200/85">
                                        Hệ thống đã tự hạ cấp hiệu ứng do FPS thấp. Bạn có thể phục hồi trong
                                        Theme Studio (⌘/).
                                    </p>
                                </div>
                            )}
                        </UltraMagneticCard>
                    </UltraReveal>

                    {/* Device caps */}
                    <UltraReveal delay={0.1}>
                        <UltraMagneticCard as="div" className="h-full p-6" intensity={6} depth={16}>
                            <h3 className="flex items-center gap-2 text-[15px] font-black text-white">
                                <MonitorSmartphone className="h-4 w-4" style={{ color: "var(--ux-accent)" }} />
                                Khả Năng Thiết Bị
                            </h3>
                            <p className="mb-4 mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">
                                Dò trực tiếp trên máy bạn
                            </p>
                            <DeviceCaps />
                        </UltraMagneticCard>
                    </UltraReveal>

                    {/* Motion levels */}
                    <UltraReveal delay={0.16} className="lg:col-span-2">
                        <UltraMagneticCard as="div" className="h-full p-6" intensity={6} depth={16}>
                            <h3 className="flex items-center gap-2 text-[15px] font-black text-white">
                                <Cpu className="h-4 w-4" style={{ color: "var(--ux-accent)" }} />
                                4 Mức Độ Hiệu Ứng
                            </h3>
                            <p className="mb-4 mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">
                                Bấm để đổi — áp dụng tức thì toàn site
                            </p>

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {motionLevels.map((m) => {
                                    const active = m.id === motionId;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setMotionId(m.id)}
                                            className="rounded-2xl border p-3.5 text-left transition-all hover:brightness-110"
                                            style={{
                                                borderColor: active
                                                    ? "color-mix(in srgb, var(--ux-accent) 55%, transparent)"
                                                    : "var(--ux-border)",
                                                background: active ? "var(--ux-glow-soft)" : "var(--ux-bg-0)",
                                            }}
                                            data-ux-cursor={`CHỌN ${m.name.toUpperCase()}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-black text-white">{m.name}</span>
                                                {active && (
                                                    <CheckCircle2
                                                        className="h-4 w-4"
                                                        style={{ color: "var(--ux-accent)" }}
                                                    />
                                                )}
                                            </div>
                                            <p className="mt-1 text-[11.5px] leading-snug text-white/45">
                                                {m.desc}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <span className="rounded border border-white/10 bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-white/45">
                                                    hạt ×{m.particleScale}
                                                </span>
                                                <span className="rounded border border-white/10 bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-white/45">
                                                    blur {m.blur}px
                                                </span>
                                                <span className="rounded border border-white/10 bg-black/25 px-1.5 py-0.5 font-mono text-[9px] text-white/45">
                                                    3D {m.enableHeavy3D ? "on" : "off"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </UltraMagneticCard>
                    </UltraReveal>

                    {/* Accessibility toggles */}
                    <UltraReveal delay={0.22}>
                        <UltraMagneticCard as="div" className="h-full p-6" intensity={6} depth={16}>
                            <h3 className="flex items-center gap-2 text-[15px] font-black text-white">
                                <Accessibility className="h-4 w-4" style={{ color: "var(--ux-accent)" }} />
                                Trợ Năng
                            </h3>
                            <p className="mb-4 mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">
                                Toàn quyền kiểm soát
                            </p>

                            <div className="space-y-2">
                                {toggles.map((t) => {
                                    const IconCmp = t.icon;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => t.set(!t.checked)}
                                            className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all"
                                            style={{
                                                borderColor: t.checked
                                                    ? "color-mix(in srgb, var(--ux-accent) 40%, transparent)"
                                                    : "var(--ux-border)",
                                                background: t.checked ? "var(--ux-glow-soft)" : "var(--ux-bg-0)",
                                            }}
                                        >
                                            <IconCmp
                                                className="h-3.5 w-3.5 shrink-0"
                                                style={{
                                                    color: t.checked ? "var(--ux-accent)" : "rgba(255,255,255,0.35)",
                                                }}
                                            />
                                            <span className="flex-1 text-[12.5px] font-bold text-white">
                                                {t.label}
                                            </span>
                                            <span
                                                className="rounded px-1.5 py-0.5 font-mono text-[9px] font-black"
                                                style={{
                                                    background: t.checked
                                                        ? "var(--ux-accent)"
                                                        : "rgba(255,255,255,0.1)",
                                                    color: t.checked ? "#0a0605" : "rgba(255,255,255,0.5)",
                                                }}
                                            >
                                                {t.checked ? "BẬT" : "TẮT"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                className="mt-4 rounded-xl border px-3 py-2.5"
                                style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                            >
                                <p className="text-[11px] leading-relaxed text-white/45">
                                    Nếu hệ điều hành của bạn bật <strong className="text-white/70">Reduced
                                    Motion</strong>, tầng Ultra tự chọn mức <strong className="text-white/70">Tĩnh
                                    Lặng</strong> ngay lần đầu truy cập.
                                </p>
                            </div>
                        </UltraMagneticCard>
                    </UltraReveal>

                    {/* Keyboard cheat sheet */}
                    <UltraReveal delay={0.28} className="lg:col-span-3">
                        <UltraMagneticCard as="div" className="p-6" intensity={4} depth={12}>
                            <h3 className="flex items-center gap-2 text-[15px] font-black text-white">
                                <Keyboard className="h-4 w-4" style={{ color: "var(--ux-accent)" }} />
                                Toàn Bộ Phím Tắt
                            </h3>
                            <p className="mb-4 mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">
                                Điều hướng như dân pro, không cần chuột
                            </p>

                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                                {[
                                    { k: "⌘K", d: "Command Palette" },
                                    { k: "⌘/", d: "Theme Studio" },
                                    { k: "⇧?", d: "Sitemap Orbit 3D" },
                                    { k: "ESC", d: "Đóng lớp phủ" },
                                    ...Object.entries(ULTRA_SHORTCUTS).map(([key, path]) => {
                                        const r = ULTRA_ROUTES.find((x) => x.path === path);
                                        return {
                                            k: `G ${key.toUpperCase()}`,
                                            d: r?.title?.split("(")[0].trim() || path,
                                        };
                                    }),
                                ].map((s) => (
                                    <div
                                        key={s.k}
                                        className="flex items-center gap-2 rounded-xl border px-2.5 py-2"
                                        style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                                    >
                                        <kbd
                                            className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-black"
                                            style={{
                                                borderColor: "color-mix(in srgb, var(--ux-accent) 35%, transparent)",
                                                color: "var(--ux-accent)",
                                                background: "var(--ux-glow-soft)",
                                            }}
                                        >
                                            {s.k}
                                        </kbd>
                                        <span className="truncate text-[11px] text-white/55">{s.d}</span>
                                    </div>
                                ))}
                            </div>
                        </UltraMagneticCard>
                    </UltraReveal>
                </div>
            </div>
        </section>
    );
}
