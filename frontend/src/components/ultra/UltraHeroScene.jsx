"use client";

// frontend/src/components/ultra/UltraHeroScene.jsx
//
// ULTRA HERO SCENE — Sân khấu WebGL 6 lớp, màu sắc đồng bộ theme runtime:
//   1. TrustCore        — khối icosahedron xoay + wireframe kép (lõi niềm tin)
//   2. OrbitShells      — 3 vành quỹ đạo nghiêng, mỗi vành có vệ tinh chạy
//   3. DataStream       — 1800 hạt bay theo trục Z (dòng dữ liệu)
//   4. GridFloor        — sàn lưới phản chiếu mờ dần theo chiều sâu
//   5. FloatingShards   — 7 mảnh kính lơ lửng bắt sáng
//   6. Fog + Lights     — sương mù + 3 nguồn sáng theo accent
//
// Tự động giảm mật độ hạt theo motion level; trả về null ở mức "still".

import React, { useEffect, useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useUltra } from "./UltraProvider";

function seededUnit(index, salt) {
    const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
}

/* ── 1. Lõi niềm tin ── */
function TrustCore({ color, rim }) {
    const inner = useRef();
    const outer = useRef();
    const cage = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (inner.current) {
            inner.current.rotation.x = t * 0.24;
            inner.current.rotation.y = t * 0.34;
        }
        if (outer.current) {
            outer.current.rotation.y = -t * 0.18;
            outer.current.rotation.z = t * 0.12;
            const s = 1 + Math.sin(t * 1.5) * 0.045;
            outer.current.scale.setScalar(s);
        }
        if (cage.current) {
            cage.current.rotation.y = t * 0.5;
            cage.current.rotation.x = -t * 0.22;
        }
    });

    return (
        <group>
            <mesh ref={inner}>
                <icosahedronGeometry args={[1.15, 1]} />
                <meshPhysicalMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.85}
                    metalness={0.92}
                    roughness={0.15}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>

            <mesh ref={outer}>
                <icosahedronGeometry args={[1.75, 1]} />
                <meshBasicMaterial color={rim} wireframe transparent opacity={0.32} />
            </mesh>

            <mesh ref={cage}>
                <torusGeometry args={[2.25, 0.012, 8, 120]} />
                <meshBasicMaterial color={color} transparent opacity={0.55} />
            </mesh>

            <pointLight position={[0, 0, 0]} intensity={3.2} distance={12} color={color} />
        </group>
    );
}

/* ── 2. Vành quỹ đạo + vệ tinh ── */
function OrbitShell({ radius, tilt, speed, color, satellites }) {
    const group = useRef();

    const ringGeo = useMemo(() => {
        const segments = 160;
        const arr = new Float32Array((segments + 1) * 3);
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            arr[i * 3] = Math.cos(a) * radius;
            arr[i * 3 + 1] = 0;
            arr[i * 3 + 2] = Math.sin(a) * radius;
        }
        return arr;
    }, [radius]);

    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = state.clock.getElapsedTime() * speed;
        }
    });

    return (
        <group rotation={[tilt, 0, tilt * 0.4]}>
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={ringGeo.length / 3}
                        array={ringGeo}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.24} />
            </line>

            <group ref={group}>
                {Array.from({ length: satellites }).map((_, i) => {
                    const a = (i / satellites) * Math.PI * 2;
                    return (
                        <mesh
                            key={i}
                            position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}
                        >
                            <sphereGeometry args={[0.075, 14, 14]} />
                            <meshStandardMaterial
                                color={color}
                                emissive={color}
                                emissiveIntensity={2.1}
                            />
                        </mesh>
                    );
                })}
            </group>
        </group>
    );
}

/* ── 3. Dòng dữ liệu hạt ── */
function DataStream({ count, color }) {
    const ref = useRef();

    const { positions, speeds } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = 2.4 + seededUnit(i, 1) * 9;
            const a = seededUnit(i, 2) * Math.PI * 2;
            pos[i * 3] = Math.cos(a) * r;
            pos[i * 3 + 1] = (seededUnit(i, 3) - 0.5) * 11;
            pos[i * 3 + 2] = Math.sin(a) * r;
            spd[i] = 0.012 + seededUnit(i, 4) * 0.045;
        }
        return { positions: pos, speeds: spd };
    }, [count]);

    useFrame(() => {
        if (!ref.current) return;
        const arr = ref.current.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] += speeds[i];
            if (arr[i * 3 + 1] > 5.8) arr[i * 3 + 1] = -5.8;
        }
        ref.current.geometry.attributes.position.needsUpdate = true;
        ref.current.rotation.y += 0.0007;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.055}
                color={color}
                transparent
                opacity={0.72}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}

/* ── 4. Sàn lưới ── */
function GridFloor({ color }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.position.z = (state.clock.getElapsedTime() * 0.6) % 2;
        }
    });

    return (
        <group position={[0, -3.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <gridHelper
                ref={ref}
                args={[46, 46, color, color]}
                rotation={[Math.PI / 2, 0, 0]}
            />
        </group>
    );
}

/* ── 5. Mảnh kính lơ lửng ── */
function FloatingShards({ color, rim }) {
    const shards = useMemo(
        () => [
            { pos: [-4.4, 1.9, -1.6], size: 0.62, geo: "octa" },
            { pos: [4.7, -1.3, -2.4], size: 0.5, geo: "tetra" },
            { pos: [3.4, 2.6, 1.4], size: 0.42, geo: "box" },
            { pos: [-3.8, -2.2, 1.9], size: 0.55, geo: "octa" },
            { pos: [5.6, 1.1, -0.6], size: 0.36, geo: "tetra" },
            { pos: [-5.4, 0.2, -2.9], size: 0.46, geo: "box" },
            { pos: [0.9, 3.4, -3.2], size: 0.4, geo: "octa" },
        ],
        []
    );

    return (
        <>
            {shards.map((s, i) => (
                <Float
                    key={i}
                    speed={1.4 + i * 0.22}
                    rotationIntensity={0.9}
                    floatIntensity={1.5}
                    position={s.pos}
                >
                    <mesh>
                        {s.geo === "octa" && <octahedronGeometry args={[s.size, 0]} />}
                        {s.geo === "tetra" && <tetrahedronGeometry args={[s.size, 0]} />}
                        {s.geo === "box" && <boxGeometry args={[s.size, s.size, s.size]} />}
                        <meshPhysicalMaterial
                            color={i % 2 === 0 ? color : rim}
                            metalness={0.85}
                            roughness={0.18}
                            transmission={0.45}
                            transparent
                            opacity={0.82}
                            emissive={i % 2 === 0 ? color : rim}
                            emissiveIntensity={0.35}
                        />
                    </mesh>
                </Float>
            ))}
        </>
    );
}

/* ── Camera phản ứng con trỏ ── */
function ParallaxCamera({ strength }) {
    useFrame((state) => {
        const { camera, pointer } = state;
        const tx = pointer.x * 2.1 * strength;
        const ty = 0.5 + pointer.y * 1.4 * strength;
        camera.position.x += (tx - camera.position.x) * 0.045;
        camera.position.y += (ty - camera.position.y) * 0.045;
        camera.lookAt(0, 0, 0);
    });
    return null;
}

export default function UltraHeroScene({ className = "", height = "100%" }) {
    const { theme, motion: level, motionId } = useUltra();
    const containerRef = useRef(null);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const node = containerRef.current;
        if (!node || typeof IntersectionObserver === "undefined") return;

        let inViewport = true;
        const updateActivity = () => setIsActive(inViewport && document.visibilityState === "visible");
        const observer = new IntersectionObserver(([entry]) => {
            inViewport = entry.isIntersecting;
            updateActivity();
        }, { rootMargin: "160px", threshold: 0.01 });

        observer.observe(node);
        document.addEventListener("visibilitychange", updateActivity);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", updateActivity);
        };
    }, []);

    if (motionId === "still") {
        // Fallback tĩnh: gradient mesh thay cho WebGL
        return (
            <div
                className={`relative ${className}`}
                style={{
                    height,
                    background:
                        "radial-gradient(circle at 50% 45%, var(--ux-glow) 0%, transparent 60%)",
                }}
                aria-hidden="true"
            />
        );
    }

    const particleCount = Math.max(200, Math.round(1800 * level.particleScale));
    const heavy = level.enableHeavy3D;

    return (
        <div ref={containerRef} className={`relative ${className}`} style={{ height }} aria-hidden="true">
            <Canvas
                frameloop={isActive ? "always" : "never"}
                camera={{ position: [0, 0.5, 9.5], fov: 48 }}
                gl={{
                    antialias: heavy,
                    alpha: true,
                    powerPreference: heavy ? "high-performance" : "low-power",
                }}
                dpr={heavy ? [1, 1.7] : [0.8, 1.1]}
            >
                <fog attach="fog" args={[theme.three.fog, 9, 27]} />
                <ambientLight intensity={0.42} />
                <directionalLight position={[6, 8, 5]} intensity={1.25} color={theme.three.particle} />
                <directionalLight position={[-7, -4, -3]} intensity={0.7} color={theme.three.rim} />

                <Suspense fallback={null}>
                    <TrustCore color={theme.three.particle} rim={theme.three.rim} />

                    <OrbitShell
                        radius={3.1}
                        tilt={0.32}
                        speed={0.42}
                        color={theme.three.road}
                        satellites={6}
                    />
                    <OrbitShell
                        radius={4.3}
                        tilt={-0.48}
                        speed={-0.28}
                        color={theme.three.particle}
                        satellites={9}
                    />
                    {heavy && (
                        <OrbitShell
                            radius={5.6}
                            tilt={0.68}
                            speed={0.19}
                            color={theme.three.rim}
                            satellites={12}
                        />
                    )}

                    <DataStream key={particleCount} count={particleCount} color={theme.three.particle} />

                    {heavy && (
                        <>
                            <GridFloor color={theme.three.road} />
                            <FloatingShards color={theme.three.particle} rim={theme.three.rim} />
                        </>
                    )}
                </Suspense>

                <ParallaxCamera strength={level.parallax} />
            </Canvas>
        </div>
    );
}
