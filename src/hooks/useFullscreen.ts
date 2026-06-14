"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Cross-browser Fullscreen API helpers.
 *
 * iOS Safari on iPhone doesn't support element fullscreen at all (only video),
 * so everything here degrades gracefully: `isSupported` is false and the
 * enter/exit calls become safe no-ops instead of throwing.
 */

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function fsEnabled(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

function fsElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Request fullscreen on the document root. Best-effort: swallows errors and
 * returns false when unsupported or rejected, so callers (e.g. the lobby's
 * "Enter the tank" click handler) never break navigation.
 */
export async function requestAppFullscreen(): Promise<boolean> {
  if (!fsEnabled() || fsElement()) return false;
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function exitAppFullscreen(): Promise<void> {
  if (!fsElement()) return;
  const doc = document as FullscreenDocument;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    /* ignore — leaving fullscreen should never surface an error */
  }
}

export function useFullscreen() {
  const [isSupported, setIsSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsSupported(fsEnabled());
    const sync = () => setIsFullscreen(Boolean(fsElement()));
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    if (fsElement()) {
      void exitAppFullscreen();
    } else {
      void requestAppFullscreen();
    }
  }, []);

  return { isSupported, isFullscreen, toggle };
}
