"use client";

// components/auth/AuthUI.jsx
//
// Shared UI components for /login and /register (Cyber Glassmorphism & Verification Network).
// Awwwards-tier Double-Bezel architecture with hardware-accelerated 60fps ambient glow
// and AuthSurroundings (Astrolabe Rings, Telemetry Badges, Top Header & Trust Guarantee).

import React, { useState } from "react";
import { Eye, EyeOff, Lock, Loader2, ArrowRight, AlertCircle, GraduationCap, CheckCircle2 } from "lucide-react";
import AuthSurroundings from "@/components/auth/AuthSurroundings";
import { Meteors } from "@/components/ui/meteors";
import ConstellationWaveCanvas from "@/components/ui/constellation-wave-canvas";

export const NoiseOverlay = () => (
  <div
    className="absolute inset-0 z-[2] opacity-[0.035] mix-blend-overlay pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);

export const AmbientBackground = ({ mode = "cosmic-wave" }) => {
  const isEmerald = mode === "emerald-wave";
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* 1. Interactive 3D Dot Wave & Connected Constellation Polygon Mesh */}
      <ConstellationWaveCanvas mode={mode} opacity={0.9} density="high" />

      {/* 2. Meteors */}
      <Meteors number={16} />

      {/* 3. Multi-Hue Atmospheric Radial Mesh (Pure GPU 60fps CSS) */}
      <div
        className={`absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[150px] animate-blob-slow mix-blend-screen transition-all duration-700 ${
          isEmerald
            ? "bg-gradient-to-r from-emerald-600/30 to-teal-600/30"
            : "bg-gradient-to-r from-indigo-600/30 to-purple-600/30"
        }`}
      />
      <div
        className={`absolute bottom-[-20%] right-[-15%] w-[55vw] h-[55vw] rounded-full blur-[150px] animate-blob-medium animation-delay-2000 mix-blend-screen transition-all duration-700 ${
          isEmerald
            ? "bg-gradient-to-r from-teal-600/25 to-cyan-600/25"
            : "bg-gradient-to-r from-blue-600/25 to-cyan-600/25"
        }`}
      />
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 ${
          isEmerald ? "bg-emerald-950/20" : "bg-indigo-950/20"
        }`}
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
    </div>
  );
};

export const InputField = ({ label, id, name, type = "text", icon: Icon, helperText, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const enableInteraction = () => {
    if (!isInteractive) setIsInteractive(true);
  };

  return (
    <div className="space-y-2 relative group/input">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 pl-1 transition-colors group-hover/input:text-gray-100">
        {label}
      </label>
      {/* Focus Halo Glow */}
      <div
        className={`absolute inset-0 top-7 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 -m-[1.5px] transition-all duration-500 ease-premium pointer-events-none ${
          isFocused ? "opacity-100 blur-[2px]" : "opacity-0 blur-0"
        }`}
      />
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? "text-indigo-400" : "text-gray-500"}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          id={id}
          name={name || id}
          type={type}
          readOnly={!isInteractive}
          onMouseDown={enableInteraction}
          onTouchStart={enableInteraction}
          onKeyDown={enableInteraction}
          onFocus={(e) => {
            enableInteraction();
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          className={`
            block w-full ${Icon ? "pl-12" : "pl-4"} pr-4 py-3.5 text-sm
            bg-white/5 backdrop-blur-xl border border-white/10
            rounded-xl shadow-sm placeholder-gray-500 text-gray-100
            transition-all duration-300 ease-premium
            focus:outline-none focus:bg-white/10 focus:border-transparent
            hover:bg-white/[0.07] hover:border-white/20
          `}
          {...props}
        />
      </div>
      {helperText && <p className="text-xs text-gray-400 pl-1">{helperText}</p>}
    </div>
  );
};

export const PasswordInput = ({ id, name, label, onFocus, onBlur, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const enableInteraction = () => {
    if (!isInteractive) setIsInteractive(true);
  };

  return (
    <div className="space-y-2 relative group/input">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 pl-1 transition-colors group-hover/input:text-gray-100">
        {label}
      </label>
      {/* Focus Halo Glow */}
      <div
        className={`absolute inset-0 top-7 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 -m-[1.5px] transition-all duration-500 ease-premium pointer-events-none ${
          isFocused ? "opacity-100 blur-[2px]" : "opacity-0 blur-0"
        }`}
      />
      <div className="relative z-10">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? "text-indigo-400" : "text-gray-500"}`}>
          <Lock className="h-5 w-5" />
        </div>
        <input
          id={id}
          name={name || id}
          type={showPassword ? "text" : "password"}
          readOnly={!isInteractive}
          onMouseDown={enableInteraction}
          onTouchStart={enableInteraction}
          onKeyDown={enableInteraction}
          onFocus={(e) => {
            enableInteraction();
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          className={`
            block w-full pl-12 pr-12 py-3.5 text-sm
            bg-white/5 backdrop-blur-xl border border-white/10
            rounded-xl shadow-sm placeholder-gray-500 text-gray-100
            transition-all duration-300 ease-premium
            focus:outline-none focus:bg-white/10 focus:border-transparent
            hover:bg-white/[0.07] hover:border-white/20
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export const CheckboxField = ({ id, checked, onChange, label, helperText, ...props }) => (
  <div className="flex items-center justify-between text-xs py-1 select-none">
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white transition-colors">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-indigo-600 transition-all"
        {...props}
      />
      <span className="font-medium text-gray-300 hover:text-gray-100">{label}</span>
    </label>
    {helperText && (
      <span className="text-gray-500 text-[11px]">{helperText}</span>
    )}
  </div>
);

export const Button = ({ children, isLoading, disabled, ...props }) => (
  <div className="relative group z-20">
    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 group-hover:blur-xl transition-all duration-500 ease-premium" />
    <button
      disabled={isLoading || disabled}
      className={`
        relative w-full flex justify-center items-center py-3.5 px-4
        bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500
        rounded-xl text-sm font-bold text-white
        shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F1117] focus:ring-indigo-500
        disabled:opacity-70 disabled:cursor-not-allowed
        transition-all duration-300 ease-premium
        active:scale-[0.98] group-hover:-translate-y-0.5 hover:brightness-105
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {children} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </>
      )}
    </button>
  </div>
);

export const GoogleButton = ({ isLoading, isDisabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading || isDisabled}
    className={`relative w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-medium text-gray-300 shadow-sm hover:bg-white/10 hover:text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0F1117] focus:ring-indigo-500 transition-all duration-300 ease-premium hover:-translate-y-0.5 group ${
      isLoading || isDisabled ? "opacity-60 cursor-not-allowed hover:translate-y-0 hover:bg-white/5 hover:border-white/10 hover:text-gray-300" : ""
    }`}
  >
    {isLoading ? (
      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
    ) : (
      <>
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path d="M 22.56 12.25 C 22.56 11.47 22.49 10.72 22.36 10 L 12 10 L 12 14.26 L 17.92 14.26 C 17.66 15.63 16.88 16.79 15.71 17.57 L 15.71 20.34 L 19.28 20.34 C 21.36 18.42 22.56 15.6 22.56 12.25 Z" fill="#4285F4" />
            <path d="M 12 23 C 14.97 23 17.46 22.02 19.28 20.34 L 15.71 17.57 C 14.73 18.23 13.48 18.63 12 18.63 C 9.14 18.63 6.71 16.7 5.84 14.1 L 2.18 14.1 L 2.18 16.94 C 3.99 20.53 7.7 23 12 23 Z" fill="#34A853" />
            <path d="M 5.84 14.1 C 5.62 13.44 5.49 12.74 5.49 12 C 5.49 11.26 5.62 10.56 5.84 9.9 L 5.84 7.07 L 2.18 7.07 C 1.43 8.55 1 10.22 1 12 C 1 13.78 1.43 15.45 2.18 16.94 L 5.84 14.1 Z" fill="#FBBC05" />
            <path d="M 12 5.38 C 13.62 5.38 15.06 5.94 16.21 7.02 L 19.36 3.87 C 17.45 2.09 14.97 1 12 1 C 7.7 1 3.99 3.47 2.18 7.07 L 5.84 9.9 C 6.71 7.3 9.14 5.38 12 5.38 Z" fill="#EA4335" />
          </g>
        </svg>
        Continue with Google
      </>
    )}
  </button>
);

export const GithubIcon = ({ className = "w-5 h-5" }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 24 24" width="24" height="24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const GithubButton = ({ isLoading, isDisabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading || isDisabled}
    className={`relative w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl text-sm font-medium text-gray-300 shadow-sm hover:bg-white/10 hover:text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0F1117] focus:ring-indigo-500 transition-all duration-300 ease-premium hover:-translate-y-0.5 group ${
      isLoading || isDisabled ? "opacity-60 cursor-not-allowed hover:translate-y-0 hover:bg-white/5 hover:border-white/10 hover:text-gray-300" : ""
    }`}
  >
    {isLoading ? (
      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
    ) : (
      <>
        <GithubIcon className="h-5 w-5 mr-2 text-gray-200" />
        Continue with GitHub
      </>
    )}
  </button>
);

export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start animate-in fade-in slide-in-from-top-1 duration-300">
      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
      <p className="text-sm text-red-300">{message}</p>
    </div>
  );
};

export const NoticeMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start animate-in fade-in slide-in-from-top-1 duration-300">
      <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
      <p className="text-sm text-emerald-300">{message}</p>
    </div>
  );
};

// Regex nhận diện email học thuật (.edu, .edu.vn, .ac.uk, v.v.)
export const ACADEMIC_EMAIL_REGEX = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i;
export const STUDENT_BONUS_POINTS = 30;

export const StudentBenefitBanner = ({ email }) => {
  const isStudent = ACADEMIC_EMAIL_REGEX.test((email || "").trim().toLowerCase());
  return (
    <div
      className={`mb-8 relative overflow-hidden rounded-2xl border transition-all duration-500 ease-premium ${
        isStudent ? "bg-indigo-900/30 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.25)]" : "bg-white/5 border-white/10"
      }`}
    >
      <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-teal-500/20 blur-md transition-opacity duration-500 ${isStudent ? "opacity-100 animate-pulse-slow" : "opacity-0"}`} />
      <div className="relative z-10 flex items-start p-4">
        <div className={`flex-shrink-0 p-2 rounded-lg transition-colors duration-500 ${isStudent ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50" : "bg-white/10 text-gray-400"}`}>
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="ml-4 transition-all duration-500">
          <h3 className={`text-sm font-semibold ${isStudent ? "text-indigo-100" : "text-gray-200"}`}>Student Benefit Program</h3>
          <div className="mt-1 relative h-5">
            <p className={`text-xs absolute top-0 left-0 transition-all duration-500 ${isStudent ? "opacity-0 translate-y-2" : "opacity-100 text-gray-400"} `}>
              Đăng ký bằng email trường để nhận <span className="text-teal-300 font-semibold">+{STUDENT_BONUS_POINTS} điểm uy tín</span>.
            </p>
            <p className={`text-xs flex items-center font-medium text-emerald-300 absolute top-0 left-0 transition-all duration-500 ${isStudent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"} `}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Đã nhận diện email trường! (+{STUDENT_BONUS_POINTS} pts)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * AuthCard: Double-bezel concentric enclosure wrapped in AuthSurroundings (Astrolabe Rings, Telemetry Badges, Top Bar).
 */
export const AuthCard = ({ children, mode = "cosmic-wave" }) => (
  <div className="min-h-screen relative overflow-hidden font-sans bg-space-950 select-none">
    <AmbientBackground mode={mode} />
    <NoiseOverlay />
    <AuthSurroundings>
      <div className="max-w-[460px] w-full perspective-1000 animate-card-in">
        {/* Outer Shell: Machine-tooled bezel */}
        <div className="relative p-1.5 rounded-[32px] bg-white/[0.04] border border-white/10 shadow-glass-deep backdrop-blur-3xl transition-all duration-500 hover:border-white/20 hover:shadow-neon-primary">
          {/* Inner Core: Deep Space Cyber Canvas */}
          <div className="relative rounded-[calc(32px-0.375rem)] bg-space-950/85 backdrop-blur-2xl py-8 px-6 sm:py-10 sm:px-10 border border-white/[0.06] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-60" />
            {children}
          </div>
        </div>
      </div>
    </AuthSurroundings>
  </div>
);
