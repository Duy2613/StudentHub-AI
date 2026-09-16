/**
 * CinematicMediaCoordinator.js
 * Single Active Cinematic Video Policy (MAX_ACTIVE_CINEMATIC_PLAYBACK = 1)
 *
 * Coordinates cinematic ambient video playback across landing sections and route surfaces.
 * Guarantees:
 * 1. At most one ambient video decodes/plays at any instant, conserving GPU decoders and memory.
 * 2. Pauses playback immediately when tab/page is hidden (document.hidden === true).
 * 3. Resumes ONLY the currently active, intersected video upon tab return.
 * 4. Gracefully pauses previous videos before playing the next one during continuous scrolling.
 */

class MediaCoordinator {
  constructor() {
    this.activeId = null;
    this.registeredVideos = new Map();
    this.isPageHidden = false;

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      this.isPageHidden = document.hidden;
      document.addEventListener(
        "visibilitychange",
        () => {
          this.isPageHidden = document.hidden;
          if (this.isPageHidden) {
            // Document hidden: pause currently active video
            if (this.activeId && this.registeredVideos.has(this.activeId)) {
              const current = this.registeredVideos.get(this.activeId);
              try {
                current.videoEl?.pause?.();
              } catch {}
              current.onPause?.();
            }
          } else {
            // Document returned: resume ONLY if the active video is still in viewport
            if (this.activeId && this.registeredVideos.has(this.activeId)) {
              const current = this.registeredVideos.get(this.activeId);
              if (current.isVisible && !current.isReducedMotion) {
                try {
                  const playPromise = current.videoEl?.play?.();
                  if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                  }
                } catch {}
                current.onResume?.();
              }
            }
          }
        },
        { passive: true }
      );
    }
  }

  register(id, entry) {
    // entry: { videoEl, onPause, onResume, isVisible, isReducedMotion }
    this.registeredVideos.set(id, {
      videoEl: entry.videoEl,
      onPause: entry.onPause,
      onResume: entry.onResume,
      isVisible: entry.isVisible || false,
      isReducedMotion: entry.isReducedMotion || false,
    });
  }

  updateElement(id, videoEl) {
    const entry = this.registeredVideos.get(id);
    if (entry) {
      entry.videoEl = videoEl;
    }
  }

  unregister(id) {
    if (this.activeId === id) {
      this.activeId = null;
    }
    this.registeredVideos.delete(id);
  }

  updateVisibility(id, isVisible) {
    const entry = this.registeredVideos.get(id);
    if (!entry) return;
    entry.isVisible = isVisible;

    if (!isVisible && this.activeId === id) {
      // Scrolled out of viewport: release playback
      try {
        entry.videoEl?.pause?.();
      } catch {}
      entry.onPause?.();
      this.activeId = null;
    } else if (isVisible && !this.activeId && !this.isPageHidden && !entry.isReducedMotion) {
      // In viewport and slot is free: claim playback
      this.requestPlayback(id);
    }
  }

  requestPlayback(id) {
    if (this.isPageHidden) return false;

    // Release prior active video if distinct
    if (this.activeId && this.activeId !== id) {
      const prev = this.registeredVideos.get(this.activeId);
      if (prev) {
        try {
          prev.videoEl?.pause?.();
        } catch {}
        prev.onPause?.();
      }
    }

    this.activeId = id;
    const current = this.registeredVideos.get(id);
    if (current && current.videoEl && !current.isReducedMotion) {
      try {
        const playPromise = current.videoEl.play?.();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch {}
      current.onResume?.();
      return true;
    }
    return false;
  }

  releasePlayback(id) {
    if (this.activeId === id) {
      const current = this.registeredVideos.get(id);
      if (current) {
        try {
          current.videoEl?.pause?.();
        } catch {}
        current.onPause?.();
      }
      this.activeId = null;
    }
  }

  getActiveId() {
    return this.activeId;
  }
}

// Global singleton instance
export const cinematicMediaCoordinator =
  typeof window !== "undefined"
    ? (window.__cinematicMediaCoordinator =
        window.__cinematicMediaCoordinator || new MediaCoordinator())
    : new MediaCoordinator();

export default cinematicMediaCoordinator;
