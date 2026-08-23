"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Bot, Zap, RefreshCw } from "lucide-react";

/**
 * LiquidStudyReveal: Inspired by Lumora Studio's signature Liquid Cursor Reveal canvas.
 * Seamlessly blends traditional fragmented study notes (Layer 1) with supercharged
 * AI-structured insights (Layer 2) as the user brushes their pointer over the interactive area.
 */
export default function LiquidStudyReveal({
  className = "relative rounded-3xl overflow-hidden border border-white/15 bg-space-950 shadow-glass-deep",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const brushRadius = 90;
    const decay = 0.018;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Offscreen brush canvas
    const brushCanvas = document.createElement("canvas");
    const brushCtx = brushCanvas.getContext("2d");

    // Offscreen revealed content canvas (AI Supercharged Study Sheet)
    const coverCanvas = document.createElement("canvas");
    const coverCtx = coverCanvas.getContext("2d");

    let rect = { width: 0, height: 0, left: 0, top: 0 };
    let lastPoint = null;
    const points = [];
    let idle = 0;

    const renderCoverContent = (cw, ch) => {
      coverCanvas.width = cw;
      coverCanvas.height = ch;
      coverCtx.clearRect(0, 0, cw, ch);

      // Deep vibrant gradient background
      const grad = coverCtx.createLinearGradient(0, 0, cw, ch);
      grad.addColorStop(0, "#1e1b4b"); // Indigo 950
      grad.addColorStop(0.5, "#0f172a"); // Slate 900
      grad.addColorStop(1, "#042f2e"); // Teal 950
      coverCtx.fillStyle = grad;
      coverCtx.fillRect(0, 0, cw, ch);

      // Grid mesh pattern
      coverCtx.strokeStyle = "rgba(99, 102, 241, 0.15)";
      coverCtx.lineWidth = 1;
      const step = 32 * dpr;
      for (let x = 0; x < cw; x += step) {
        coverCtx.beginPath();
        coverCtx.moveTo(x, 0);
        coverCtx.lineTo(x, ch);
        coverCtx.stroke();
      }
      for (let y = 0; y < ch; y += step) {
        coverCtx.beginPath();
        coverCtx.moveTo(0, y);
        coverCtx.lineTo(cw, y);
        coverCtx.stroke();
      }

      // Draw glowing AI Badge
      coverCtx.fillStyle = "#6366f1";
      coverCtx.beginPath();
      coverCtx.roundRect(24 * dpr, 24 * dpr, 180 * dpr, 32 * dpr, 16 * dpr);
      coverCtx.fill();

      coverCtx.fillStyle = "#ffffff";
      coverCtx.font = `bold ${12 * dpr}px sans-serif`;
      coverCtx.fillText("⚡ STUDENTHUB AI COPILOT", 36 * dpr, 45 * dpr);

      // Main Title
      coverCtx.fillStyle = "#f8fafc";
      coverCtx.font = `bold ${20 * dpr}px sans-serif`;
      coverCtx.fillText("Phân Tích Kiến Thức Tối Ưu Hóa (Socratic 2.0)", 24 * dpr, 90 * dpr);

      // Key Points
      coverCtx.fillStyle = "#38bdf8";
      coverCtx.font = `${13 * dpr}px sans-serif`;
      coverCtx.fillText("✔ Đã tóm lược 45 trang giáo trình thành 3 công thức trọng tâm", 24 * dpr, 130 * dpr);
      coverCtx.fillText("✔ Sơ đồ Mindmap liên kết trực tiếp giải thuật Dijkstra & Bellman-Ford", 24 * dpr, 160 * dpr);
      coverCtx.fillText("✔ Nhận xét & lưu ý thực chiến từ Cố vấn TS. Nguyễn Minh Đức (Top 1%)", 24 * dpr, 190 * dpr);

      // Simulated Code Snippet Preview Box
      coverCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
      coverCtx.strokeStyle = "rgba(52, 211, 153, 0.4)";
      coverCtx.beginPath();
      coverCtx.roundRect(24 * dpr, 220 * dpr, (cw - 48 * dpr), 80 * dpr, 12 * dpr);
      coverCtx.fill();
      coverCtx.stroke();

      coverCtx.fillStyle = "#34d399";
      coverCtx.font = `bold ${11 * dpr}px monospace`;
      coverCtx.fillText("def solve_fast(graph): return heapq.heappop(pq) # O((V+E)logV)", 40 * dpr, 265 * dpr);
    };

    const resize = () => {
      const r = container.getBoundingClientRect();
      rect = r;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;

      const rad = brushRadius * dpr;
      const diam = Math.ceil(rad * 2);
      brushCanvas.width = diam;
      brushCanvas.height = diam;

      renderCoverContent(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    let animId = null;

    const handlePointerMove = (e) => {
      if (!rect.width) return;
      setHintVisible(false);
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      const rad = brushRadius * dpr;

      if (x < -rad || x > canvas.width + rad || y < -rad || y > canvas.height + rad) {
        lastPoint = null;
        return;
      }

      if (!lastPoint) {
        lastPoint = { x, y };
        points.push({ x, y });
      } else {
        const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y);
        const step = Math.max(rad * 0.3, 1);
        const n = Math.min(Math.ceil(dist / step), 50);

        for (let i = 1; i <= n; i++) {
          const t = i / n;
          points.push({
            x: lastPoint.x + (x - lastPoint.x) * t,
            y: lastPoint.y + (y - lastPoint.y) * t,
          });
        }
        lastPoint = { x, y };
      }

      // Wake up the render loop if it's asleep
      if (idle >= 120 && !animId) {
        idle = 0;
        animId = requestAnimationFrame(tick);
      }
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });

    const stamp = (x, y) => {
      const rad = brushRadius * dpr;
      const diam = Math.ceil(rad * 2);
      const c = diam / 2;

      brushCtx.clearRect(0, 0, diam, diam);
      brushCtx.globalCompositeOperation = "source-over";
      const grad = brushCtx.createRadialGradient(c, c, 0, c, c, rad);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.55, "rgba(255,255,255,0.85)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      brushCtx.fillStyle = grad;
      brushCtx.fillRect(0, 0, diam, diam);

      brushCtx.globalCompositeOperation = "source-in";
      brushCtx.drawImage(coverCanvas, x - c, y - c, diam, diam, 0, 0, diam, diam);

      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(brushCanvas, x - c, y - c);
    };

    const tick = () => {
      const drawing = points.length > 0;
      if (drawing) {
        idle = 0;
      } else {
        idle++;
      }

      if (idle <= 120) {
        const fade = drawing ? decay : Math.min(decay + idle * 0.004, 0.5);
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${fade})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (drawing) {
          for (let i = 0; i < points.length; i++) {
            stamp(points[i].x, points[i].y);
          }
          points.length = 0;
        }
        if (idle === 120) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        animId = requestAnimationFrame(tick);
      } else {
        animId = null; // Stop the loop to save GPU
      }
    };
    animId = requestAnimationFrame(tick);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div ref={containerRef} className={`${className} h-[340px] select-none cursor-crosshair`}>
      {/* Base Layer: Traditional Note Taking */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between bg-[#0b0f19] text-slate-300">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Phương Pháp Học Truyền Thống</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Ghi Chép Rời Rạc & Tốn Nhiều Thời Gian
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg mb-4">
            Sinh viên phải tự đọc hàng trăm trang PDF không cấu trúc, thiếu người giải thích chi tiết khi gặp bài toán khó, không có lộ trình liên kết thực tế.
          </p>
          <div className="space-y-2 text-xs font-mono text-slate-400 bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <p>• Đọc tài liệu 45 trang giáo trình (Mất 4.5 tiếng)</p>
            <p>• Tìm kiếm lời giải trên diễn đàn rời rạc (Dễ gặp lời giải sai)</p>
            <p>• Không có chuyên gia đồng hành 1:1 xác thực</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
          <span>Trạng thái: Hiệu suất thấp, dễ nản chí</span>
          <span className="text-indigo-400 font-medium">Rê chuột để quét lộ diện AI Copilot ➔</span>
        </div>
      </div>

      {/* Canvas Overlay for Liquid Reveal of AI Supercharged insights */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Interactive Helper Badge */}
      {hintVisible && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-indigo-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-lg pointer-events-none animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Rê chuột qua đây để xem cọ quét Liquid AI Reveal</span>
        </div>
      )}
    </div>
  );
}
