"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  Brain,
  Trash2,
  CheckCircle2,
  Save,
  RotateCcw
} from "lucide-react";

export function PersonalizationControls() {
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [goalRes, memRes] = await Promise.all([
        fetch("/api/personalization/goals"),
        fetch("/api/personalization/memory")
      ]);
      const goalJson = await goalRes.json();
      const memJson = await memRes.json();

      if (goalJson.success) setGoals(goalJson.data || []);
      if (memJson.success) setMemories(memJson.data || []);
    } catch (err) {
      console.error("Failed loading personalization controls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Sliders className="w-7 h-7" />
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Kiểm Soát Cá Nhân Hóa & Bộ Nhớ AI</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Tùy chỉnh cường độ khuyến nghị, mục tiêu học tập và kiểm toán các ghi nhớ AI được ủy quyền.
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            {message}
          </div>
        )}
      </div>

      {/* 1. Academic Goals */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Mục Tiêu Học Vụ Của Bạn (Academic Goals)</span>
        </h3>

        <div className="space-y-3">
          {goals.map((g) => (
            <div
              key={g.goalId}
              className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-neutral-200">{g.title}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Phân loại: <strong className="text-neutral-300">{g.category}</strong> • Ưu tiên: <strong className="text-cyan-400">{g.priority}</strong> • Hạn: {g.deadline || "Trong học kỳ"}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Tiến độ: {g.currentProgress || 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Auditable AI Memories */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span>Bộ Nhớ AI Được Ủy Quyền (Auditable AI Memory)</span>
        </h3>
        <p className="text-xs text-neutral-300">
          Chỉ những thông tin bạn chủ động xác nhận mới được AI lưu lại. Không tự động suy diễn trái phép.
        </p>

        {memories.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500">
            Chưa có ghi nhớ dài hạn nào được lưu.
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((m) => (
              <div
                key={m.memoryId}
                className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs flex items-center justify-between"
              >
                <span className="text-neutral-200">{m.text}</span>
                <span className="text-[10px] text-neutral-500 font-mono">AUTHORIZED</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
