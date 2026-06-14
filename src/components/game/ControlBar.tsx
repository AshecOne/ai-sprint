"use client";

import { useEffect, useState } from "react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { cleanReward } from "@/simulation/engine";
import { Pause, Play, FastForward, Droplets, Cookie, RefreshCw, Trash2, Sparkles } from "lucide-react";

export function ControlBar() {
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const speed = useGameStore((s) => s.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const feed = useAquariumStore((s) => s.feedFish);
  const change = useAquariumStore((s) => s.doWaterChange);
  const clean = useAquariumStore((s) => s.cleanTank);
  const resetTank = useAquariumStore((s) => s.resetTank);
  const removeDead = useAquariumStore((s) => s.removeDeadFish);
  const dead = useAquariumStore((s) => s.fish.filter((f) => !f.alive).length);
  const water = useAquariumStore((s) => s.aquariums[0]?.water);
  const cleanReadyAt = useAquariumStore((s) => s.cleanReadyAt);
  const estReward = water ? cleanReward(water, 1) : 0;

  // Tick once a second so the cooldown countdown stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const cooldownLeft = Math.max(0, Math.ceil((cleanReadyAt - now) / 1000));
  const onCooldown = cooldownLeft > 0;
  const cooldownLabel = `${Math.floor(cooldownLeft / 60)}:${String(
    cooldownLeft % 60
  ).padStart(2, "0")}`;

  return (
    <div className="panel flex items-center justify-between gap-3 px-3 py-2" data-testid="control-bar">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaused(!paused)}
          className="btn"
          data-testid="toggle-pause"
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          {paused ? "Resume" : "Pause"}
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
          <FastForward size={12} className="text-slate-500 mx-1" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button
          onClick={() => feed(35)}
          className="btn btn-amber"
          data-testid="feed-fish-button"
        >
          <Cookie size={12} />
          Feed
        </button>
        <button
          onClick={() => clean()}
          disabled={onCooldown}
          className={`btn btn-emerald ${onCooldown ? "opacity-50 cursor-not-allowed" : ""}`}
          data-testid="clean-tank-button"
          title={
            onCooldown
              ? `Clean recharging — ready in ${cooldownLabel}`
              : estReward > 0
              ? `Scrub the tank and sell ~$${estReward} of detritus`
              : "Tank is clean — nothing to sell yet"
          }
        >
          <Sparkles size={12} />
          {onCooldown
            ? `Clean ${cooldownLabel}`
            : `Clean${estReward > 0 ? ` (+$${estReward})` : ""}`}
        </button>
        <button
          onClick={() => change(0.25)}
          className="btn"
          data-testid="water-change-25"
        >
          <Droplets size={12} />
          Water 25%
        </button>
        <button
          onClick={() => change(0.5)}
          className="btn btn-ghost"
          data-testid="water-change-50"
        >
          50%
        </button>
        {dead > 0 && (
          <button
            onClick={() => removeDead()}
            className="btn btn-danger"
            data-testid="remove-dead-button"
          >
            <Trash2 size={12} />
            Net ({dead})
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("Reset the tank? You'll lose all progress.")) resetTank();
          }}
          className="btn btn-ghost"
          data-testid="reset-tank-button"
        >
          <RefreshCw size={12} />
          Reset
        </button>
      </div>
    </div>
  );
}
