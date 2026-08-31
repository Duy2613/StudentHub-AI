"use client";

// frontend/src/components/ultra/UltraToastHub.jsx
//
// ULTRA TOAST HUB — Hàng đợi thông báo nổi góc dưới-phải:
// - Spring slide-in + layout animation khi stack thay đổi
// - 4 tông: info / success / warn / danger với viền glow tương ứng
// - Thanh tiến trình đếm ngược tự tan

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, CheckCircle2, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { useUltra } from "./UltraProvider";

const TONES = {
    info: { icon: Info, color: "#38bdf8", label: "THÔNG TIN" },
    success: { icon: CheckCircle2, color: "#10b981", label: "THÀNH CÔNG" },
    warn: { icon: AlertTriangle, color: "#f59e0b", label: "CẢNH BÁO" },
    danger: { icon: ShieldAlert, color: "#f43f5e", label: "NGUY HIỂM" },
};

export default function UltraToastHub() {
    const { toasts, dismissToast } = useUltra();

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[1100] flex w-[min(94vw,360px)] flex-col gap-2">
            <AnimatePresence initial={false}>
                {toasts.map((t) => {
                    const tone = TONES[t.tone] || TONES.info;
                    const IconCmp = tone.icon;
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 60, scale: 0.94 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.92 }}
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="pointer-events-auto relative overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(0,0,0,0.75)]"
                            style={{
                                borderColor: `color-mix(in srgb, ${tone.color} 42%, transparent)`,
                                background: "color-mix(in srgb, var(--ux-bg-1) 95%, transparent)",
                                backdropFilter: "blur(20px)",
                            }}
                            role="status"
                        >
                            <div className="flex items-start gap-3 px-4 py-3">
                                <span
                                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                        background: `color-mix(in srgb, ${tone.color} 16%, transparent)`,
                                        color: tone.color,
                                    }}
                                >
                                    <IconCmp className="h-4 w-4" />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className="font-mono text-[9.5px] font-black uppercase tracking-[0.16em]"
                                        style={{ color: tone.color }}
                                    >
                                        {tone.label}
                                    </p>
                                    <p className="mt-0.5 text-[13px] font-bold leading-tight text-white">
                                        {t.title}
                                    </p>
                                    {t.message && (
                                        <p className="mt-0.5 text-[11.5px] leading-snug text-white/55">
                                            {t.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => dismissToast(t.id)}
                                    className="shrink-0 rounded-md p-1 text-white/35 transition-colors hover:text-white"
                                    aria-label="Đóng thông báo"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {t.duration > 0 && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-[2px]"
                                    style={{ background: tone.color }}
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: t.duration / 1000, ease: "linear" }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
