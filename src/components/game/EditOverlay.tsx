"use client";

import { useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  Check,
} from "lucide-react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { useConfirm } from "@/components/game/ConfirmProvider";
import { audio } from "@/audio/engine";

/** How far one nudge-button press moves an object (fraction of the tank). */
const NUDGE = 0.03;

const EQUIP_LABEL: Record<string, string> = {
  filter: "HOB Filter",
  heater: "Heater",
  airstone: "Air Stone",
  co2_diffuser: "CO₂ Diffuser",
  light: "LED Light",
};

/**
 * HUD layer shown only in edit mode. A banner explains the mode and, once an
 * object is selected (in the Phaser canvas), a compact panel lets the player
 * nudge it with arrow buttons or delete it. Dragging happens in the canvas;
 * this is the keyboard-free precision + delete affordance asked for in #18.
 */
export function EditOverlay() {
  const editMode = useGameStore((s) => s.editMode);
  const setEditMode = useGameStore((s) => s.setEditMode);
  const selectedId = useGameStore((s) => s.selectedDecorId);
  const setSelectedId = useGameStore((s) => s.setSelectedDecorId);

  const plants = useAquariumStore((s) => s.plants);
  const equipment = useAquariumStore((s) => s.equipment);
  const setPlantPosition = useAquariumStore((s) => s.setPlantPosition);
  const setEquipmentPosition = useAquariumStore((s) => s.setEquipmentPosition);
  const removePlantById = useAquariumStore((s) => s.removePlantById);
  const removeEquipment = useAquariumStore((s) => s.removeEquipment);
  const confirm = useConfirm();

  const plant = plants.find((p) => p.id === selectedId);
  const equip = equipment.find((e) => e.id === selectedId);
  const selected = plant ?? equip;

  // If the selected object disappears (e.g. deleted elsewhere), drop the stale
  // selection so the panel doesn't linger.
  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selectedId, selected, setSelectedId]);

  if (!editMode) return null;

  const nudgeX = (dir: -1 | 1) => {
    if (plant) setPlantPosition(plant.id, plant.x + dir * NUDGE);
    else if (equip) setEquipmentPosition(equip.id, equip.x + dir * NUDGE, equip.y);
    audio.play("toggle");
  };
  const nudgeY = (dir: -1 | 1) => {
    if (equip) setEquipmentPosition(equip.id, equip.x, equip.y + dir * NUDGE);
    audio.play("toggle");
  };

  // Which nudge axes apply, mirroring the per-type drag constraints.
  const canX = !!plant || (!!equip && equip.type !== "light");
  const canY = !!equip && equip.type !== "airstone" && equip.type !== "co2_diffuser";

  const label = plant ? "Plant" : equip ? EQUIP_LABEL[equip.type] ?? "Equipment" : "";

  const onDelete = async () => {
    if (!selected) return;
    const ok = await confirm({
      title: plant ? "Hapus tanaman ini?" : "Hapus alat ini?",
      message: plant
        ? "Tanaman ini akan dicabut dari akuarium."
        : `${label} ini akan dilepas dari akuarium.`,
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    if (plant) removePlantById(plant.id);
    else if (equip) removeEquipment(equip.id);
    setSelectedId(null);
    audio.play("error");
  };

  return (
    <div className="absolute inset-x-0 top-2 z-20 flex flex-col items-center gap-2 px-2 pointer-events-none">
      {/* Mode banner */}
      <div
        className="panel-glass pointer-events-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-1.5 text-[10px] sm:text-[11px] max-w-[92vw] text-center"
        data-testid="edit-mode-banner"
      >
        <span className="tracking-wide text-cyan-200">
          🛠️ Mode Atur — pilih objek, geser (drag/▲▼◀▶) atau hapus
        </span>
        <button
          onClick={() => setEditMode(false)}
          className="btn btn-emerald px-2! py-1! text-[10px]!"
          data-testid="edit-mode-done"
        >
          <Check size={12} strokeWidth={2.5} />
          Selesai
        </button>
      </div>

      {/* Selected-object controls */}
      {selected && (
        <div
          className="panel pointer-events-auto flex items-center gap-2 px-2.5 py-1.5"
          data-testid="edit-selected-panel"
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-300 mr-1">
            {label}
          </span>

          <div className="flex items-center gap-1">
            <NudgeBtn
              disabled={!canX}
              onClick={() => nudgeX(-1)}
              label="Geser kiri"
              testid="nudge-left"
            >
              <ChevronLeft size={14} />
            </NudgeBtn>
            <NudgeBtn
              disabled={!canY}
              onClick={() => nudgeY(-1)}
              label="Geser atas"
              testid="nudge-up"
            >
              <ChevronUp size={14} />
            </NudgeBtn>
            <NudgeBtn
              disabled={!canY}
              onClick={() => nudgeY(1)}
              label="Geser bawah"
              testid="nudge-down"
            >
              <ChevronDown size={14} />
            </NudgeBtn>
            <NudgeBtn
              disabled={!canX}
              onClick={() => nudgeX(1)}
              label="Geser kanan"
              testid="nudge-right"
            >
              <ChevronRight size={14} />
            </NudgeBtn>
          </div>

          <button
            onClick={onDelete}
            className="btn btn-danger px-2! py-1!"
            data-testid="edit-delete"
            aria-label={`Hapus ${label}`}
            title="Hapus objek"
          >
            <Trash2 size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function NudgeBtn({
  children,
  onClick,
  disabled,
  label,
  testid,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  testid: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      data-testid={testid}
      className="flex h-7 w-7 items-center justify-center rounded border border-cyan-400/40 bg-cyan-400/10 text-cyan-200 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-cyan-400/20"
    >
      {children}
    </button>
  );
}
