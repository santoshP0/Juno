import {
  addDays,
  differenceInDays,
  parseISO,
  format,
  isBefore,
  isAfter,
  isEqual,
} from 'date-fns';
import type { Cycle, CyclePrediction, CyclePhase } from '../../types';

const MAX_HISTORY = 6;
const LUTEAL_PHASE_LENGTH = 14;

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return (
    (isAfter(date, start) || isEqual(date, start)) &&
    (isBefore(date, end) || isEqual(date, end))
  );
}

function calcStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calcPregnancyChance(
  today: Date,
  fertileStart: Date,
  fertileEnd: Date
): { label: CyclePrediction['pregnancyChance']; score: number } {
  if (!isDateInRange(today, fertileStart, fertileEnd)) return { label: 'very_low', score: 0.05 };
  
  const daysBefore = differenceInDays(fertileEnd, today);
  
  // fertileEnd is ovulationDay + 1
  if (daysBefore <= 0) return { label: 'low', score: 0.15 }; // Day after ovulation
  if (daysBefore === 1) return { label: 'very_high', score: 0.95 }; // Ovulation day (peak)
  if (daysBefore === 2) return { label: 'high', score: 0.8 }; // 1 day before
  if (daysBefore === 3) return { label: 'high', score: 0.65 }; // 2 days before
  if (daysBefore === 4) return { label: 'medium', score: 0.45 }; // 3 days before
  if (daysBefore === 5) return { label: 'medium', score: 0.3 }; // 4 days before
  return { label: 'low', score: 0.2 }; // 5 days before
}

export function calculatePredictions(
  cycles: Cycle[],
  defaultCycleLength = 28,
  defaultPeriodLength = 5,
  bbtReadings?: { date: string; value: number }[]
): CyclePrediction {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort cycles newest-first
  const sorted = [...cycles].sort(
    (a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
  );

  // Derive avg cycle and period lengths from last MAX_HISTORY completed cycles
  const completed = sorted
    .filter((c) => c.length && c.length > 10 && c.length < 60)
    .slice(0, MAX_HISTORY);

  let avgCycleLength = defaultCycleLength;
  let avgPeriodLength = defaultPeriodLength;
  let confidenceDays = 3;

  if (completed.length > 0) {
    const cycleLengths = completed.map((c) => c.length!);
    avgCycleLength = Math.round(
      cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
    );

    const periodLengths = completed
      .filter((c) => c.periodLength && c.periodLength > 0)
      .map((c) => c.periodLength!);
    if (periodLengths.length > 0) {
      avgPeriodLength = Math.round(
        periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
      );
    }

    // Confidence: higher variance = wider range
    const stdDev = calcStdDev(cycleLengths);
    confidenceDays = Math.max(1, Math.min(7, Math.round(stdDev)));
  }

  // Current cycle start (most recent period start)
  const latestCycle = sorted[0];
  const currentCycleStart = latestCycle ? parseISO(latestCycle.startDate) : today;

  const currentCycleDay = Math.max(
    1,
    differenceInDays(today, currentCycleStart) + 1
  );

  // Ovulation relative to next period (luteal phase is fixed ~14 days)
  const nextPeriodStart = addDays(currentCycleStart, avgCycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriodLength - 1);
  const ovulationDay = addDays(nextPeriodStart, -LUTEAL_PHASE_LENGTH);

  // If BBT data is available, refine ovulation estimate by finding the temp shift
  let ovulationOffset = 0;
  if (bbtReadings && bbtReadings.length >= 5) {
    const readings = [...bbtReadings]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20); // last 20 readings

    const avg = readings.reduce((s, r) => s + r.value, 0) / readings.length;
    const riseIdx = readings.findIndex((r, i) => {
      if (i < 2) return false;
      const pre = readings.slice(0, i).reduce((s, r) => s + r.value, 0) / i;
      return r.value > pre + 0.2;
    });
    if (riseIdx >= 0) {
      const shiftDate = parseISO(readings[riseIdx].date);
      ovulationOffset = differenceInDays(shiftDate, ovulationDay);
    }
  }

  const refinedOvulation = addDays(ovulationDay, ovulationOffset);
  const fertileWindowStart = addDays(refinedOvulation, -5);
  const fertileWindowEnd = addDays(refinedOvulation, 1);
  const pmsWindowStart = addDays(nextPeriodStart, -5);
  const daysUntilNextPeriod = differenceInDays(nextPeriodStart, today);

  // Determine current cycle phase
  let currentPhase: CyclePhase;
  const periodEnd = addDays(currentCycleStart, avgPeriodLength - 1);
  const ovulationInCurrentCycle = addDays(currentCycleStart, avgCycleLength - LUTEAL_PHASE_LENGTH);
  const fertileStart = addDays(ovulationInCurrentCycle, -5);
  const fertileEnd = addDays(ovulationInCurrentCycle, 1);

  if (isDateInRange(today, currentCycleStart, periodEnd)) {
    currentPhase = 'menstrual';
  } else if (isDateInRange(today, fertileStart, fertileEnd)) {
    currentPhase = 'ovulation';
  } else if (isBefore(today, ovulationInCurrentCycle)) {
    currentPhase = 'follicular';
  } else {
    currentPhase = 'luteal';
  }

  const chanceResult = calcPregnancyChance(today, fertileStart, fertileEnd);

  return {
    nextPeriodStart: format(nextPeriodStart, 'yyyy-MM-dd'),
    nextPeriodEnd: format(nextPeriodEnd, 'yyyy-MM-dd'),
    fertileWindowStart: format(fertileWindowStart, 'yyyy-MM-dd'),
    fertileWindowEnd: format(fertileWindowEnd, 'yyyy-MM-dd'),
    ovulationDay: format(refinedOvulation, 'yyyy-MM-dd'),
    pmsWindowStart: format(pmsWindowStart, 'yyyy-MM-dd'),
    confidenceDays,
    currentPhase,
    currentCycleDay,
    daysUntilNextPeriod,
    avgCycleLength,
    pregnancyChance: chanceResult.label,
    pregnancyChanceScore: chanceResult.score,
  };
}

/**
 * Build a map of date → DayStatus[] for rendering the calendar.
 */
export function buildCalendarMap(
  cycles: Cycle[],
  logs: { date: string }[],
  prediction: CyclePrediction,
  monthStart: Date,
  monthEnd: Date
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  const today = format(new Date(), 'yyyy-MM-dd');

  const addStatus = (date: string, status: string) => {
    if (!map[date]) map[date] = [];
    if (!map[date].includes(status)) map[date].push(status);
  };

  // Logged period days from cycles
  cycles.forEach((cycle) => {
    const start = parseISO(cycle.startDate);
    const periodDays = cycle.periodLength ?? 5;
    for (let i = 0; i < periodDays; i++) {
      const d = format(addDays(start, i), 'yyyy-MM-dd');
      addStatus(d, 'period');
    }
  });

  // Predicted period
  const predStart = parseISO(prediction.nextPeriodStart);
  const predEnd = parseISO(prediction.nextPeriodEnd);
  let cur = predStart;
  while (!isAfter(cur, predEnd)) {
    addStatus(format(cur, 'yyyy-MM-dd'), 'period_predicted');
    cur = addDays(cur, 1);
  }

  // Fertile window
  const fertileStart = parseISO(prediction.fertileWindowStart);
  const fertileEnd = parseISO(prediction.fertileWindowEnd);
  cur = fertileStart;
  while (!isAfter(cur, fertileEnd)) {
    const d = format(cur, 'yyyy-MM-dd');
    if (!map[d]?.includes('period') && !map[d]?.includes('period_predicted')) {
      addStatus(d, 'fertile');
    }
    cur = addDays(cur, 1);
  }

  // Ovulation
  const ovDate = prediction.ovulationDay;
  if (!map[ovDate]?.includes('period') && !map[ovDate]?.includes('period_predicted')) {
    addStatus(ovDate, 'ovulation');
  }

  // Logged days
  logs.forEach((log) => addStatus(log.date, 'logged'));

  // Today
  addStatus(today, 'today');

  return map;
}
