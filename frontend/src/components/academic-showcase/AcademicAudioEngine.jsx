"use client";

import React, { useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function AcademicAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const gainRef = useRef(null);

  const toggleSoundscape = () => {
    if (isPlaying) {
      // Stop smoothly
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
        setTimeout(() => {
          if (osc1Ref.current) osc1Ref.current.stop();
          if (osc2Ref.current) osc2Ref.current.stop();
          setIsPlaying(false);
        }, 500);
      }
    } else {
      // Start 432Hz Ambient Focus Tone
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.2);
        gainNode.connect(ctx.destination);
        gainRef.current = gainNode;

        // Primary 432Hz (Healing harmonic)
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(432, ctx.currentTime);
        osc1.connect(gainNode);
        osc1.start();
        osc1Ref.current = osc1;

        // Binaural beat 436Hz (+4Hz Theta wave for learning & memory consolidation)
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(436, ctx.currentTime);
        osc2.connect(gainNode);
        osc2.start();
        osc2Ref.current = osc2;

        setIsPlaying(true);
      } catch (err) {
        console.error("Audio Context initialization error", err);
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
      <button
        onClick={toggleSoundscape}
        className={`group flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs font-mono backdrop-blur-xl transition-all duration-300 shadow-lg ${
          isPlaying
            ? "border-teal-400/80 bg-teal-950/80 text-teal-300 shadow-[0_0_20px_rgba(52,231,196,0.3)]"
            : "border-white/15 bg-[#0a0d1d]/80 text-gray-400 hover:border-white/30 hover:text-white"
        }`}
        title="Bật/Tắt sóng âm tập trung trí tuệ 432Hz Alpha Waves"
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4 text-teal-400 animate-pulse" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}

        <span className="hidden sm:inline">
          {isPlaying ? "432Hz FOCUS AMBIENCE" : "BẬT ÂM HỌC THUẬT"}
        </span>

        {/* Animated EQ Bars */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 h-full bg-teal-400 rounded-full animate-[bounce_0.8s_infinite_100ms]"></span>
            <span className="w-0.5 h-2/3 bg-teal-400 rounded-full animate-[bounce_0.8s_infinite_300ms]"></span>
            <span className="w-0.5 h-4/5 bg-teal-400 rounded-full animate-[bounce_0.8s_infinite_200ms]"></span>
          </div>
        )}
      </button>
    </div>
  );
}
