"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * CreativeShaderCanvas: Ultra-high performance, GPU-accelerated procedural background canvas.
 * Fuses Flow Wave Simplex Noise wave displacement with Cosmic Dust floating motes.
 * Uses 100% true alpha transparency so underlying CSS gradients and meshes shine through.
 */
export default function CreativeShaderCanvas({
  className = "absolute inset-0 w-full h-full pointer-events-none -z-10",
  mode = "cosmic-wave", // "cosmic-wave" | "emerald-wave" | "amber-dust"
  particleCount = 400,
  opacity = 0.65,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Honor prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const w = container.clientWidth || window.innerWidth || 800;
    const h = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 2.5, 9);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("WebGL not supported or context lost:", e);
      return;
    }

    renderer.setClearColor(0x000000, 0); // 100% transparent clear color
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // 1. Simplex Noise GLSL definition
    const SNOISE = `
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    `;

    // 2. Color Palette Setup based on mode
    let colLow, colHigh, dustColA, dustColB;
    if (mode === "emerald-wave") {
      colLow = new THREE.Vector3(0.02, 0.20, 0.15); // Rich emerald
      colHigh = new THREE.Vector3(0.20, 0.95, 0.65); // Bright mint teal
      dustColA = new THREE.Vector3(0.20, 0.95, 0.65);
      dustColB = new THREE.Vector3(0.06, 0.71, 0.83);
    } else if (mode === "amber-dust") {
      colLow = new THREE.Vector3(0.25, 0.12, 0.02); // Deep amber
      colHigh = new THREE.Vector3(0.98, 0.75, 0.25); // Radiant gold
      dustColA = new THREE.Vector3(0.98, 0.75, 0.25);
      dustColB = new THREE.Vector3(0.95, 0.45, 0.20);
    } else {
      // "cosmic-wave" (Default)
      colLow = new THREE.Vector3(0.18, 0.12, 0.45); // Deep cosmic indigo
      colHigh = new THREE.Vector3(0.40, 0.55, 1.0); // Vibrant neon blue-purple
      dustColA = new THREE.Vector3(0.99, 0.77, 0.42); // Stardust amber
      dustColB = new THREE.Vector3(0.39, 0.65, 0.98); // Cyan
    }

    // 3. Wave Surface Points (Flow Wave inspired)
    const waveGeo = new THREE.PlaneGeometry(18, 14, 90, 70);
    const waveMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uCursor: { value: new THREE.Vector3(0, 0, 0) },
        uActivity: { value: 0 },
        uOpacity: { value: opacity },
        uColLow: { value: colLow },
        uColHigh: { value: colHigh },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uCursor;
        uniform float uActivity;
        uniform vec3 uColLow;
        uniform vec3 uColHigh;
        varying vec3 vColor;
        varying float vFade;
        ${SNOISE}
        void main() {
          vec3 p = position;
          float n = snoise(vec3(p.x * 0.22, p.y * 0.22, uTime * 0.25)) * 0.9;
          n += snoise(vec3(p.x * 0.45, p.y * 0.45, uTime * 0.5)) * 0.35;
          p.z += n;

          vec4 modelPos = modelMatrix * vec4(p, 1.0);
          vec3 toP = modelPos.xyz - uCursor;
          float d = length(toP);
          float repel = smoothstep(4.5, 0.0, d);
          modelPos.xyz += normalize(toP + vec3(0.001)) * repel * 1.8 * uActivity;

          vec4 mvPos = viewMatrix * modelPos;
          vColor = mix(uColLow, uColHigh, clamp((p.z + 1.2) * 0.5, 0.0, 1.0));
          vFade = smoothstep(14.0, 3.5, length(p.xy));

          gl_PointSize = (4.5 * (10.0 / -mvPos.z));
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vFade;
        void main() {
          vec2 xy = gl_PointCoord - 0.5;
          float l = length(xy);
          if (l > 0.5) discard;
          float alpha = smoothstep(0.5, 0.05, l) * uOpacity * vFade;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });

    const wavePoints = new THREE.Points(waveGeo, waveMat);
    wavePoints.rotation.x = -Math.PI / 3.4;
    wavePoints.position.set(0, -1.6, 0);
    scene.add(wavePoints);

    // 4. Cosmic Floating Dust Motes (Cosmic Dust inspired)
    const count = particleCount;
    const dustPositions = new Float32Array(count * 3);
    const dustSizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 22;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      dustSizes[i] = 10 + Math.random() * 18;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute("size", new THREE.BufferAttribute(dustSizes, 1));

    const dustMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: dustColA },
        uColorB: { value: dustColB },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.z = mod(p.z + uTime * 0.35 + 9.0, 18.0) - 9.0;
          p.y += sin(uTime * 0.4 + p.x * 0.5) * 0.25;
          p.x += cos(uTime * 0.3 + p.y * 0.5) * 0.25;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          vAlpha = smoothstep(11.0, 2.0, -mvPos.z) * smoothstep(0.0, 2.0, -mvPos.z);
          vColor = mix(uColorA, uColorB, step(0.5, fract(p.x * 2.7)));

          gl_PointSize = size * (10.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          if (d > 0.5) discard;
          float mask = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, mask * vAlpha * 0.7);
        }
      `,
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // 5. Mouse Tracking & Parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, lastMove: 0 };
    const handleMouseMove = (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.active = true;
      mouse.lastMove = performance.now();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 6. Animation Loop
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Idle calculation
      const idleSec = (performance.now() - mouse.lastMove) / 1000;
      const activity = mouse.active && idleSec < 3.0 ? 1.0 : 0.0;
      waveMat.uniforms.uActivity.value +=
        (activity - waveMat.uniforms.uActivity.value) * 0.08;

      // Unproject cursor to Z plane
      const cursorTarget = new THREE.Vector3(mouse.x * 6, mouse.y * 4, 0);
      waveMat.uniforms.uCursor.value.lerp(cursorTarget, 0.1);
      waveMat.uniforms.uTime.value = elapsed;
      dustMat.uniforms.uTime.value = elapsed;

      // Camera subtle drift
      camera.position.x = mouse.x * 0.6;
      camera.position.y = 2.5 + mouse.y * 0.4;
      camera.lookAt(0, -0.4, 0);

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const currentW = container.clientWidth || window.innerWidth;
      const currentH = container.clientHeight || window.innerHeight;
      if (currentW && currentH) {
        camera.aspect = currentW / currentH;
        camera.updateProjectionMatrix();
        renderer.setSize(currentW, currentH);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      waveGeo.dispose();
      waveMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
    };
  }, [mode, particleCount, opacity]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
