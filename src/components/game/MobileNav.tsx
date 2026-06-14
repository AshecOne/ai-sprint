"use client";

import { useGameStore } from "@/store/gameStore";
import { Fish, BarChart3, ShoppingBag, ScrollText } from "lucide-react";

const ITEMS = [
  { id: "tank" as const, label: "Tank", icon: Fish },
  { id: "stats" as const, label: "Stats", icon: BarChart3 },
  { id: "shop" as const, label: "Shop", icon: ShoppingBag },
  { id: "log" as const, label: "Log", icon: ScrollText },
];

/** Bottom tab bar — mobile-only single-focus navigation. */
export function MobileNav() {
  const view = useGameStore((s) => s.mobileView);
  const setView = useGameStore((s) => s.setMobileView);
  return (
    <nav className="mobile-nav mobile-only" data-testid="mobile-nav">
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            data-testid={`mobile-tab-${id}`}
            className={`mobile-nav__item ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
