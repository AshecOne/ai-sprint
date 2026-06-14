"use client";

import { useAquariumStore } from "@/store/aquariumStore";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";

const ICONS = {
  info: <Info size={12} className="text-cyan-300" />,
  warn: <AlertTriangle size={12} className="text-amber-300" />,
  danger: <AlertCircle size={12} className="text-red-300" />,
  success: <CheckCircle2 size={12} className="text-emerald-300" />,
};

export function EventLog() {
  const events = useAquariumStore((s) => s.events);
  const clear = useAquariumStore((s) => s.clearEvents);
  return (
    <div className="h-full panel p-3 flex flex-col" data-testid="event-log">
      <header className="flex items-center justify-between mb-2">
        <span className="section-title">Event Log</span>
        <button
          onClick={() => clear()}
          className="btn btn-ghost py-1 px-2 text-[10px]"
          data-testid="clear-log-button"
        >
          <Trash2 size={10} /> Clear
        </button>
      </header>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {events.length === 0 && (
          <div className="text-xs text-slate-500 italic">No events yet.</div>
        )}
        {events.map((evt) => (
          <div
            key={evt.id}
            data-testid={`event-${evt.severity}`}
            className="flex items-start gap-2 px-2 py-1.5 rounded bg-white/[0.02] text-[11px]"
          >
            <span className="mt-0.5">{ICONS[evt.severity]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-slate-200 leading-snug">{evt.message}</div>
              <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest">
                {new Date(evt.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
