import { create } from 'zustand';
import type { Alert, AlertSeverity } from '@/simulation/types';

interface AlertStoreState {
  alerts: Alert[];
}

interface AlertStoreActions {
  addAlert: (alert: Alert) => void;
  resolveAlert: (alertId: string) => void;
  resolveByParameter: (aquariumId: string, parameter: Alert['parameter']) => void;
  clearResolved: () => void;
}

export const useAlertStore = create<AlertStoreState & AlertStoreActions>((set) => ({
  alerts: [],

  addAlert: (alert) =>
    set((s) => ({ alerts: [...s.alerts, alert] })),

  resolveAlert: (alertId) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
    })),

  resolveByParameter: (aquariumId, parameter) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.aquariumId === aquariumId && a.parameter === parameter
          ? { ...a, resolved: true }
          : a
      ),
    })),

  clearResolved: () =>
    set((s) => ({ alerts: s.alerts.filter((a) => !a.resolved) })),
}));

/** Severity order for sorting the alert feed (collapse first). */
export const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  collapse: 0,
  danger: 1,
  warning: 2,
};
