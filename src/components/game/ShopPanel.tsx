"use client";

import { useAquariumStore } from "@/store/aquariumStore";
import { FISH_SPECIES, PLANT_SPECIES, EQUIPMENT_SPECS } from "@/simulation/species";
import type { FishSpeciesId, PlantSpeciesId, EquipmentType } from "@/simulation/types";

export function ShopPanel() {
  const cash = useAquariumStore((s) => s.cash);
  const buyFish = useAquariumStore((s) => s.buyFish);
  const buyPlant = useAquariumStore((s) => s.buyPlant);
  const buyEquipment = useAquariumStore((s) => s.buyEquipment);

  return (
    <div className="@container h-full overflow-y-auto pr-1" data-testid="shop-panel">
      <div className="grid grid-cols-1 @2xl:grid-cols-2 @4xl:grid-cols-3 gap-3 items-start">
      <div className="panel p-3">
        <header className="flex items-center justify-between mb-2">
          <span className="section-title">Fish</span>
          <span className="title-eyebrow text-amber-300">${cash}</span>
        </header>
        <div className="divide-y divide-white/[0.06]" data-testid="shop-fish-list">
          {(Object.keys(FISH_SPECIES) as FishSpeciesId[]).map((id) => {
            const spec = FISH_SPECIES[id];
            const canAfford = cash >= spec.price;
            return (
              <ShopRow
                key={id}
                testid={`buy-fish-${id}`}
                title={spec.label}
                subtitle={`${spec.prefs.tempMin}–${spec.prefs.tempMax}°C · pH ${spec.prefs.phMin}–${spec.prefs.phMax}`}
                description={spec.description}
                price={spec.price}
                canAfford={canAfford}
                onBuy={() => buyFish(id)}
              />
            );
          })}
        </div>
      </div>

      <div className="panel p-3">
        <header className="mb-2">
          <span className="section-title">Plants</span>
        </header>
        <div className="divide-y divide-white/[0.06]" data-testid="shop-plant-list">
          {(Object.keys(PLANT_SPECIES) as PlantSpeciesId[]).map((id) => {
            const spec = PLANT_SPECIES[id];
            const canAfford = cash >= spec.price;
            return (
              <ShopRow
                key={id}
                testid={`buy-plant-${id}`}
                title={spec.label}
                subtitle={`O₂ +${spec.oxygenRate.toFixed(2)} · NO₃ −${spec.nitrateRate.toFixed(2)}/tick`}
                description={spec.description}
                price={spec.price}
                canAfford={canAfford}
                onBuy={() => buyPlant(id)}
              />
            );
          })}
        </div>
      </div>

      <div className="panel p-3">
        <header className="mb-2">
          <span className="section-title">Equipment</span>
        </header>
        <div className="divide-y divide-white/[0.06]" data-testid="shop-equipment-list">
          {(Object.keys(EQUIPMENT_SPECS) as EquipmentType[]).map((t) => {
            const spec = EQUIPMENT_SPECS[t];
            const canAfford = cash >= spec.price;
            return (
              <ShopRow
                key={t}
                testid={`buy-equipment-${t}`}
                title={spec.label}
                subtitle={spec.description}
                description=""
                price={spec.price}
                canAfford={canAfford}
                onBuy={() => buyEquipment(t)}
              />
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}

function ShopRow({
  testid,
  title,
  subtitle,
  description,
  price,
  canAfford,
  onBuy,
}: {
  testid: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  canAfford: boolean;
  onBuy: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-white/[0.03] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-slate-100 truncate">
          {title}
        </div>
        <div className="text-[10px] text-cyan-300/80 truncate">{subtitle}</div>
        {description && (
          <div className="text-[10px] text-slate-500 truncate">{description}</div>
        )}
      </div>
      <button
        onClick={onBuy}
        disabled={!canAfford}
        data-testid={testid}
        className={`btn py-1.5 px-3 text-[10px] ${canAfford ? "" : "opacity-40 cursor-not-allowed"}`}
      >
        ${price}
      </button>
    </div>
  );
}
