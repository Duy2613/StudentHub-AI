"use client";

// frontend/src/components/ultra/UltraThemeStudio.jsx
//
// ULTRA THEME STUDIO (⌘/ hoặc Ctrl+/)
// Panel trượt bên phải cho phép người dùng tuỳ biến toàn bộ trải nghiệm:
// - 6 bảng màu điện ảnh với preview swatch trực tiếp
// - 4 mức hiệu ứng (Điện Ảnh → Tĩnh Lặng)
// - Bật/tắt film grain, con trỏ Ultra, âm thanh UI
// - Đồng hồ FPS trực tiếp + cảnh báo khi hệ thống tự hạ cấp

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    Palette,
    Gauge,
    Film,
    MousePointer2,
    Volume2,
    VolumeX,
    Activity,
    RotateCcw,
    Check,
    Sparkles,
} from "lucide-react";
import { useUltra } from "./UltraProvider";

function ToggleRow({ icon: IconCmp, label, desc, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all hover:brightness-125"
            style={{
                borderColor: checked
                    ? "color-mix(in srgb, var(--ux-accent) 45%, transparent)"
                    : "var(--ux-border)",
                background: checked ? "var(--ux-glow-soft)" : "var(--ux-bg-2)",
            }}
            aria-pressed={checked}
        >
            <IconCmp
                className="h-4 w-4 shrink-0"
                style={{ color: checked ? "var(--ux-accent)" : "rgba(255,255,255,0.4)" }}
            />
            <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-white">{label}</span>
                <span className="block text-[11px] text-white/45">{desc}</span>
            </span>
            <span
                className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                style={{
                    background: checked ? "var(--ux-accent)" : "rgba(255,255,255,0.14)",
                }}
            >
                <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 600, damping: 34 }}
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                    style={{ left: checked ? 18 : 2 }}
                />
            </span>
        </button>
    );
}

export default function UltraThemeStudio() {
    const {
        studioOpen,
        setStudioOpen,
        themes,
        themeId,
        setThemeId,
        motionLevels,
        motionId,
        setMotionId,
        grainEnabled,
        setGrainEnabled,
        cursorEnabled,
        setCursorEnabled,
        soundEnabled,
        setSoundEnabled,
        fps,
        autoDegraded,
        resetDegradation,
        pushToast,
    } = useUltra();

    const fpsTone = fps >= 50 ? "#10b981" : fps >= 32 ? "#f59e0b" : "#f43f5e";

    return (
        <AnimatePresence>
            {studioOpen && (
                <div className="fixed inset-0 z-[999]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => setStudioOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 340, damping: 34 }}
                        className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l shadow-[-30px_0_100px_rgba(0,0,0,0.85)]"
                        style={{
                            borderColor: "var(--ux-border)",
                            background: "color-mix(in srgb, var(--ux-bg-1) 96%, transparent)",
                            backdropFilter: "blur(26px)",
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Ultra Theme Studio"
                    >
                        {/* Header */}
                        <header
                            className="flex items-center justify-between border-b px-5 py-4"
                            style={{ borderColor: "var(--ux-border)" }}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                                    style={{
                                        borderColor: "var(--ux-border)",
                                        background: "var(--ux-bg-2)",
                                        color: "var(--ux-accent)",
                                    }}
                                >
                                    <Palette className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-black tracking-tight text-white">
                                        ULTRA THEME STUDIO
                                    </h2>
                                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                                        Tuỳ biến trải nghiệm toàn cục
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStudioOpen(false)}
                                className="rounded-full border p-2 text-white/60 transition-colors hover:text-white"
                                style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-2)" }}
                                aria-label="Đóng Theme Studio"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
                            {/* FPS telemetry */}
                            <section
                                className="rounded-2xl border px-4 py-3.5"
                                style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-2)" }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
                                        <Activity className="h-3.5 w-3.5" style={{ color: fpsTone }} />
                                        Hiệu năng thời gian thực
                                    </span>
                                    <span
                                        className="font-mono text-lg font-black leading-none"
                                        style={{ color: fpsTone }}
                                    >
                                        {fps}
                                        <span className="ml-1 text-[10px] font-bold text-white/40">FPS</span>
                                    </span>
                                </div>
                                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: fpsTone }}
                                        animate={{ width: `${Math.min(100, (fps / 60) * 100)}%` }}
                                        transition={{ type: "spring", stiffness: 180, damping: 26 }}
                                    />
                                </div>
                                {autoDegraded && (
                                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-amber-300">
                                                Đã tự động hạ cấp hiệu ứng
                                            </p>
                                            <p className="text-[10.5px] leading-snug text-amber-200/70">
                                                FPS thấp kéo dài — hệ thống giảm tải để giữ độ mượt.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetDegradation();
                                                    pushToast({
                                                        tone: "info",
                                                        title: "Đã phục hồi",
                                                        message: "Trả về mức Điện Ảnh đầy đủ.",
                                                    });
                                                }}
                                                className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase text-amber-300 underline decoration-dotted"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                Phục hồi Điện Ảnh
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Palettes */}
                            <section>
                                <h3 className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                                    01 — Bảng Màu Điện Ảnh
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {themes.map((t) => {
                                        const active = t.id === themeId;
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    setThemeId(t.id);
                                                    pushToast({
                                                        tone: "success",
                                                        title: "Đã đổi bảng màu",
                                                        message: t.name,
                                                    });
                                                }}
                                                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all"
                                                style={{
                                                    borderColor: active
                                                        ? t.vars["--ux-accent"]
                                                        : "var(--ux-border)",
                                                    background: active
                                                        ? `color-mix(in srgb, ${t.vars["--ux-accent"]} 12%, ${t.vars["--ux-bg-1"]})`
                                                        : "var(--ux-bg-2)",
                                                }}
                                            >
                                                <span className="flex shrink-0 -space-x-1.5">
                                                    {t.swatch.map((c, i) => (
                                                        <span
                                                            key={i}
                                                            className="h-6 w-6 rounded-full border-2"
                                                            style={{
                                                                background: c,
                                                                borderColor: t.vars["--ux-bg-1"],
                                                            }}
                                                        />
                                                    ))}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[13px] font-bold text-white">
                                                        {t.name}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-white/45">
                                                        {t.tagline}
                                                    </span>
                                                </span>
                                                {active && (
                                                    <Check
                                                        className="h-4 w-4 shrink-0"
                                                        style={{ color: t.vars["--ux-accent"] }}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Motion levels */}
                            <section>
                                <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                                    <Gauge className="h-3.5 w-3.5" />
                                    02 — Mức Độ Hiệu Ứng
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {motionLevels.map((m) => {
                                        const active = m.id === motionId;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setMotionId(m.id);
                                                    pushToast({
                                                        tone: "info",
                                                        title: "Mức hiệu ứng",
                                                        message: `${m.name} — ${m.desc}`,
                                                    });
                                                }}
                                                className="rounded-2xl border px-3 py-3 text-left transition-all"
                                                style={{
                                                    borderColor: active
                                                        ? "color-mix(in srgb, var(--ux-accent) 55%, transparent)"
                                                        : "var(--ux-border)",
                                                    background: active
                                                        ? "var(--ux-glow-soft)"
                                                        : "var(--ux-bg-2)",
                                                }}
                                            >
                                                <span className="flex items-center justify-between">
                                                    <span className="text-[12.5px] font-bold text-white">
                                                        {m.name}
                                                    </span>
                                                    {active && (
                                                        <Check
                                                            className="h-3.5 w-3.5"
                                                            style={{ color: "var(--ux-accent)" }}
                                                        />
                                                    )}
                                                </span>
                                                <span className="mt-0.5 block text-[10.5px] leading-snug text-white/45">
                                                    {m.desc}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Toggles */}
                            <section>
                                <h3 className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                                    03 — Lớp Trải Nghiệm
                                </h3>
                                <div className="space-y-2">
                                    <ToggleRow
                                        icon={Film}
                                        label="Film Grain"
                                        desc="Lớp nhiễu điện ảnh phủ toàn màn hình"
                                        checked={grainEnabled}
                                        onChange={setGrainEnabled}
                                    />
                                    <ToggleRow
                                        icon={MousePointer2}
                                        label="Con Trỏ Ultra"
                                        desc="Vành sáng magnetic + nhãn ngữ cảnh"
                                        checked={cursorEnabled}
                                        onChange={setCursorEnabled}
                                    />
                                    <ToggleRow
                                        icon={soundEnabled ? Volume2 : VolumeX}
                                        label="Âm Thanh Giao Diện"
                                        desc="Tiếng click, chuyển tab, xác nhận (Web Audio)"
                                        checked={soundEnabled}
                                        onChange={setSoundEnabled}
                                    />
                                </div>
                            </section>

                            {/* Shortcuts cheat sheet */}
                            <section
                                className="rounded-2xl border px-4 py-3.5"
                                style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                            >
                                <h3 className="mb-2.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                                    04 — Phím Tắt
                                </h3>
                                <ul className="space-y-1.5 font-mono text-[11px]">
                                    {[
                                        ["⌘K / Ctrl+K", "Command Palette"],
                                        ["⌘/ / Ctrl+/", "Theme Studio"],
                                        ["⇧ + ?", "Sitemap Orbit 3D"],
                                        ["G rồi H / S / D / F", "Nhảy nhanh tới trang"],
                                        ["ESC", "Đóng mọi lớp phủ"],
                                    ].map(([k, v]) => (
                                        <li key={k} className="flex items-center justify-between gap-3">
                                            <kbd
                                                className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold"
                                                style={{
                                                    borderColor: "var(--ux-border)",
                                                    color: "var(--ux-accent-2)",
                                                    background: "var(--ux-bg-2)",
                                                }}
                                            >
                                                {k}
                                            </kbd>
                                            <span className="truncate text-white/50">{v}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
