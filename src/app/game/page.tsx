"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Smartphone } from "lucide-react";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { useSimulationLoop } from "@/hooks/useSimulationLoop";
import { TopBar } from "@/components/game/TopBar";
import { StatsPanel } from "@/components/game/StatsPanel";
import { ShopPanel } from "@/components/game/ShopPanel";
import { EventLog } from "@/components/game/EventLog";
import { ControlBar } from "@/components/game/ControlBar";
import { PanelTabs } from "@/components/game/PanelTabs";
import { MobileNav } from "@/components/game/MobileNav";
import { X } from "lucide-react";

// Phaser canvas is strictly client-side.
const PhaserGame = dynamic(() => import("@/renderer/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-cyan-400 text-xs uppercase tracking-widest">
      Booting renderer…
    </div>
  ),
});

export default function GamePage() {
  // Drive the simulation tick.
  useSimulationLoop();

  const aquariums = useAquariumStore((s) => s.aquariums);
  const activeAquariumId = useGameStore((s) => s.activeAquariumId);
  const setActiveAquariumId = useGameStore((s) => s.setActiveAquariumId);
  const rightPanel = useGameStore((s) => s.rightPanel);
  const mobileView = useGameStore((s) => s.mobileView);
  const setMobileView = useGameStore((s) => s.setMobileView);

  useEffect(() => {
    if (!activeAquariumId && aquariums[0]) {
      setActiveAquariumId(aquariums[0].id);
    }
  }, [activeAquariumId, aquariums, setActiveAquariumId]);

  const mobilePanelTitle =
    mobileView === "stats" ? "Stats" : mobileView === "shop" ? "Shop" : "Log";

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden crt-scanlines">
      <TopBar />

      <div className="flex-1 flex gap-2 sm:gap-3 px-2 sm:px-3 pb-2 sm:pb-3 overflow-hidden min-h-0">
        {/* Left: Phaser canvas (rendered once) + control bar */}
        <section className="flex-1 flex flex-col gap-2 sm:gap-3 min-w-0">
          <div
            className="tank-container flex-1 relative overflow-hidden"
            data-testid="tank-container"
          >
            <PhaserGame aquariumId={activeAquariumId} />
            {/* HUD overlay */}
            <div className="absolute top-2 left-2 z-10 panel-glass px-2 py-1 text-[9px] sm:text-[10px] tracking-widest text-cyan-300 uppercase">
              <span className="blink-dot mr-2" />
              Live · Tank #1
            </div>

            {/* Mobile: full-screen panel overlay — one window, one focus */}
            {mobileView !== "tank" && (
              <div
                className="mobile-only mobile-panel"
                data-testid="mobile-panel"
              >
                <div className="mobile-panel__head">
                  <span className="section-title text-xs">{mobilePanelTitle}</span>
                  <button
                    onClick={() => setMobileView("tank")}
                    className="btn btn-ghost py-1 px-2"
                    data-testid="mobile-panel-close"
                    aria-label="Back to tank"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mobile-panel__body">
                  {mobileView === "stats" && <StatsPanel />}
                  {mobileView === "shop" && <ShopPanel />}
                  {mobileView === "log" && <EventLog />}
                </div>
              </div>
            )}
          </div>

          {/* ControlBar: always on desktop; on mobile only while viewing the tank */}
          <div className={mobileView === "tank" ? "" : "mobile-hidden"}>
            <ControlBar />
          </div>
        </section>

        {/* Right: Dashboard — desktop only */}
        <aside className="desktop-only w-[300px] lg:w-[360px] flex-col gap-3 min-h-0">
          <PanelTabs />
          <div className="flex-1 overflow-hidden min-h-0">
            {rightPanel === "stats" && <StatsPanel />}
            {rightPanel === "shop" && <ShopPanel />}
            {rightPanel === "log" && <EventLog />}
          </div>
        </aside>
      </div>

      {/* Mobile: bottom tab navigation */}
      <MobileNav />

      {/* Mobile portrait: nudge the player to rotate for a bigger tank */}
      <div className="rotate-notice" role="dialog" aria-label="Rotate your device">
        <div className="rotate-notice__inner">
          <Smartphone size={64} strokeWidth={1.5} className="rotate-notice__icon" />
          <p className="rotate-notice__title">Putar HP ke landscape</p>
          <p className="rotate-notice__sub">
            Miringkan layar biar akuariummu lebih lega buat dimainkan 🐟
          </p>
        </div>
      </div>
    </main>
  );
}
