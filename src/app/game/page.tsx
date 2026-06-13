'use client';

import { useEffect } from 'react';
import { useAquariumStore } from '@/store/aquariumStore';
import { useGameStore } from '@/store/gameStore';
import { useAlertStore, SEVERITY_ORDER } from '@/store/alertStore';
import { getGameLoop } from '@/simulation/gameLoop';
import { tickAquarium } from '@/simulation/engine';
import { detectAlerts } from '@/simulation/collapseDetector';
import { createAquarium, createFish, createPlant, createEquipment } from '@/simulation/factory';
import type { GameSpeed, WaterParameters } from '@/simulation/types';

// ── Colour helpers ────────────────────────────────────────────────────────────

type ParamStatus = 'safe' | 'warning' | 'danger';

function nh3Status(v: number): ParamStatus {
  if (v > 0.5) return 'danger';
  if (v > 0.25) return 'warning';
  return 'safe';
}
function no2Status(v: number): ParamStatus {
  if (v > 1) return 'danger';
  if (v > 0.5) return 'warning';
  return 'safe';
}
function o2Status(v: number): ParamStatus {
  if (v < 3) return 'danger';
  if (v < 5) return 'warning';
  return 'safe';
}
function phStatus(v: number): ParamStatus {
  if (v < 6.0 || v > 8.5) return 'danger';
  if (v < 6.5 || v > 8.0) return 'warning';
  return 'safe';
}
function no3Status(v: number): ParamStatus {
  if (v > 40) return 'danger';
  if (v > 20) return 'warning';
  return 'safe';
}
function tempStatus(v: number): ParamStatus {
  const d = Math.abs(v - 25);
  if (d > 5) return 'danger';
  if (d > 3) return 'warning';
  return 'safe';
}
function turbidityStatus(v: number): ParamStatus {
  if (v > 15) return 'danger';
  if (v > 5) return 'warning';
  return 'safe';
}
function co2Status(v: number): ParamStatus {
  if (v > 50 || v < 5) return 'danger';
  if (v > 35 || v < 10) return 'warning';
  return 'safe';
}

function statusClass(s: ParamStatus): string {
  if (s === 'danger') return 'text-red-400';
  if (s === 'warning') return 'text-amber-400';
  return 'text-emerald-400';
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

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

interface ParamRowProps {
  label: string;
  value: string;
  status: ParamStatus;
}

function ParamRow({ label, value, status }: ParamRowProps) {
  return (
    <li className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={statusClass(status)}>{value}</span>
    </li>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function buildStarterAquarium() {
  const tank = createAquarium('Starter Tank', 60, 40, 35);
  tank.bacteriaLevel = 15;
  tank.parameters.ammonia = 0;
  tank.parameters.nitrate = 5;

  tank.equipment.push(createEquipment('hob_filter_s'));
  tank.equipment.push(createEquipment('heater_100w'));
  tank.equipment.push(createEquipment('air_stone'));

  tank.fish.push(createFish('guppy', { x: 0.3, y: 0.5 }));
  tank.fish.push(createFish('guppy', { x: 0.5, y: 0.4 }));
  tank.fish.push(createFish('guppy', { x: 0.7, y: 0.6 }));

  tank.plants.push(createPlant('java_fern', { x: 0.2, y: 0.9 }));
  tank.plants.push(createPlant('anubias',   { x: 0.8, y: 0.9 }));

  return tank;
}

export default function GamePage() {
  const aquariums         = useAquariumStore(s => s.aquariums);
  const addAquarium       = useAquariumStore(s => s.addAquarium);
  const updateParameters  = useAquariumStore(s => s.updateParameters);
  const updateFish        = useAquariumStore(s => s.updateFish);
  const updatePlant       = useAquariumStore(s => s.updatePlant);
  const updateBacteria    = useAquariumStore(s => s.updateBacteria);
  const recordHistory     = useAquariumStore(s => s.recordParameterHistory);

  const tick              = useGameStore(s => s.tick);
  const speed             = useGameStore(s => s.speed);
  const paused            = useGameStore(s => s.paused);
  const activeAquariumId  = useGameStore(s => s.activeAquariumId);
  const setTick           = useGameStore(s => s.setTick);
  const setSpeed          = useGameStore(s => s.setSpeed);
  const togglePause       = useGameStore(s => s.togglePause);
  const setActiveAquarium = useGameStore(s => s.setActiveAquarium);

  const alerts            = useAlertStore(s => s.alerts);
  const addAlert          = useAlertStore(s => s.addAlert);

  // Bootstrap starter tank on first mount
  useEffect(() => {
    if (aquariums.length > 0) return;
    const tank = buildStarterAquarium();
    addAquarium(tank);
    setActiveAquarium(tank.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Orientation lock (best-effort, PWA only)
  useEffect(() => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation?.lock?.('landscape').catch(() => undefined);
  }, []);

  // Game loop subscription
  useEffect(() => {
    const loop = getGameLoop();
    loop.start();

    const unsub = loop.subscribe((currentTick) => {
      const { aquariums: aq } = useAquariumStore.getState();
      const { activeAquariumId: aqId } = useGameStore.getState();
      const aquarium = aq.find(a => a.id === aqId);
      if (!aquarium) return;

      const result = tickAquarium(aquarium, currentTick);

      updateParameters(aquarium.id, result.parameters);
      updateBacteria(aquarium.id, result.newBacteriaLevel);

      for (const fu of result.fishUpdates) {
        updateFish(aquarium.id, fu.fishId, { stress: fu.newStress, alive: fu.alive });
      }
      for (const pu of result.plantUpdates) {
        updatePlant(aquarium.id, pu.plantId, { health: pu.newHealth });
      }

      if (currentTick % 24 === 0) {
        recordHistory(aquarium.id, currentTick);
      }

      // Build updated snapshot for alert detection
      const updatedAquarium = {
        ...aquarium,
        parameters: { ...aquarium.parameters, ...result.parameters } as WaterParameters,
        fish: aquarium.fish.map(f => {
          const fu = result.fishUpdates.find(u => u.fishId === f.id);
          return fu ? { ...f, stress: fu.newStress, alive: fu.alive } : f;
        }),
      };

      const { alerts: currentAlerts } = useAlertStore.getState();
      const newAlerts = detectAlerts(updatedAquarium, currentTick, currentAlerts);
      newAlerts.forEach(a => addAlert(a));

      setTick(currentTick);
    });

    return () => {
      unsub();
      loop.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync pause / speed to loop
  useEffect(() => {
    const loop = getGameLoop();
    if (paused) loop.pause(); else loop.resume();
  }, [paused]);

  useEffect(() => {
    getGameLoop().setSpeed(speed);
  }, [speed]);

  // Active aquarium data
  const aquarium = aquariums.find(a => a.id === activeAquariumId);
  const p = aquarium?.parameters;

  const activeAlerts = alerts
    .filter(a => !a.resolved && a.aquariumId === activeAquariumId)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const inGameDay  = Math.floor(tick / (24 * 24)) + 1;
  const inGameHour = Math.floor((tick % (24 * 24)) / 24);

  return (
    <>
      <RotateOverlay />

      <div className="game-layout">
        {/* ── Tank View ─────────────────────────────────── */}
        <div className="tank-container">
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500">
            <div className="text-center">
              <div className="mb-3 text-4xl">🐠</div>
              <p className="text-sm font-mono">Phaser canvas — Phase 3</p>
              {aquarium && (
                <p className="mt-2 text-xs text-slate-600">
                  {aquarium.name} · {aquarium.dimensions.volumeLiters.toFixed(0)} L ·
                  bacteria {aquarium.bacteriaLevel.toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Dashboard ─────────────────────────────────── */}
        <div className="dashboard-container">
          {/* Header */}
          <div className="border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <h1 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
              Aquarium Simulator
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              Day {inGameDay} · {String(inGameHour).padStart(2, '0')}:00
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Speed controls */}
            <section className="flex items-center gap-2">
              <button
                onClick={togglePause}
                className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                {paused ? '▶ Play' : '⏸ Pause'}
              </button>
              {([1, 5, 60] as GameSpeed[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-xs rounded ${
                    speed === s && !paused
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </section>

            {/* Water Parameters */}
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Water Parameters
              </h2>
              {p ? (
                <ul className="space-y-1 text-xs">
                  <ParamRow label="O₂"       value={`${p.dissolvedOxygen.toFixed(2)} mg/L`} status={o2Status(p.dissolvedOxygen)} />
                  <ParamRow label="pH"        value={p.ph.toFixed(2)}                        status={phStatus(p.ph)} />
                  <ParamRow label="NH₃"       value={`${p.ammonia.toFixed(4)} ppm`}          status={nh3Status(p.ammonia)} />
                  <ParamRow label="NO₂"       value={`${p.nitrite.toFixed(4)} ppm`}          status={no2Status(p.nitrite)} />
                  <ParamRow label="NO₃"       value={`${p.nitrate.toFixed(2)} ppm`}          status={no3Status(p.nitrate)} />
                  <ParamRow label="CO₂"       value={`${p.co2.toFixed(1)} ppm`}              status={co2Status(p.co2)} />
                  <ParamRow label="Temp"      value={`${p.temperature.toFixed(1)} °C`}       status={tempStatus(p.temperature)} />
                  <ParamRow label="KH"        value={`${p.kh.toFixed(1)} dKH`}               status="safe" />
                  <ParamRow label="GH"        value={`${p.gh.toFixed(1)} dGH`}               status="safe" />
                  <ParamRow label="Turbidity" value={`${p.turbidity.toFixed(2)} NTU`}        status={turbidityStatus(p.turbidity)} />
                </ul>
              ) : (
                <p className="text-xs text-slate-600 italic">No active aquarium.</p>
              )}
            </section>

            {/* Inhabitants */}
            {aquarium && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Inhabitants
                </h2>
                <ul className="space-y-1 text-xs">
                  {aquarium.fish.map(f => (
                    <li key={f.id} className="flex justify-between">
                      <span className={f.alive ? 'text-slate-400' : 'text-slate-600 line-through'}>
                        {f.commonName}
                      </span>
                      <span className={
                        !f.alive ? 'text-slate-600' :
                        f.stress > 60 ? 'text-red-400' :
                        f.stress > 30 ? 'text-amber-400' :
                        'text-emerald-400'
                      }>
                        {f.alive ? `stress ${f.stress.toFixed(0)}` : 'dead'}
                      </span>
                    </li>
                  ))}
                  {aquarium.plants.map(pl => (
                    <li key={pl.id} className="flex justify-between">
                      <span className="text-slate-500">🌿 {pl.commonName}</span>
                      <span className={pl.health < 50 ? 'text-amber-400' : 'text-emerald-400'}>
                        {pl.health.toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Alerts */}
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Alerts
              </h2>
              {activeAlerts.length === 0 ? (
                <p className="text-xs text-emerald-600">All parameters nominal.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {activeAlerts.slice(0, 8).map(a => (
                    <li key={a.id} className={`rounded p-2 ${
                      a.severity === 'collapse' ? 'bg-red-950 border border-red-700' :
                      a.severity === 'danger'   ? 'bg-orange-950 border border-orange-700' :
                                                  'bg-amber-950 border border-amber-700'
                    }`}>
                      <p className={`font-semibold ${
                        a.severity === 'collapse' ? 'text-red-400' :
                        a.severity === 'danger'   ? 'text-orange-400' :
                                                    'text-amber-400'
                      }`}>
                        {a.severity.toUpperCase()} — {a.message}
                      </p>
                      <p className="mt-0.5 text-slate-400">{a.suggestion}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
