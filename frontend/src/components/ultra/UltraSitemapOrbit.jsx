"use client";

// frontend/src/components/ultra/UltraSitemapOrbit.jsx
//
// ULTRA SITEMAP ORBIT 3D (⇧ + ?)
// Bản đồ toàn site dạng thiên hà 3D: mỗi nhóm route là một quỹ đạo (orbital ring),
// mỗi trang là một node phát sáng. Kéo để quay, lăn chuột để zoom, click node để đi.
//
// Kỹ thuật:
// - @react-three/fiber + drei (Html, Line) — dựng orbit ring bằng BufferGeometry
// - Node dùng instanced-free approach (mesh nhỏ, số lượng ~30 => an toàn hiệu năng)
// - Fallback DOM grid khi motion level = performance/still (không dựng WebGL)

import React, { useRef, useMemo, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import * as Icons from "lucide-react";
import { groupedRoutes, ULTRA_GROUPS } from "@/lib/ultra/routes";
import { useUltra } from "./UltraProvider";

function Icon({ name, className, style }) {
    const Cmp = Icons[name] || Icons.Circle;
    return <Cmp className={className} style={style} />;
}

/* ── Vòng quỹ đạo phát sáng ── */
function OrbitRing({ radius, color, tilt }) {
    const points = useMemo(() => {
        const segments = 128;
        const arr = new Float32Array((segments + 1) * 3);
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            arr[i * 3] = Math.cos(a) * radius;
            arr[i * 3 + 1] = 0;
            arr[i * 3 + 2] = Math.sin(a) * radius;
        }
        return arr;
    }, [radius]);

    return (
        <line rotation={[tilt, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length / 3}
                    array={points}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={0.28} />
        </line>
    );
}

/* ── Node trang ── */
function RouteNode({ route, position, color, onPick, isHot }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        const scale = (hovered ? 1.55 : 1) + Math.sin(t * 2 + position[0]) * 0.06;
        meshRef.current.scale.setScalar(scale);
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = "";
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onPick(route);
                }}
            >
                <icosahedronGeometry args={[0.34, 1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 2.4 : isHot ? 1.4 : 0.7}
                    metalness={0.6}
                    roughness={0.22}
                />
            </mesh>

            {/* Halo */}
            <mesh>
                <sphereGeometry args={[hovered ? 0.72 : 0.5, 20, 20]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={hovered ? 0.16 : 0.07}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {(hovered || isHot) && (
                <Html center distanceFactor={12} position={[0, 0.95, 0]}>
                    <div
                        className="pointer-events-none select-none whitespace-nowrap rounded-lg border px-2.5 py-1 text-center"
                        style={{
                            borderColor: color,
                            background: "rgba(6,4,3,0.92)",
                            boxShadow: `0 0 18px ${color}55`,
                        }}
                    >
                        <span className="block text-[11px] font-black text-white">{route.title}</span>
                        <span className="block font-mono text-[8.5px] uppercase tracking-wider" style={{ color }}>
                            {route.path}
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
}

/* ── Thiên hà chứa toàn bộ orbit ── */
function Galaxy({ onPick, activePath }) {
    const groupRef = useRef();
    const groups = useMemo(() => groupedRoutes(), []);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.07;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Hạt nhân trung tâm */}
            <mesh>
                <icosahedronGeometry args={[0.7, 2]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={1.1}
                    metalness={0.9}
                    roughness={0.1}
                    wireframe
                />
            </mesh>
            <pointLight intensity={2.4} distance={30} color="#ffffff" />

            {groups.map((g, gi) => {
                const radius = 2.9 + gi * 1.55;
                const tilt = (gi % 2 === 0 ? 1 : -1) * (0.14 + gi * 0.07);
                const color = g.color;

                return (
                    <group key={g.id} rotation={[tilt, 0, 0]}>
                        <OrbitRing radius={radius} color={color} tilt={0} />
                        {g.items.map((route, ri) => {
                            const angle = (ri / g.items.length) * Math.PI * 2 + gi * 0.5;
                            const pos = [
                                Math.cos(angle) * radius,
                                Math.sin(angle * 2.2) * 0.35,
                                Math.sin(angle) * radius,
                            ];
                            return (
                                <RouteNode
                                    key={route.id}
                                    route={route}
                                    position={pos}
                                    color={color}
                                    onPick={onPick}
                                    isHot={route.path === activePath}
                                />
                            );
                        })}
                    </group>
                );
            })}
        </group>
    );
}

/* ── Fallback DOM (mức hiệu năng thấp) ── */
function FlatSitemap({ onPick }) {
    const groups = useMemo(() => groupedRoutes(), []);
    return (
        <div className="grid max-h-full grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
                <section
                    key={g.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-1)" }}
                >
                    <h3
                        className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.18em]"
                        style={{ color: g.color }}
                    >
                        {g.label}
                    </h3>
                    <ul className="space-y-1">
                        {g.items.map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    onClick={() => onPick(r)}
                                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                                >
                                    <Icon name={r.icon} className="h-3.5 w-3.5 shrink-0" style={{ color: g.color }} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12.5px] font-bold text-white">
                                            {r.title}
                                        </span>
                                        <span className="block truncate text-[10.5px] text-white/40">{r.desc}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export default function UltraSitemapOrbit() {
    const router = useRouter();
    const { sitemapOpen, setSitemapOpen, motion: level, theme } = useUltra();
    const [activePath, setActivePath] = useState(null);

    const pick = (route) => {
        setActivePath(route.path);
        setSitemapOpen(false);
        router.push(route.path);
    };

    const use3D = level.enableHeavy3D;

    return (
        <AnimatePresence>
            {sitemapOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="fixed inset-0 z-[995]"
                    style={{ background: "rgba(2,1,1,0.9)", backdropFilter: "blur(10px)" }}
                >
                    {/* Header */}
                    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white sm:text-2xl">
                                SITEMAP ORBIT 3D
                            </h2>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                                {use3D
                                    ? "Kéo để quay · Lăn để zoom · Click node để điều hướng"
                                    : "Chế độ hiệu năng — danh sách phẳng"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSitemapOpen(false)}
                            className="rounded-full border p-2.5 text-white/70 transition-colors hover:text-white"
                            style={{ borderColor: "var(--ux-border)", background: "var(--ux-bg-1)" }}
                            aria-label="Đóng sitemap"
                        >
                            <Icons.X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="absolute inset-0 pt-24 pb-16">
                        {use3D ? (
                            <Canvas
                                camera={{ position: [0, 6.5, 14], fov: 52 }}
                                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                                dpr={[1, 1.6]}
                            >
                                <color attach="background" args={[theme.three.fog]} />
                                <fog attach="fog" args={[theme.three.fog, 14, 38]} />
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[8, 10, 6]} intensity={1.3} />
                                <Suspense fallback={null}>
                                    <Galaxy onPick={pick} activePath={activePath} />
                                </Suspense>
                                <OrbitControls
                                    enablePan={false}
                                    minDistance={7}
                                    maxDistance={26}
                                    autoRotate
                                    autoRotateSpeed={0.35}
                                    dampingFactor={0.08}
                                />
                            </Canvas>
                        ) : (
                            <FlatSitemap onPick={pick} />
                        )}
                    </div>

                    {/* Legend */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 p-4">
                        {Object.values(ULTRA_GROUPS).map((g) => (
                            <span key={g.id} className="flex items-center gap-1.5">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }}
                                />
                                <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-white/55">
                                    {g.label}
                                </span>
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
