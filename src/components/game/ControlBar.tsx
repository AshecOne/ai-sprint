"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAquariumStore } from "@/store/aquariumStore";
import { useGameStore } from "@/store/gameStore";
import { useConfirm } from "@/components/game/ConfirmProvider";
import { cleanReward } from "@/simulation/engine";
import { useFullscreen } from "@/hooks/useFullscreen";
import { audio } from "@/audio/engine";
import {
  Cookie,
  RefreshCw,
  Trash2,
  Sparkles,
  MoreHorizontal,
  Home,
  Maximize,
  Minimize,
  Move,
} from "lucide-react";

export function ControlBar({ floating = false }: { floating?: boolean }) {
  const feed = useAquariumStore((s) => s.feedFish);
  const clean = useAquariumStore((s) => s.cleanTank);
  const resetTank = useAquariumStore((s) => s.resetTank);
  const removeDead = useAquariumStore((s) => s.removeDeadFish);
  const dead = useAquariumStore((s) => s.fish.filter((f) => !f.alive).length);
  const aliveCount = useAquariumStore((s) => s.fish.filter((f) => f.alive).length);
  const water = useAquariumStore((s) => s.aquariums[0]?.water);
  const cleanReadyAt = useAquariumStore((s) => s.cleanReadyAt);
  const estReward = water ? cleanReward(water, aliveCount) : 0;
  const confirm = useConfirm();
  const editMode = useGameStore((s) => s.editMode);
  const setEditMode = useGameStore((s) => s.setEditMode);
  const { isSupported: fsSupported, isFullscreen, toggle: toggleFullscreen } =
    useFullscreen();

  // Tick once a second so the cooldown countdown stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const cooldownLeft = Math.max(0, Math.ceil((cleanReadyAt - now) / 1000));
  const onCooldown = cooldownLeft > 0;
  const cooldownLabel = `${Math.floor(cooldownLeft / 60)}:${String(
    cooldownLeft % 60
  ).padStart(2, "0")}`;

  // Overflow menu (rare actions live here to keep the bar uncluttered).
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  return (
    <div
      className={
        floating
          ? "control-floating flex items-center justify-between gap-3"
          : "panel flex items-center justify-between gap-3 px-3 py-2"
      }
      data-testid="control-bar"
    >
      {/* Primary actions — the two things players do most. Hidden while
          arranging decor: the edit banner's "Selesai" handles exit, so the
          tank stays uncluttered and stray taps can't feed/clean mid-edit. */}
      {!editMode && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              feed(35);
              audio.play("feed");
            }}
            className="btn btn-amber btn-lg"
            data-testid="feed-fish-button"
          >
            <Cookie size={15} strokeWidth={2.5} />
            Feed
          </button>
          <button
            onClick={() => {
              clean();
              audio.play("clean");
              // A payout means detritus was sold — chime the coin too.
              if (estReward > 0) audio.play("coin");
            }}
            disabled={onCooldown}
            className={`btn btn-emerald btn-lg ${onCooldown ? "opacity-50 cursor-not-allowed" : ""}`}
            data-testid="clean-tank-button"
            title={
              onCooldown
                ? `Clean recharging — ready in ${cooldownLabel}`
                : estReward > 0
                ? `Scrub the tank and sell ~$${estReward} of detritus`
                : aliveCount === 0
                ? "No living fish to care for — cleaning pays nothing"
                : "Tank is clean — nothing to sell yet"
            }
          >
            <Sparkles size={15} strokeWidth={2.5} />
            {onCooldown
              ? `Clean ${cooldownLabel}`
              : `Clean${estReward > 0 ? ` (+$${estReward})` : ""}`}
          </button>
        </div>
      )}

      {/* Contextual + rare actions */}
      <div className="flex items-center gap-2 ml-auto">
        {!editMode && dead > 0 && (
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Net dead fish?",
                message: `Scoop out ${dead} deceased fish? They'll be gone for good.`,
                confirmLabel: "Net them",
                tone: "danger",
              });
              if (ok) removeDead();
            }}
            className="btn btn-danger"
            data-testid="remove-dead-button"
          >
            <Trash2 size={13} strokeWidth={2.5} />
            Net ({dead})
          </button>
        )}

        {!editMode && (
          <button
            onClick={() => {
              setEditMode(true);
              audio.play("toggle");
            }}
            className="btn btn-ghost"
            data-testid="edit-mode-toggle"
            title="Arrange & remove decor"
          >
            <Move size={14} strokeWidth={2.5} />
            Arrange
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="btn btn-ghost"
            data-testid="control-overflow"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="More"
          >
            <MoreHorizontal size={16} strokeWidth={2.5} />
          </button>
          {menuOpen && (
            <div className="hud-menu" role="menu">
              <Link
                href="/"
                className="hud-menu-item"
                data-testid="back-home-link"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Home size={14} />
                Lobby
              </Link>
              {fsSupported && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    toggleFullscreen();
                  }}
                  className="hud-menu-item"
                  data-testid="fullscreen-toggle"
                  role="menuitem"
                >
                  {isFullscreen ? (
                    <Minimize size={14} />
                  ) : (
                    <Maximize size={14} />
                  )}
                  {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                </button>
              )}
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  const ok = await confirm({
                    title: "Reset the tank?",
                    message:
                      "This wipes your fish, plants, gear, and cash back to a fresh starter tank. You'll lose all progress.",
                    confirmLabel: "Reset everything",
                    tone: "danger",
                  });
                  if (ok) resetTank();
                }}
                className="hud-menu-item hud-menu-item--danger"
                data-testid="reset-tank-button"
                role="menuitem"
              >
                <RefreshCw size={14} />
                Reset tank
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
