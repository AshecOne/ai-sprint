"use client";

import { useGameStore } from "@/store/gameStore";
import { useAquariumStore } from "@/store/aquariumStore";
import { Coins, Fish, Leaf, AlertOctagon } from "lucide-react";

export function TopBar() {
  const cash = useAquariumStore((s) => s.cash);
  const fish = useAquariumStore((s) => s.fish);
  const plants = useAquariumStore((s) => s.plants);
  const aquarium = useAquariumStore((s) => s.aquariums[0]);
  const tick = useGameStore((s) => s.tick);
  const speed = useGameStore((s) => s.speed);

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
      className="px-4 py-3 border-b border-[var(--border-soft)] flex items-center justify-between gap-4 flex-shrink-0 panel"
      data-testid="topbar"
    >
      <div className="flex items-center gap-4">
        <h1 className="font-display text-sm tracking-wider text-cyan-300">
          AQUASIM
        </h1>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">
          Tank: <span className="text-slate-200">{aquarium?.name ?? "—"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <Pill icon={<Coins size={12} />} label="Cash" value={`$${cash}`} testid="kpi-cash" tone="amber" />
        <Pill icon={<Fish size={12} />} label="Fish" value={`${aliveFish}${deadFish > 0 ? ` / -${deadFish}` : ""}`} testid="kpi-fish" tone={deadFish > 0 ? "warn" : "ok"} />
        <Pill icon={<Leaf size={12} />} label="Plants" value={`${plants.length}`} testid="kpi-plants" tone="ok" />
        <Pill icon={<AlertOctagon size={12} />} label="Alerts" value={`${dangerCount}`} testid="kpi-alerts" tone={dangerCount > 0 ? "bad" : "ok"} />
        <div className="text-[10px] text-slate-500 uppercase tracking-widest pl-3 border-l border-[var(--border-soft)]">
          Tick <span className="text-cyan-300">{tick.toLocaleString()}</span> · {speed}x
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
      className={`flex items-center gap-2 panel-glass px-2.5 py-1.5 ${color}`}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
