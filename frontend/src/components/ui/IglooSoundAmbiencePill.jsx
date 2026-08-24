"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

/**
 * IglooSoundAmbiencePill — Igloo.inc style procedural Web Audio ambient sound & haptic feedback.
 * Uses 100% native browser Web Audio API (0MB external audio files).
 * Synthesizes a crystalline polar drone + delicate celestial harmonics.
 */
export default function IglooSoundAmbiencePill({ className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscNodesRef = useRef([]);

  useEffect(() => {
    setMounted(true);
    return () => {
      stopAmbience();
    };
  }, []);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const startAmbience = () => {
    initAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 3);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Glacial Harmony: Root (D3 = 146.83Hz), Fifth (A3 = 220Hz), Ninth (E4 = 329.63Hz)
    const freqs = [146.83, 220.0, 329.63, 587.33];
    oscNodesRef.current = [];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const filter = ctx.createBiquadFilter();
      const oscGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Gentle LFO pitch vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15 + idx * 0.08;
      lfoGain.gain.value = 1.2;
      lfo.connect(osc.frequency);
      lfo.start();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600 + idx * 200, ctx.currentTime);

      oscGain.gain.value = 0.25 / freqs.length;

      if (panner) {
        panner.pan.value = (idx - 1.5) * 0.4;
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(panner);
        panner.connect(masterGain);
      } else {
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);
      }

      osc.start();
      oscNodesRef.current.push(osc, lfo);
    });

    setIsPlaying(true);
  };

  const stopAmbience = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, ctx.currentTime);
      gainNodeRef.current.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      setTimeout(() => {
        oscNodesRef.current.forEach((node) => {
          try {
            node.stop();
            node.disconnect();
          } catch (e) {}
        });
        oscNodesRef.current = [];
        setIsPlaying(false);
      }, 1200);
    } else {
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAmbience();
    } else {
      startAmbience();
    }
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleSound}
      title={isPlaying ? "Tắt âm hưởng Băng Tuyết Bắc Cực" : "Bật âm hưởng Băng Tuyết Bắc Cực (Web Audio)"}
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-space-900/80 hover:bg-space-850/95 border border-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 shadow-md text-xs select-none ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {isPlaying ? (
          <div className="flex items-center gap-0.5 h-3.5 w-3.5 text-cyan-400">
            <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-0.5 h-3.5 bg-teal-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
            <span className="w-0.5 h-2.5 bg-indigo-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite]" />
          </div>
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-200 transition-colors" />
        )}

        <span className="font-machine text-[10px] tracking-wider uppercase text-gray-300 group-hover:text-white transition-colors">
          {isPlaying ? "SOUND: ON" : "ARCTIC AUDIO"}
        </span>
      </div>

      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 group-hover:bg-cyan-400 transition-colors" />
    </button>
  );
}
