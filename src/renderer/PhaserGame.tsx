"use client";

import { useEffect, useRef } from "react";

interface PhaserGameProps {
  aquariumId: string | null;
}

/**
 * React wrapper for the Phaser canvas. Loads Phaser dynamically so it never
 * touches the SSR pipeline, then mounts a single Game instance into the
 * provided ref. Handles resize and clean unmount.
 */
export default function PhaserGame({ aquariumId }: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  // Hold the game in a ref to allow safe destroy on unmount.
  // We use `unknown` here because Phaser's type isn't available SSR-side.
  const gameRef = useRef<unknown>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);

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
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        fps: { target: 60, forceSetTimeOut: false },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
      // Start the MainScene with aquariumId data
      game.scene.start("MainScene", { aquariumId });

      // ResizeObserver to keep canvas in sync with container
      resizeObsRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0) {
            game.scale.resize(w, h);
          }
        }
      });
      resizeObsRef.current.observe(parent);

      cleanup = () => {
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
