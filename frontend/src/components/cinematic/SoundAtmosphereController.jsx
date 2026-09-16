"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * SoundAtmosphereController
 * Inspired by overworldaudio.com & arstraumur.music
 * Generative ambient soundscape engine using the browser's native Web Audio API.
 * Synthesizes an ethereal 432Hz harmonic resonant atmosphere with zero external audio assets.
 */
export default function SoundAtmosphereController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const oscillatorsRef = useRef([]);

  // Synthesize ethereal 432Hz harmonic chord: A (432), E (648), C# (540)
  const startAtmosphere = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Master Gain for smooth crossfade
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      // Gentle fade in over 3 seconds to avoid sudden clicks
      masterGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 3.0);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Lowpass Filter for warm, deep cinematic tone
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(480, ctx.currentTime);
      filter.Q.setValueAtTime(2.0, ctx.currentTime);
      filter.connect(masterGain);

      // Procedural LFO for breathing filter modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second slow breathing cycle
      lfoGain.gain.setValueAtTime(120, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      // Three harmonic sine waves: Root (216Hz), Quint (324Hz), Octave (432Hz)
      const frequencies = [216, 324, 432];
      const oscNodes = frequencies.map((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        // Subtle detuning for lush stereo-like shimmer
        osc.frequency.setValueAtTime(freq + (idx === 1 ? 0.35 : idx === 2 ? -0.4 : 0), ctx.currentTime);
        oscGain.gain.setValueAtTime(0.3 / frequencies.length, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        return osc;
      });

      oscillatorsRef.current = [...oscNodes, lfo];
      setIsPlaying(true);
      setAudioInitialized(true);
    } catch (e) {
      console.warn("Web Audio atmosphere initialization suppressed:", e);
    }
  }, []);

  const stopAtmosphere = useCallback(() => {
    if (audioCtxRef.current && masterGainRef.current) {
      const ctx = audioCtxRef.current;
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime);
      masterGainRef.current.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      setTimeout(() => {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        oscillatorsRef.current = [];
        setIsPlaying(false);
      }, 1300);
    } else {
      setIsPlaying(false);
    }
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      stopAtmosphere();
    } else {
      startAtmosphere();
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-space-950/85 border border-white/10 backdrop-blur-xl shadow-2xl text-slate-300 select-none group hover:border-emerald-500/40 transition-all duration-300"
      data-cursor={isPlaying ? "MUTE AUDIO" : "PLAY ATMOSPHERE"}
    >
      {/* Equalizer Waveform Bars (Overworld Audio Style) */}
      <div className="flex items-end gap-[3px] h-3.5 w-4" aria-hidden="true">
        <span
          className={`w-[2.5px] rounded-full bg-emerald-400 transition-all ${
            isPlaying ? "animate-[bounce_0.8s_ease-in-out_infinite] h-3" : "h-1 opacity-40"
          }`}
        />
        <span
          className={`w-[2.5px] rounded-full bg-teal-400 transition-all ${
            isPlaying ? "animate-[bounce_1.2s_ease-in-out_infinite_0.2s] h-3.5" : "h-1.5 opacity-40"
          }`}
        />
        <span
          className={`w-[2.5px] rounded-full bg-cyan-400 transition-all ${
            isPlaying ? "animate-[bounce_0.9s_ease-in-out_infinite_0.4s] h-2.5" : "h-1 opacity-40"
          }`}
        />
      </div>

      {/* Monospace Telemetry Status */}
      <button
        type="button"
        onClick={toggleSound}
        className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
        aria-label={isPlaying ? "Tắt âm thanh không gian 432Hz" : "Bật âm thanh không gian 432Hz"}
      >
        <div className="flex flex-col">
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
            OVERWORLD // AUDIO
          </span>
          <span className="text-[11px] font-mono font-semibold text-emerald-400 tracking-wider">
            {isPlaying ? "432Hz AMBIENT ACTIVE" : "ATMOSPHERE MUTED"}
          </span>
        </div>

        <div className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 ml-1">
          {isPlaying ? <Volume2 size={15} className="text-emerald-400" /> : <VolumeX size={15} />}
        </div>
      </button>
    </div>
  );
}
