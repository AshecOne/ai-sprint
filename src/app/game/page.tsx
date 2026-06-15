"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { useAudioStore } from "@/store/audioStore";
import {
  getActiveId,
  listSaves,
  migrateLegacy,
  readSlot,
  setActiveId,
} from "@/store/saveManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSimulationLoop } from "@/hooks/useSimulationLoop";
import {
  fastForwardAwayChunked,
  shouldFastForward,
  type AwaySummary,
} from "@/simulation/offline";
import { useIsMobile, useRotatePrompt, useClientSettled } from "@/hooks/useIsMobile";
import { GameLoader } from "@/components/game/GameLoader";
import { TopBar } from "@/components/game/TopBar";
import { StatsPanel } from "@/components/game/StatsPanel";
import { ShopPanel } from "@/components/game/ShopPanel";
import { EventLog } from "@/components/game/EventLog";
import { ControlBar } from "@/components/game/ControlBar";
import { EditOverlay } from "@/components/game/EditOverlay";
import { PanelTabs } from "@/components/game/PanelTabs";
import { MobileNav } from "@/components/game/MobileNav";
import { ConfirmProvider } from "@/components/game/ConfirmProvider";
import { WhileYouWereAway } from "@/components/game/WhileYouWereAway";

// Phaser canvas is strictly client-side. No `loading` fallback here — the
// full-screen GameLoader covers the whole page until the scene is truly ready.
const PhaserGame = dynamic(() => import("@/renderer/PhaserGame"), {
  ssr: false,
});

// Minimum time the loader stays up so the transition feels deliberate (a brief
// "loading" beat) rather than a flicker.
const MIN_LOADER_MS = 1500;
// Safety net: if the scene never signals ready (error/stall), reveal anyway.
const READY_FALLBACK_MS = 6000;

export default function GamePage() {
  const router = useRouter();

  // Drive the simulation tick.
  useSimulationLoop();

  const activeAquariumId = useGameStore((s) => s.activeAquariumId);
  const setActiveAquariumId = useGameStore((s) => s.setActiveAquariumId);
  const rightPanel = useGameStore((s) => s.rightPanel);
  const mobileView = useGameStore((s) => s.mobileView);
  const isMobile = useIsMobile();
  const showRotatePrompt = useRotatePrompt();
  const settled = useClientSettled();

  // Loading gate: hide the overlay only once the scene reports ready, the
  // min display time has passed, AND the mobile/rotate layout has settled.
  const [sceneReady, setSceneReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  // True once the active save slot has been loaded into the store.
  const [hydrated, setHydrated] = useState(false);
  // Populated when the tank was fast-forwarded over offline time on load (#34).
  const [awaySummary, setAwaySummary] = useState<AwaySummary | null>(null);
  const ready = sceneReady && minTimeElapsed && settled && hydrated;

  // Auto-save the live store into its slot once we've hydrated one.
  useAutoSave(hydrated);

  useEffect(() => {
    const minT = setTimeout(() => setMinTimeElapsed(true), MIN_LOADER_MS);
    const fallback = setTimeout(() => setSceneReady(true), READY_FALLBACK_MS);
    return () => {
      clearTimeout(minT);
      clearTimeout(fallback);
    };
  }, []);

  // Hydrate the active save slot into the store on mount. Loading the tank from
  // localStorage is the save layer's job; if there's no slot to load, send the
  // player back to the lobby to create one. If the player was away a while
  // (savedAt is old), fast-forward the sim over that gap first (#34) and show a
  // "While you were away…" recap.
  useEffect(() => {
    let cancelled = false;
    migrateLegacy(); // one-time: import a pre-#16 single-tank blob if present
    let id = getActiveId();
    let snap = id ? readSlot(id) : null;
    if (!snap) {
      // Active pointer was stale/missing — fall back to the newest slot.
      const first = listSaves()[0];
      if (first) {
        id = first.id;
        snap = readSlot(id);
        setActiveId(id);
      }
    }
    if (!snap || !id) {
      // No saves at all — pick/create one in the lobby.
      router.replace("/");
      return;
    }

    const slotId = id;
    const loaded = snap;

    const commit = (
      aquarium: (typeof loaded.aquariums)[number],
      fish: typeof loaded.fish,
      plants: typeof loaded.plants,
      equipment: typeof loaded.equipment,
      events: typeof loaded.events,
      summary: AwaySummary | null
    ) => {
      if (cancelled) return;
      useAquariumStore.setState({
        aquariums: loaded.aquariums.map((a, i) => (i === 0 ? aquarium : a)),
        fish,
        plants,
        equipment,
        cash: loaded.cash,
        events,
        cleanReadyAt: loaded.cleanReadyAt,
        cleanFx: 0,
      });
      setActiveAquariumId(slotId);
      if (summary) setAwaySummary(summary);
      setHydrated(true);
    };

    const elapsed = loaded.savedAt ? (Date.now() - loaded.savedAt) / 1000 : 0;

    if (shouldFastForward(elapsed) && loaded.aquariums[0]) {
      // Catch up the world over the away time in chunks (keeps the loader
      // animating), then commit the advanced state + recap.
      fastForwardAwayChunked(
        {
          aquarium: loaded.aquariums[0],
          fish: loaded.fish,
          plants: loaded.plants,
          equipment: loaded.equipment,
        },
        elapsed
      ).then(({ state, events, summary }) => {
        // Only surface meaningful catch-up events (e.g. deaths) in the log —
        // not the routine warning spam — newest first, capped like applyTick.
        const notable = events.filter((e) => e.severity === "danger");
        const merged = [...notable.reverse(), ...loaded.events].slice(0, 80);
        commit(state.aquarium, state.fish, state.plants, state.equipment, merged, summary);
      });
    } else {
      commit(
        loaded.aquariums[0],
        loaded.fish,
        loaded.plants,
        loaded.equipment,
        loaded.events,
        null
      );
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start audio as early as possible. The normal flow already unlocked it on
  // the lobby's "Enter the tank" click; this also covers a direct reload of
  // /game — best-effort autoplay on load, with a first-input fallback for when
  // the browser's autoplay policy blocks the load-time attempt.
  useEffect(() => {
    const unlock = () => useAudioStore.getState().unlock();
    unlock(); // best-effort autoplay on load
    const opts = { once: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <ConfirmProvider>
    <main className="game-shell w-screen flex flex-col overflow-hidden crt-scanlines">
      <TopBar />

      <div
        className={`flex-1 flex overflow-hidden min-h-0 ${
          isMobile ? "" : "gap-2 sm:gap-3 px-2 sm:px-3 pt-2 sm:pt-3 pb-2 sm:pb-3"
        }`}
      >
        {/* Left: Phaser canvas (rendered once) + control bar */}
        <section
          className={`flex-1 flex flex-col min-w-0 ${
            isMobile ? "" : "gap-2 sm:gap-3"
          }`}
        >
          <div
            className={`tank-container flex-1 relative overflow-hidden ${
              isMobile ? "tank-container--bleed" : ""
            }`}
            data-testid="tank-container"
          >
            <PhaserGame
              aquariumId={activeAquariumId}
              onReady={() => setSceneReady(true)}
            />

            {/* Edit-mode HUD (banner + selected-object controls) */}
            <EditOverlay />

            {/* Mobile: full-screen panel overlay — one window, one focus.
                No header: the bottom nav already labels the view and the
                "Tank" tab is the way back, so a title bar + close button
                would just be redundant chrome. */}
            {isMobile && mobileView !== "tank" && (
              <div className="mobile-panel" data-testid="mobile-panel">
                <div className="mobile-panel__body">
                  {mobileView === "stats" && <StatsPanel />}
                  {mobileView === "shop" && <ShopPanel />}
                  {mobileView === "log" && <EventLog />}
                </div>
              </div>
            )}

            {/* Mobile: actions float over the tank so the aquarium can fill
                the whole section — no separate bar eating vertical space */}
            {isMobile && mobileView === "tank" && (
              <div className="absolute inset-x-0 bottom-0 z-10 px-2 pb-2 pt-6 bg-gradient-to-t from-black/45 to-transparent">
                <ControlBar floating />
              </div>
            )}
          </div>

          {/* Desktop: standard control bar below the tank */}
          {!isMobile && <ControlBar />}
        </section>

        {/* Right: Dashboard sidebar — desktop only */}
        {!isMobile && (
          <aside className="w-[300px] lg:w-[360px] flex flex-col gap-3 min-h-0">
            <PanelTabs />
            <div className="flex-1 overflow-hidden min-h-0">
              {rightPanel === "stats" && <StatsPanel />}
              {rightPanel === "shop" && <ShopPanel />}
              {rightPanel === "log" && <EventLog />}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile: bottom tab navigation */}
      {isMobile && <MobileNav />}

      {/* Mobile portrait: nudge the player to rotate for a bigger tank.
          Rendered only when actually on a small portrait screen so it never
          flashes on desktop (no reliance on CSS media-query timing). */}
      {showRotatePrompt && (
        <div className="rotate-notice" role="dialog" aria-label="Rotate your device">
          <div className="rotate-notice__inner">
            <Smartphone size={64} strokeWidth={1.5} className="rotate-notice__icon" />
            <p className="rotate-notice__title">Putar HP ke landscape</p>
            <p className="rotate-notice__sub">
              Miringkan layar biar akuariummu lebih lega buat dimainkan 🐟
            </p>
          </div>
        </div>
      )}

      {/* Full-screen loading overlay — covers HUD + canvas until the renderer
          is truly ready, then fades out. Self-unmounts after the fade. */}
      <GameLoader ready={ready} />

      {/* "While you were away…" recap — only after the loader has revealed the
          tank, so it lands on the game rather than over the loading screen. */}
      {awaySummary && ready && (
        <WhileYouWereAway
          summary={awaySummary}
          onClose={() => setAwaySummary(null)}
        />
      )}
    </main>
    </ConfirmProvider>
  );
}
