"use client";

// frontend/src/components/ultra/sections/UltraThemeShowcase.jsx
//
// Chương 04 — THEME LIVE PREVIEW:
// - 6 thẻ bảng màu, bấm là toàn bộ site (kể cả WebGL) đổi màu tức thì
// - Khối "component preview" hiển thị nút / badge / thẻ / input dưới theme đang chọn
// - Băng token CSS đang áp dụng (đọc trực tiếp từ theme object)

import React from "react";
import { Check, Palette, Droplet, Type, ToggleRight } from "lucide-react";
import { UltraReveal } from "../UltraMotionKit";
import UltraMagneticCard from "../UltraMagneticCard";
import { useUltra } from "../UltraProvider";

export default function UltraThemeShowcase() {
    const { themes, themeId, setThemeId, theme, pushToast } = useUltra();

    return (
        <section id="ultra-themes" className="relative py-24 sm:py-32">
            <div className="layout-safe-container">
                <UltraReveal>
                    <div className="mb-11 max-w-2xl">
                        <span
                            className="font-mono text-[10px] font-black uppercase tracking-[0.24em]"
                            style={{ color: "var(--ux-accent)" }}
                        >
                            CHƯƠNG 04 — BẢNG MÀU ĐIỆN ẢNH
                        </span>
                        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                            6 vũ trụ màu, <span className="ux-text-accent">đổi trong 1 nhịp</span>
                        </h2>
                        <p className="mt-4 text-[14.5px] leading-relaxed text-white/55">
                            Bấm bất kỳ thẻ dưới đây — toàn bộ giao diện, kể cả sân khấu WebGL, hạt 3D và
                            sương mù đều đổi màu ngay lập tức. Lựa chọn được ghi nhớ cho lần truy cập sau.
                        </p>
                    </div>
                </UltraReveal>

                {/* Grid theme */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {themes.map((t, i) => {
                        const active = t.id === themeId;
                        return (
                            <UltraReveal key={t.id} delay={i * 0.06}>
                                <UltraMagneticCard
                                    as="div"
                                    className="h-full cursor-pointer"
                                    intensity={9}
                                    depth={24}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setThemeId(t.id);
                                            pushToast({
                                                tone: "success",
                                                title: "Đã áp bảng màu",
                                                message: `${t.name} — ${t.tagline}`,
                                            });
                                        }}
                                        className="flex h-full w-full flex-col gap-4 p-5 text-left"
                                        data-ux-cursor={`ÁP ${t.name.toUpperCase()}`}
                                    >
                                        {/* Preview swatch lớn */}
                                        <div
                                            className="relative h-28 overflow-hidden rounded-2xl border"
                                            style={{
                                                borderColor: t.vars["--ux-border"],
                                                background: `radial-gradient(circle at 30% 25%, ${t.vars["--ux-accent"]}44, transparent 62%), radial-gradient(circle at 78% 78%, ${t.vars["--ux-accent-3"]}3a, transparent 60%), ${t.vars["--ux-bg-0"]}`,
                                            }}
                                        >
                                            {/* Lưới nhỏ */}
                                            <div
                                                className="absolute inset-0 opacity-40"
                                                style={{
                                                    backgroundImage: `linear-gradient(${t.vars["--ux-accent"]}18 1px, transparent 1px), linear-gradient(90deg, ${t.vars["--ux-accent"]}18 1px, transparent 1px)`,
                                                    backgroundSize: "22px 22px",
                                                }}
                                            />
                                            {/* Mock UI mini */}
                                            <div className="absolute inset-0 flex flex-col justify-end gap-1.5 p-3">
                                                <span
                                                    className="h-1.5 w-16 rounded-full"
                                                    style={{ background: t.vars["--ux-accent"] }}
                                                />
                                                <span
                                                    className="h-1.5 w-24 rounded-full"
                                                    style={{ background: `${t.vars["--ux-text"]}44` }}
                                                />
                                                <span
                                                    className="mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[8.5px] font-black"
                                                    style={{
                                                        background: t.vars["--ux-accent"],
                                                        color: t.vars["--ux-bg-0"],
                                                    }}
                                                >
                                                    CTA
                                                </span>
                                            </div>

                                            {active && (
                                                <span
                                                    className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full"
                                                    style={{
                                                        background: t.vars["--ux-accent"],
                                                        color: t.vars["--ux-bg-0"],
                                                    }}
                                                >
                                                    <Check className="h-3.5 w-3.5" strokeWidth={3.2} />
                                                </span>
                                            )}
                                        </div>

                                        {/* Tên & tagline */}
                                        <div>
                                            <h3 className="text-[15px] font-black text-white">{t.name}</h3>
                                            <p className="mt-1 text-[12px] leading-snug text-white/50">
                                                {t.tagline}
                                            </p>
                                        </div>

                                        {/* Token chips */}
                                        <div
                                            className="mt-auto flex flex-wrap gap-1.5 border-t pt-3"
                                            style={{ borderColor: "var(--ux-border)" }}
                                        >
                                            {[
                                                t.vars["--ux-accent"],
                                                t.vars["--ux-accent-2"],
                                                t.vars["--ux-accent-3"],
                                                t.vars["--ux-bg-1"],
                                                t.vars["--ux-border"],
                                            ].map((c) => (
                                                <span
                                                    key={c}
                                                    className="flex items-center gap-1 rounded-md border px-1.5 py-0.5"
                                                    style={{ borderColor: "var(--ux-border)" }}
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-sm"
                                                        style={{ background: c }}
                                                    />
                                                    <span className="font-mono text-[8.5px] uppercase text-white/40">
                                                        {c}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                </UltraMagneticCard>
                            </UltraReveal>
                        );
                    })}
                </div>

                {/* Live component preview dưới theme hiện tại */}
                <UltraReveal delay={0.2}>
                    <div
                        className="ux-glass mt-8 overflow-hidden p-0"
                        style={{ background: "var(--ux-bg-1)" }}
                    >
                        <div
                            className="flex items-center justify-between border-b px-5 py-3"
                            style={{ borderColor: "var(--ux-border)" }}
                        >
                            <span className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                                <Palette className="h-3.5 w-3.5" style={{ color: "var(--ux-accent)" }} />
                                LIVE COMPONENT PREVIEW · {theme.name}
                            </span>
                            <span className="font-mono text-[10px] text-white/30">
                                data-ultra-theme=&quot;{theme.id}&quot;
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                            {/* Nút */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-white/40">
                                    <ToggleRight className="h-3.5 w-3.5" /> NÚT
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="ux-btn ux-btn-primary">Xác thực ngay</span>
                                    <span className="ux-btn">Xem chi tiết</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span
                                        className="rounded-full border px-2.5 py-1 font-mono text-[9.5px] font-black uppercase"
                                        style={{
                                            borderColor: "color-mix(in srgb, var(--ux-accent) 45%, transparent)",
                                            color: "var(--ux-accent)",
                                            background: "var(--ux-glow-soft)",
                                        }}
                                    >
                                        AN TOÀN
                                    </span>
                                    <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 font-mono text-[9.5px] font-black uppercase text-rose-300">
                                        NGUY HIỂM
                                    </span>
                                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[9.5px] font-black uppercase text-amber-300">
                                        CẢNH BÁO
                                    </span>
                                </div>
                            </div>

                            {/* Input */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-white/40">
                                    <Type className="h-3.5 w-3.5" /> NHẬP LIỆU
                                </h4>
                                <input
                                    readOnly
                                    aria-label="URL minh họa để xem trước màu trường nhập liệu"
                                    value="https://hoc-bong-uu-dai.xyz/dang-ky"
                                    className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 font-mono text-[12px] text-white/70 outline-none transition-colors focus:border-[var(--ux-accent)]"
                                    style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-0)" }}
                                />
                                <div
                                    className="rounded-xl border px-3.5 py-2.5"
                                    style={{
                                        borderColor: "color-mix(in srgb, var(--ux-accent) 30%, transparent)",
                                        background: "var(--ux-glow-soft)",
                                    }}
                                >
                                    <p
                                        className="font-mono text-[9.5px] font-black uppercase tracking-wider"
                                        style={{ color: "var(--ux-accent)" }}
                                    >
                                        KẾT QUẢ LỚP 1
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-white/65">
                                        Tên miền .xyz mới đăng ký 3 ngày — rủi ro cao.
                                    </p>
                                </div>
                            </div>

                            {/* Thẻ dữ liệu */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-white/40">
                                    <Droplet className="h-3.5 w-3.5" /> THẺ DỮ LIỆU
                                </h4>
                                <div
                                    className="ux-border-beam rounded-2xl p-4"
                                    style={{ background: "var(--ux-bg-0)" }}
                                >
                                    <div className="flex items-baseline justify-between">
                                        <span className="font-mono text-3xl font-black text-white">92</span>
                                        <span
                                            className="font-mono text-[10px] font-black uppercase"
                                            style={{ color: "var(--ux-accent)" }}
                                        >
                                            /100
                                        </span>
                                    </div>
                                    <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wider text-white/40">
                                        ĐIỂM UY TÍN HỒ SƠ
                                    </p>
                                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: "92%",
                                                background:
                                                    "linear-gradient(90deg, var(--ux-accent-2), var(--ux-accent))",
                                                boxShadow: "0 0 12px var(--ux-glow)",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </UltraReveal>
            </div>
        </section>
    );
}
