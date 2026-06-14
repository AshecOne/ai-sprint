"use client";

import { useEffect, useRef, useState } from "react";
import { PixelFish, PixelPlant } from "./PixelCreatures";

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
  const [visible, setVisible] = useState(false);
  // Respect reduced-motion: skip the fade entirely (instant hide).
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Fade in on the next frame so the opacity transition actually runs.
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (reduceRef.current) {
      setRender(false);
      return;
    }
    setVisible(false);
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
        opacity: reduceRef.current ? 1 : visible ? 1 : 0,
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
        <h1 className="font-display text-4xl sm:text-6xl leading-tight lobby-title">
          <span className="text-cyan-300">AQUA</span>
          <span className="text-amber-300">SIM</span>
        </h1>
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

      <PixelFish className="lobby-fish lobby-fish--1" color="#f5b461" belly="#fb7185" />
      <PixelFish className="lobby-fish lobby-fish--2" color="#22d3ee" belly="#a5f3fc" />
      <PixelFish className="lobby-fish lobby-fish--3" color="#a3e635" belly="#ecfeff" />
      <PixelFish className="lobby-fish lobby-fish--4" color="#38bdf8" belly="#a5f3fc" />

      <span className="lobby-bubble lobby-bubble--1" />
      <span className="lobby-bubble lobby-bubble--2" />
      <span className="lobby-bubble lobby-bubble--3" />
      <span className="lobby-bubble lobby-bubble--4" />
      <span className="lobby-bubble lobby-bubble--5" />
      <span className="lobby-bubble lobby-bubble--6" />

      <div className="lobby-floor">
        <PixelPlant className="lobby-plant lobby-plant--1" />
        <PixelPlant className="lobby-plant lobby-plant--2" />
        <PixelPlant className="lobby-plant lobby-plant--3" />
        <PixelPlant className="lobby-plant lobby-plant--4" />
      </div>
    </div>
  );
}
