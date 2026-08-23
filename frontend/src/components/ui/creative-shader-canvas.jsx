"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * CreativeShaderCanvas: A high-performance, GPU-accelerated procedural background canvas
 * fusing Flow Wave Simplex Noise wave displacement with Cosmic Dust floating embers.
 * Interacts smoothly with mouse movement (vertex repulsion) and scroll.
 */
export default function CreativeShaderCanvas({
  className = "absolute inset-0 w-full h-full pointer-events-none -z-10",
  mode = "cosmic-wave", // "cosmic-wave", "emerald-wave", "amber-dust"
  particleCount = 500,
  opacity = 0.55,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Honor prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05070f, 0, 30);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3, 10);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 1. Simplex Noise GLSL Chunk
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

    // 2. Wave Surface Points (Flow Wave inspired)
    const waveGeo = new THREE.PlaneGeometry(16, 12, 100, 80);
    const waveMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uCursor: { value: new THREE.Vector3(0, 0, 0) },
        uActivity: { value: 0 },
        uOpacity: { value: opacity },
        uColLow: {
          value:
            mode === "emerald-wave"
              ? new THREE.Vector3(0.01, 0.09, 0.05)
              : new THREE.Vector3(0.12, 0.08, 0.35),
        },
        uColHigh: {
          value:
            mode === "emerald-wave"
              ? new THREE.Vector3(0.2, 0.9, 0.6)
              : new THREE.Vector3(0.4, 0.4, 0.95),
        },
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
          float n = snoise(vec3(p.x * 0.25, p.y * 0.25, uTime * 0.35)) * 0.8;
          n += snoise(vec3(p.x * 0.5, p.y * 0.5, uTime * 0.7)) * 0.3;
          p.z += n;

          vec4 modelPos = modelMatrix * vec4(p, 1.0);
          vec3 toP = modelPos.xyz - uCursor;
          float d = length(toP);
          float repel = smoothstep(4.0, 0.0, d);
          modelPos.xyz += normalize(toP + vec3(0.001)) * repel * 1.5 * uActivity;

          vec4 mvPos = viewMatrix * modelPos;
          vColor = mix(uColLow, uColHigh, clamp((p.z + 1.0) * 0.6, 0.0, 1.0));
          vFade = smoothstep(12.0, 3.0, length(p.xy));

          gl_PointSize = (4.0 * (10.0 / -mvPos.z));
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
    wavePoints.rotation.x = -Math.PI / 3.2;
    wavePoints.position.set(0, -1.8, 0);
    scene.add(wavePoints);

    // 3. Cosmic Floating Dust Motes (Cosmic Dust inspired)
    const count = particleCount;
    const dustPositions = new Float32Array(count * 3);
    const dustSizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 20;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      dustSizes[i] = 12 + Math.random() * 20;
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
        uColorA: { value: new THREE.Vector3(0.99, 0.77, 0.42) }, // Warm Amber
        uColorB: { value: new THREE.Vector3(0.39, 0.65, 0.98) }, // Cyan / Indigo
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
          p.z = mod(p.z + uTime * 0.4 + 8.0, 16.0) - 8.0;
          p.y += sin(uTime * 0.5 + p.x) * 0.2;
          p.x += cos(uTime * 0.4 + p.y) * 0.2;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          vAlpha = smoothstep(10.0, 2.0, -mvPos.z) * smoothstep(0.0, 2.0, -mvPos.z);
          vColor = mix(uColorA, uColorB, step(0.5, fract(p.x * 3.17)));

          gl_PointSize = size * (12.0 / -mvPos.z);
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
          gl_FragColor = vec4(vColor, mask * vAlpha * 0.75);
        }
      `,
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // 4. Mouse Tracking & Parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, lastMove: 0 };
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.active = true;
      mouse.lastMove = performance.now();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 5. Animation Loop
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
      camera.position.x = mouse.x * 0.8;
      camera.position.y = 3 + mouse.y * 0.5;
      camera.lookAt(0, -0.5, 0);

      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
