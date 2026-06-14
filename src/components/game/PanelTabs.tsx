"use client";

import { useGameStore } from "@/store/gameStore";
import { BarChart3, ShoppingBag, ScrollText } from "lucide-react";

const TABS = [
  { id: "stats" as const, label: "Stats", icon: BarChart3 },
  { id: "shop" as const, label: "Shop", icon: ShoppingBag },
  { id: "log" as const, label: "Log", icon: ScrollText },
];

export function PanelTabs() {
  const active = useGameStore((s) => s.rightPanel);
  const setActive = useGameStore((s) => s.setRightPanel);
  return (
    <div className="flex items-stretch gap-1 p-1 panel" data-testid="panel-tabs">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => setActive(id)}
            data-testid={`tab-${id}`}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[11px] uppercase tracking-widest font-semibold transition-colors ${
              isActive
                ? "bg-cyan-400/15 text-cyan-200 border border-cyan-400/40"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
