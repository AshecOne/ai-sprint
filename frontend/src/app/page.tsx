"use client";

import Link from "next/link";
import { Droplets, Fish, Sparkles, Play } from "lucide-react";

export default function HomePage() {
  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center px-6 crt-scanlines overflow-hidden">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="title-eyebrow mb-3">// AQUASIM v0.3 — pixel ecology</div>
          <h1
            className="font-display text-3xl md:text-5xl text-cyan-300 leading-tight mb-4"
            data-testid="landing-title"
          >
            Run a living
            <br />
            <span className="text-amber-300">pixel aquarium.</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            A real-time aquarium simulator with fish behaviour, water chemistry,
            plants, and equipment management. Built on Next.js 16 + Phaser 4 +
            Zustand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <FeatureCard
            icon={<Droplets size={20} />}
            title="Water Chemistry"
            description="Ammonia, nitrite, nitrate, pH, O₂ and CO₂ all tick in real time."
          />
          <FeatureCard
            icon={<Fish size={20} />}
            title="Fish Behaviour"
            description="7 species with stress, hunger, shoaling and life cycle."
          />
          <FeatureCard
            icon={<Sparkles size={20} />}
            title="Pixel Art Tank"
            description="Phaser 4 renderer with bubbles, plants sway, day/night cycle."
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/game"
            className="btn"
            data-testid="enter-tank-button"
          >
            <Play size={14} />
            Enter the tank
          </Link>
          <a
            href="https://phaser.io/news/2026/04/phaser-v4-final"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            data-testid="docs-link"
          >
            Phaser 4 release notes
          </a>
        </div>

        <div className="mt-12 text-center text-xs text-slate-500">
          <span className="blink-dot" /> &nbsp;Engine online •
          {" "}<span className="text-cyan-400">/api/health</span>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="panel-glass p-4">
      <div className="flex items-center gap-2 text-cyan-300 mb-2">
        {icon}
        <span className="section-title">{title}</span>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
