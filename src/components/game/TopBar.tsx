"use client";

import { useGameStore } from "@/store/gameStore";
import { useAquariumStore } from "@/store/aquariumStore";
import { Coins, Fish, Leaf, AlertOctagon, Pause, Play } from "lucide-react";

export function TopBar() {
  const cash = useAquariumStore((s) => s.cash);
  const fish = useAquariumStore((s) => s.fish);
  const plants = useAquariumStore((s) => s.plants);
  const aquarium = useAquariumStore((s) => s.aquariums[0]);
  const tick = useGameStore((s) => s.tick);
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);

  const aliveFish = fish.filter((f) => f.alive).length;
  const deadFish = fish.length - aliveFish;
  const water = aquarium?.water;
  const dangerCount = water
    ? [
        water.ammonia > 0.5,
        water.nitrite > 1,
        water.oxygen < 4,
        water.turbidity > 30,
      ].filter(Boolean).length
    : 0;

  return (
    <header
      className="px-2 py-1.5 sm:px-4 sm:py-3 border-b border-[var(--border-soft)] flex items-center justify-between gap-2 sm:gap-4 flex-shrink-0 panel"
      data-testid="topbar"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <h1 className="font-display text-[11px] sm:text-sm tracking-wider text-cyan-300">
          AQUASIM
        </h1>
        <div className="hidden md:block text-[10px] text-slate-500 uppercase tracking-widest">
          Tank: <span className="text-slate-200">{aquarium?.name ?? "—"}</span>
        </div>

        {/* Transport controls — playback lives here so the ControlBar stays action-only */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 ml-0.5 sm:ml-1 border-l border-[var(--border-soft)]">
          <button
            onClick={() => setPaused(!paused)}
            className="btn py-1 px-2 sm:py-1.5 sm:px-3 text-[10px] sm:text-[11px]"
            data-testid="toggle-pause"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
          </button>
          <div className="flex items-center gap-1 panel-glass p-1 rounded-md">
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                data-testid={`speed-${s}x`}
                className={`px-2.5 py-1 text-[11px] tracking-widest font-semibold rounded ${
                  speed === s
                    ? "bg-cyan-400/20 text-cyan-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 text-xs flex-wrap justify-end">
        <Pill icon={<Coins size={12} />} label="Cash" value={`$${cash}`} testid="kpi-cash" tone="amber" />
        <Pill icon={<Fish size={12} />} label="Fish" value={`${aliveFish}${deadFish > 0 ? ` / -${deadFish}` : ""}`} testid="kpi-fish" tone={deadFish > 0 ? "warn" : "ok"} />
        <Pill icon={<Leaf size={12} />} label="Plants" value={`${plants.length}`} testid="kpi-plants" tone="ok" />
        <Pill icon={<AlertOctagon size={12} />} label="Alerts" value={`${dangerCount}`} testid="kpi-alerts" tone={dangerCount > 0 ? "bad" : "ok"} />
        <div className="hidden lg:block text-[10px] text-slate-500 uppercase tracking-widest pl-3 border-l border-[var(--border-soft)]">
          Tick <span className="text-cyan-300">{tick.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}

function Pill({
  icon,
  label,
  value,
  testid,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  testid: string;
  tone: "ok" | "warn" | "bad" | "amber";
}) {
  const color =
    tone === "bad"
      ? "text-red-300 border-red-400/30"
      : tone === "warn"
      ? "text-amber-300 border-amber-400/30"
      : tone === "amber"
      ? "text-amber-200 border-amber-300/40"
      : "text-cyan-300 border-cyan-400/30";
  return (
    <div
      data-testid={testid}
      className={`flex items-center gap-1.5 sm:gap-2 panel-glass px-2 py-1 sm:px-2.5 sm:py-1.5 ${color}`}
    >
      {icon}
      <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
