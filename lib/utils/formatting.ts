import type { CyclePhase, FlowLevel, Mood, EnergyLevel } from '../../types';

export function formatCyclePhase(phase: CyclePhase): string {
  const map: Record<CyclePhase, string> = {
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulation: 'Ovulation',
    luteal: 'Luteal',
  };
  return map[phase];
}

export function formatFlow(flow: FlowLevel | null): string {
  if (!flow) return 'Not logged';
  const map: Record<FlowLevel, string> = {
    none: 'No flow',
    spotting: 'Spotting',
    light: 'Light',
    medium: 'Medium',
    heavy: 'Heavy',
  };
  return map[flow];
}

export function formatEnergy(level: EnergyLevel | null): string {
  if (!level) return 'Not logged';
  const map: Record<EnergyLevel, string> = {
    low: 'Low energy',
    medium: 'Moderate energy',
    high: 'High energy',
  };
  return map[level];
}

export function formatMood(mood: Mood): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1).replace('_', ' ');
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `In ${days} days`;
}

export function formatCycleDays(days: number): string {
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function formatRegularityScore(score: number): string {
  if (score >= 90) return 'Very regular';
  if (score >= 75) return 'Regular';
  if (score >= 60) return 'Somewhat regular';
  if (score >= 40) return 'Irregular';
  return 'Very irregular';
}

export function calculateRegularityScore(cycleLengths: number[]): number {
  if (cycleLengths.length < 2) return 100;
  const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
  const variance =
    cycleLengths.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    cycleLengths.length;
  const stdDev = Math.sqrt(variance);
  // Score decreases with standard deviation; ~3 days = 75, ~7 days = 0
  const score = Math.max(0, Math.min(100, 100 - stdDev * 10));
  return Math.round(score);
}

export function formatTemperature(
  value: number,
  unit: 'celsius' | 'fahrenheit'
): string {
  if (unit === 'fahrenheit') {
    return `${value.toFixed(1)}°F`;
  }
  return `${value.toFixed(1)}°C`;
}

export function formatWeight(value: number, unit: 'kg' | 'lbs'): string {
  return `${value.toFixed(1)} ${unit}`;
}
