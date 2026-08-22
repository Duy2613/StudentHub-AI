"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

/**
 * Settigation OTP Verification v3 (React / Framer Motion / SVG)
 * Inspired by Settigation Component 89 ("4 boxes. One ring. Zero dependencies.")
 * Supports customizable length (4 or 6 digits), dynamic orbit rotation on complete,
 * zero-delay input handling, clipboard paste, and high-fidelity jade/indigo aesthetics.
 */
export default function OtpVerificationOrbit({
  length = 6,
  value = "",
  onChange,
  onComplete,
  isVerifying = false,
  isSuccess = false,
  isError = false,
  errorMessage = "",
  email = "",
  resendCountdown = 0,
  onResend,
  isResending = false,
  className = "",
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  // Focus hidden input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Trigger orbit animation when user completes the code
  useEffect(() => {
    if (value.length === length) {
      setIsSpinning(true);
      if (onComplete) {
        onComplete(value);
      }
      const timer = setTimeout(() => {
        setIsSpinning(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [value, length, onComplete]);

  const handleChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, length);
    if (onChange) {
      onChange(rawVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && value.length > 0) {
      if (onChange) {
        onChange(value.slice(0, -1));
      }
    }
  };

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  };

  // Convert string to array of chars with length padding
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // Calculate circular orbit positions for each digit slot (radius = 76px)
  const radius = 78;
  const getOrbitPosition = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // start from top
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    return { x, y, deg: (angle * 180) / Math.PI + 90 };
  };

  const isCompleted = value.length === length;

  return (
    <div
      onClick={handleContainerClick}
      className={`relative flex flex-col items-center select-none cursor-pointer w-full ${className}`}
    >
      {/* Hidden real numeric input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 opacity-0 cursor-default pointer-events-auto z-30"
        aria-label="OTP verification code"
      />

      {/* Orbit Dynamic Canvas */}
      <div className="relative w-72 h-72 flex items-center justify-center my-2">
        {/* Ambient Glow Aura */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
            isSuccess
              ? "bg-[#0caa8f]/30 scale-110"
              : isError
              ? "bg-rose-500/25 scale-105"
              : isCompleted || isVerifying
              ? "bg-indigo-500/30 scale-105"
              : isFocused
              ? "bg-indigo-600/15 scale-95"
              : "bg-white/5 scale-90"
          }`}
        />

        {/* SVG Orbit Track & Glowing Ring */}
        <svg
          className="absolute w-56 h-56 pointer-events-none transform -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* Background Orbit Track */}
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            className="animate-spin-slow origin-center opacity-70"
            style={{ animationDuration: "35s" }}
          />

          {/* Active / Verified Arc */}
          <motion.circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke={isSuccess ? "#0caa8f" : isError ? "#f43f5e" : "#6366f1"}
            strokeWidth={isSuccess ? "3" : "2"}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 78}
            initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
            animate={{
              strokeDashoffset:
                2 * Math.PI * 78 * (1 - (isSuccess ? 1 : value.length / length)),
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="origin-center drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
          />

          {/* Secondary rotating neon dashes (Settigation style) */}
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke={isSuccess ? "#0caa8f" : "#a855f7"}
            strokeWidth="1"
            strokeDasharray="2 12"
            className={`origin-center transition-opacity duration-500 ${
              isCompleted || isVerifying ? "opacity-90 animate-spin" : "opacity-30"
            }`}
            style={{ animationDuration: isSpinning ? "1.5s" : "20s" }}
          />
        </svg>

        {/* Center Hub Core */}
        <div
          className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center backdrop-blur-xl border transition-all duration-500 shadow-glass-deep ${
            isSuccess
              ? "bg-[#0caa8f]/20 border-[#0caa8f]/60 text-[#0caa8f] shadow-[0_0_30px_rgba(12,170,143,0.5)] scale-110"
              : isError
              ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)]"
              : isVerifying
              ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-400"
              : isCompleted
              ? "bg-indigo-900/60 border-indigo-400/50 text-indigo-200"
              : "bg-space-900/80 border-white/10 text-gray-400"
          }`}
        >
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </motion.div>
          ) : isVerifying ? (
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          ) : isError ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: 2, duration: 0.3 }}
            >
              <AlertCircle className="w-7 h-7 text-rose-400" />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <ShieldCheck
                className={`w-6 h-6 transition-colors duration-300 ${
                  isCompleted ? "text-indigo-400" : "text-gray-500"
                }`}
              />
              <span className="text-[10px] font-mono font-bold tracking-wider mt-1 text-gray-400">
                {value.length}/{length}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Rotating Orbit Slots (Settigation 4/6 boxes curling onto orbit) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{
            rotate: isSpinning ? 450 : 0,
          }}
          transition={{
            duration: 1.1,
            ease: [0.16, 1, 0.3, 1], // Settigation snap deceleration
          }}
        >
          {digits.map((digit, idx) => {
            const { x, y } = getOrbitPosition(idx, length);
            const isSlotFilled = Boolean(digit);
            const isCurrentSlot = value.length === idx;

            return (
              <motion.div
                key={idx}
                className="absolute"
                animate={{
                  x,
                  y,
                  scale: isCurrentSlot && isFocused ? 1.15 : isSlotFilled ? 1.05 : 0.95,
                  rotate: isSpinning ? -450 : 0, // counter-rotate content to stay upright
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                }}
              >
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-mono text-lg sm:text-xl font-bold transition-all duration-300 backdrop-blur-xl border ${
                    isSuccess
                      ? "bg-[#0caa8f]/20 border-[#0caa8f]/70 text-[#0caa8f] shadow-[0_0_15px_rgba(12,170,143,0.4)]"
                      : isError
                      ? "bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                      : isSlotFilled
                      ? "bg-indigo-600/30 border-indigo-400/80 text-white shadow-[0_0_14px_rgba(99,102,241,0.35)]"
                      : isCurrentSlot && isFocused
                      ? "bg-white/10 border-indigo-400 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/40"
                      : "bg-white/5 border-white/10 text-gray-500"
                  }`}
                >
                  {digit ? (
                    <motion.span
                      key={digit}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    >
                      {digit}
                    </motion.span>
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isCurrentSlot && isFocused
                          ? "bg-indigo-400 animate-pulse scale-125"
                          : "bg-white/15"
                      }`}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Helper Status & Error Messaging */}
      <AnimatePresence mode="wait">
        {errorMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mt-2 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(12,170,143,0.2)]"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Mã xác thực hợp lệ! Đang chuẩn bị không gian học...</span>
          </motion.div>
        ) : (
          <div className="text-xs text-gray-400 text-center mt-1 flex items-center justify-center gap-1">
            <span>Chạm hoặc gõ bàn phím để nhập mã OTP</span>
          </div>
        )}
      </AnimatePresence>

      {/* Resend OTP Bar */}
      {onResend && (
        <div className="flex items-center justify-between w-full max-w-xs mt-5 pt-4 border-t border-white/10 text-xs">
          <span className="text-gray-400">Chưa nhận được mã?</span>
          <button
            type="button"
            disabled={resendCountdown > 0 || isResending}
            onClick={(e) => {
              e.stopPropagation();
              onResend();
            }}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            {resendCountdown > 0
              ? `Gửi lại sau ${resendCountdown}s`
              : "Gửi lại mã mới"}
          </button>
        </div>
      )}
    </div>
  );
}
