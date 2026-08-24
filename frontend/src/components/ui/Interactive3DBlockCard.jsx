"use client";

import React, { useRef, useState, useEffect } from "react";

/**
 * Interactive3DBlockCard — Robin Payot inspired 3D Floating Block & Tilt Mesh Card
 * - Interactive multi-axis gyro & mouse raycasting tilt physics (rotates X & Y smoothly)
 * - Dynamic specular holographic sheen / light reflection that shifts with cursor position
 * - Layered depth elevation (inner elements pop out with translateZ)
 */
export default function Interactive3DBlockCard({
  children,
  className = "",
  glowColor = "rgba(52, 231, 196, 0.4)",
  maxTilt = 12,
  depth = 40,
}) {
  const cardRef = useRef(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const targetRotX = useRef(0);
  const targetRotY = useRef(0);
  const currentRotX = useRef(0);
  const currentRotY = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    // Smooth lerp loop for organic inertia
    const loop = () => {
      currentRotX.current += (targetRotX.current - currentRotX.current) * 0.12;
      currentRotY.current += (targetRotY.current - currentRotY.current) * 0.12;

      setRotX(currentRotX.current);
      setRotY(currentRotY.current);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    targetRotX.current = tiltX;
    targetRotY.current = tiltY;

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.85,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    targetRotX.current = 0;
    targetRotY.current = 0;
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      style={{ perspective: "1200px" }}
      className="w-full flex justify-center py-2"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(${
            isHovered ? depth : 0
          }px)`,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        className={`relative transition-shadow duration-500 rounded-3xl ${className}`}
      >
        {/* Dynamic Holographic Specular Glare Layer */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none z-30 transition-opacity duration-300 mix-blend-screen overflow-hidden"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
          }}
        />

        {/* Ambient Backlight Aura on Hover */}
        <div
          className="absolute -inset-2 rounded-3xl pointer-events-none -z-10 transition-opacity duration-500 blur-xl"
          style={{
            background: glowColor,
            opacity: isHovered ? 0.6 : 0,
          }}
        />

        {/* Card Content with 3D Depth Child Support */}
        <div className="relative z-10 w-full h-full [transform-style:preserve-3d]">
          {children}
        </div>
      </div>
    </div>
  );
}
