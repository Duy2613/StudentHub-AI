"use client";

import React, { useState, useEffect } from "react";
import { Link2, RefreshCw, Layers } from "lucide-react";

export function ConnectedSourcesManager() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [message, setMessage] = useState(null);

  const loadSources = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/intelligence/social/sources");
      const json = await res.json();
      if (json.success) {
        setSources(json.data || []);
      }
    } catch (err) {
      console.error("Failed loading sources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSync = async (connectorId) => {
    try {
      setSyncingId(connectorId);
      const res = await fetch("/api/intelligence/social/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: `Đồng bộ thành công nguồn '${connectorId}'. Đã nạp ${json.data?.itemsIngested || 0} mục dữ liệu mới.`
        });
        loadSources();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Đồng bộ thất bại. Vui lòng thử lại sau." });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Link2 className="w-7 h-7" />
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Quản Lý Nguồn Dữ Liệu & Tài Khoản Liên Kết</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Kiểm soát các kết nối dữ liệu chính quy, feed thông báo học vụ và quyền riêng tư nguồn nạp vào hệ thống.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/40 border border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold underline">
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Sources List */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Danh Sách Nguồn Đang Hoạt Động ({sources.length})</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-500">Đang tải danh sách nguồn kết nối...</div>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => (
              <div
                key={s.connectorId}
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-neutral-200">{s.connectorId}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {s.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {s.health}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Phân loại: <strong className="text-neutral-300">{s.sourceClassification}</strong> • Quyền: {s.capabilities.join(", ")}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Giới hạn: {s.rateLimits?.requestsPerMinute || 60} req/phút
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-center">
                  <button
                    onClick={() => handleSync(s.connectorId)}
                    disabled={syncingId === s.connectorId}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700/60 flex items-center space-x-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === s.connectorId ? "animate-spin" : ""}`} />
                    <span>Đồng bộ ngay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
