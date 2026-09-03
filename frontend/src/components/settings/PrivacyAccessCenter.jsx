"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Download, Key, Laptop, Lock, RotateCcw, Shield, Smartphone, Tablet, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { createAuthRequiredState, createErrorState, createOfflineState, createStateEnvelope, createUnavailableState, createWorkIdentity, uiStateForApiError } from "@/lib/ui-state/model";
import StateBoundary from "@/components/ui/StateBoundary";
import SourceDisclosure from "@/components/ui/SourceDisclosure";

const devicesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    deviceId: z.string().min(1),
    deviceName: z.string().min(1),
    platform: z.string().min(1),
    ipAddress: z.string().nullable().optional(),
    lastSeenAt: z.string().datetime().nullable().optional(),
    securityStatus: z.string().min(1).nullable().optional(),
  }).passthrough()).max(50),
}).passthrough();

const actionResponseSchema = z.object({ success: z.literal(true), data: z.unknown().optional() }).passthrough();
const exportResponseSchema = z.object({ success: z.literal(true), data: z.unknown() }).passthrough();

function providerError(caught, dependency, requestId) {
  const error = caught instanceof ApiError ? caught : new ApiError("Privacy provider request failed.", "SERVER_ERROR", { requestId });
  const state = uiStateForApiError(error.code);
  const common = {
    phase: `${dependency.toUpperCase()}_FAILED`,
    requestId: error.requestId || requestId,
    retryable: error.retryable,
    nextActions: error.code === "UNAUTHORIZED" ? [{ id: "SIGN_IN", label: "Đăng nhập để tiếp tục" }] : [{ id: "RETRY", label: "Thử lại" }],
  };
  if (state === "AUTH_REQUIRED") return createAuthRequiredState(error.toSafeError(), common);
  if (state === "FORBIDDEN") return createStateEnvelope({ ...common, state: "FORBIDDEN", error: error.toSafeError() });
  if (state === "OFFLINE") return createOfflineState({ ...common, error: error.toSafeError() });
  if (state === "UNAVAILABLE") return createUnavailableState({ ...common, error: error.toSafeError(), unavailable: { dependency, reason: error.code === "TIMEOUT" ? "TIMEOUT" : "UNREACHABLE" } });
  return createErrorState(error.toSafeError(), common);
}

function assertSuccess(payload, dependency) {
  if (!payload?.success) throw new ApiError(`${dependency} did not confirm success.`, "INVALID_RESPONSE");
  return payload;
}

export function PrivacyAccessCenter() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [deviceResult, setDeviceResult] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadDevices = useCallback(async (signal) => {
    const identity = createWorkIdentity("privacy-devices");
    setDeviceResult(createStateEnvelope({ state: "LOADING", phase: "DEVICES_LOADING", requestId: identity.requestId, retryable: true, nextActions: [] }));
    try {
      const payload = await apiRequest("/api/personalization/devices", { method: "GET", signal, requestId: identity.requestId, schema: devicesResponseSchema });
      const nextDevices = payload.data || [];
      setDevices(nextDevices);
      setDeviceResult(createStateEnvelope({ state: nextDevices.length ? "SUCCESS" : "EMPTY", phase: "DEVICES_READY", data: nextDevices, requestId: identity.requestId, retryable: false, nextActions: [] }));
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ABORTED") return;
      setDeviceResult(providerError(caught, "personalization-devices", identity.requestId));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDevices(controller.signal);
    return () => controller.abort("privacy-view-unmounted");
  }, [loadDevices]);

  const runAction = useCallback(async (path, options, successMessage, dependency) => {
    const identity = createWorkIdentity(`privacy-${dependency}`);
    try {
      const payload = await apiRequest(path, { ...options, requestId: identity.requestId, schema: actionResponseSchema });
      assertSuccess(payload, dependency);
      setMessage({ type: "success", text: successMessage });
      return true;
    } catch (caught) {
      const error = caught instanceof ApiError ? caught : new ApiError("Privacy action failed.", "SERVER_ERROR", { requestId: identity.requestId });
      setMessage({ type: "error", text: error.userMessage });
      return false;
    }
  }, []);

  const handleRevokeDevice = async (deviceId) => {
    const revoked = await runAction("/api/personalization/devices/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    }, "Đã gửi yêu cầu thu hồi thiết bị.", "device-revoke");
    if (revoked) loadDevices();
  };

  const handleRevokeAllOthers = async () => {
    if (!devices.length) return;
    const revoked = await runAction("/api/personalization/devices/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revokeAllOthers: true, currentDeviceId: devices[0]?.deviceId }),
    }, "Đã gửi yêu cầu thu hồi các phiên khác.", "device-revoke-all");
    if (revoked) loadDevices();
  };

  const handleExportData = async () => {
    const identity = createWorkIdentity("privacy-export");
    try {
      const payload = await apiRequest("/api/personalization/digital-twin", { method: "GET", requestId: identity.requestId, schema: exportResponseSchema });
      assertSuccess(payload, "digital-twin-export");
      const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload.data, null, 2))}`;
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `studenthub_data_export_${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setMessage({ type: "success", text: "Đã tạo tệp xuất dữ liệu từ nguồn được xác thực." });
    } catch (caught) {
      const error = caught instanceof ApiError ? caught : new ApiError("Data export failed.", "SERVER_ERROR", { requestId: identity.requestId });
      setMessage({ type: "error", text: error.userMessage });
    }
  };

  const handleResetPersonalization = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt cá nhân hóa về mặc định ban đầu?")) return;
    setResetting(true);
    await runAction("/api/personalization/reset", { method: "POST" }, "Đã gửi yêu cầu đặt lại cá nhân hóa.", "personalization-reset");
    setResetting(false);
  };

  const getPlatformIcon = (platform) => {
    if (["MOBILE_IOS", "MOBILE_ANDROID"].includes(platform)) return <Smartphone className="w-5 h-5 text-cyan-400" />;
    if (platform === "TABLET") return <Tablet className="w-5 h-5 text-indigo-400" />;
    return <Laptop className="w-5 h-5 text-blue-400" />;
  };

  const deviceAction = (action) => {
    if (action.id === "RETRY") loadDevices();
    if (action.id === "SIGN_IN") router.push("/login");
  };
  const deviceIsReady = deviceResult?.state === "SUCCESS" || deviceResult?.state === "EMPTY";
  const deviceRows = useMemo(() => deviceIsReady ? devices : [], [deviceIsReady, devices]);

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-3xl p-6">
        <div className="flex items-center gap-3 text-cyan-400"><Shield className="w-7 h-7" /><div><h1 className="text-xl font-bold text-app-primary">Trung tâm bảo mật, thiết bị &amp; quyền riêng tư</h1><p className="mt-1 text-xs text-app-muted">Chỉ hiển thị trạng thái mà contract hiện tại có thể xác minh; nguồn chưa kết nối không được trình bày như đang hoạt động.</p></div></div>
        <SourceDisclosure sourceMode="LIVE" provenance={{ requestedMode: "LIVE", sourceMode: "LIVE", kind: "LIVE_PROVIDER", label: "Privacy API", providerId: "privacy-api", disclosure: "Trạng thái thiết bị và thao tác quyền riêng tư đến từ API cùng nguồn." }} className="mt-4" />
        {message && <div className={`mt-4 flex items-center justify-between rounded-2xl p-3.5 text-xs ${message.type === "success" ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300" : "border border-rose-500/30 bg-rose-950/40 text-rose-300"}`} role={message.type === "error" ? "alert" : "status"}><span>{message.text}</span><button type="button" onClick={() => setMessage(null)} className="font-bold underline">Đóng</button></div>}
      </section>

      <section className="surface-card space-y-4 rounded-3xl p-6" aria-labelledby="devices-title">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 id="devices-title" className="flex items-center gap-2 text-sm font-bold text-neutral-100"><Laptop className="w-4 h-4 text-cyan-400" />Thiết bị đang hoạt động ({devices.length})</h2><p className="mt-0.5 text-xs text-neutral-400">Danh sách được lấy từ session/device API. Nếu nguồn không xác minh được, hệ thống giữ trạng thái lỗi.</p></div><button type="button" onClick={handleRevokeAllOthers} disabled={!deviceRows.length} className="self-start rounded-xl border border-neutral-700/60 bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 transition-all hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center">Đăng xuất thiết bị khác</button></div>
        {deviceResult && deviceResult.state !== "SUCCESS" && deviceResult.state !== "EMPTY" && <StateBoundary envelope={deviceResult} onAction={deviceAction} />}
        {deviceIsReady && <div className="space-y-3">{deviceRows.length ? deviceRows.map((device, index) => <div key={device.deviceId} className="flex flex-col justify-between gap-3 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-4 text-xs sm:flex-row sm:items-center"><div className="flex items-start space-x-3.5"><div className="shrink-0 rounded-xl border border-neutral-800 bg-neutral-900 p-2.5">{getPlatformIcon(device.platform)}</div><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-neutral-200">{device.deviceName}</span>{index === 0 && <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">THIẾT BỊ NÀY</span>}<span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-neutral-300">{device.securityStatus || "UNKNOWN"}</span></div><div className="mt-1 text-[11px] text-neutral-400">IP: {device.ipAddress || "Không công bố"} · Lần hoạt động cuối: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString("vi-VN") : "Không có thời điểm"}</div></div></div>{index !== 0 && <button type="button" onClick={() => handleRevokeDevice(device.deviceId)} className="flex items-center space-x-1.5 self-start rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-900/50 sm:self-center"><Trash2 className="w-3.5 h-3.5" />Thu hồi</button>}</div>) : <StateBoundary envelope={deviceResult} />}</div>}
      </section>

      <section className="surface-card space-y-4 rounded-3xl p-6" aria-labelledby="integrations-title"><h2 id="integrations-title" className="flex items-center gap-2 text-sm font-bold text-neutral-100"><Key className="w-4 h-4 text-indigo-400" />Tài khoản và nguồn dữ liệu đã kết nối</h2><div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-100"><strong>NOT_CONFIGURED</strong><p className="mt-1 text-amber-100/75">Contract hiện tại chưa cung cấp danh sách kết nối tài khoản giáo dục hoặc mạng xã hội. Không hiển thị các nguồn này như đã xác thực.</p></div></section>

      <section className="surface-card space-y-4 rounded-3xl p-6" aria-labelledby="privacy-controls-title"><h2 id="privacy-controls-title" className="flex items-center gap-2 text-sm font-bold text-neutral-100"><Lock className="w-4 h-4 text-emerald-400" />Quyền sở hữu dữ liệu &amp; cá nhân hóa</h2><p className="text-xs leading-relaxed text-neutral-300">Các thao tác dưới đây chỉ báo thành công sau khi API xác nhận. StudentHub không tự tạo bản sao hoặc trạng thái quyền riêng tư thay thế khi provider không khả dụng.</p><div className="flex flex-wrap items-center gap-3 pt-2"><button type="button" onClick={handleExportData} className="flex items-center space-x-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 transition-all hover:bg-cyan-500"><Download className="w-4 h-4" />Xuất dữ liệu cá nhân</button><button type="button" onClick={handleResetPersonalization} disabled={resetting} className="flex items-center space-x-2 rounded-xl border border-neutral-700/60 bg-neutral-800 px-4 py-2.5 text-xs font-bold text-neutral-300 transition-all hover:bg-neutral-700 disabled:opacity-50"><RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />Đặt lại cá nhân hóa</button></div></section>
    </div>
  );
}
