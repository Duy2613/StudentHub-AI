"use client";

// frontend/src/components/auth/SaffronAuthModal.jsx
//
// Universal 3D Holographic Auth Modal (Summoned anywhere across the app)
// - Opens SaffronAuthDeck with smooth 3D perspective zoom & dark cocoa backdrop
// - Closes on Escape or backdrop click with audio feedback

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import SaffronAuthDeck from "@/components/auth/SaffronAuthDeck";
import { saffronAudio } from "@/lib/audio/saffronAudio";

export default function SaffronAuthModal({
  isOpen = false,
  onClose,
  initialMode = "login",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        saffronAudio.playClick(400);
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with Frosted Cocoa Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              saffronAudio.playClick(400);
              onClose();
            }}
            className="fixed inset-0 bg-[#0d0403]/85 backdrop-blur-xl"
          />

          {/* Modal Container with 3D Perspective Flip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            className="relative z-10 w-full max-w-[500px] my-auto"
          >
            {/* Close Button Header Tag */}
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => {
                  saffronAudio.playClick(400);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#210a07] hover:bg-[#2f0e09] border border-[#47140b] text-[11px] font-mono text-[#ffbc09] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              >
                <span>[ ✕ ĐÓNG CỬA SỔ ]</span>
              </button>
            </div>

            <SaffronAuthDeck initialMode={initialMode} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
