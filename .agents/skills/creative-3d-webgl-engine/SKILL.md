---
name: creative-3d-webgl-engine
description: Advanced WebGL, Three.js, React Three Fiber, Simplex Noise shaders, and creative canvas engineering skill. Provides architecture patterns, GLSL shaders, procedural particle systems, liquid reveal mechanics, and performance guardrails for building Awwwards-tier 3D web experiences without causing GPU context exhaustion.
---

# Creative 3D & WebGL Engineering Skill

This skill documents and encapsulates high-end 3D graphics, procedural GLSL shaders, canvas physics, and performance optimization techniques for modern web applications.

---

## 1. Core Architecture & Shaders

### 1.1 Simplex Noise Wave Vertex & Fragment Shader (Flow Wave)
Procedural 3D vertex displacement with mouse repulsion and depth fading:

```glsl
// GLSL Simplex Noise 3D Chunk
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
```

### 1.2 Cosmic Stardust Particle Engine
Floating particle buffer geometry with depth-faded billboard sizing:
```javascript
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
dustGeo.setAttribute("size", new THREE.BufferAttribute(dustSizes, 1));
```

### 1.3 Liquid Canvas Reveal Mechanics (Lumora-Style)
Dual-layer canvas composition using `destination-out` and offscreen brush stamping:
```javascript
// Offscreen brush stamp with radial gradient falloff
brushCtx.clearRect(0, 0, diam, diam);
brushCtx.globalCompositeOperation = "source-over";
const grad = brushCtx.createRadialGradient(c, c, 0, c, c, rad);
grad.addColorStop(0, "rgba(255,255,255,1)");
grad.addColorStop(1, "rgba(255,255,255,0)");
brushCtx.fillStyle = grad;
brushCtx.fillRect(0, 0, diam, diam);

brushCtx.globalCompositeOperation = "source-in";
brushCtx.drawImage(coverCanvas, x - c, y - c, diam, diam, 0, 0, diam, diam);

ctx.globalCompositeOperation = "source-over";
ctx.drawImage(brushCanvas, x - c, y - c);
```

---

## 2. Performance Rules & GPU Safety

1. **Isolate 3D to Dedicated Lab/Showcase Pages**:
   - Do NOT run multiple live Three.js / WebGL canvases simultaneously on primary transaction or authentication routes (Home, Login, Register, Dashboard).
   - Running multiple WebGL contexts on mobile or low-end GPUs causes WebGL context loss (`WEBGL_CONTEXT_LOST`), battery drain, and visual stutter.
2. **WebGL Context Lifecycle & Cleanup**:
   - Always call `renderer.dispose()`, `geometry.dispose()`, `material.dispose()`, and `cancelAnimationFrame()`.
   - Never let an animation loop run when the tab is hidden or when the element is offscreen (`IntersectionObserver`).
3. **Prefer Hardware-Accelerated CSS & SVG on Core Pages**:
   - Use CSS gradients, CSS keyframes, and SVG orbital paths with `transform: translate3d()` for 60fps locked rendering on core screens.
   - Reserve WebGL for dedicated immersive experiences (e.g. `/showcase`, `/showcase/flow-wave`, `/showcase/soda`).
