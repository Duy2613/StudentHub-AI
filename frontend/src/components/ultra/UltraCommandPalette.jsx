"use client";

// frontend/src/components/ultra/UltraCommandPalette.jsx
//
// ULTRA COMMAND PALETTE (⌘K / Ctrl+K)
// - Fuzzy search không dấu toàn bộ 30+ trang & lệnh hệ thống
// - Điều hướng bàn phím đầy đủ (↑ ↓ Enter Esc, Tab nhóm)
// - Lệnh hành động: đổi theme, đổi mức hiệu ứng, bật/tắt grain, mở sitemap
// - Hiệu ứng: glass blur sâu, spring scale-in, hàng chọn có glow chạy viền

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import * as Icons from "lucide-react";
import { searchRoutes, ULTRA_GROUPS } from "@/lib/ultra/routes";
import { useUltra } from "./UltraProvider";

function Icon({ name, className }) {
    const Cmp = Icons[name] || Icons.Circle;
    return <Cmp className={className} />;
}

export default function UltraCommandPalette() {
    const router = useRouter();
    const {
        paletteOpen,
        setPaletteOpen,
        setStudioOpen,
        setSitemapOpen,
        themes,
        setThemeId,
        themeId,
        motionLevels,
        setMotionId,
        motionId,
        grainEnabled,
        setGrainEnabled,
        cursorEnabled,
        setCursorEnabled,
        pushToast,
    } = useUltra();

    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // ── Lệnh hành động (không phải điều hướng) ────────────────
    const actionCommands = useMemo(() => {
        const cmds = [
            {
                id: "act-studio",
                kind: "action",
                title: "Mở Theme Studio",
                desc: "Tuỳ biến bảng màu, mức hiệu ứng, film grain",
                icon: "Palette",
                keywords: "theme studio mau sac tuy bien hieu ung",
                run: () => setStudioOpen(true),
            },
            {
                id: "act-sitemap",
                kind: "action",
                title: "Mở Sitemap Orbit 3D",
                desc: "Bản đồ toàn site dạng quỹ đạo 3D tương tác",
                icon: "Orbit",
                keywords: "sitemap orbit ban do toan site 3d",
                run: () => setSitemapOpen(true),
            },
            {
                id: "act-grain",
                kind: "action",
                title: grainEnabled ? "Tắt Film Grain" : "Bật Film Grain",
                desc: "Lớp nhiễu điện ảnh phủ toàn màn hình",
                icon: "Film",
                keywords: "film grain nhieu dien anh bat tat",
                run: () => {
                    setGrainEnabled(!grainEnabled);
                    pushToast({
                        tone: "info",
                        title: "Film Grain",
                        message: grainEnabled ? "Đã tắt lớp nhiễu điện ảnh." : "Đã bật lớp nhiễu điện ảnh.",
                    });
                },
            },
            {
                id: "act-cursor",
                kind: "action",
                title: cursorEnabled ? "Tắt Con Trỏ Ultra" : "Bật Con Trỏ Ultra",
                desc: "Con trỏ magnetic có vành sáng & nhãn ngữ cảnh",
                icon: "MousePointer2",
                keywords: "cursor con tro magnetic bat tat",
                run: () => {
                    setCursorEnabled(!cursorEnabled);
                    pushToast({
                        tone: "info",
                        title: "Con Trỏ Ultra",
                        message: cursorEnabled ? "Đã trả về con trỏ hệ thống." : "Đã bật con trỏ Ultra.",
                    });
                },
            },
        ];

        themes.forEach((t) => {
            cmds.push({
                id: `theme-${t.id}`,
                kind: "action",
                title: `Bảng màu: ${t.name}`,
                desc: t.tagline,
                icon: "Swatch" in Icons ? "Swatch" : "Paintbrush",
                keywords: `theme bang mau ${t.id} ${t.name}`,
                accent: t.vars["--ux-accent"],
                active: themeId === t.id,
                run: () => {
                    setThemeId(t.id);
                    pushToast({ tone: "success", title: "Đã đổi bảng màu", message: t.name });
                },
            });
        });

        motionLevels.forEach((m) => {
            cmds.push({
                id: `motion-${m.id}`,
                kind: "action",
                title: `Mức hiệu ứng: ${m.name}`,
                desc: m.desc,
                icon: "Gauge",
                keywords: `motion hieu ung muc ${m.id} ${m.name}`,
                active: motionId === m.id,
                run: () => {
                    setMotionId(m.id);
                    pushToast({ tone: "success", title: "Mức hiệu ứng", message: m.name });
                },
            });
        });

        return cmds;
    }, [
        themes,
        themeId,
        motionLevels,
        motionId,
        grainEnabled,
        cursorEnabled,
        setStudioOpen,
        setSitemapOpen,
        setGrainEnabled,
        setCursorEnabled,
        setThemeId,
        setMotionId,
        pushToast,
    ]);

    // ── Kết quả tổng hợp: routes + actions ────────────────────
    const results = useMemo(() => {
        const routeHits = searchRoutes(query, 10).map(({ route }) => ({
            id: `route-${route.id}`,
            kind: "route",
            title: route.title,
            desc: route.desc,
            icon: route.icon,
            path: route.path,
            badge: route.badge,
            group: route.group,
            accent: ULTRA_GROUPS[route.group]?.color,
        }));

        const q = query.trim().toLowerCase();
        const actionHits = actionCommands
            .filter((c) => {
                if (!q) return c.id === "act-studio" || c.id === "act-sitemap";
                const hay = `${c.title} ${c.desc} ${c.keywords}`
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase();
                const nq = q
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase();
                return nq.split(/\s+/).every((tok) => hay.includes(tok));
            })
            .slice(0, 8);

        return [...routeHits, ...actionHits];
    }, [query, actionCommands]);

    // Reset khi mở
    useEffect(() => {
        if (paletteOpen) {
            const resetTimer = setTimeout(() => {
                setQuery("");
                setActiveIndex(0);
            }, 0);
            const focusTimer = setTimeout(() => inputRef.current?.focus(), 60);
            return () => {
                clearTimeout(resetTimer);
                clearTimeout(focusTimer);
            };
        }
    }, [paletteOpen]);

    useEffect(() => {
        const timer = setTimeout(() => setActiveIndex(0), 0);
        return () => clearTimeout(timer);
    }, [query]);

    // Chặn scroll body khi mở
    useEffect(() => {
        if (typeof document === "undefined") return;
        if (paletteOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [paletteOpen]);

    const execute = useCallback(
        (item) => {
            if (!item) return;
            setPaletteOpen(false);
            if (item.kind === "route") {
                router.push(item.path);
            } else if (typeof item.run === "function") {
                item.run();
            }
        },
        [router, setPaletteOpen]
    );

    const onKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            execute(results[activeIndex]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setPaletteOpen(false);
        }
    };

    // Cuộn hàng đang chọn vào tầm nhìn
    useEffect(() => {
        const node = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
        node?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    return (
        <AnimatePresence>
            {paletteOpen && (
                <div className="fixed inset-0 z-[1000] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => setPaletteOpen(false)}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: -18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -12 }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
                        style={{
                            background: "color-mix(in srgb, var(--ux-bg-1) 94%, transparent)",
                            borderColor: "var(--ux-border)",
                            backdropFilter: "blur(28px)",
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Ultra Command Palette"
                    >
                        {/* Viền glow chạy */}
                        <div
                            className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                            style={{
                                background:
                                    "linear-gradient(90deg, transparent, var(--ux-accent), transparent)",
                                animation: "ux-border-run 2.6s linear infinite",
                            }}
                        />

                        {/* Search input */}
                        <div
                            className="flex items-center gap-3 border-b px-5 py-4"
                            style={{ borderColor: "var(--ux-border)" }}
                        >
                            <Icons.Search
                                className="h-5 w-5 shrink-0"
                                style={{ color: "var(--ux-accent)" }}
                            />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Tìm trang, lệnh, bảng màu… (thử: hoc bong, scam, theme tim)"
                                className="w-full bg-transparent text-[15px] font-medium text-white outline-none placeholder:text-white/35"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <kbd
                                className="hidden shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] font-bold sm:inline"
                                style={{
                                    borderColor: "var(--ux-border)",
                                    color: "var(--ux-accent-2)",
                                    background: "var(--ux-bg-2)",
                                }}
                            >
                                ESC
                            </kbd>
                        </div>

                        {/* Results */}
                        <div ref={listRef} className="max-h-[52vh] overflow-y-auto overscroll-contain p-2">
                            {results.length === 0 && (
                                <div className="px-4 py-10 text-center">
                                    <Icons.SearchX className="mx-auto mb-3 h-8 w-8 text-white/25" />
                                    <p className="text-sm font-semibold text-white/70">
                                        Không tìm thấy kết quả cho “{query}”
                                    </p>
                                    <p className="mt-1 text-xs text-white/40">
                                        Thử từ khoá không dấu: “hoc bong”, “lich tin chi”, “dien dan”.
                                    </p>
                                </div>
                            )}

                            {results.map((item, idx) => {
                                const isActive = idx === activeIndex;
                                return (
                                    <button
                                        key={item.id}
                                        data-idx={idx}
                                        type="button"
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => execute(item)}
                                        className="group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors"
                                        style={{
                                            background: isActive
                                                ? "color-mix(in srgb, var(--ux-accent) 12%, transparent)"
                                                : "transparent",
                                        }}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="ux-palette-active"
                                                transition={{ type: "spring", stiffness: 520, damping: 36 }}
                                                className="absolute inset-0 rounded-2xl border"
                                                style={{
                                                    borderColor: "color-mix(in srgb, var(--ux-accent) 45%, transparent)",
                                                    boxShadow: "0 0 24px var(--ux-glow-soft)",
                                                }}
                                            />
                                        )}

                                        <span
                                            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                                            style={{
                                                borderColor: "var(--ux-border)",
                                                background: "var(--ux-bg-2)",
                                                color: item.accent || "var(--ux-accent)",
                                            }}
                                        >
                                            <Icon name={item.icon} className="h-4 w-4" />
                                        </span>

                                        <span className="relative min-w-0 flex-1">
                                            <span className="flex items-center gap-2">
                                                <span className="truncate text-sm font-bold text-white">
                                                    {item.title}
                                                </span>
                                                {item.badge && (
                                                    <span
                                                        className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase"
                                                        style={{
                                                            borderColor:
                                                                "color-mix(in srgb, var(--ux-accent) 40%, transparent)",
                                                            color: "var(--ux-accent)",
                                                            background: "var(--ux-glow-soft)",
                                                        }}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {item.active && (
                                                    <Icons.Check
                                                        className="h-3.5 w-3.5 shrink-0"
                                                        style={{ color: "var(--ux-accent)" }}
                                                    />
                                                )}
                                            </span>
                                            <span className="mt-0.5 block truncate text-[11.5px] text-white/45">
                                                {item.desc}
                                            </span>
                                        </span>

                                        <span className="relative shrink-0 font-mono text-[10px] uppercase tracking-wider text-white/30">
                                            {item.kind === "route" ? item.path : "LỆNH"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer hint bar */}
                        <div
                            className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white/40"
                            style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                        >
                            <span className="flex items-center gap-3">
                                <span>↑↓ Di chuyển</span>
                                <span>↵ Mở</span>
                                <span>ESC Đóng</span>
                            </span>
                            <span className="flex items-center gap-3">
                                <span>⌘/ Theme Studio</span>
                                <span>⇧? Sitemap 3D</span>
                            </span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
