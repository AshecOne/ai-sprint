"use client";

import { useEffect, useRef } from "react";

export default function LobbyCanvas() {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<unknown>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const Phaser = (await import("phaser")).default;
      const { LobbyScene } = await import("@/renderer/scenes/LobbyScene");
      if (cancelled || !parentRef.current) return;

      const parent = parentRef.current;
      const width = parent.clientWidth || 960;
      const height = parent.clientHeight || 540;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent,
        width,
        height,
        transparent: true,
        backgroundColor: "rgba(0,0,0,0)",
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        scene: [LobbyScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
        },
        fps: { target: 30, forceSetTimeOut: false },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      let rafId = 0;
      const scheduleResize = (w: number, h: number) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          if (gameRef.current) (game as Phaser.Game).scale.resize(w, h);
        });
      };

      resizeObsRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) scheduleResize(w, h);
      });
      resizeObsRef.current.observe(parent);

      const onOrientation = () => {
        if (parentRef.current) {
          scheduleResize(
            parentRef.current.clientWidth,
            parentRef.current.clientHeight
          );
        }
      };
      window.addEventListener("orientationchange", onOrientation);

      cleanup = () => {
        window.removeEventListener("orientationchange", onOrientation);
        if (rafId) cancelAnimationFrame(rafId);
        resizeObsRef.current?.disconnect();
        resizeObsRef.current = null;
        (game as Phaser.Game).destroy(true);
        gameRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={parentRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
