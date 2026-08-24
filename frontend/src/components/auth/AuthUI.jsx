"use client";

// components/auth/AuthUI.jsx
//
// Shared UI components for /login and /register (Vibrant Cosmic Purple/Magenta Constellation & 3D Geometric Neural Mesh).
// Awwwards-tier Double-Bezel architecture with hardware-accelerated 60fps ambient glow,
// GeometricConstellationCanvas, Robin Payot Fluid waves, and Astrolabe Rings.

import React, { useState } from "react";
import { Eye, EyeOff, Lock, Loader2, ArrowRight, AlertCircle, GraduationCap, CheckCircle2 } from "lucide-react";
import AuthSurroundings from "@/components/auth/AuthSurroundings";
import { Meteors } from "@/components/ui/meteors";
import GeometricConstellationCanvas from "@/components/canvas/GeometricConstellationCanvas";
import SparklingStardustCanvas from "@/components/ui/SparklingStardustCanvas";
import PageTransitionWrapper from "@/components/ui/page-transition-wrapper";
import { BorderBeam } from "@/components/ui/border-beam";

export const NoiseOverlay = () => (
  <div
    className="fixed inset-0 z-[2] opacity-[0.03] mix-blend-overlay pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);

export const AmbientBackground = ({ mode = "cosmic-wave" }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 w-full h-full">
      {/* 1. Interactive Real-time 60fps Geometric Constellation Web & Neural Nodes Canvas */}
      <GeometricConstellationCanvas opacity={1} interactive={true} />

      {/* 2. Sparkling Stardust Canvas */}
      <SparklingStardustCanvas count={70} speed={0.45} />

      {/* 3. Ambient Shooting Meteors */}
      <Meteors number={14} />

      {/* 4. Radiant Prismatic Ambient Glows */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-pink-600/40 to-rose-500/35 blur-[130px] mix-blend-screen pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-700/35 to-purple-800/35 blur-[140px] mix-blend-screen pointer-events-none" />
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
        className={`absolute inset-0 top-7 rounded-xl bg-gradient-to-r from-pink-400 via-purple-500 to-teal-400 -m-[1.5px] transition-all duration-500 ease-premium pointer-events-none ${
          isFocused ? "opacity-100 blur-[2px]" : "opacity-0 blur-0"
        }`}
      />
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? "text-pink-400" : "text-gray-400"}`}>
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
            bg-space-950/80 backdrop-blur-2xl border border-white/20
            rounded-xl shadow-sm placeholder-gray-400 text-gray-100
            transition-all duration-300 ease-premium
            focus:outline-none focus:bg-space-950 focus:border-pink-500/50
            hover:bg-space-900/80 hover:border-white/30
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
        className={`absolute inset-0 top-7 rounded-xl bg-gradient-to-r from-pink-400 via-purple-500 to-teal-400 -m-[1.5px] transition-all duration-500 ease-premium pointer-events-none ${
          isFocused ? "opacity-100 blur-[2px]" : "opacity-0 blur-0"
        }`}
      />
      <div className="relative z-10">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isFocused ? "text-pink-400" : "text-gray-400"}`}>
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
            bg-space-950/80 backdrop-blur-2xl border border-white/20
            rounded-xl shadow-sm placeholder-gray-400 text-gray-100
            transition-all duration-300 ease-premium
            focus:outline-none focus:bg-space-950 focus:border-pink-500/50
            hover:bg-space-900/80 hover:border-white/30
          `}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
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
        className="w-4 h-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-400 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-pink-500 transition-all"
        {...props}
      />
      <span className="font-medium text-gray-300 hover:text-gray-100">{label}</span>
    </label>
    {helperText && (
      <span className="text-gray-400 text-[11px]">{helperText}</span>
    )}
  </div>
);

export const Button = ({ children, isLoading, disabled, ...props }) => (
  <div className="relative group z-20">
    <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 via-purple-600 to-pink-500 rounded-2xl blur-lg opacity-80 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500 ease-premium" />
    <button
      disabled={isLoading || disabled}
      className={`
        relative w-full flex justify-center items-center py-3.5 px-4
        bg-gradient-to-r from-teal-400 via-indigo-600 to-pink-500
        rounded-xl text-sm font-bold text-white
        shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06060a] focus:ring-pink-400
        disabled:opacity-70 disabled:cursor-not-allowed
        transition-all duration-300 ease-premium
        active:scale-[0.98] group-hover:-translate-y-0.5 hover:brightness-110
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
    className={`relative w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl bg-space-950/70 border border-white/20 backdrop-blur-2xl text-sm font-medium text-gray-200 shadow-sm hover:bg-space-900/80 hover:text-white hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#06060a] focus:ring-pink-400 transition-all duration-300 ease-premium hover:-translate-y-0.5 group ${
      isLoading || isDisabled ? "opacity-60 cursor-not-allowed hover:translate-y-0 hover:bg-space-950/70 hover:border-white/20 hover:text-gray-200" : ""
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
    className={`relative w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl bg-space-950/70 border border-white/20 backdrop-blur-2xl text-sm font-medium text-gray-200 shadow-sm hover:bg-space-900/80 hover:text-white hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#06060a] focus:ring-pink-400 transition-all duration-300 ease-premium hover:-translate-y-0.5 group ${
      isLoading || isDisabled ? "opacity-60 cursor-not-allowed hover:translate-y-0 hover:bg-space-950/70 hover:border-white/20 hover:text-gray-200" : ""
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
    <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 flex items-start animate-in fade-in slide-in-from-top-1 duration-300">
      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
      <p className="text-sm text-red-200">{message}</p>
    </div>
  );
};

export const NoticeMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 flex items-start animate-in fade-in slide-in-from-top-1 duration-300">
      <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
      <p className="text-sm text-emerald-200">{message}</p>
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
        isStudent ? "bg-pink-950/40 border-pink-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3)]" : "bg-space-950/60 border-white/15"
      }`}
    >
      <div className={`absolute -inset-1 bg-gradient-to-r from-pink-500/25 to-purple-500/25 blur-md transition-opacity duration-500 ${isStudent ? "opacity-100 animate-pulse-slow" : "opacity-0"}`} />
      <div className="relative z-10 flex items-start p-4">
        <div className={`flex-shrink-0 p-2 rounded-lg transition-colors duration-500 ${isStudent ? "bg-pink-500 text-white shadow-lg shadow-pink-500/50 font-bold" : "bg-white/15 text-gray-300"}`}>
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="ml-4 transition-all duration-500">
          <h3 className={`text-sm font-semibold ${isStudent ? "text-pink-100" : "text-gray-200"}`}>Student Benefit Program</h3>
          <div className="mt-1 relative h-5">
            <p className={`text-xs absolute top-0 left-0 transition-all duration-500 ${isStudent ? "opacity-0 translate-y-2" : "opacity-100 text-gray-300"} `}>
              Đăng ký bằng email trường để nhận <span className="text-pink-300 font-semibold">+{STUDENT_BONUS_POINTS} điểm uy tín</span>.
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
 * AuthCard: Double-bezel concentric enclosure with sweeping BorderBeam and Vibrant Purple/Magenta Constellation.
 */
export const AuthCard = ({ children, mode = "cosmic-wave" }) => (
  <PageTransitionWrapper>
    <div className="min-h-screen relative overflow-hidden font-sans bg-transparent select-none">
      <AmbientBackground mode={mode} />
      <NoiseOverlay />
      <AuthSurroundings>
        <div className="max-w-[460px] w-full perspective-1000 animate-card-in">
          {/* Outer Shell: Machine-tooled bezel with BorderBeam laser effect & glowing shadow */}
          <div className="relative p-1.5 rounded-[32px] bg-white/[0.08] border border-white/20 shadow-[0_12px_45px_rgba(0,0,0,0.75)] backdrop-blur-3xl transition-all duration-500 hover:border-pink-400/40 hover:shadow-[0_0_50px_rgba(244,63,94,0.35)] overflow-hidden">
            <BorderBeam size={260} duration={7} colorFrom="#f43f5e" colorTo="#a855f7" />
            
            {/* Inner Core: Deep Space Cyber Canvas */}
            <div className="relative rounded-[calc(32px-0.375rem)] bg-space-950/90 backdrop-blur-3xl py-8 px-6 sm:py-10 sm:px-10 border border-white/10 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/80 to-transparent opacity-90" />
              {children}
            </div>
          </div>
        </div>
      </AuthSurroundings>
    </div>
  </PageTransitionWrapper>
);
