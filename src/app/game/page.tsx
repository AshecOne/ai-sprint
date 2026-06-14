"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { useSimulationLoop } from "@/hooks/useSimulationLoop";
import { TopBar } from "@/components/game/TopBar";
import { StatsPanel } from "@/components/game/StatsPanel";
import { ShopPanel } from "@/components/game/ShopPanel";
import { EventLog } from "@/components/game/EventLog";
import { ControlBar } from "@/components/game/ControlBar";
import { PanelTabs } from "@/components/game/PanelTabs";

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

  useEffect(() => {
    if (!activeAquariumId && aquariums[0]) {
      setActiveAquariumId(aquariums[0].id);
    }
  }, [activeAquariumId, aquariums, setActiveAquariumId]);

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden crt-scanlines">
      <TopBar />

      <div className="flex-1 flex gap-3 px-3 pb-3 overflow-hidden">
        {/* Left: Phaser canvas + control bar */}
        <section className="flex-1 flex flex-col gap-3 min-w-0">
          <div
            className="tank-container flex-1 relative overflow-hidden"
            data-testid="tank-container"
          >
            <PhaserGame aquariumId={activeAquariumId} />
            {/* HUD overlay */}
            <div className="absolute top-2 left-2 z-10 panel-glass px-3 py-1.5 text-[10px] tracking-widest text-cyan-300 uppercase">
              <span className="blink-dot mr-2" />
              Live · Tank #1
            </div>
            <Link
              href="/"
              className="absolute top-2 right-2 z-10 btn btn-ghost py-1.5 px-3 text-[10px]"
              data-testid="back-home-link"
            >
              ← Lobby
            </Link>
          </div>
          <ControlBar />
        </section>

        {/* Right: Dashboard */}
        <aside className="w-[360px] flex flex-col gap-3 min-h-0">
          <PanelTabs />
          <div className="flex-1 overflow-hidden min-h-0">
            {rightPanel === "stats" && <StatsPanel />}
            {rightPanel === "shop" && <ShopPanel />}
            {rightPanel === "log" && <EventLog />}
          </div>
        </aside>
      </div>
    </main>
  );
}
