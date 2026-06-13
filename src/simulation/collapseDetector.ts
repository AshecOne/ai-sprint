import type { Aquarium, Alert, AlertSeverity } from './types';

function uid(): string {
  return `alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeAlert(
  aquariumId: string,
  parameter: Alert['parameter'],
  severity: AlertSeverity,
  message: string,
  suggestion: string,
  tick: number,
): Alert {
  return { id: uid(), aquariumId, parameter, severity, message, suggestion, triggeredAt: tick, resolved: false };
}

function alreadyActive(
  alerts: Alert[],
  aquariumId: string,
  parameter: Alert['parameter'],
  severity: AlertSeverity,
): boolean {
  return alerts.some(
    a => !a.resolved && a.aquariumId === aquariumId && a.parameter === parameter && a.severity === severity,
  );
}

export function detectAlerts(aquarium: Aquarium, tick: number, activeAlerts: Alert[]): Alert[] {
  const newAlerts: Alert[] = [];
  const { id: aqId, parameters: p, fish } = aquarium;

  function check(
    parameter: Alert['parameter'],
    severity: AlertSeverity,
    triggered: boolean,
    message: string,
    suggestion: string,
  ) {
    if (triggered && !alreadyActive(activeAlerts, aqId, parameter, severity)) {
      newAlerts.push(makeAlert(aqId, parameter, severity, message, suggestion, tick));
    }
  }

  // NH₃
  check('ammonia', 'warning',  p.ammonia > 0.25, `NH₃ elevated (${p.ammonia.toFixed(3)} ppm)`,         'Partial water change. Review stocking levels.');
  check('ammonia', 'danger',   p.ammonia > 0.5,  `NH₃ dangerous (${p.ammonia.toFixed(3)} ppm)`,        '25% water change now. Add ammonia detox.');
  check('ammonia', 'collapse', p.ammonia > 2,    `NH₃ CRITICAL ${p.ammonia.toFixed(3)} ppm — COLLAPSE`, 'Emergency 50% water change. Remove dead fish.');

  // NO₂
  check('nitrite', 'warning',  p.nitrite > 0.5,  `NO₂ elevated (${p.nitrite.toFixed(3)} ppm)`,         'Water change needed. Stop feeding for 24 h.');
  check('nitrite', 'danger',   p.nitrite > 1,    `NO₂ dangerous (${p.nitrite.toFixed(3)} ppm)`,        '30% water change. Add bacterial supplement.');
  check('nitrite', 'collapse', p.nitrite > 5,    `NO₂ CRITICAL ${p.nitrite.toFixed(3)} ppm — COLLAPSE`, 'Emergency 50% water change immediately.');

  // O₂
  check('dissolvedOxygen', 'warning',  p.dissolvedOxygen < 5, `O₂ low (${p.dissolvedOxygen.toFixed(2)} mg/L)`,       'Add air stone or powerhead.');
  check('dissolvedOxygen', 'danger',   p.dissolvedOxygen < 3, `O₂ critical (${p.dissolvedOxygen.toFixed(2)} mg/L)`,  'Immediate surface agitation. Reduce CO₂.');
  check('dissolvedOxygen', 'collapse', p.dissolvedOxygen < 1, `O₂ DEPLETED (${p.dissolvedOxygen.toFixed(2)} mg/L)`, 'Emergency aeration. Stop CO₂ injection now.');

  // pH
  check('ph', 'warning',  p.ph < 6.5 || p.ph > 8.0, `pH out of range (${p.ph.toFixed(2)})`,          'Reduce ammonia. Add KH buffer if needed.');
  check('ph', 'danger',   p.ph < 6.0 || p.ph > 8.5, `pH dangerous (${p.ph.toFixed(2)})`,             'Water change + KH buffer immediately.');
  check('ph', 'collapse', p.ph < 5.5 || p.ph > 9.0, `pH EXTREME (${p.ph.toFixed(2)}) — TOXIC`,       'Large water change + buffer. Fish dying.');

  // NO₃
  check('nitrate', 'warning',  p.nitrate > 20, `NO₃ elevated (${p.nitrate.toFixed(1)} ppm)`,         'Partial water change. Add more plants.');
  check('nitrate', 'danger',   p.nitrate > 40, `NO₃ high (${p.nitrate.toFixed(1)} ppm)`,             '30% water change. Add fast-growing plants.');
  check('nitrate', 'collapse', p.nitrate > 80, `NO₃ CRITICAL (${p.nitrate.toFixed(1)} ppm)`,         'Emergency 50% water change. Reduce feeding.');

  // Temperature (baseline optimal 25 °C for starter tank)
  const tempDiff = Math.abs(p.temperature - 25);
  check('temperature', 'warning',  tempDiff > 3, `Temperature off (${p.temperature.toFixed(1)} °C)`,          'Check heater settings.');
  check('temperature', 'danger',   tempDiff > 5, `Temperature dangerous (${p.temperature.toFixed(1)} °C)`,    'Adjust heater immediately.');
  check('temperature', 'collapse', tempDiff > 8, `Temperature CRITICAL (${p.temperature.toFixed(1)} °C)`,     'Emergency temperature correction.');

  // Turbidity
  check('turbidity', 'warning',  p.turbidity > 5,  `Turbidity elevated (${p.turbidity.toFixed(1)} NTU)`,   'Clean filter media. Siphon substrate.');
  check('turbidity', 'danger',   p.turbidity > 15, `Turbidity high (${p.turbidity.toFixed(1)} NTU)`,       'Clean/upgrade filter. Water change.');
  check('turbidity', 'collapse', p.turbidity > 30, `Turbidity CRITICAL (${p.turbidity.toFixed(1)} NTU)`,   'Emergency filtration. Remove dead fish.');

  // Fish death
  for (const f of fish) {
    if (!f.alive) {
      const alreadyDead = activeAlerts.some(
        a => !a.resolved && a.parameter === 'fish_death' && a.message.includes(f.id),
      );
      if (!alreadyDead) {
        newAlerts.push(
          makeAlert(aqId, 'fish_death', 'danger',
            `[${f.id}] ${f.commonName} has died`,
            'Remove the dead fish immediately to prevent NH₃ spikes.',
            tick),
        );
      }
    }
  }

  return newAlerts;
}
