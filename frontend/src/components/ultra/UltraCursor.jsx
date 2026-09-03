"use client";

// frontend/src/components/ultra/UltraCursor.jsx
//
// ULTRA CURSOR — Con trỏ điện ảnh 3 lớp:
// 1. Dot lõi (bám tức thì, không lag)
// 2. Ring ngoài (lerp mượt, phóng to khi hover phần tử tương tác)
// 3. Trail vệt sáng (mảng điểm mờ dần)
// + Nhãn ngữ cảnh đọc từ data-ux-cursor="..." trên phần tử được hover
//
// Chỉ hoạt động trên thiết bị con trỏ mịn (pointer: fine) và khi cursorEnabled = true.

import React, { useEffect, useRef, useState } from "react";
import { useUltra } from "./UltraProvider";

const TRAIL_LENGTH = 10;

export default function UltraCursor() {
    const { cursorEnabled, motionId } = useUltra();
    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const labelRef = useRef(null);
    const trailRefs = useRef([]);
    const [label, setLabel] = useState(null);
    const [mode, setMode] = useState("default"); // default | link | text | drag
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!cursorEnabled || typeof window === "undefined") return;
        if (window.matchMedia("(pointer: coarse)").matches) return;

        let mx = -200;
        let my = -200;
        let rx = -200;
        let ry = -200;
        const trail = Array.from({ length: TRAIL_LENGTH }, () => ({ x: -200, y: -200 }));
        let rafId;

        const onMove = (e) => {
            mx = e.clientX;
            my = e.clientY;
            setVisible(true);
            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
            }
        };

        const onOver = (e) => {
            const el = e.target instanceof Element ? e.target.closest("[data-ux-cursor]") : null;
            if (el) {
                setLabel(el.getAttribute("data-ux-cursor"));
                setMode(el.getAttribute("data-ux-cursor-mode") || "link");
                return;
            }
            const interactive =
                e.target instanceof Element
                    ? e.target.closest("a, button, [role='button'], input, textarea, select")
                    : null;
            if (interactive) {
                setLabel(null);
                const tag = interactive.tagName;
                setMode(tag === "INPUT" || tag === "TEXTAREA" ? "text" : "link");
            } else {
                setLabel(null);
                setMode("default");
            }
        };

        const onLeave = () => setVisible(false);

        const loop = () => {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
            }
            if (labelRef.current) {
                labelRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
            }

            // Trail: mỗi điểm đuổi theo điểm trước
            let px = mx;
            let py = my;
            for (let i = 0; i < trail.length; i++) {
                trail[i].x += (px - trail[i].x) * 0.3;
                trail[i].y += (py - trail[i].y) * 0.3;
                px = trail[i].x;
                py = trail[i].y;
                const node = trailRefs.current[i];
                if (node) {
                    node.style.transform = `translate3d(${trail[i].x}px, ${trail[i].y}px, 0) translate(-50%, -50%)`;
                }
            }

            rafId = requestAnimationFrame(loop);
        };

        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("mouseover", onOver, { passive: true });
        document.addEventListener("mouseleave", onLeave);
        rafId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseover", onOver);
            document.removeEventListener("mouseleave", onLeave);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [cursorEnabled]);

    if (!cursorEnabled) return null;

    const ringSize = mode === "link" ? 56 : mode === "text" ? 4 : 34;
    const showTrail = motionId === "cinematic" || motionId === "balanced";

    return (
        <div
            className="pointer-events-none fixed inset-0 z-[1200] hidden md:block"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
            aria-hidden="true"
        >
            {/* Trail */}
            {showTrail &&
                Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
                    <span
                        key={i}
                        ref={(el) => (trailRefs.current[i] = el)}
                        className="fixed left-0 top-0 rounded-full"
                        style={{
                            width: `${Math.max(2, 8 - i * 0.6)}px`,
                            height: `${Math.max(2, 8 - i * 0.6)}px`,
                            background: "var(--ux-accent)",
                            opacity: (1 - i / TRAIL_LENGTH) * 0.32,
                            filter: "blur(1px)",
                        }}
                    />
                ))}

            {/* Ring */}
            <span
                ref={ringRef}
                className="fixed left-0 top-0 rounded-full border"
                style={{
                    width: `${ringSize}px`,
                    height: `${ringSize}px`,
                    borderColor:
                        mode === "text" ? "transparent" : "color-mix(in srgb, var(--ux-accent) 70%, transparent)",
                    background:
                        mode === "link"
                            ? "var(--ux-glow-soft)"
                            : mode === "text"
                            ? "var(--ux-accent)"
                            : "transparent",
                    boxShadow: `0 0 18px var(--ux-glow-soft)`,
                    transition: "width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1), background-color 0.3s, border-color 0.3s",
                }}
            />

            {/* Dot lõi */}
            <span
                ref={dotRef}
                className="fixed left-0 top-0 rounded-full"
                style={{
                    width: "6px",
                    height: "6px",
                    background: "var(--ux-accent)",
                    boxShadow: "0 0 12px var(--ux-glow)",
                }}
            />

            {/* Nhãn ngữ cảnh */}
            {label && (
                <span
                    ref={labelRef}
                    className="fixed left-0 top-0"
                >
                    <span
                        className="absolute left-8 top-4 whitespace-nowrap rounded-lg border px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider"
                        style={{
                            borderColor: "var(--ux-border)",
                            background: "var(--ux-bg-1)",
                            color: "var(--ux-accent)",
                        }}
                    >
                        {label}
                    </span>
                </span>
            )}
        </div>
    );
}
