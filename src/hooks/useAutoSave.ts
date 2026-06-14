"use client";

import { useEffect } from "react";
import { useAquariumStore } from "@/store/aquariumStore";
import { snapshotOf, touchSlot, writeSlot } from "@/store/saveManager";

/** How often a dirty store is flushed to its slot, in ms. */
const SAVE_INTERVAL_MS = 2000;

/**
 * Auto-saves the live store into its active slot while `/game` is mounted.
 *
 * Strategy: a store subscription just marks the state dirty; a low-frequency
 * interval flushes when dirty. (A plain debounce would starve under the
 * once-a-second simulation tick that keeps resetting the timer.) We also flush
 * immediately on tab-hide, page-unload, and unmount so nothing is lost.
 *
 * The slot key is `aquariums[0].id` — the store only ever holds the one active
 * tank, so that id always points at the right slot.
 */
export function useAutoSave(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    let dirty = false;

    const flush = () => {
      dirty = false;
      const s = useAquariumStore.getState();
      const aq = s.aquariums[0];
      if (!aq) return;
      writeSlot(aq.id, snapshotOf(s));
      touchSlot(aq.id, {
        fishCount: s.fish.filter((f) => f.alive).length,
        cash: s.cash,
        name: aq.name,
      });
    };

    const unsub = useAquariumStore.subscribe(() => {
      dirty = true;
    });
    const interval = setInterval(() => {
      if (dirty) flush();
    }, SAVE_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", flush);

    return () => {
      unsub();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", flush);
      flush(); // persist the latest state on unmount (e.g. SPA nav to lobby)
    };
  }, [enabled]);
}
