"use client";

import { useEffect, useState } from "react";

/**
 * True when the player should get the mobile (single-focus) layout.
 *
 * We can't tell "phone" from "desktop" by width alone — a landscape phone
 * is wide but is a touch device. So we treat it as mobile when the primary
 * input is touch (`pointer: coarse`) OR the viewport is small/short.
 *
 * For testing on a desktop you can force a layout with a URL param:
 *   /game?view=mobile   or   /game?view=desktop
 */
const MOBILE_QUERY =
  "(pointer: coarse), (max-width: 820px), (max-height: 600px)";

export function useIsMobile(): boolean {
  // Default to desktop so SSR and the first client render agree.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const force = new URLSearchParams(window.location.search).get("view");
    if (force === "mobile") {
      setIsMobile(true);
      return;
    }
    if (force === "desktop") {
      setIsMobile(false);
      return;
    }

    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
