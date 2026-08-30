"use client";

import React, { useState, useEffect } from "react";
import { Shield, Smartphone, Laptop, Tablet, Trash2, Download, RotateCcw, CheckCircle2, Lock, Key } from "lucide-react";

export function PrivacyAccessCenter() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/personalization/devices");
      const json = await res.json();
      if (json.success) {
        setDevices(json.data || []);
      }
    } catch (err) {
      console.error("Failed loading devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRevokeDevice = async (deviceId) => {
    try {
      const res = await fetch("/api/personalization/devices/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `Đã thu hồi quyền truy cập của thiết bị ${deviceId}.` });
        loadDevices();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Thu hồi thiết bị thất bại." });
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!devices.length) return;
    const currentDevId = devices[0]?.deviceId;
    try {
      const res = await fetch("/api/personalization/devices/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAllOthers: true, currentDeviceId: currentDevId })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Đã thu hồi tất cả phiên đăng nhập trên các thiết bị khác." });
        loadDevices();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Xử lý thất bại." });
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/personalization/digital-twin");
      const json = await res.json();
      if (json.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `studenthub_data_export_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setMessage({ type: "success", text: "Đã xuất thành công toàn bộ hồ sơ dữ liệu cá nhân (GDPR Format)." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Xuất dữ liệu thất bại." });
    }
  };

  const handleResetPersonalization = async () => {
    if (!confirm("Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt cá nhân hóa về mặc định ban đầu?")) return;
    try {
      setResetting(true);
      const res = await fetch("/api/personalization/reset", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Đã đặt lại toàn bộ cài đặt cá nhân hóa về trạng thái an toàn." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Đặt lại thất bại." });
    } finally {
      setResetting(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "MOBILE_IOS":
      case "MOBILE_ANDROID":
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case "TABLET":
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      default:
        return <Laptop className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Shield className="w-7 h-7" />
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Trung Tâm Bảo Mật, Thiết Bị & Quyền Riêng Tư</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Kiểm soát tuyệt đối các thiết bị đăng nhập, liên kết tài khoản và quyền sở hữu dữ liệu cá nhân của bạn.
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

      {/* 1. Multi-Device Management */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>Thiết Bị Đang Hoạt Động ({devices.length})</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Các thiết bị đang duy trì phiên làm việc được ủy quyền trên Zero-Trust Security Fabric.
            </p>
          </div>

          <button
            onClick={handleRevokeAllOthers}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700/60 transition-all self-start sm:self-center"
          >
            Đăng xuất tất cả thiết bị khác
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-neutral-500">Đang tải danh sách thiết bị...</div>
        ) : (
          <div className="space-y-3">
            {devices.map((dev, idx) => (
              <div
                key={dev.deviceId}
                className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
                    {getPlatformIcon(dev.platform)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-neutral-200">{dev.deviceName}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          THIẾT BỊ NÀY
                        </span>
                      )}
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {dev.securityStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      IP: {dev.ipAddress} • Lần hoạt động cuối: {new Date(dev.lastSeenAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>

                {idx !== 0 && (
                  <button
                    onClick={() => handleRevokeDevice(dev.deviceId)}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-xs font-semibold border border-rose-500/30 flex items-center space-x-1.5 transition-all self-start sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Thu hồi</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Connected Accounts */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
          <Key className="w-4 h-4 text-indigo-400" />
          <span>Tài Khoản Đã Kết Nối (Connected Integrations)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-neutral-200">Cổng Đào Tạo HCMUTE (online.hcmute.edu.vn)</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã kết nối • Xác thực 2 chiều chính quy</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-neutral-800 text-neutral-400 font-mono">AUTHORIZED</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-neutral-200">Google Workspace Sinh Viên (@student.hcmute.edu.vn)</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã kết nối • Single Sign-On (SSO)</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-neutral-800 text-neutral-400 font-mono">AUTHORIZED</span>
          </div>
        </div>
      </div>

      {/* 3. Personal Data Vault & Privacy Controls */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Quyền Sở Hữu Dữ Liệu & Cá Nhân Hóa Minh Bạch</span>
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed">
          StudentHub AI tuân thủ nguyên tắc <strong>Anti-Surveillance</strong>: Không thu thập lịch sử trình duyệt, không quét tệp tin trên máy tính, và không đọc clipboard của bạn. Mọi cá nhân hóa đều được giải trình rõ ràng.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Dữ Liệu Cá Nhân (GDPR Export)</span>
          </button>

          <button
            onClick={handleResetPersonalization}
            disabled={resetting}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center space-x-2 border border-neutral-700/60 transition-all"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
            <span>Đặt Lại Cài Đặt Cá Nhân Hóa (Reset)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
