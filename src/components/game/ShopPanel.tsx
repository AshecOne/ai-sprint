"use client";

import { useState } from "react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useConfirm } from "@/components/game/ConfirmProvider";
import { ItemDetailModal, type DetailItem } from "@/components/game/ItemDetailModal";
import { audio } from "@/audio/engine";
import { FISH_SPECIES, PLANT_SPECIES, EQUIPMENT_SPECS } from "@/simulation/species";
import { MAX_TANK_TIER, TANK_TIERS, tierSpec } from "@/simulation/tanks";
import { ChevronRight } from "lucide-react";
import type { FishSpeciesId, PlantSpeciesId, EquipmentType } from "@/simulation/types";

/** A selected item plus the per-unit buy action the confirm flow will run. */
type SelectedItem = DetailItem & { buyOne: () => void };

export function ShopPanel() {
  const cash = useAquariumStore((s) => s.cash);
  const aquarium = useAquariumStore((s) => s.aquariums[0]);
  const aliveCount = useAquariumStore((s) => s.fish.filter((f) => f.alive).length);
  const buyFish = useAquariumStore((s) => s.buyFish);
  const buyPlant = useAquariumStore((s) => s.buyPlant);
  const buyEquipment = useAquariumStore((s) => s.buyEquipment);
  const upgradeTank = useAquariumStore((s) => s.upgradeTank);
  const confirm = useConfirm();

  const [selected, setSelected] = useState<SelectedItem | null>(null);

  const currentTier = tierSpec(aquarium?.tier ?? 0);
  const isMaxTier = currentTier.tier >= MAX_TANK_TIER;
  const nextTier = isMaxTier ? null : TANK_TIERS[currentTier.tier + 1];
  const canUpgrade = !!nextTier && cash >= nextTier.upgradePrice;
  const fishCapacityLeft = Math.max(0, currentTier.maxFish - aliveCount);

  const handleUpgrade = async () => {
    if (!nextTier) return;
    const ok = await confirm({
      title: `Upgrade to ${nextTier.name}?`,
      message: `Upgrade your tank to ${nextTier.name} (${nextTier.volume}L, holds ${nextTier.maxFish} fish) for $${nextTier.upgradePrice}. You'll have $${cash - nextTier.upgradePrice} left. Bigger tanks keep their water more stable.`,
      confirmLabel: `Upgrade ($${nextTier.upgradePrice})`,
    });
    if (ok) {
      upgradeTank();
      audio.play("buy");
    }
  };

  // Buy from the detail modal: close the detail FIRST so the confirm dialog
  // never stacks on top of it, then run the shared purchase confirm and buy
  // `qty` units. Capacity/cash are already clamped inside the modal.
  const handleConfirmBuy = async (qty: number) => {
    const item = selected;
    if (!item) return;
    setSelected(null);
    const total = item.price * qty;
    const ok = await confirm({
      title: qty > 1 ? `Buy ${qty}× ${item.label}?` : `Buy ${item.label}?`,
      message: `Total $${total}. You'll have $${cash - total} left.`,
      confirmLabel: `Buy ($${total})`,
      rememberKey: "shop-buy",
      rememberLabel: "Don't ask for purchases again",
    });
    if (ok) {
      for (let i = 0; i < qty; i++) item.buyOne();
      audio.play("buy");
    }
  };

  const openFish = (id: FishSpeciesId) => {
    const spec = FISH_SPECIES[id];
    setSelected({
      kind: "Fish",
      label: spec.label,
      description: spec.description,
      spriteKey: spec.spriteKey,
      price: spec.price,
      capacityLeft: fishCapacityLeft,
      stats: [
        { label: "Temp", value: `${spec.prefs.tempMin}–${spec.prefs.tempMax}°C` },
        { label: "pH", value: `${spec.prefs.phMin}–${spec.prefs.phMax}` },
        { label: "Adult size", value: `${spec.adultSize} cm` },
      ],
      buyOne: () => buyFish(id),
    });
  };

  const openPlant = (id: PlantSpeciesId) => {
    const spec = PLANT_SPECIES[id];
    setSelected({
      kind: "Plant",
      label: spec.label,
      description: spec.description,
      spriteKey: spec.spriteKey,
      price: spec.price,
      stats: [
        { label: "O₂", value: `+${spec.oxygenRate.toFixed(2)}/tick` },
        { label: "NO₃", value: `−${spec.nitrateRate.toFixed(2)}/tick` },
      ],
      buyOne: () => buyPlant(id),
    });
  };

  const openEquipment = (type: EquipmentType) => {
    const spec = EQUIPMENT_SPECS[type];
    setSelected({
      kind: "Equipment",
      label: spec.label,
      description: spec.description,
      spriteKey: spec.spriteKey,
      price: spec.price,
      stats: [],
      buyOne: () => buyEquipment(type),
    });
  };

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-3" data-testid="shop-panel">
      {/* Tank upgrade */}
      <div className="panel p-3" data-testid="tank-upgrade">
        <header className="mb-2 flex items-center justify-between">
          <span className="section-title">Tank</span>
          <span className="title-eyebrow">
            {currentTier.name} · {aliveCount}/{currentTier.maxFish} fish
          </span>
        </header>
        {nextTier ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-slate-100">
                Upgrade → {nextTier.name}
              </div>
              <div className="text-[10px] text-cyan-300/80">
                {nextTier.volume}L · holds {nextTier.maxFish} fish · more stable water
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={!canUpgrade}
              data-testid="upgrade-tank"
              className={`btn btn-emerald py-1.5 px-3 text-[10px] ${
                canUpgrade ? "" : "opacity-40 cursor-not-allowed"
              }`}
            >
              ${nextTier.upgradePrice}
            </button>
          </div>
        ) : (
          <div className="px-2 py-2 text-[11px] text-slate-400">
            Maximum tier reached — {currentTier.volume}L Show Tank 🏆
          </div>
        )}
      </div>

      <div className="panel p-3">
        <header className="mb-2">
          <span className="section-title">Fish</span>
        </header>
        <div className="divide-y divide-white/[0.06]" data-testid="shop-fish-list">
          {(Object.keys(FISH_SPECIES) as FishSpeciesId[]).map((id) => {
            const spec = FISH_SPECIES[id];
            return (
              <ShopRow
                key={id}
                testid={`buy-fish-${id}`}
                title={spec.label}
                subtitle={`${spec.prefs.tempMin}–${spec.prefs.tempMax}°C · pH ${spec.prefs.phMin}–${spec.prefs.phMax}`}
                description={spec.description}
                price={spec.price}
                canAfford={cash >= spec.price}
                onOpen={() => openFish(id)}
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
            return (
              <ShopRow
                key={id}
                testid={`buy-plant-${id}`}
                title={spec.label}
                subtitle={`O₂ +${spec.oxygenRate.toFixed(2)} · NO₃ −${spec.nitrateRate.toFixed(2)}/tick`}
                description={spec.description}
                price={spec.price}
                canAfford={cash >= spec.price}
                onOpen={() => openPlant(id)}
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
            return (
              <ShopRow
                key={t}
                testid={`buy-equipment-${t}`}
                title={spec.label}
                subtitle={spec.description}
                description=""
                price={spec.price}
                canAfford={cash >= spec.price}
                onOpen={() => openEquipment(t)}
              />
            );
          })}
        </div>
      </div>

      {selected && (
        <ItemDetailModal
          item={selected}
          cash={cash}
          onBuy={handleConfirmBuy}
          onClose={() => setSelected(null)}
        />
      )}
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
  onOpen,
}: {
  testid: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  canAfford: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={testid}
      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-white/[0.04] transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-slate-100 truncate">
          {title}
        </div>
        <div className="text-[10px] text-cyan-300/80 truncate">{subtitle}</div>
        {description && (
          <div className="text-[10px] text-slate-500 truncate">{description}</div>
        )}
      </div>
      <span
        className={`text-[11px] font-semibold tabular-nums shrink-0 ${
          canAfford ? "text-slate-200" : "text-red-300/80"
        }`}
      >
        ${price}
      </span>
      <ChevronRight size={14} className="text-slate-500 shrink-0" />
    </button>
  );
}
