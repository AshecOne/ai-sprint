"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { PixelFish, PixelPlant } from "@/components/game/PixelCreatures";
import { requestAppFullscreen } from "@/hooks/useFullscreen";
import { useAudioStore } from "@/store/audioStore";

export default function HomePage() {
  // Try to start ambient + music the moment the lobby opens. Browsers block
  // audio before a user gesture (autoplay policy), so this only succeeds where
  // allowed (e.g. returning visitors); otherwise the first interaction anywhere
  // — including the "Enter the tank" click — kicks it off. SPA nav keeps the
  // same document, so the sound carries into /game.
  useEffect(() => {
    const unlock = () => useAudioStore.getState().unlock();
    unlock(); // best-effort autoplay on load
    const opts = { once: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <main className="lobby game-shell relative w-screen flex flex-col items-center justify-center px-6 crt-scanlines overflow-hidden">
      <LobbyBackground />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="title-eyebrow mb-4">PIXEL AQUARIUM SIM</div>
        <h1
          className="font-display text-4xl sm:text-6xl md:text-7xl leading-tight mb-10 lobby-title"
          data-testid="landing-title"
        >
          <span className="text-cyan-300">AQUA</span>
          <span className="text-amber-300">SIM</span>
        </h1>

        <Link
          href="/game"
          className="btn-play"
          data-testid="enter-tank-button"
          onClick={() => {
            // Fire inside the click (still a user gesture) so the browser
            // honours the request; SPA nav keeps the same document so
            // fullscreen carries into /game. Best-effort: no-op if unsupported.
            void requestAppFullscreen();
            // Same gesture unlocks the AudioContext + kicks off ambient/music.
            useAudioStore.getState().unlock();
          }}
        >
          <Play size={22} fill="currentColor" />
          Enter the tank
        </Link>

        <div className="lobby-hint mt-8">▸ Press to dive in</div>
      </div>
    </main>
  );
}

function LobbyBackground() {
  return (
    <div className="lobby-bg" aria-hidden="true">
      {/* sunbeams / water tint */}
      <div className="lobby-water" />

      {/* swimming fish */}
      <PixelFish className="lobby-fish lobby-fish--1" color="#f5b461" belly="#fb7185" />
      <PixelFish className="lobby-fish lobby-fish--2" color="#22d3ee" belly="#a5f3fc" />
      <PixelFish className="lobby-fish lobby-fish--3" color="#a3e635" belly="#ecfeff" />
      <PixelFish className="lobby-fish lobby-fish--4" color="#38bdf8" belly="#a5f3fc" />

      {/* rising bubbles */}
      <span className="lobby-bubble lobby-bubble--1" />
      <span className="lobby-bubble lobby-bubble--2" />
      <span className="lobby-bubble lobby-bubble--3" />
      <span className="lobby-bubble lobby-bubble--4" />
      <span className="lobby-bubble lobby-bubble--5" />
      <span className="lobby-bubble lobby-bubble--6" />

      {/* swaying plants + substrate */}
      <div className="lobby-floor">
        <PixelPlant className="lobby-plant lobby-plant--1" />
        <PixelPlant className="lobby-plant lobby-plant--2" />
        <PixelPlant className="lobby-plant lobby-plant--3" />
        <PixelPlant className="lobby-plant lobby-plant--4" />
      </div>
    </div>
  );
}
