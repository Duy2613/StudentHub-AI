"use client";

// frontend/src/components/ultra/sections/UltraChapterNav.jsx
//
// Điều hướng chương dạng dot-rail dọc bên trái:
// - Theo dõi section nào đang trong khung nhìn (IntersectionObserver)
// - Click để cuộn mượt tới chương
// - Nhãn hiện khi hover, dot đang active phóng to + glow

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHAPTERS = [
    { id: "ultra-hero", num: "01", label: "Sân Khấu 3D" },
    { id: "ultra-effects", num: "02", label: "Thư Viện Hiệu Ứng" },
    { id: "ultra-atlas", num: "03", label: "Bản Đồ Chức Năng" },
    { id: "ultra-themes", num: "04", label: "Bảng Màu Điện Ảnh" },
    { id: "ultra-performance", num: "05", label: "Hiệu Năng & Trợ Năng" },
];

export default function UltraChapterNav() {
    const [active, setActive] = useState("ultra-hero");
    const [hovered, setHovered] = useState(null);

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return;

        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { threshold: [0.15, 0.4, 0.7], rootMargin: "-15% 0px -35% 0px" }
        );

        CHAPTERS.forEach((c) => {
            const el = document.getElementById(c.id);
            if (el) obs.observe(el);
        });

        return () => obs.disconnect();
    }, []);

    const go = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <nav
            className="fixed left-4 top-1/2 z-[840] hidden -translate-y-1/2 flex-col gap-3 lg:flex"
            aria-label="Điều hướng chương"
        >
            {CHAPTERS.map((c) => {
                const isActive = active === c.id;
                const isHovered = hovered === c.id;
                return (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => go(c.id)}
                        onMouseEnter={() => setHovered(c.id)}
                        onMouseLeave={() => setHovered(null)}
                        className="group relative flex items-center gap-3"
                        aria-current={isActive ? "true" : undefined}
                    >
                        {/* Dot */}
                        <span className="relative flex h-3 w-3 items-center justify-center">
                            <span
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: isActive ? 11 : 6,
                                    height: isActive ? 11 : 6,
                                    background: isActive ? "var(--ux-accent)" : "rgba(255,255,255,0.22)",
                                    boxShadow: isActive ? "0 0 14px var(--ux-glow)" : "none",
                                }}
                            />
                            {isActive && (
                                <motion.span
                                    className="absolute inset-0 rounded-full border"
                                    style={{ borderColor: "var(--ux-accent)" }}
                                    animate={{ scale: [1, 2.1], opacity: [0.7, 0] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                                />
                            )}
                        </span>

                        {/* Nhãn */}
                        <motion.span
                            initial={false}
                            animate={{
                                opacity: isActive || isHovered ? 1 : 0,
                                x: isActive || isHovered ? 0 : -8,
                            }}
                            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                            className="pointer-events-none whitespace-nowrap rounded-lg border px-2.5 py-1"
                            style={{
                                borderColor: "var(--ux-border)",
                                background: "color-mix(in srgb, var(--ux-bg-1) 92%, transparent)",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            <span
                                className="font-mono text-[9px] font-black tracking-wider"
                                style={{ color: "var(--ux-accent)" }}
                            >
                                {c.num}
                            </span>
                            <span className="ml-1.5 text-[11px] font-bold text-white/80">{c.label}</span>
                        </motion.span>
                    </button>
                );
            })}
        </nav>
    );
}
