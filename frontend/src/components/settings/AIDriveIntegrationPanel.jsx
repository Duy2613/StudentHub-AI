"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Cloud, File, Folder, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let current = bytes;
  let index = -1;
  do {
    current /= 1024;
    index += 1;
  } while (current >= 1024 && index < units.length - 1);
  return `${current.toFixed(current >= 10 ? 1 : 2)} ${units[index]}`;
}

export default function AIDriveIntegrationPanel() {
  const [status, setStatus] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusResponse = await fetch("/api/v1/integrations/aidrive?mode=status", { cache: "no-store" });
      const statusPayload = await statusResponse.json();
      if (!statusResponse.ok || !statusPayload.success) throw new Error(statusPayload?.error?.code || "STATUS_FAILED");
      setStatus(statusPayload.data);

      if (statusPayload.data.status === "READY") {
        const listResponse = await fetch("/api/v1/integrations/aidrive?mode=list&path=%2F&limit=12", { cache: "no-store" });
        const listPayload = await listResponse.json();
        if (!listResponse.ok || !listPayload.success) throw new Error(listPayload?.error?.code || "LIST_FAILED");
        setListing(listPayload.data);
      } else {
        setListing(null);
      }
    } catch (requestError) {
      setError(requestError.message || "AIDRIVE_UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const ready = status?.status === "READY";
  return (
    <section className="surface-card overflow-hidden" aria-labelledby="aidrive-title">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-teal-400/25 bg-teal-400/10 text-teal-300"><Cloud size={20} /></span>
          <div>
            <p className="eyebrow">External evidence source</p>
            <h3 id="aidrive-title" className="mt-1 text-base font-bold text-app-primary">GenSpark AI Drive bridge</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-app-muted">Kết nối server-only, chỉ đọc. Token không bao giờ được gửi xuống trình duyệt; FUSE và script đặc quyền không chạy trong ứng dụng.</p>
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading} className="secondary-action self-start" aria-label="Làm mới trạng thái AI Drive">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      <div className="p-5">
        {loading && <div className="h-20 animate-pulse rounded-xl bg-white/[0.04]" aria-label="Đang kiểm tra AI Drive" />}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs text-amber-100">
            <TriangleAlert size={18} className="shrink-0" /><div><strong>Không thể đọc trạng thái AI Drive.</strong><p className="mt-1 text-amber-100/70">Mã: {error}. Kết nối vẫn fail-closed và không dùng dữ liệu giả.</p></div>
          </div>
        )}
        {!loading && !error && status && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className={`rounded-md border px-2 py-1 ${ready ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.04] text-app-muted"}`}>{status.status}</span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-app-muted">{status.mode}</span>
              <span className="rounded-md border border-white/10 px-2 py-1 text-app-muted">{status.release}</span>
              {ready && <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck size={13} /> HTTPS allowlist verified</span>}
            </div>

            {!ready && <p className="text-xs leading-5 text-app-muted">Đặt `GENSPARK_TOKEN` trong secret store của server để kích hoạt. Không dùng các file `genspark_llm.yaml` hoặc `git-credentials.txt` đã cung cấp.</p>}

            {ready && listing && (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {listing.items.length === 0 && <p className="text-xs text-app-muted">Thư mục gốc chưa có tệp hoặc provider không trả mục hợp lệ.</p>}
                {listing.items.map((item) => (
                  <article key={item.path} className="flex min-w-0 items-center gap-3 rounded-xl bg-white/[0.035] p-3">
                    {item.type === "directory" ? <Folder size={17} className="shrink-0 text-teal-300" /> : <File size={17} className="shrink-0 text-slate-300" />}
                    <div className="min-w-0"><p className="truncate text-xs font-semibold text-app-primary">{item.name}</p><p className="mt-0.5 text-[10px] text-app-muted">{item.type === "directory" ? "Thư mục" : formatBytes(item.size)}</p></div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
