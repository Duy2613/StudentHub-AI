"use client";

// frontend/src/components/ultra/sections/UltraEffectsGallery.jsx
//
// Chương 02 — THƯ VIỆN HIỆU ỨNG: 12 demo tương tác trực tiếp trong bento grid,
// mỗi ô là một hiệu ứng thật đang chạy (không phải ảnh chụp):
//   3D tilt · spotlight · border beam · scanline · sheen · marquee
//   scramble · typewriter · counter · progress ring · magnetic button · ripple

import React, { useState, useRef, useCallback } from "react";
import {
    Box,
    Crosshair,
    Radio,
    ScanLine,
    Sparkle,
    MoveHorizontal,
    Binary,
    Terminal,
    Hash,
    CircleDot,
    Magnet,
    Waves,
} from "lucide-react";
import UltraMagneticCard from "../UltraMagneticCard";
import {
    UltraReveal,
    UltraScramble,
    UltraTypewriter,
    UltraCounter,
    UltraMarquee,
    UltraProgressRing,
} from "../UltraMotionKit";
import { useUltra } from "../UltraProvider";

/* ── Demo: nút magnetic (bị hút về con trỏ) ── */
function MagneticButton() {
    const ref = useRef(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const { motion: level } = useUltra();

    const onMove = (e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        setOffset({ x: dx * 0.28 * level.parallax, y: dy * 0.28 * level.parallax });
    };

    return (
        <div
            className="flex h-full items-center justify-center py-4"
            onMouseMove={onMove}
            onMouseLeave={() => setOffset({ x: 0, y: 0 })}
        >
            <button
                ref={ref}
                type="button"
                className="ux-btn ux-btn-primary"
                style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                    transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1)",
                }}
            >
                <Magnet className="h-4 w-4" />
                Hút theo con trỏ
            </button>
        </div>
    );
}

/* ── Demo: ripple khi click ── */
function RippleSurface() {
    const [ripples, setRipples] = useState([]);
    const seq = useRef(0);

    const onClick = useCallback((e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const id = ++seq.current;
        const item = { id, x: e.clientX - r.left, y: e.clientY - r.top };
        setRipples((prev) => [...prev, item]);
        setTimeout(() => setRipples((prev) => prev.filter((p) => p.id !== id)), 900);
    }, []);

    return (
        <button
            type="button"
            onClick={onClick}
            className="relative h-full min-h-[110px] w-full overflow-hidden rounded-2xl border text-center"
            style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
        >
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold uppercase tracking-wider text-white/45">
                Bấm vào đây
            </span>
            {ripples.map((r) => (
                <span
                    key={r.id}
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        left: r.x,
                        top: r.y,
                        width: 24,
                        height: 24,
                        marginLeft: -12,
                        marginTop: -12,
                        border: "1.5px solid var(--ux-accent)",
                        animation: "ux-ring-expand 0.9s cubic-bezier(0.16,1,0.3,1) forwards",
                    }}
                />
            ))}
        </button>
    );
}

/* ── Demo: thanh equalizer sóng âm ── */
function WaveBars() {
    const bars = 22;
    return (
        <div className="flex h-full min-h-[110px] items-end justify-center gap-[3px] py-4">
            {Array.from({ length: bars }).map((_, i) => (
                <span
                    key={i}
                    className="w-[5px] rounded-t-sm"
                    style={{
                        height: `${25 + Math.sin(i * 0.9) * 20 + 25}%`,
                        background: `linear-gradient(180deg, var(--ux-accent), var(--ux-accent-3))`,
                        animation: `ux-float-y ${0.9 + (i % 5) * 0.24}s ease-in-out ${i * 0.05}s infinite alternate`,
                        opacity: 0.42 + (i % 4) * 0.16,
                    }}
                />
            ))}
        </div>
    );
}

const EFFECTS = [
    {
        id: "tilt",
        num: "01",
        icon: Box,
        title: "3D Magnetic Tilt",
        desc: "Thẻ nghiêng theo con trỏ, lớp nội dung nổi translateZ 34px",
        span: "lg:col-span-2 lg:row-span-2",
        demo: "tilt",
    },
    {
        id: "spotlight",
        num: "02",
        icon: Crosshair,
        title: "Pointer Spotlight",
        desc: "Đèn rọi radial 420px bám con trỏ",
        demo: "spotlight",
    },
    {
        id: "beam",
        num: "03",
        icon: Radio,
        title: "Conic Border Beam",
        desc: "Viền conic-gradient quay 360° bằng @property",
        demo: "beam",
    },
    {
        id: "scan",
        num: "04",
        icon: ScanLine,
        title: "HUD Scanline",
        desc: "Vạch quét dọc kiểu màn hình radar",
        demo: "scan",
    },
    {
        id: "sheen",
        num: "05",
        icon: Sparkle,
        title: "Glass Sheen Sweep",
        desc: "Vệt sáng quét chéo khi hover",
        demo: "sheen",
    },
    {
        id: "marquee",
        num: "06",
        icon: MoveHorizontal,
        title: "Infinite Marquee",
        desc: "Băng chạy vô hạn, dừng khi hover",
        span: "lg:col-span-2",
        demo: "marquee",
    },
    {
        id: "scramble",
        num: "07",
        icon: Binary,
        title: "Glyph Scramble",
        desc: "Giải mã ký tự ngẫu nhiên khi vào khung nhìn",
        demo: "scramble",
    },
    {
        id: "typewriter",
        num: "08",
        icon: Terminal,
        title: "Terminal Typewriter",
        desc: "Gõ chữ theo nhịp + con trỏ nhấp nháy",
        span: "lg:col-span-2",
        demo: "typewriter",
    },
    {
        id: "counter",
        num: "09",
        icon: Hash,
        title: "EaseOutExpo Counter",
        desc: "Số đếm tăng dần định dạng vi-VN",
        demo: "counter",
    },
    {
        id: "ring",
        num: "10",
        icon: CircleDot,
        title: "Spring Progress Ring",
        desc: "Vòng SVG gradient với spring physics",
        demo: "ring",
    },
    {
        id: "magnetic",
        num: "11",
        icon: Magnet,
        title: "Magnetic Button",
        desc: "Nút bị hút lệch theo vị trí con trỏ",
        demo: "magnetic",
    },
    {
        id: "wave",
        num: "12",
        icon: Waves,
        title: "Audio Wave Bars",
        desc: "22 cột equalizer lệch pha",
        demo: "wave",
    },
];

function DemoBody({ kind }) {
    switch (kind) {
        case "tilt":
            return (
                <div className="flex h-full min-h-[180px] items-center justify-center">
                    <div
                        className="ux-border-beam rounded-2xl px-6 py-8 text-center"
                        style={{ background: "var(--ux-bg-0)" }}
                    >
                        <span className="block font-mono text-4xl font-black" style={{ color: "var(--ux-accent)" }}>
                            3D
                        </span>
                        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                            Di chuột lên thẻ này
                        </span>
                    </div>
                </div>
            );
        case "spotlight":
            return (
                <div className="flex h-full min-h-[110px] items-center justify-center">
                    <Crosshair className="h-10 w-10" style={{ color: "var(--ux-accent)", opacity: 0.55 }} />
                </div>
            );
        case "beam":
            return (
                <div className="flex h-full min-h-[110px] items-center justify-center">
                    <div
                        className="ux-border-beam rounded-xl px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-wider text-white/60"
                        style={{ background: "var(--ux-bg-0)" }}
                    >
                        BEAM ACTIVE
                    </div>
                </div>
            );
        case "scan":
            return (
                <div
                    className="ux-scan flex h-full min-h-[110px] items-center justify-center rounded-2xl border"
                    style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                >
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/45">
                        SCANNING…
                    </span>
                </div>
            );
        case "sheen":
            return (
                <div className="flex h-full min-h-[110px] items-center justify-center">
                    <div
                        className="ux-sheen rounded-2xl border px-6 py-5 font-mono text-[11px] font-bold uppercase tracking-wider text-white/55"
                        style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                    >
                        HOVER ME
                    </div>
                </div>
            );
        case "marquee":
            return (
                <UltraMarquee speed={18} className="h-full min-h-[110px] py-6">
                    {[
                        "XÁC THỰC AI",
                        "TRUST SCORE",
                        "OCR + QR",
                        "CSP SOLVER",
                        "REALITY GRAPH",
                        "EVIDENCE FUSION",
                    ].map((t) => (
                        <span
                            key={t}
                            className="whitespace-nowrap rounded-full border px-4 py-2 font-mono text-[11px] font-black uppercase tracking-wider"
                            style={{
                                borderColor: "var(--ux-border)",
                                background: "var(--ux-bg-0)",
                                color: "var(--ux-accent)",
                            }}
                        >
                            {t}
                        </span>
                    ))}
                </UltraMarquee>
            );
        case "scramble":
            return (
                <div className="flex h-full min-h-[110px] items-center justify-center">
                    <UltraScramble
                        text="DECRYPTED"
                        className="font-mono text-2xl font-black tracking-widest"
                    />
                </div>
            );
        case "typewriter":
            return (
                <div className="h-full min-h-[110px] py-2">
                    <UltraTypewriter
                        lines={[
                            "Khởi tạo động cơ xác thực 4 lớp…",
                            "Lớp 1: sàng lọc tất định — 0.19ms",
                            "Lớp 4: ma trận quyết định 3D — HOÀN TẤT",
                        ]}
                        speed={22}
                        linePause={520}
                    />
                </div>
            );
        case "counter":
            return (
                <div className="flex h-full min-h-[110px] flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-black text-white">
                        <UltraCounter value={128450} />
                    </span>
                    <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/35">
                        lượt quét đã xử lý
                    </span>
                </div>
            );
        case "ring":
            return (
                <div className="flex h-full min-h-[110px] items-center justify-center">
                    <UltraProgressRing value={92} label="" sublabel="TRUST SCORE" size={104} />
                </div>
            );
        case "magnetic":
            return <MagneticButton />;
        case "wave":
            return <WaveBars />;
        default:
            return <RippleSurface />;
    }
}

export default function UltraEffectsGallery() {
    return (
        <section id="ultra-effects" className="relative py-24 sm:py-32">
            <div className="layout-safe-container">
                {/* Header chương */}
                <UltraReveal>
                    <div className="mb-12 max-w-2xl">
                        <span
                            className="font-mono text-[10px] font-black uppercase tracking-[0.24em]"
                            style={{ color: "var(--ux-accent)" }}
                        >
                            CHƯƠNG 02 — THƯ VIỆN HIỆU ỨNG
                        </span>
                        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                            12 hiệu ứng <span className="ux-text-accent">đang chạy thật</span>
                        </h2>
                        <p className="mt-4 text-[14.5px] leading-relaxed text-white/55">
                            Không phải ảnh chụp — mỗi ô dưới đây là một thành phần React thật đang render.
                            Hãy di chuột, bấm, và cuộn để cảm nhận. Tất cả tự giảm tải khi máy yếu.
                        </p>
                    </div>
                </UltraReveal>

                {/* Bento grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {EFFECTS.map((fx, i) => {
                        const IconCmp = fx.icon;
                        return (
                            <UltraReveal key={fx.id} delay={i * 0.05} className={fx.span || ""}>
                                <UltraMagneticCard
                                    className="flex h-full flex-col p-5"
                                    intensity={fx.demo === "tilt" ? 14 : 7}
                                    depth={fx.demo === "tilt" ? 40 : 18}
                                >
                                    {/* Header ô */}
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                                                style={{
                                                    borderColor: "var(--ux-border)",
                                                    background: "var(--ux-bg-2)",
                                                    color: "var(--ux-accent)",
                                                }}
                                            >
                                                <IconCmp className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-[13.5px] font-black text-white">
                                                    {fx.title}
                                                </h3>
                                                <p className="truncate font-mono text-[9.5px] uppercase tracking-wider text-white/35">
                                                    FX-{fx.num}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demo */}
                                    <div className="flex-1">
                                        <DemoBody kind={fx.demo} />
                                    </div>

                                    {/* Mô tả */}
                                    <p className="mt-3 border-t pt-3 text-[11.5px] leading-snug text-white/45"
                                        style={{ borderColor: "var(--ux-border)" }}>
                                        {fx.desc}
                                    </p>
                                </UltraMagneticCard>
                            </UltraReveal>
                        );
                    })}

                    {/* Ô ripple bổ sung */}
                    <UltraReveal delay={0.62} className="lg:col-span-2">
                        <UltraMagneticCard className="flex h-full flex-col p-5" intensity={7} depth={18}>
                            <div className="mb-3 flex items-center gap-2.5">
                                <span
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                                    style={{
                                        borderColor: "var(--ux-border)",
                                        background: "var(--ux-bg-2)",
                                        color: "var(--ux-accent)",
                                    }}
                                >
                                    <CircleDot className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="text-[13.5px] font-black text-white">Click Ripple Rings</h3>
                                    <p className="font-mono text-[9.5px] uppercase tracking-wider text-white/35">
                                        FX-13
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1">
                                <RippleSurface />
                            </div>
                            <p
                                className="mt-3 border-t pt-3 text-[11.5px] leading-snug text-white/45"
                                style={{ borderColor: "var(--ux-border)" }}
                            >
                                Vòng sóng lan toả từ đúng điểm click, tự dọn DOM sau 900ms.
                            </p>
                        </UltraMagneticCard>
                    </UltraReveal>
                </div>
            </div>
        </section>
    );
}
