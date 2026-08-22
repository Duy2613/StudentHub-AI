"use client";

// components/whiteboard/WhiteboardCanvas.jsx
// Tldraw dynamic canvas embedding

import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function WhiteboardCanvas() {
  return (
    <div className="w-full h-full relative tldraw-custom-wrapper">
      <Tldraw
        inferDarkMode={true}
        persistenceKey="studenthub-whiteboard-session"
      />
    </div>
  );
}
