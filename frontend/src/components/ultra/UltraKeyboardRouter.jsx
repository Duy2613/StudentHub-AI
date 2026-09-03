"use client";

// frontend/src/components/ultra/UltraKeyboardRouter.jsx
//
// ULTRA KEYBOARD ROUTER — Điều hướng kiểu Vim/Linear: nhấn "G" rồi một chữ cái.
//   G H → Trang chủ        G S → Kiểm tra lừa đảo
//   G D → Dashboard        G F → Diễn đàn
//   G C → Xếp tín chỉ      G P → Hồ sơ
//   G U → Ultra Lab
//
// Hiển thị chip "G …" ở giữa dưới màn hình trong 1.4s để người dùng biết
// hệ thống đang chờ phím thứ hai (leader-key affordance).

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ULTRA_SHORTCUTS, ULTRA_ROUTES } from "@/lib/ultra/routes";
import { useUltra } from "./UltraProvider";

export default function UltraKeyboardRouter() {
    const router = useRouter();
    const { pushToast } = useUltra();
    const [pending, setPending] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const clearPending = () => {
            setPending(false);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        const onKeyDown = (e) => {
            const target = e.target;
            const isTyping =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);
            if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

            const key = e.key.toLowerCase();

            // Bước 1: nhấn "g" mở chế độ chờ
            if (!pending && key === "g") {
                e.preventDefault();
                setPending(true);
                timerRef.current = setTimeout(() => setPending(false), 1500);
                return;
            }

            // Bước 2: phím đích
            if (pending) {
                e.preventDefault();
                clearPending();
                const path = ULTRA_SHORTCUTS[key];
                if (path) {
                    const route = ULTRA_ROUTES.find((r) => r.path === path);
                    router.push(path);
                    pushToast({
                        tone: "info",
                        title: "Điều hướng nhanh",
                        message: route ? route.title : path,
                        duration: 2200,
                    });
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pending, router, pushToast]);

    const hints = Object.entries(ULTRA_SHORTCUTS).slice(0, 7);

    return (
        <AnimatePresence>
            {pending && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 460, damping: 32 }}
                    className="pointer-events-none fixed bottom-24 left-1/2 z-[960] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                    style={{
                        borderColor: "color-mix(in srgb, var(--ux-accent) 50%, transparent)",
                        background: "color-mix(in srgb, var(--ux-bg-1) 95%, transparent)",
                        backdropFilter: "blur(18px)",
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        <kbd
                            className="rounded-md border px-2 py-1 font-mono text-xs font-black"
                            style={{
                                borderColor: "var(--ux-accent)",
                                color: "var(--ux-accent)",
                                background: "var(--ux-glow-soft)",
                            }}
                        >
                            G
                        </kbd>
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/60">
                            đang chờ phím đích…
                        </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {hints.map(([k, path]) => {
                            const route = ULTRA_ROUTES.find((r) => r.path === path);
                            return (
                                <span key={k} className="flex items-center gap-1">
                                    <kbd
                                        className="rounded border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase"
                                        style={{
                                            borderColor: "var(--ux-border)",
                                            color: "var(--ux-accent-2)",
                                            background: "var(--ux-bg-2)",
                                        }}
                                    >
                                        {k}
                                    </kbd>
                                    <span className="text-[10px] text-white/45">
                                        {route?.title?.split("(")[0].trim() || path}
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
