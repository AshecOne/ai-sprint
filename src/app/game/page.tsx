'use client';

import { useEffect } from 'react';

function RotateOverlay() {
  return (
    <div className="rotate-overlay fixed inset-0 z-50 flex-col items-center justify-center bg-slate-900 text-white">
      <div className="text-7xl mb-6 select-none" style={{ transform: 'rotate(90deg)' }}>
        &#x21BB;
      </div>
      <p className="text-2xl font-semibold tracking-tight">Rotate your device</p>
      <p className="mt-2 text-sm text-slate-400">Aquarium Simulator requires landscape orientation</p>
    </div>
  );
}

export default function GamePage() {
  useEffect(() => {
    // Attempt to lock orientation to landscape on supporting browsers.
    // Most mobile browsers require a user gesture first; this covers PWA installs.
    // ScreenOrientation.lock is not in the standard TS lib but is available
    // in Chromium-based browsers and PWA contexts.
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    orientation?.lock?.('landscape').catch(() => {
      // Lock denied (not PWA / no permission) — CSS overlay handles it.
    });
  }, []);

  return (
    <>
      <RotateOverlay />

      <div className="game-layout">
        {/* ── Tank View ─────────────────────────────────── */}
        <div className="tank-container">
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500">
            <div className="text-center">
              <div className="mb-3 text-4xl">🐠</div>
              <p className="text-sm font-mono">Phaser canvas — coming in Phase 1.4</p>
            </div>
          </div>
        </div>

        {/* ── Dashboard ─────────────────────────────────── */}
        <div className="dashboard-container">
          <div className="border-b border-slate-700 px-4 py-3">
            <h1 className="text-sm font-semibold uppercase tracking-widest text-slate-300">
              Aquarium Simulator
            </h1>
          </div>

          <div className="p-4 space-y-4">
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Water Parameters
              </h2>
              <ul className="space-y-1 text-xs text-slate-400">
                {[
                  { label: 'O₂', value: '7.5 mg/L', ok: true },
                  { label: 'pH', value: '7.0', ok: true },
                  { label: 'NH₃', value: '0.00 ppm', ok: true },
                  { label: 'NO₂', value: '0.00 ppm', ok: true },
                  { label: 'NO₃', value: '5 ppm', ok: true },
                  { label: 'CO₂', value: '15 ppm', ok: true },
                  { label: 'Temp', value: '25 °C', ok: true },
                  { label: 'KH', value: '6 dKH', ok: true },
                  { label: 'GH', value: '8 dGH', ok: true },
                  { label: 'Turbidity', value: '1 NTU', ok: true },
                ].map(({ label, value, ok }) => (
                  <li key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className={ok ? 'text-emerald-400' : 'text-amber-400'}>{value}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Inhabitants
              </h2>
              <p className="text-xs text-slate-600 italic">No fish yet — add some in Phase 2.</p>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Alerts
              </h2>
              <p className="text-xs text-emerald-600">All parameters nominal.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
