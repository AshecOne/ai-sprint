"use client";

import { useEffect, useRef } from "react";

interface PhaserGameProps {
  aquariumId: string | null;
  /** Fired once the Phaser scene has finished building + its first sprite
   *  sync, so the parent can hide the loading overlay. */
  onReady?: () => void;
}

/**
 * React wrapper for the Phaser canvas. Loads Phaser dynamically so it never
 * touches the SSR pipeline, then mounts a single Game instance into the
 * provided ref. Handles resize and clean unmount.
 */
export default function PhaserGame({ aquariumId, onReady }: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  // Hold the game in a ref to allow safe destroy on unmount.
  // We use `unknown` here because Phaser's type isn't available SSR-side.
  const gameRef = useRef<unknown>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  // Keep the latest onReady in a ref so it never enters the effect deps — that
  // would recreate the whole Phaser.Game on every parent render.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const Phaser = (await import("phaser")).default;
      const { MainScene } = await import("./scenes/MainScene");
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
        backgroundColor: "#020a12",
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        scene: [MainScene],
        scale: {
          // RESIZE keeps the canvas matched to its parent; no autoCenter
          // needed (that's for letterboxed FIT/ENVELOP modes).
          mode: Phaser.Scale.RESIZE,
        },
        fps: { target: 60, forceSetTimeOut: false },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
      // Listen for the scene's ready signal BEFORE starting it, so we never
      // miss the event. Fires once MainScene.create() + first sync is done.
      game.events.once("scene-ready", () => {
        if (!cancelled) onReadyRef.current?.();
      });
      // Start the MainScene with aquariumId data
      game.scene.start("MainScene", { aquariumId });

      // Coalesce rapid resizes (orientation flips fire many events) into one
      // resize per frame, and avoid the "ResizeObserver loop" warning that a
      // synchronous resize-inside-observer can trigger.
      let rafId = 0;
      const scheduleResize = (w: number, h: number) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          if (gameRef.current) game.scale.resize(w, h);
        });
      };

      // ResizeObserver to keep canvas in sync with container (catches layout
      // reflows that a plain window-resize listener would miss).
      resizeObsRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) scheduleResize(w, h);
      });
      resizeObsRef.current.observe(parent);

      // iOS Safari often reports stale dimensions on orientationchange until
      // the viewport settles, so re-sync to the parent on the next frame.
      const onOrientation = () => {
        if (parentRef.current) {
          scheduleResize(parentRef.current.clientWidth, parentRef.current.clientHeight);
        }
      };
      window.addEventListener("orientationchange", onOrientation);

      cleanup = () => {
        window.removeEventListener("orientationchange", onOrientation);
        if (rafId) cancelAnimationFrame(rafId);
        resizeObsRef.current?.disconnect();
        resizeObsRef.current = null;
        game.destroy(true);
        gameRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // Re-create the game when aquariumId changes (rare).
  }, [aquariumId]);

  return (
    <div
      ref={parentRef}
      data-testid="phaser-canvas-host"
      className="absolute inset-0 w-full h-full pixelated"
    />
  );
}
