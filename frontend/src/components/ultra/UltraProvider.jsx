"use client";

// frontend/src/components/ultra/UltraProvider.jsx
//
// ULTRA PROVIDER — Trung tâm điều phối trải nghiệm toàn cục:
// - Theme runtime (6 palette điện ảnh) + Motion level (4 mức)
// - Cờ bật/tắt: film grain, custom cursor, âm thanh UI
// - Trạng thái Command Palette (⌘K), Theme Studio, Sitemap Orbit
// - Đo FPS thời gian thực & tự động hạ cấp hiệu ứng (adaptive degradation)
// - Toast notification queue
// - Tôn trọng prefers-reduced-motion và lưu preference vào localStorage

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
} from "react";
import {
    ULTRA_THEMES,
    MOTION_LEVELS,
    DEFAULT_THEME_ID,
    DEFAULT_MOTION_ID,
    getTheme,
    getMotionLevel,
    applyThemeToDocument,
    applyMotionToDocument,
    STORAGE_KEYS,
} from "@/lib/ultra/themes";

const UltraContext = createContext(null);

function readStored(key, fallback) {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : raw;
    } catch {
        return fallback;
    }
}

function writeStored(key, value) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, String(value));
    } catch {
        /* localStorage bị chặn — bỏ qua, không crash UI */
    }
}

export function UltraProvider({ children }) {
    // ── Preferences ───────────────────────────────────────────
    const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
    const [motionId, setMotionId] = useState(DEFAULT_MOTION_ID);
    const [grainEnabled, setGrainEnabled] = useState(true);
    const [cursorEnabled, setCursorEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // ── Overlay state ─────────────────────────────────────────
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [studioOpen, setStudioOpen] = useState(false);
    const [sitemapOpen, setSitemapOpen] = useState(false);

    // ── Telemetry ─────────────────────────────────────────────
    const [fps, setFps] = useState(60);
    const [autoDegraded, setAutoDegraded] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    // ── Toasts ────────────────────────────────────────────────
    const [toasts, setToasts] = useState([]);
    const toastSeq = useRef(0);

    const pushToast = useCallback((toast) => {
        const id = ++toastSeq.current;
        const entry = {
            id,
            tone: toast.tone || "info",
            title: toast.title || "Thông báo",
            message: toast.message || "",
            duration: toast.duration ?? 4200,
        };
        setToasts((prev) => [...prev.slice(-4), entry]);
        if (entry.duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, entry.duration);
        }
        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // ── Hydrate preferences từ localStorage (client-only) ─────
    useEffect(() => {
        const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const constrainedDevice =
            typeof window !== "undefined" &&
            (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
        const automaticMotion = prefersReduced
            ? "still"
            : constrainedDevice
            ? "performance"
            : DEFAULT_MOTION_ID;

        const storedTheme = readStored(STORAGE_KEYS.theme, DEFAULT_THEME_ID);
        const storedMotion = readStored(
            STORAGE_KEYS.motion,
            automaticMotion
        );

        const timer = setTimeout(() => {
            setThemeId(ULTRA_THEMES.some((t) => t.id === storedTheme) ? storedTheme : DEFAULT_THEME_ID);
            const selectedMotion = MOTION_LEVELS.some((m) => m.id === storedMotion) ? storedMotion : automaticMotion;
            setMotionId(prefersReduced ? "still" : constrainedDevice && selectedMotion === "cinematic" ? "performance" : selectedMotion);
            setGrainEnabled(readStored(STORAGE_KEYS.grain, "true") !== "false");
            setCursorEnabled(readStored(STORAGE_KEYS.cursor, "true") !== "false");
            setSoundEnabled(readStored(STORAGE_KEYS.sound, "false") === "true");
            setHydrated(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // ── Áp theme & motion vào DOM ─────────────────────────────
    useEffect(() => {
        applyThemeToDocument(themeId);
        if (hydrated) writeStored(STORAGE_KEYS.theme, themeId);
    }, [themeId, hydrated]);

    useEffect(() => {
        applyMotionToDocument(motionId);
        if (hydrated) writeStored(STORAGE_KEYS.motion, motionId);
    }, [motionId, hydrated]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.documentElement.setAttribute("data-ultra-grain", grainEnabled ? "on" : "off");
        if (hydrated) writeStored(STORAGE_KEYS.grain, grainEnabled);
    }, [grainEnabled, hydrated]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.documentElement.setAttribute("data-ultra-cursor", cursorEnabled ? "on" : "off");
        if (hydrated) writeStored(STORAGE_KEYS.cursor, cursorEnabled);
    }, [cursorEnabled, hydrated]);

    useEffect(() => {
        if (hydrated) writeStored(STORAGE_KEYS.sound, soundEnabled);
    }, [soundEnabled, hydrated]);

    // ── FPS monitor + adaptive degradation ────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (motionId === "still") {
            const timer = setTimeout(() => setFps(60), 0);
            return () => clearTimeout(timer);
        }

        let frames = 0;
        let last = performance.now();
        let rafId;
        let lowStreak = 0;
        let cancelled = false;

        const tick = (now) => {
            if (cancelled) return;
            frames++;
            const elapsed = now - last;
            if (elapsed >= 1000) {
                const current = Math.round((frames * 1000) / elapsed);
                setFps(current);
                frames = 0;
                last = now;

                // Nếu FPS < 32 liên tục 4 giây -> tự động hạ cấp một bậc
                if (current > 0 && current < 32) {
                    lowStreak++;
                    if (lowStreak >= 4) {
                        lowStreak = 0;
                        setMotionId((prev) => {
                            const order = ["cinematic", "balanced", "performance"];
                            const idx = order.indexOf(prev);
                            if (idx >= 0 && idx < order.length - 1) {
                                setAutoDegraded(true);
                                return order[idx + 1];
                            }
                            return prev;
                        });
                    }
                } else {
                    lowStreak = 0;
                }
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [motionId]);

    // ── Scroll progress toàn cục ──────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        let rafId = null;

        const compute = () => {
            rafId = null;
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;
            setScrollProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
        };

        const onScroll = () => {
            if (rafId === null) rafId = requestAnimationFrame(compute);
        };

        compute();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    // ── Global hotkeys ────────────────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;

        const onKeyDown = (e) => {
            const target = e.target;
            const isTyping =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);

            // ⌘K / Ctrl+K -> Command palette
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((p) => !p);
                return;
            }

            // ⌘/ hoặc Ctrl+/ -> Theme Studio
            if ((e.metaKey || e.ctrlKey) && e.key === "/") {
                e.preventDefault();
                setStudioOpen((p) => !p);
                return;
            }

            // Shift + ? -> Sitemap orbit
            if (!isTyping && e.shiftKey && e.key === "?") {
                e.preventDefault();
                setSitemapOpen((p) => !p);
                return;
            }

            if (e.key === "Escape") {
                setPaletteOpen(false);
                setStudioOpen(false);
                setSitemapOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const theme = useMemo(() => getTheme(themeId), [themeId]);
    const motion = useMemo(() => getMotionLevel(motionId), [motionId]);

    const cycleTheme = useCallback(() => {
        setThemeId((prev) => {
            const idx = ULTRA_THEMES.findIndex((t) => t.id === prev);
            return ULTRA_THEMES[(idx + 1) % ULTRA_THEMES.length].id;
        });
    }, []);

    const value = useMemo(
        () => ({
            // theme
            themeId,
            theme,
            setThemeId,
            cycleTheme,
            themes: ULTRA_THEMES,
            // motion
            motionId,
            motion,
            setMotionId,
            motionLevels: MOTION_LEVELS,
            autoDegraded,
            resetDegradation: () => {
                setAutoDegraded(false);
                setMotionId("cinematic");
            },
            // toggles
            grainEnabled,
            setGrainEnabled,
            cursorEnabled,
            setCursorEnabled,
            soundEnabled,
            setSoundEnabled,
            // overlays
            paletteOpen,
            setPaletteOpen,
            studioOpen,
            setStudioOpen,
            sitemapOpen,
            setSitemapOpen,
            // telemetry
            fps,
            scrollProgress,
            hydrated,
            // toasts
            toasts,
            pushToast,
            dismissToast,
        }),
        [
            themeId,
            theme,
            cycleTheme,
            motionId,
            motion,
            autoDegraded,
            grainEnabled,
            cursorEnabled,
            soundEnabled,
            paletteOpen,
            studioOpen,
            sitemapOpen,
            fps,
            scrollProgress,
            hydrated,
            toasts,
            pushToast,
            dismissToast,
        ]
    );

    return <UltraContext.Provider value={value}>{children}</UltraContext.Provider>;
}

export function useUltra() {
    const ctx = useContext(UltraContext);
    if (!ctx) {
        // Fallback an toàn: cho phép component dùng ngoài provider mà không crash
        return {
            themeId: DEFAULT_THEME_ID,
            theme: getTheme(DEFAULT_THEME_ID),
            setThemeId: () => {},
            cycleTheme: () => {},
            themes: ULTRA_THEMES,
            motionId: DEFAULT_MOTION_ID,
            motion: getMotionLevel(DEFAULT_MOTION_ID),
            setMotionId: () => {},
            motionLevels: MOTION_LEVELS,
            autoDegraded: false,
            resetDegradation: () => {},
            grainEnabled: true,
            setGrainEnabled: () => {},
            cursorEnabled: true,
            setCursorEnabled: () => {},
            soundEnabled: false,
            setSoundEnabled: () => {},
            paletteOpen: false,
            setPaletteOpen: () => {},
            studioOpen: false,
            setStudioOpen: () => {},
            sitemapOpen: false,
            setSitemapOpen: () => {},
            fps: 60,
            scrollProgress: 0,
            hydrated: false,
            toasts: [],
            pushToast: () => 0,
            dismissToast: () => {},
        };
    }
    return ctx;
}
