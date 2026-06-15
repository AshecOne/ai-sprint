"use client";

import type {
  Aquarium,
  Equipment,
  Fish,
  Plant,
  SimulationEvent,
} from "@/simulation/types";
import { createStarterTank, uid } from "@/simulation/engine";
import { resolveTier, tierSpec } from "@/simulation/tanks";

/**
 * Multi-slot save layer.
 *
 * The live Zustand store (`aquariumStore`) only ever holds ONE tank at a time
 * (everything keys off `aquariums[0]`). This module is the layer ABOVE it that
 * lets the player keep several named aquariums in localStorage and switch
 * between them.
 *
 * Storage model:
 *  - `aquasim-saves`        → a registry: `{ version, activeId, slots: SaveMeta[] }`
 *  - `aquasim-save:<id>`    → one slot's full snapshot: `{ version, snapshot }`
 *
 * Key trick: a slot's `id` is the SAME string as its aquarium's `id`, so the
 * store's `aquariums[0].id` doubles as "which slot am I writing to".
 */

const REGISTRY_KEY = "aquasim-saves";
const SLOT_PREFIX = "aquasim-save:";
const LEGACY_KEY = "aquasim-aquarium";

export const REGISTRY_VERSION = 1;
export const SLOT_VERSION = 1;

/** Lightweight per-slot metadata shown in the lobby list. */
export interface SaveMeta {
  id: string;
  name: string;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
  /** Living fish — cheap summary for the card. */
  fishCount: number;
  cash: number;
}

/** The persisted slice of the live store, one per slot. */
export interface SaveSnapshot {
  aquariums: Aquarium[];
  fish: Fish[];
  plants: Plant[];
  equipment: Equipment[];
  cash: number;
  events: SimulationEvent[];
  cleanReadyAt: number;
  /**
   * Epoch ms when this slot was last written. Stamped by `writeSlot`, surfaced
   * by `readSlot`. Drives offline/away progression (#34): on load,
   * `Date.now() - savedAt` is how long the tab was closed. Absent on pre-#34
   * saves → treated as "no time away".
   */
  savedAt?: number;
}

interface Registry {
  version: number;
  activeId: string | null;
  slots: SaveMeta[];
}

const hasWindow = () => typeof window !== "undefined";

const emptyRegistry = (): Registry => ({
  version: REGISTRY_VERSION,
  activeId: null,
  slots: [],
});

function readRegistry(): Registry {
  if (!hasWindow()) return emptyRegistry();
  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (!raw) return emptyRegistry();
    const parsed = JSON.parse(raw) as Partial<Registry>;
    if (!parsed || !Array.isArray(parsed.slots)) return emptyRegistry();
    return {
      version: parsed.version ?? REGISTRY_VERSION,
      activeId: parsed.activeId ?? null,
      slots: parsed.slots,
    };
  } catch {
    return emptyRegistry();
  }
}

function writeRegistry(reg: Registry): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  } catch {
    /* quota / private mode — saving is best-effort */
  }
}

/** Slots, most-recently-played first. */
export function listSaves(): SaveMeta[] {
  return [...readRegistry().slots].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  );
}

export function getActiveId(): string | null {
  return readRegistry().activeId;
}

export function setActiveId(id: string | null): void {
  const reg = readRegistry();
  reg.activeId = id;
  writeRegistry(reg);
}

/**
 * Backfill fields added after a slot was first written so older saves load
 * cleanly. Currently: the `tier` field (issue #24) — legacy tanks predate it,
 * so infer it from volume (or default 0) and snap volume/dimensions to that
 * tier's canonical values.
 */
function normalizeSnapshot(snap: SaveSnapshot): SaveSnapshot {
  return {
    ...snap,
    aquariums: snap.aquariums.map((a) => {
      if (typeof a.tier === "number") return a;
      const tier = resolveTier(a);
      const spec = tierSpec(tier);
      return {
        ...a,
        tier,
        volume: a.volume ?? spec.volume,
        width: a.width ?? spec.width,
        height: a.height ?? spec.height,
        depth: a.depth ?? spec.depth,
      };
    }),
  };
}

export function readSlot(id: string): SaveSnapshot | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(SLOT_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      version?: number;
      savedAt?: number;
      snapshot?: SaveSnapshot;
    };
    if (!parsed?.snapshot || !Array.isArray(parsed.snapshot.aquariums)) return null;
    return { ...normalizeSnapshot(parsed.snapshot), savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function writeSlot(id: string, snapshot: SaveSnapshot): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(
      SLOT_PREFIX + id,
      JSON.stringify({ version: SLOT_VERSION, savedAt: Date.now(), snapshot })
    );
  } catch {
    /* best-effort */
  }
}

/** Pull just the persistable slice out of a full store state. */
export function snapshotOf(state: SaveSnapshot): SaveSnapshot {
  return {
    aquariums: state.aquariums,
    fish: state.fish,
    plants: state.plants,
    equipment: state.equipment,
    cash: state.cash,
    events: state.events,
    cleanReadyAt: state.cleanReadyAt,
  };
}

/** Auto-save touch: refresh a slot's summary + updatedAt in the registry. */
export function touchSlot(
  id: string,
  meta: Partial<Pick<SaveMeta, "fishCount" | "cash" | "name">>
): void {
  const reg = readRegistry();
  let changed = false;
  reg.slots = reg.slots.map((s) => {
    if (s.id !== id) return s;
    changed = true;
    return { ...s, ...meta, updatedAt: new Date().toISOString() };
  });
  if (changed) writeRegistry(reg);
}

/**
 * Create a brand-new named slot from a fresh starter tank and mark it active.
 * Returns the new slot's metadata (its `id` is the aquarium id).
 */
export function createSlot(name: string): SaveMeta {
  const fresh = createStarterTank();
  const finalName = name.trim().slice(0, 30) || "Akuarium Baru";
  const aquarium: Aquarium = { ...fresh.aquarium, name: finalName };
  const id = aquarium.id;
  const now = new Date().toISOString();

  const snapshot: SaveSnapshot = {
    aquariums: [aquarium],
    fish: fresh.fish,
    plants: fresh.plants,
    equipment: fresh.equipment,
    cash: 250,
    events: [
      {
        id: uid("evt"),
        ts: Date.now(),
        severity: "success",
        message: "Welcome to AquaSim. Your starter tank is online.",
      },
    ],
    cleanReadyAt: 0,
  };
  writeSlot(id, snapshot);

  const meta: SaveMeta = {
    id,
    name: finalName,
    createdAt: now,
    updatedAt: now,
    fishCount: fresh.fish.filter((f) => f.alive).length,
    cash: 250,
  };
  const reg = readRegistry();
  reg.slots = [...reg.slots, meta];
  reg.activeId = id;
  writeRegistry(reg);
  return meta;
}

/** Rename a slot in both the registry and the slot's own aquarium name. */
export function renameSlot(id: string, name: string): void {
  const clean = name.trim().slice(0, 30);
  if (!clean) return;
  const reg = readRegistry();
  reg.slots = reg.slots.map((s) =>
    s.id === id ? { ...s, name: clean, updatedAt: new Date().toISOString() } : s
  );
  writeRegistry(reg);
  // Keep the aquarium's own name in sync so /game shows the new name too.
  const snap = readSlot(id);
  if (snap) {
    writeSlot(id, {
      ...snap,
      aquariums: snap.aquariums.map((a) =>
        a.id === id ? { ...a, name: clean } : a
      ),
    });
  }
}

/** Delete a slot: drop its snapshot key + registry entry, re-point active. */
export function deleteSlot(id: string): void {
  if (hasWindow()) {
    try {
      window.localStorage.removeItem(SLOT_PREFIX + id);
    } catch {
      /* best-effort */
    }
  }
  const reg = readRegistry();
  reg.slots = reg.slots.filter((s) => s.id !== id);
  if (reg.activeId === id) reg.activeId = reg.slots[0]?.id ?? null;
  writeRegistry(reg);
}

/**
 * One-time migration: if no registry exists yet but the old single-tank persist
 * blob (`aquasim-aquarium`) does, import it as a first slot so existing players
 * keep their progress. Pre-#14 tanks (persist version < 2) hold stale chemistry,
 * so those are skipped (the player gets a clean empty lobby instead of a broken
 * tank). Idempotent: writes a registry so it never runs twice.
 */
export function migrateLegacy(): void {
  if (!hasWindow()) return;
  if (window.localStorage.getItem(REGISTRY_KEY)) return; // already initialised

  const reg = emptyRegistry();
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: SaveSnapshot; version?: number };
      const version = parsed?.version ?? 0;
      const st = parsed?.state;
      if (st && Array.isArray(st.aquariums) && st.aquariums[0] && version >= 2) {
        const aq0 = st.aquariums[0];
        const id = aq0.id;
        const name = "Akuarium Saya";
        const fish = st.fish ?? [];
        const snapshot: SaveSnapshot = {
          aquariums: st.aquariums.map((a) =>
            a.id === id ? { ...a, name } : a
          ),
          fish,
          plants: st.plants ?? [],
          equipment: st.equipment ?? [],
          cash: typeof st.cash === "number" ? st.cash : 250,
          events: st.events ?? [],
          cleanReadyAt: typeof st.cleanReadyAt === "number" ? st.cleanReadyAt : 0,
        };
        writeSlot(id, snapshot);
        reg.slots.push({
          id,
          name,
          createdAt: aq0.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fishCount: fish.filter((f) => f.alive).length,
          cash: snapshot.cash,
        });
        reg.activeId = id;
      }
    }
  } catch {
    /* corrupt legacy blob — fall through to an empty registry */
  }
  writeRegistry(reg);
}
