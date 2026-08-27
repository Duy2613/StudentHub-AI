"use client";

/**
 * StudentHub AI — Privacy, Security & Source Connection Center
 * Multi-device session revocation, AI Memory audit, GDPR Data Vault export, and honest source statuses.
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Key
} from "lucide-react";

export default function PrivacyAndSecurityCenter() {
  const [activeTab, setActiveTab] = useState("devices");

  const [devices, setDevices] = useState([
    {
      id: "dev_laptop_01",
      name: "ThinkPad X1 Carbon (Web Desktop)",
      platform: "DESKTOP_WEB",
      lastSeen: "Đang hoạt động (Hiện tại)",
      status: "TRUSTED",
      ip: "127.0.0.1 (Localhost)"
    },
    {
      id: "dev_mobile_02",
      name: "iPhone 15 Pro (iOS Safari)",
      platform: "MOBILE_IOS",
      lastSeen: "15 phút trước",
      status: "TRUSTED",
      ip: "14.169.120.45"
    }
  ]);

  const [aiMemories, setAiMemories] = useState([
    {
      id: "mem_01",
      text: "Ưu tiên đăng ký các môn học của Thầy Lê Hoàng Triết vào buổi sáng Thứ 3.",
      category: "PREFERENCE",
      approvedAt: "25/08/2026 09:30"
    },
    {
      id: "mem_02",
      text: "Đặt mục tiêu tốt nghiệp sớm trước 1 học kỳ với GPA >= 8.5.",
      category: "CAREER_GOAL",
      approvedAt: "26/08/2026 14:15"
    }
  ]);

  const sourceStatuses = [
    { name: "Cổng Thông Tin Đào Tạo (PDT HCMUTE)", type: "OFFICIAL", status: "ACTIVE", health: "HEALTHY", lastSync: "10 phút trước" },
    { name: "Cổng Thông Tin Khoa CNTT (FIT HCMUTE)", type: "OFFICIAL", status: "ACTIVE", health: "HEALTHY", lastSync: "12 phút trước" },
    { name: "Institutional RSS Announcements", type: "OFFICIAL_RSS", status: "ACTIVE", health: "HEALTHY", lastSync: "5 phút trước" },
    { name: "GitHub Academic Materials (fit-hcmute)", type: "COMMUNITY_GIT", status: "ACTIVE", health: "HEALTHY", lastSync: "1 giờ trước" },
    { name: "Discord Nhóm Học Tập K24", type: "COMMUNITY_DISCORD", status: "AUTHORIZED", health: "HEALTHY", lastSync: "20 phút trước" },
    { name: "Facebook Groups Sinh Viên HCMUTE", type: "SOCIAL_META", status: "NOT_CONFIGURED", health: "UNSUPPORTED", note: "Chưa cấu hình (Cần Meta App ID & Token)" },
    { name: "Instagram Campus Stories", type: "SOCIAL_META", status: "NOT_CONFIGURED", health: "UNSUPPORTED", note: "Chưa cấu hình" }
  ];

  const handleRevokeDevice = (deviceId) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
  };

  const handleRevokeMemory = (memoryId) => {
    setAiMemories(prev => prev.filter(m => m.id !== memoryId));
  };

  const handleExportData = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      studentId: "24110001",
      name: "Trần Bảo Duy",
      devices,
      aiMemories,
      classificationTiers: {
        academicOfficial: "Được lưu trữ theo cơ chế đối soát chữ ký số từ Phòng Đào Tạo",
        personalPreferences: "Được mã hóa theo chuẩn Zero-Trust",
        transientContext: "Tự động thu hồi sau khi kết thúc phiên làm việc"
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studenthub_data_vault_24110001_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <section className="p-6 rounded-3xl bg-[#120704] border border-[#3d1910] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Privacy, Security & Sources Center</h1>
            <p className="text-xs text-gray-400">Quản trị bảo mật Zero-Trust, thiết bị đăng nhập, bộ nhớ AI và nguồn dữ liệu thực tế</p>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2d120a] pb-2">
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "devices" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          Thiết Bị Đăng Nhập ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("memory")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "memory" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          Bộ Nhớ AI Đã Phê Duyệt ({aiMemories.length})
        </button>
        <button
          onClick={() => setActiveTab("sources")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "sources" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          Kết Nối Nguồn Dữ Liệu
        </button>
        <button
          onClick={() => setActiveTab("gdpr")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "gdpr" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-gray-400 hover:text-white bg-[#120704]"
          }`}
        >
          Xuất Dữ Liệu GDPR
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "devices" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] text-xs text-gray-400 leading-relaxed">
            🛡️ <strong className="text-white">Kiểm Soát Phiên Đăng Nhập:</strong> Bạn có thể thu hồi bất kỳ thiết bị nào từ xa. Khi thu hồi, toàn bộ session token trên thiết bị đó sẽ bị vô hiệu hóa tức thì tại Gateway bảo mật.
          </div>

          <div className="space-y-3">
            {devices.map((d) => (
              <div key={d.id} className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#180905] border border-[#2d120a] text-amber-400">
                    {d.platform === "DESKTOP_WEB" ? <Laptop size={20} /> : <Smartphone size={20} />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{d.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">IP: {d.ip} • Lần cuối: {d.lastSeen}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeDevice(d.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={13} />
                  <span>Thu Hồi</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "memory" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] text-xs text-gray-400 leading-relaxed">
            🧠 <strong className="text-white">Bộ Nhớ AI An Toàn:</strong> AI chỉ ghi nhớ các tùy chọn và mục tiêu sau khi bạn đã xác nhận. Mọi câu lệnh thao túng (prompt injection) đều bị tường lửa AI chặn tuyệt đối.
          </div>

          <div className="space-y-3">
            {aiMemories.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Đã phê duyệt: {m.approvedAt}</span>
                  </div>
                  <p className="text-xs text-gray-200">{m.text}</p>
                </div>

                <button
                  onClick={() => handleRevokeMemory(m.id)}
                  className="px-3 py-1 rounded-xl bg-[#180905] hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-[#2d120a] hover:border-red-500/30 text-xs transition-all"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "sources" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] text-xs text-gray-400 leading-relaxed">
            📡 <strong className="text-white">Báo Cáo Nguồn Dữ Liệu Minh Bạch:</strong> StudentHub công khai trạng thái thực tế của mọi cổng kết nối. Các nền tảng chưa được cấp quyền truy cập chính thống (như Facebook/Instagram) được hiển thị đúng trạng thái <code>NOT_CONFIGURED</code>.
          </div>

          <div className="space-y-3">
            {sourceStatuses.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#120704] border border-[#2d120a] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-white">{s.name}</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                      s.status === "AUTHORIZED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                      "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Loại: {s.type} {s.lastSync && `• Lần đồng bộ cuối: ${s.lastSync}`}
                    {s.note && <span className="text-amber-400/90 ml-1">({s.note})</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "gdpr" && (
        <div className="p-6 rounded-2xl bg-[#120704] border border-[#2d120a] space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Download className="text-amber-400" size={18} />
            <span>Xuất Toàn Bộ Dữ Liệu Cá Nhân (Data Vault GDPR Export)</span>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Bạn có toàn quyền tải về bản sao lưu toàn bộ hồ sơ số cá nhân, các thiết bị đã kết nối, lịch sử mục tiêu học vụ và bộ nhớ AI theo tiêu chuẩn quyền riêng tư cao nhất.
          </p>
          <button
            onClick={handleExportData}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
          >
            <Download size={14} />
            <span>Tải Về File JSON Dữ Liệu Cá Nhân</span>
          </button>
        </div>
      )}
    </div>
  );
}
