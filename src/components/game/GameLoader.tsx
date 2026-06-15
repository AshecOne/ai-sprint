"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PixelPlant } from "./PixelCreatures";

const FADE_MS = 450;

/**
 * Full-screen AQUASIM-themed loading overlay that covers `/game` until the
 * renderer is truly ready, then fades out. Mounted by the game page and
 * self-unmounts once the fade-out completes.
 *
 * Positioning is done with INLINE STYLE (fixed + full-bleed + top z-index)
 * rather than a new CSS class: in this project's dev env (Turbopack / Console
 * Ninja) freshly added globals.css classes sometimes don't apply and the
 * overlay falls into the document flow. The aqua visuals reuse the proven
 * `.lobby-*` classes, which already include a `prefers-reduced-motion` guard.
 */
export function GameLoader({ ready }: { ready: boolean }) {
  const [render, setRender] = useState(true);
  // Start fully opaque so the overlay covers the page from the very first
  // paint — no fade-IN, otherwise the tank flashes through for one frame
  // before the overlay becomes visible. We only fade OUT when ready.
  const [hiding, setHiding] = useState(false);
  // Respect reduced-motion: skip the fade entirely (instant hide).
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (reduceRef.current) {
      setRender(false);
      return;
    }
    setHiding(true);
    const t = setTimeout(() => setRender(false), FADE_MS);
    return () => clearTimeout(t);
  }, [ready]);

  if (!render) return null;

  return (
    <div
      className="lobby crt-scanlines"
      role="status"
      aria-live="polite"
      aria-label="Memuat akuarium"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: hiding ? 0 : 1,
        transition: reduceRef.current ? "none" : `opacity ${FADE_MS}ms ease`,
      }}
    >
      <LoaderBackground />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Image
          src="/logo.png"
          alt="AquaSim"
          width={3584}
          height={1184}
          style={{ width: 260, height: "auto" }}
          className="drop-shadow-[0_0_24px_rgba(34,211,238,0.4)]"
          priority
        />
        <p className="lobby-hint" style={{ marginTop: "1.5rem" }}>
          Menyiapkan akuarium…
        </p>
      </div>
    </div>
  );
}

/** Same aqua scene as the lobby background (reused classes for consistency). */
function LoaderBackground() {
  return (
    <div className="lobby-bg" aria-hidden="true">
      <div className="lobby-water" />

<span className="lobby-bubble lobby-bubble--1" />
      <span className="lobby-bubble lobby-bubble--2" />
      <span className="lobby-bubble lobby-bubble--3" />
      <span className="lobby-bubble lobby-bubble--4" />
      <span className="lobby-bubble lobby-bubble--5" />
      <span className="lobby-bubble lobby-bubble--6" />

      <div className="lobby-floor">
        <PixelPlant className="lobby-plant lobby-plant--1" species="amazon_sword" />
        <PixelPlant className="lobby-plant lobby-plant--2" species="anubias" />
        <PixelPlant className="lobby-plant lobby-plant--3" species="vallisneria" />
        <PixelPlant className="lobby-plant lobby-plant--4" species="java_moss" />
      </div>
    </div>
  );
}
