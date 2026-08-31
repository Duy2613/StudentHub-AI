"use client";

// frontend/src/components/ultra/UltraMotionKit.jsx
//
// ULTRA MOTION KIT — Bộ nguyên thuỷ animation dùng lại toàn site:
//   • UltraReveal        — fade + slide/blur khi phần tử vào khung nhìn (IntersectionObserver)
//   • UltraStagger       — bọc nhiều con, tự động delay tuần tự
//   • UltraCounter       — số đếm tăng dần với easing, hỗ trợ hậu tố & thập phân
//   • UltraScramble      — chữ giải mã ký tự ngẫu nhiên khi vào khung nhìn
//   • UltraSplitText     — tách từng chữ, animate từng ký tự (spring)
//   • UltraMarquee       — băng chạy vô hạn 2 chiều, dừng khi hover
//   • UltraTypewriter    — gõ chữ theo nhịp, có con trỏ nhấp nháy
//   • UltraProgressRing  — vòng tiến trình SVG có gradient theo theme
//
// Tất cả tôn trọng motion level: mức "still" render tĩnh ngay lập tức.

import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    Children,
    cloneElement,
    isValidElement,
} from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useUltra } from "./UltraProvider";

/* ══════════════ useOnScreen ══════════════ */
function useOnScreen(options = {}) {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node || seen) return;
        if (typeof IntersectionObserver === "undefined") {
            const timer = setTimeout(() => setSeen(true), 0);
            return () => clearTimeout(timer);
        }

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setSeen(true);
                        obs.disconnect();
                    }
                });
            },
            { threshold: options.threshold ?? 0.18, rootMargin: options.rootMargin ?? "0px 0px -8% 0px" }
        );

        obs.observe(node);
        return () => obs.disconnect();
    }, [seen, options.threshold, options.rootMargin]);

    return [ref, seen];
}

/* ══════════════ 1. UltraReveal ══════════════ */
export function UltraReveal({
    children,
    delay = 0,
    y = 30,
    x = 0,
    blur = 8,
    duration = 0.78,
    className = "",
    as: Tag = "div",
}) {
    const { motionId } = useUltra();
    const [ref, seen] = useOnScreen();
    const still = motionId === "still";

    const MotionTag = motion[Tag] || motion.div;

    return (
        <MotionTag
            ref={ref}
            className={className}
            initial={still ? false : { opacity: 0, y, x, filter: `blur(${blur}px)` }}
            animate={
                still || seen
                    ? { opacity: 1, y: 0, x: 0, filter: "blur(0px)" }
                    : { opacity: 0, y, x, filter: `blur(${blur}px)` }
            }
            transition={{ duration: still ? 0 : duration, delay: still ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </MotionTag>
    );
}

/* ══════════════ 2. UltraStagger ══════════════ */
export function UltraStagger({ children, step = 0.09, className = "", ...revealProps }) {
    const items = Children.toArray(children);
    return (
        <div className={className}>
            {items.map((child, i) => (
                <UltraReveal key={i} delay={i * step} {...revealProps}>
                    {child}
                </UltraReveal>
            ))}
        </div>
    );
}

/* ══════════════ 3. UltraCounter ══════════════ */
export function UltraCounter({
    value,
    decimals = 0,
    suffix = "",
    prefix = "",
    duration = 1.9,
    className = "",
}) {
    const { motionId } = useUltra();
    const [ref, seen] = useOnScreen({ threshold: 0.4 });
    const [display, setDisplay] = useState(motionId === "still" ? value : 0);

    useEffect(() => {
        if (motionId === "still") {
            const timer = setTimeout(() => setDisplay(value), 0);
            return () => clearTimeout(timer);
        }
        if (!seen) return;

        let rafId;
        const start = performance.now();
        const total = duration * 1000;

        const tick = (now) => {
            const p = Math.min(1, (now - start) / total);
            // easeOutExpo
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            setDisplay(value * eased);
            if (p < 1) rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => rafId && cancelAnimationFrame(rafId);
    }, [seen, value, duration, motionId]);

    const formatted = useMemo(() => {
        const n = Number(display);
        return n.toLocaleString("vi-VN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }, [display, decimals]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            {formatted}
            {suffix}
        </span>
    );
}

/* ══════════════ 4. UltraScramble ══════════════ */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*+=<>/\\";

export function UltraScramble({ text, className = "", speed = 34, holdRatio = 0.42 }) {
    const { motionId } = useUltra();
    const [ref, seen] = useOnScreen({ threshold: 0.35 });
    const [output, setOutput] = useState(motionId === "still" ? text : "");

    useEffect(() => {
        if (motionId === "still") {
            const timer = setTimeout(() => setOutput(text), 0);
            return () => clearTimeout(timer);
        }
        if (!seen) return;

        let frame = 0;
        const chars = text.split("");
        const total = chars.length;
        let intervalId;

        intervalId = setInterval(() => {
            frame++;
            const revealCount = Math.floor(frame * holdRatio);
            const next = chars
                .map((ch, i) => {
                    if (ch === " ") return " ";
                    if (i < revealCount) return ch;
                    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                })
                .join("");
            setOutput(next);
            if (revealCount >= total) clearInterval(intervalId);
        }, speed);

        return () => clearInterval(intervalId);
    }, [seen, text, speed, holdRatio, motionId]);

    return (
        <span ref={ref} className={className}>
            {output || text.replace(/\S/g, "\u00a0")}
        </span>
    );
}

/* ══════════════ 5. UltraSplitText ══════════════ */
export function UltraSplitText({ text, className = "", charClassName = "", step = 0.028 }) {
    const { motionId } = useUltra();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.3 });
    const still = motionId === "still";
    const words = text.split(" ");

    return (
        <span ref={ref} className={className}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
              {words.map((word, wi) => (
                <span key={wi} className="inline-block whitespace-nowrap">
                    {word.split("").map((ch, ci) => {
                        const idx = wi * 6 + ci;
                        return (
                            <motion.span
                                key={ci}
                                className={`inline-block ${charClassName}`}
                                initial={still ? false : { opacity: 0, y: 26, rotateX: -70 }}
                                animate={
                                    still || inView
                                        ? { opacity: 1, y: 0, rotateX: 0 }
                                        : { opacity: 0, y: 26, rotateX: -70 }
                                }
                                transition={{
                                    duration: still ? 0 : 0.62,
                                    delay: still ? 0 : idx * step,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                aria-hidden="true"
                            >
                                {ch}
                            </motion.span>
                        );
                    })}
                    {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
                </span>
              ))}
            </span>
        </span>
    );
}

/* ══════════════ 6. UltraMarquee ══════════════ */
export function UltraMarquee({
    children,
    speed = 26,
    reverse = false,
    className = "",
    pauseOnHover = true,
}) {
    const { motionId } = useUltra();
    const items = Children.toArray(children);

    if (motionId === "still") {
        return (
            <div
                className={`flex gap-6 overflow-x-auto ${className}`}
                role="region"
                aria-label="Nội dung chạy ngang"
                tabIndex={0}
            >
                {items}
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div
                className={`flex w-max gap-6 ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
                style={{
                    animation: `ux-marquee-x ${speed}s linear infinite`,
                    animationDirection: reverse ? "reverse" : "normal",
                }}
            >
                {items}
                {items.map((child, i) =>
                    isValidElement(child) ? cloneElement(child, { key: `dup-${i}` }) : child
                )}
            </div>
            {/* Mờ 2 biên */}
            <div
                className="pointer-events-none absolute inset-y-0 left-0 w-16"
                style={{ background: "linear-gradient(90deg, var(--ux-bg-0), transparent)" }}
            />
            <div
                className="pointer-events-none absolute inset-y-0 right-0 w-16"
                style={{ background: "linear-gradient(270deg, var(--ux-bg-0), transparent)" }}
            />
        </div>
    );
}

/* ══════════════ 7. UltraTypewriter ══════════════ */
export function UltraTypewriter({ lines = [], className = "", speed = 26, linePause = 700 }) {
    const { motionId } = useUltra();
    const [ref, seen] = useOnScreen({ threshold: 0.3 });
    const [rendered, setRendered] = useState([]);

    useEffect(() => {
        if (motionId === "still") {
            const timer = setTimeout(() => setRendered(lines), 0);
            return () => clearTimeout(timer);
        }
        if (!seen) return;

        let cancelled = false;
        let lineIdx = 0;
        let charIdx = 0;
        const out = [];

        const step = () => {
            if (cancelled || lineIdx >= lines.length) return;
            const line = lines[lineIdx];
            charIdx++;
            out[lineIdx] = line.slice(0, charIdx);
            setRendered([...out]);

            if (charIdx >= line.length) {
                lineIdx++;
                charIdx = 0;
                setTimeout(step, linePause);
            } else {
                setTimeout(step, speed);
            }
        };

        step();
        return () => {
            cancelled = true;
        };
    }, [seen, lines, speed, linePause, motionId]);

    return (
        <div ref={ref} className={className}>
            {rendered.map((line, i) => (
                <p key={i} className="font-mono text-[12.5px] leading-relaxed">
                    <span style={{ color: "var(--ux-accent)" }}>{">"} </span>
                    <span className="text-white/80">{line}</span>
                    {i === rendered.length - 1 && line.length < (lines[i]?.length ?? 0) && (
                        <span
                            className="ml-0.5 inline-block h-3.5 w-1.5 align-middle"
                            style={{
                                background: "var(--ux-accent)",
                                animation: "ux-pulse 0.9s steps(2) infinite",
                            }}
                        />
                    )}
                </p>
            ))}
        </div>
    );
}

/* ══════════════ 8. UltraProgressRing ══════════════ */
export function UltraProgressRing({
    value = 0,
    max = 100,
    size = 120,
    thickness = 8,
    label,
    sublabel,
    tone,
}) {
    const { motionId } = useUltra();
    const [ref, seen] = useOnScreen({ threshold: 0.4 });
    const pct = Math.max(0, Math.min(1, value / max));
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;

    const mv = useMotionValue(0);
    const spring = useSpring(mv, { stiffness: 90, damping: 22 });
    const dashOffset = useTransform(spring, (v) => circumference * (1 - v));

    useEffect(() => {
        if (motionId === "still") {
            mv.set(pct);
            return;
        }
        if (seen) mv.set(pct);
    }, [seen, pct, mv, motionId]);

    const color = tone || "var(--ux-accent)";
    const gid = `ux-ring-${Math.round(size)}-${Math.round(value)}`;

    return (
        <div ref={ref} className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--ux-accent-2)" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.09)"
                    strokeWidth={thickness}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gid})`}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: dashOffset, filter: "drop-shadow(0 0 8px var(--ux-glow))" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-xl font-black leading-none text-white">
                    <UltraCounter value={value} suffix={label || ""} />
                </span>
                {sublabel && (
                    <span className="mt-1 font-mono text-[8.5px] font-bold uppercase tracking-wider text-white/40">
                        {sublabel}
                    </span>
                )}
            </div>
        </div>
    );
}

export { useOnScreen };
