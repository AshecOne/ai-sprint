"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Clock, Skull, ArrowRight } from "lucide-react";
import type { AwaySummary } from "@/simulation/offline";

/** "2h 13m", "13m", "<1m" — compact human duration from seconds. */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return "<1m";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

interface StatRowProps {
  label: string;
  before: number;
  after: number;
  /** Decimals to show. */
  digits?: number;
  /** Which direction is "bad" — colours the delta. */
  badDirection?: "up" | "down";
}

function StatRow({ label, before, after, digits = 0, badDirection }: StatRowProps) {
  const delta = after - before;
  const changed = Math.abs(delta) >= (digits === 0 ? 0.5 : 0.05);
  const bad =
    changed &&
    badDirection &&
    ((badDirection === "up" && delta > 0) || (badDirection === "down" && delta < 0));
  const color = !changed ? "#94a3b8" : bad ? "#fca5a5" : "#6ee7b7";
  return (
    <div className="flex items-center justify-between text-[12px] py-1.5 border-b border-white/5 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="flex items-center gap-1.5 font-mono" style={{ color }}>
        <span className="text-slate-500">{before.toFixed(digits)}</span>
        <ArrowRight size={11} className="text-slate-600" aria-hidden="true" />
        <span>{after.toFixed(digits)}</span>
      </span>
    </div>
  );
}

interface Props {
  summary: AwaySummary;
  onClose: () => void;
}

/**
 * "While you were away…" recap shown on load after the sim has been
 * fast-forwarded over the time the tab was closed (issue #34). Same portal +
 * inline-layout + reuse-.panel/.btn pattern as ConfirmDialog.
 */
export function WhileYouWereAway({ summary, onClose }: Props) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const id = window.requestAnimationFrame(() => okRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(id);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const { deaths } = summary;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(3, 8, 14, 0.6)",
        backdropFilter: "blur(2px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="panel"
        style={{ width: "100%", maxWidth: 380, padding: 18 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="away-title"
        data-testid="away-modal"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <span className="inline-flex" style={{ color: "var(--accent-cyan)" }} aria-hidden="true">
            <Clock size={18} strokeWidth={2.5} />
          </span>
          <h2 id="away-title" className="section-title" style={{ margin: 0 }}>
            While you were away…
          </h2>
        </div>

        <p className="text-[12px] text-slate-400" style={{ margin: "0 0 12px" }}>
          Your tank kept running for{" "}
          <strong className="text-slate-200">{formatDuration(summary.awaySeconds)}</strong>
          {summary.capped && (
            <span className="text-slate-500"> (simulated up to the 8h cap)</span>
          )}
          .
        </p>

        {deaths > 0 && (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 mb-3 text-[12px]"
            style={{ background: "rgba(248,113,113,0.12)", color: "#fca5a5" }}
          >
            <Skull size={15} strokeWidth={2.5} aria-hidden="true" />
            <span>
              {deaths} fish {deaths === 1 ? "died" : "died"} while you were gone.
              {summary.aliveAfter > 0
                ? ` ${summary.aliveAfter} still alive.`
                : " The tank is empty."}
            </span>
          </div>
        )}

        <div className="mt-1">
          <StatRow
            label="Fish alive"
            before={summary.aliveBefore}
            after={summary.aliveAfter}
            badDirection="down"
          />
          <StatRow
            label="Avg hunger"
            before={summary.avgHungerBefore}
            after={summary.avgHungerAfter}
            badDirection="up"
          />
          <StatRow
            label="Nitrate (NO₃)"
            before={summary.nitrateBefore}
            after={summary.nitrateAfter}
            digits={1}
            badDirection="up"
          />
          <StatRow
            label="Ammonia (NH₃)"
            before={summary.ammoniaBefore}
            after={summary.ammoniaAfter}
            digits={2}
            badDirection="up"
          />
          <StatRow
            label="Cleanliness"
            before={summary.cleanlinessBefore}
            after={summary.cleanlinessAfter}
            badDirection="down"
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            ref={okRef}
            type="button"
            className="btn btn-emerald"
            onClick={onClose}
            data-testid="away-dismiss"
          >
            {deaths > 0 ? "Got it" : "Welcome back"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
