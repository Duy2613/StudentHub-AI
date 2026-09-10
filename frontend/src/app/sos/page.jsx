'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  generateEmergencySosPayload,
  OFFICIAL_EMERGENCY_HOTLINES,
} from '@/lib/intelligence/emergency/emergencySystemEngine';

const HOLD_DURATION_MS = 2000; // 2.0s Verified Canonical Hold Duration

export default function EmergencySosPage() {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [locationStatus, setLocationStatus] = useState('ACQUIRING'); // 'ACQUIRING' | 'AVAILABLE' | 'LOCATION_UNAVAILABLE'
  const [coords, setCoords] = useState(null);
  const [preparedPayload, setPreparedPayload] = useState(null);
  const holdStartTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  // Geolocation Acquisition — Zero Fake Coordinates
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('LOCATION_UNAVAILABLE');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationStatus('AVAILABLE');
      },
      (err) => {
        console.warn(
          '[SOS Security Guard] Geolocation failed. Transitioning to LOCATION_UNAVAILABLE. Never fabricate coordinates.',
          err
        );
        setLocationStatus('LOCATION_UNAVAILABLE');
        setCoords(null);
      },
      geoOptions
    );
  }, []);

  // Calibrated 2.0s Hold Engine
  const startHold = () => {
    setIsHolding(true);
    holdStartTimeRef.current = Date.now();

    const step = () => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (progress < 100) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        triggerLocalSosActivation();
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setHoldProgress(0);
  };

  const triggerLocalSosActivation = () => {
    setIsHolding(false);
    // Payload generation without fake coordinates
    const payload = generateEmergencySosPayload({
      coords: locationStatus === 'AVAILABLE' ? coords : null,
      timestamp: new Date().toISOString(),
    });
    setPreparedPayload(payload);
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 flex flex-col justify-between max-w-md mx-auto select-none">
      {/* Top Banner: Immediate Direct Call (Native Telephony) */}
      <div>
        <div className="text-center mb-6">
          <span className="text-xs font-[family-name:var(--font-technical)] text-[var(--status-danger)] uppercase tracking-widest font-bold">
            TRUNG TÂM KHẨN CẤP SINH VIÊN
          </span>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-ui)] mt-1 vn-heading-safe">
            Cứu nạn & Trợ giúp Tức thời
          </h1>
        </div>

        {/* Primary Hotlines Strip */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <a
            href="tel:113"
            className="flex flex-col items-center justify-center p-3 bg-red-950/40 border border-red-800/60 rounded text-center active:bg-red-900/60"
          >
            <span className="text-xl font-bold text-red-400">113</span>
            <span className="text-[11px] text-red-200">Cảnh sát Phản ứng nhanh</span>
          </a>
          <a
            href="tel:115"
            className="flex flex-col items-center justify-center p-3 bg-red-950/40 border border-red-800/60 rounded text-center active:bg-red-900/60"
          >
            <span className="text-xl font-bold text-red-400">115</span>
            <span className="text-[11px] text-red-200">Cấp cứu Y tế</span>
          </a>
        </div>
      </div>

      {/* Center: 2.0s Press-and-Hold Button */}
      <div className="flex flex-col items-center my-6">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Circular Progress Perimeter */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cy="50"
              cx="50"
              r="44"
              className="stroke-neutral-900 fill-none"
              strokeWidth="6"
            />
            <circle
              cy="50"
              cx="50"
              r="44"
              className="stroke-[var(--status-danger)] fill-none transition-all duration-75"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * holdProgress) / 100}
            />
          </svg>

          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="w-44 h-44 rounded-full bg-red-600 active:bg-red-700 flex flex-col items-center justify-center p-4 text-center shadow-lg active:scale-95 transition-transform"
            aria-label="Nhấn và giữ 2 giây để tạo tín hiệu khẩn cấp"
          >
            <span className="text-3xl font-black tracking-wider">SOS</span>
            <span className="text-xs font-semibold mt-1 opacity-90">GIỮ 2 GIÂY</span>
          </button>
        </div>
        <p className="text-xs text-neutral-400 text-center mt-4 max-w-xs">
          Giữ nút tròn trong 2.0 giây để tự động soạn tin nhắn tọa độ cứu nạn. Nhả tay trước 2 giây để hủy.
        </p>
      </div>

      {/* Bottom Status: Location Integrity & Prepared Actions */}
      <div className="border-t border-neutral-800 pt-4 text-xs font-[family-name:var(--font-technical)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-500">TRẠNG THÁI GPS:</span>
          {locationStatus === 'AVAILABLE' && (
            <span className="text-[var(--status-success)] font-semibold">
              TỌA ĐỘ SẴN SÀNG (±{Math.round(coords?.accuracy || 0)}m)
            </span>
          )}
          {locationStatus === 'ACQUIRING' && (
            <span className="text-[var(--status-warning)]">ĐANG DÒ TỌA ĐỘ VỆ TINH...</span>
          )}
          {locationStatus === 'LOCATION_UNAVAILABLE' && (
            <span className="text-[var(--status-danger)] font-bold">
              [VỊ TRÍ KHÔNG KHẢ DỤNG]
            </span>
          )}
        </div>

        {locationStatus === 'LOCATION_UNAVAILABLE' && (
          <div className="p-2.5 bg-red-950/30 border border-red-900/50 rounded text-[11px] text-red-300 mb-3">
            Cảnh báo an toàn: Thiết bị chưa cấp quyền GPS hoặc tín hiệu yếu. Vui lòng nói rõ địa chỉ hoặc cột mốc xung quanh khi gọi 113.
          </div>
        )}

        {preparedPayload && (
          <div className="mt-4 p-3 bg-neutral-900 border border-neutral-700 rounded">
            <span className="text-neutral-400 font-bold block mb-1">TIN NHẮN ĐÃ SOẠN SẴN:</span>
            <p className="text-neutral-200 text-xs mb-3 select-all bg-black p-2 rounded">
              {preparedPayload.message}
            </p>
            {preparedPayload.smsUrl && (
              <a
                href={preparedPayload.smsUrl}
                className="block w-full py-2 bg-white text-black font-bold text-center rounded text-xs"
              >
                MỞ ỨNG DỤNG TIN NHẮN (SMS) ĐỂ GỬI
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
