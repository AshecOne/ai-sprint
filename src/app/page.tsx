"use client";

import Link from "next/link";
import { Play } from "lucide-react";

export default function HomePage() {
  return (
    <main className="lobby relative h-screen w-screen flex flex-col items-center justify-center px-6 crt-scanlines overflow-hidden">
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

/** Tiny pixel-art fish drawn with crisp <rect>s on a low-res viewBox. */
function PixelFish({
  className,
  color,
  belly,
}: {
  className?: string;
  color: string;
  belly: string;
}) {
  return (
    <svg
      className={`pixelated ${className ?? ""}`}
      viewBox="0 0 16 10"
      width="48"
      height="30"
      shapeRendering="crispEdges"
    >
      {/* tail */}
      <rect x="0" y="3" width="2" height="1" fill={color} />
      <rect x="0" y="6" width="2" height="1" fill={color} />
      <rect x="1" y="4" width="2" height="2" fill={color} />
      {/* body */}
      <rect x="3" y="3" width="8" height="4" fill={color} />
      <rect x="4" y="2" width="6" height="1" fill={color} />
      <rect x="4" y="7" width="6" height="1" fill={color} />
      <rect x="11" y="4" width="2" height="2" fill={color} />
      {/* belly highlight */}
      <rect x="4" y="5" width="6" height="2" fill={belly} opacity="0.55" />
      {/* eye */}
      <rect x="10" y="4" width="1" height="1" fill="#061018" />
    </svg>
  );
}

/** Simple pixel seaweed; sway handled in CSS. */
function PixelPlant({ className }: { className?: string }) {
  return (
    <svg
      className={`pixelated ${className ?? ""}`}
      viewBox="0 0 8 24"
      width="24"
      height="72"
      shapeRendering="crispEdges"
    >
      <rect x="3" y="2" width="2" height="22" fill="#2f7d4f" />
      <rect x="1" y="6" width="2" height="2" fill="#3aa15f" />
      <rect x="5" y="10" width="2" height="2" fill="#3aa15f" />
      <rect x="1" y="14" width="2" height="2" fill="#2f7d4f" />
      <rect x="5" y="18" width="2" height="2" fill="#2f7d4f" />
      <rect x="3" y="0" width="2" height="2" fill="#3aa15f" />
    </svg>
  );
}
