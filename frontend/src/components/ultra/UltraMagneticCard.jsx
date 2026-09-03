"use client";

// frontend/src/components/ultra/UltraMagneticCard.jsx
//
// ULTRA MAGNETIC 3D CARD — Thẻ nghiêng theo con trỏ với:
// - Tilt 3D thực (rotateX/rotateY tính từ vị trí chuột trong thẻ)
// - Spotlight radial-gradient bám theo con trỏ
// - Lớp nội dung nổi (translateZ) tạo cảm giác chiều sâu
// - Glare/sheen phản chiếu, viền glow theo theme runtime
// - Tự tắt tilt khi motion level là performance/still hoặc trên thiết bị touch

import React, { useRef, useState, useCallback } from "react";
import { useUltra } from "./UltraProvider";

export default function UltraMagneticCard({
    children,
    className = "",
    intensity = 12,
    glare = true,
    spotlight = true,
    depth = 34,
    as: Tag = "div",
    ...rest
}) {
    const ref = useRef(null);
    const { motion: level, motionId } = useUltra();
    const [style, setStyle] = useState({});
    const [pointer, setPointer] = useState({ x: 50, y: 50, active: false });

    const enabled = motionId !== "still" && level.parallax > 0.2;

    const handleMove = useCallback(
        (e) => {
            if (!enabled || !ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;

            const rotY = (px - 0.5) * intensity * 2 * level.parallax;
            const rotX = -(py - 0.5) * intensity * 2 * level.parallax;

            setStyle({
                transform: `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(
                    2
                )}deg) scale3d(1.018, 1.018, 1.018)`,
            });
            setPointer({ x: px * 100, y: py * 100, active: true });
        },
        [enabled, intensity, level.parallax]
    );

    const handleLeave = useCallback(() => {
        setStyle({
            transform: "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
        });
        setPointer((p) => ({ ...p, active: false }));
    }, []);

    return (
        <Tag
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className={`ux-glass ux-tilt group relative overflow-hidden ${className}`}
            style={{
                ...style,
                transition: "transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            {...rest}
        >
            {/* Spotlight bám con trỏ */}
            {spotlight && enabled && (
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                        opacity: pointer.active ? 1 : 0,
                        background: `radial-gradient(420px circle at ${pointer.x}% ${pointer.y}%, var(--ux-glow-soft), transparent 62%)`,
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Glare phản chiếu */}
            {glare && enabled && (
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                    style={{
                        opacity: pointer.active ? 0.5 : 0,
                        background: `linear-gradient(${
                            110 + (pointer.x - 50) * 0.7
                        }deg, transparent 32%, rgba(255,255,255,0.13) 48%, transparent 62%)`,
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Nội dung nổi */}
            <div
                className="relative"
                style={{
                    transform: enabled ? `translateZ(${depth * level.parallax}px)` : "none",
                    transformStyle: "preserve-3d",
                }}
            >
                {children}
            </div>
        </Tag>
    );
}
