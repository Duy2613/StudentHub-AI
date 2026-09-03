"use client";

// frontend/src/components/ultra/sections/UltraFeatureAtlas.jsx
//
// Chương 03 — BẢN ĐỒ CHỨC NĂNG: toàn bộ 31 trang chia theo 7 nhóm.
// - Bộ lọc nhóm dạng pill với indicator trượt (layoutId)
// - Thẻ trang có 3D tilt, badge, và link điều hướng thật
// - Nút mở Sitemap Orbit 3D

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { groupedRoutes, ULTRA_ROUTES, ULTRA_GROUPS } from "@/lib/ultra/routes";
import UltraMagneticCard from "../UltraMagneticCard";
import { UltraReveal, UltraCounter } from "../UltraMotionKit";
import { useUltra } from "../UltraProvider";

function Icon({ name, className, style }) {
    const Cmp = Icons[name] || Icons.Circle;
    return <Cmp className={className} style={style} />;
}

export default function UltraFeatureAtlas() {
    const { setSitemapOpen } = useUltra();
    const [filter, setFilter] = useState("all");

    const groups = useMemo(() => groupedRoutes(), []);

    const visible = useMemo(() => {
        if (filter === "all") {
            return ULTRA_ROUTES.slice().sort((a, b) => b.priority - a.priority);
        }
        return ULTRA_ROUTES.filter((r) => r.group === filter).sort(
            (a, b) => b.priority - a.priority
        );
    }, [filter]);

    const filters = [
        { id: "all", label: "Tất Cả", color: "var(--ux-accent)", count: ULTRA_ROUTES.length },
        ...groups.map((g) => ({ id: g.id, label: g.label, color: g.color, count: g.items.length })),
    ];

    return (
        <section id="ultra-atlas" className="relative py-24 sm:py-32">
            {/* Nền lưới */}
            <div className="ux-grid-bg pointer-events-none absolute inset-0 opacity-40" />

            <div className="layout-safe-container relative">
                <UltraReveal>
                    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <span
                                className="font-mono text-[10px] font-black uppercase tracking-[0.24em]"
                                style={{ color: "var(--ux-accent)" }}
                            >
                                CHƯƠNG 03 — BẢN ĐỒ CHỨC NĂNG
                            </span>
                            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                                <UltraCounter value={ULTRA_ROUTES.length} /> trang,{" "}
                                <span className="ux-text-accent">{groups.length} nhóm năng lực</span>
                            </h2>
                            <p className="mt-4 text-[14.5px] leading-relaxed text-white/55">
                                Từ động cơ chống lừa đảo 4 lớp, bộ giải xếp tín chỉ CSP, radar học bổng
                                cho tới đồ thị tri thức chuyên gia — toàn bộ đều truy cập được trong 1 lần bấm.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSitemapOpen(true)}
                            className="ux-btn ux-sheen shrink-0"
                            data-ux-cursor="MỞ SITEMAP 3D"
                        >
                            <Icons.Orbit className="h-4 w-4" style={{ color: "var(--ux-accent)" }} />
                            Xem Sitemap Orbit 3D
                        </button>
                    </div>
                </UltraReveal>

                {/* Bộ lọc */}
                <UltraReveal delay={0.12}>
                    <div className="mb-8 flex flex-wrap gap-2">
                        {filters.map((f) => {
                            const active = filter === f.id;
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setFilter(f.id)}
                                    className="relative flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors"
                                    style={{
                                        borderColor: active ? f.color : "var(--ux-border)",
                                        color: active ? "#0a0605" : "rgba(255,255,255,0.6)",
                                        background: active ? f.color : "var(--ux-bg-1)",
                                    }}
                                >
                                    <span className="relative z-10">{f.label}</span>
                                    <span
                                        className="relative z-10 rounded px-1.5 py-0.5 font-mono text-[9px] font-black"
                                        style={{
                                            background: active ? "rgba(0,0,0,0.18)" : "var(--ux-bg-2)",
                                            color: active ? "#0a0605" : f.color,
                                        }}
                                    >
                                        {f.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </UltraReveal>

                {/* Grid trang */}
                <motion.div layout className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((r, i) => {
                        const group = ULTRA_GROUPS[r.group];
                        return (
                            <motion.div
                                key={r.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.42,
                                    delay: Math.min(i * 0.025, 0.4),
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <UltraMagneticCard
                                    as="div"
                                    className="h-full"
                                    intensity={8}
                                    depth={20}
                                >
                                    <Link
                                        href={r.path}
                                        className="flex h-full flex-col gap-3 p-5"
                                        data-ux-cursor={`ĐI TỚI ${r.title.toUpperCase()}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                                                style={{
                                                    borderColor: `color-mix(in srgb, ${group.color} 35%, transparent)`,
                                                    background: `color-mix(in srgb, ${group.color} 10%, var(--ux-bg-2))`,
                                                    color: group.color,
                                                }}
                                            >
                                                <Icon name={r.icon} className="h-4.5 w-4.5" />
                                            </span>

                                            <div className="flex shrink-0 items-center gap-1.5">
                                                {r.badge && (
                                                    <span
                                                        className="rounded border px-1.5 py-0.5 font-mono text-[8.5px] font-black uppercase"
                                                        style={{
                                                            borderColor: `color-mix(in srgb, ${group.color} 40%, transparent)`,
                                                            color: group.color,
                                                            background: `color-mix(in srgb, ${group.color} 10%, transparent)`,
                                                        }}
                                                    >
                                                        {r.badge}
                                                    </span>
                                                )}
                                                {r.shortcut && (
                                                    <kbd
                                                        className="rounded border px-1.5 py-0.5 font-mono text-[8.5px] font-black"
                                                        style={{
                                                            borderColor: "var(--ux-border)",
                                                            color: "var(--ux-text, #ece7e0)",
                                                            background: "var(--ux-bg-0)",
                                                        }}
                                                    >
                                                        {r.shortcut}
                                                    </kbd>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-[14.5px] font-black leading-snug text-white">
                                                {r.title}
                                            </h3>
                                            <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">
                                                {r.desc}
                                            </p>
                                        </div>

                                        <div
                                            className="flex items-center justify-between border-t pt-2.5"
                                            style={{ borderColor: "var(--ux-border)" }}
                                        >
                                            <span
                                                className="font-mono text-[9.5px] font-bold uppercase tracking-wider"
                                                style={{ color: group.color }}
                                            >
                                                {group.label}
                                            </span>
                                            <span className="flex items-center gap-1 font-mono text-[10px] text-white/35">
                                                {r.path}
                                                <Icons.ArrowUpRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </Link>
                                </UltraMagneticCard>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
