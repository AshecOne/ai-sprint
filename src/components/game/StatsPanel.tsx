"use client";

import { useState } from "react";
import { useAquariumStore } from "@/store/aquariumStore";
import { FISH_SPECIES } from "@/simulation/species";
import { cleanReward } from "@/simulation/engine";
import { PixelFace } from "./PixelFace";
import { audio } from "@/audio/engine";
import type { Fish, WaterParameters } from "@/simulation/types";
import { Thermometer, Beaker, Droplet, Wind, Activity, Power, Pencil, Check, X } from "lucide-react";

interface RangeOk {
  ok: boolean;
  tone: "good" | "warn" | "bad";
}

const judge = (
  value: number,
  okMin: number,
  okMax: number,
  warnMin: number,
  warnMax: number
): RangeOk => {
  if (value >= okMin && value <= okMax) return { ok: true, tone: "good" };
  if (value >= warnMin && value <= warnMax) return { ok: false, tone: "warn" };
  return { ok: false, tone: "bad" };
};

export function StatsPanel() {
  const aquarium = useAquariumStore((s) => s.aquariums[0]);
  const fish = useAquariumStore((s) => s.fish);
  const equipment = useAquariumStore((s) => s.equipment);
  const toggleEquipment = useAquariumStore((s) => s.toggleEquipment);
  const setEquipmentPower = useAquariumStore((s) => s.setEquipmentPower);
  const setFishName = useAquariumStore((s) => s.setFishName);

  if (!aquarium) return null;
  const water = aquarium.water;
  const aliveFish = fish.filter((f) => f.alive);
  const avgStress =
    aliveFish.length > 0
      ? aliveFish.reduce((s, f) => s + f.stress, 0) / aliveFish.length
      : 0;
  const avgHealth =
    aliveFish.length > 0
      ? aliveFish.reduce((s, f) => s + f.health, 0) / aliveFish.length
      : 0;
  const avgHunger =
    aliveFish.length > 0
      ? aliveFish.reduce((s, f) => s + f.hunger, 0) / aliveFish.length
      : 0;

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-3" data-testid="stats-panel">
      {/* Water chemistry card */}
      <section className="panel p-3">
        <header className="flex items-center justify-between mb-2">
          <span className="section-title">Water</span>
          <span className="title-eyebrow">{aquarium.volume}L · {aquarium.width}×{aquarium.height}×{aquarium.depth}cm</span>
        </header>
        <ParamRow icon={<Thermometer size={12} />} label="Temp" value={`${water.temperature.toFixed(1)} °C`} bar={(water.temperature - 18) / 14} tone={judge(water.temperature, 23, 28, 20, 31).tone} />
        <ParamRow icon={<Beaker size={12} />} label="pH" value={water.ph.toFixed(2)} bar={(water.ph - 5) / 4} tone={judge(water.ph, 6.5, 7.8, 6.0, 8.2).tone} />
        <ParamRow icon={<Droplet size={12} />} label="NH₃" value={`${water.ammonia.toFixed(2)} mg/L`} bar={water.ammonia / 2} tone={judge(water.ammonia, 0, 0.25, 0.25, 0.6).tone} invert />
        <ParamRow label="NO₂⁻" value={`${water.nitrite.toFixed(2)} mg/L`} bar={water.nitrite / 2} tone={judge(water.nitrite, 0, 0.3, 0.3, 0.8).tone} invert />
        <ParamRow label="NO₃⁻" value={`${water.nitrate.toFixed(1)} mg/L`} bar={water.nitrate / 80} tone={judge(water.nitrate, 0, 30, 30, 60).tone} invert />
        <ParamRow icon={<Wind size={12} />} label="O₂" value={`${water.oxygen.toFixed(1)} mg/L`} bar={water.oxygen / 12} tone={judge(water.oxygen, 6, 12, 4, 14).tone} />
        <ParamRow label="CO₂" value={`${water.co2.toFixed(0)} ppm`} bar={water.co2 / 60} tone={judge(water.co2, 10, 30, 0, 50).tone} />
        <ParamRow label="Hardness" value={`${water.hardness.toFixed(1)} dGH`} bar={water.hardness / 20} tone={judge(water.hardness, 4, 14, 2, 18).tone} />
        <ParamRow label="Turbidity" value={water.turbidity.toFixed(1)} bar={water.turbidity / 60} tone={judge(water.turbidity, 0, 8, 8, 25).tone} invert />
        <ParamRow label="Cleanliness" value={`${water.cleanliness.toFixed(0)}%`} bar={water.cleanliness / 100} tone={water.cleanliness > 70 ? "good" : water.cleanliness > 40 ? "warn" : "bad"} />
        <div
          className="mt-2 flex items-center justify-between rounded-md bg-emerald-500/[0.06] border border-emerald-400/20 px-2.5 py-1.5"
          data-testid="clean-reward-estimate"
        >
          <span className="text-[10px] uppercase tracking-wider text-emerald-300/80">
            Clean payout
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-emerald-300">
            {cleanReward(water, aliveFish.length) > 0
              ? `+$${cleanReward(water, aliveFish.length)}`
              : "—"}
          </span>
        </div>
      </section>

      {/* Livestock vitals */}
      <section className="panel p-3">
        <header className="flex items-center justify-between mb-2">
          <span className="section-title">Livestock</span>
          <span className="title-eyebrow">{aliveFish.length} alive</span>
        </header>
        {/* Vitals are averages over *living* fish — meaningless with none, so
            hide the cards entirely until there's at least one fish alive. */}
        {aliveFish.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <KpiCard label="Health" value={`${avgHealth.toFixed(0)}%`} tone={avgHealth > 70 ? "good" : avgHealth > 40 ? "warn" : "bad"} />
            <KpiCard label="Stress" value={`${avgStress.toFixed(0)}%`} tone={avgStress < 30 ? "good" : avgStress < 60 ? "warn" : "bad"} />
            <KpiCard label="Hunger" value={`${avgHunger.toFixed(0)}%`} tone={avgHunger < 50 ? "good" : avgHunger < 80 ? "warn" : "bad"} />
          </div>
        )}
        <div className="space-y-1.5" data-testid="fish-list">
          {fish.length === 0 && (
            <div className="text-xs text-slate-500 italic">No fish in tank.</div>
          )}
          {fish.map((f) => (
            <FishRow key={f.id} fish={f} onRename={setFishName} />
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="panel p-3">
        <header className="flex items-center justify-between mb-2">
          <span className="section-title">Equipment</span>
          <span className="title-eyebrow">{equipment.filter((e) => e.active).length} on</span>
        </header>
        <div className="space-y-2" data-testid="equipment-list">
          {equipment.map((e) => (
            <div
              key={e.id}
              data-testid={`equipment-row-${e.id}`}
              className="px-2.5 py-2 rounded-md bg-white/[0.03]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs uppercase tracking-wider text-slate-200">
                  {labelOf(e.type)}
                </span>
                <button
                  onClick={() => {
                    toggleEquipment(e.id);
                    audio.play("toggle");
                  }}
                  data-testid={`toggle-${e.type}-${e.id}`}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold ${
                    e.active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : "bg-slate-500/20 text-slate-400 border border-slate-400/30"
                  }`}
                >
                  <Power size={10} />
                  {e.active ? "On" : "Off"}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="w-12">Power</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={e.power}
                  onChange={(ev) => setEquipmentPower(e.id, Number(ev.target.value))}
                  data-testid={`power-${e.id}`}
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-8 text-right tabular-nums text-slate-300">
                  {e.power}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FishRow({ fish: f, onRename }: { fish: Fish; onRename: (id: string, name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(f.name);
  const spec = FISH_SPECIES[f.species];

  const startEdit = () => {
    setDraft(f.name);
    setEditing(true);
  };
  const commit = () => {
    onRename(f.id, draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(f.name);
    setEditing(false);
  };

  return (
    <div
      data-testid={`fish-row-${f.id}`}
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] ${
        f.alive ? "bg-white/[0.02]" : "bg-red-500/10 text-red-300 line-through"
      }`}
    >
      <Activity size={10} className={f.alive ? "text-cyan-400" : "text-red-400"} />
      {editing ? (
        <>
          <input
            autoFocus
            value={draft}
            maxLength={20}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") cancel();
            }}
            onBlur={commit}
            data-testid={`fish-name-input-${f.id}`}
            className="flex-1 min-w-0 bg-slate-900/60 border border-cyan-400/40 rounded px-1.5 py-0.5 text-slate-100 outline-none focus:border-cyan-300"
          />
          <button
            // onMouseDown (not onClick) so it fires before the input's onBlur commit.
            onMouseDown={(e) => { e.preventDefault(); commit(); }}
            aria-label="Save name"
            className="text-emerald-400 hover:text-emerald-300"
          >
            <Check size={12} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); cancel(); }}
            aria-label="Cancel rename"
            className="text-slate-500 hover:text-slate-300"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-slate-200">{f.name}</span>
          {f.alive && (
            <button
              onClick={startEdit}
              aria-label={`Rename ${f.name}`}
              data-testid={`fish-rename-${f.id}`}
              className="text-slate-500 hover:text-cyan-300 shrink-0"
            >
              <Pencil size={11} />
            </button>
          )}
          <span className="text-[10px] text-slate-500">{spec.label}</span>
          {f.alive && (
            <PixelFace
              mood={f.health > 70 ? "good" : f.health > 40 ? "warn" : "bad"}
              size={14}
              title={`Health ${f.health.toFixed(0)}%`}
            />
          )}
        </>
      )}
    </div>
  );
}

function labelOf(t: string) {
  switch (t) {
    case "filter": return "HOB Filter";
    case "heater": return "Heater";
    case "airstone": return "Air Stone";
    case "co2_diffuser": return "CO₂ Diffuser";
    case "light": return "LED Light";
    default: return t;
  }
}

interface ParamRowProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  bar: number;
  tone: "good" | "warn" | "bad";
  invert?: boolean;
}

function ParamRow({ icon, label, value, bar, tone }: ParamRowProps) {
  const barClass =
    tone === "good"
      ? "bar bar-good"
      : tone === "warn"
      ? "bar bar-warn"
      : "bar bar-bad";
  const pct = Math.max(2, Math.min(100, bar * 100));
  return (
    <div className="py-1 grid grid-cols-[14px_82px_1fr_62px] items-center gap-2">
      <span className="text-slate-500">{icon}</span>
      <span className="text-[10px] uppercase tracking-wide text-slate-400 truncate">
        {label}
      </span>
      <div className={barClass}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <span
        className={`text-[11px] font-semibold tabular-nums text-right ${
          tone === "good"
            ? "text-emerald-300"
            : tone === "warn"
            ? "text-amber-300"
            : "text-red-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" }) {
  return (
    <div className={`kpi-card ${tone}`} title={`${label} ${value}`}>
      <div className="text-[10px] tracking-widest uppercase text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 flex justify-center">
        <PixelFace mood={tone} size={28} title={`${label} ${value}`} />
      </div>
    </div>
  );
}
