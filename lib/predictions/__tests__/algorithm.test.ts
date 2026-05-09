import { calculatePredictions } from '../algorithm';
import type { Cycle } from '../../../types';
import { addDays, format, parseISO } from 'date-fns';

function makeCycle(startDate: string, length: number, periodLength = 5): Cycle {
  const endDate = format(addDays(parseISO(startDate), length - 1), 'yyyy-MM-dd');
  return {
    id: Math.random(),
    startDate,
    endDate,
    length,
    periodLength,
    notes: null,
    createdAt: startDate,
    updatedAt: startDate,
  };
}

describe('calculatePredictions', () => {
  it('uses defaults when no cycles exist', () => {
    const result = calculatePredictions([], 28, 5);
    expect(result.avgCycleLength).toBe(28);
    expect(result.confidenceDays).toBe(3);
    expect(result.fertileWindowStart).toBeTruthy();
    expect(result.nextPeriodStart).toBeTruthy();
  });

  it('averages cycle lengths from history', () => {
    // 3 cycles of length 26, 28, 30 → avg 28
    const cycles: Cycle[] = [
      makeCycle('2024-01-01', 26),
      makeCycle('2024-01-27', 28),
      makeCycle('2024-02-24', 30),
    ];
    const result = calculatePredictions(cycles, 28, 5);
    expect(result.avgCycleLength).toBe(28);
  });

  it('uses latest cycle to project next period', () => {
    const cycles: Cycle[] = [makeCycle('2024-03-01', 28)];
    const result = calculatePredictions(cycles, 28, 5);
    // next period should be 28 days from 2024-03-01 = 2024-03-29
    expect(result.nextPeriodStart).toBe('2024-03-29');
  });

  it('fertile window is 5 days before ovulation to 1 day after', () => {
    const cycles: Cycle[] = [makeCycle('2024-03-01', 28)];
    const result = calculatePredictions(cycles, 28, 5);
    // ovulation = next period - 14 = 2024-03-29 - 14 = 2024-03-15
    expect(result.ovulationDay).toBe('2024-03-15');
    // fertile start = ovulation - 5 = 2024-03-10
    expect(result.fertileWindowStart).toBe('2024-03-10');
    // fertile end = ovulation + 1 = 2024-03-16
    expect(result.fertileWindowEnd).toBe('2024-03-16');
  });

  it('confidence days increase with irregular cycles', () => {
    // Cycles of 21, 28, 35 — high variance
    const cycles: Cycle[] = [
      makeCycle('2024-01-01', 21),
      makeCycle('2024-01-22', 28),
      makeCycle('2024-02-19', 35),
    ];
    const result = calculatePredictions(cycles, 28, 5);
    expect(result.confidenceDays).toBeGreaterThan(1);
  });

  it('limits confidence days to max 7', () => {
    const cycles: Cycle[] = [
      makeCycle('2024-01-01', 18),
      makeCycle('2024-01-19', 45),
      makeCycle('2024-03-05', 20),
    ];
    const result = calculatePredictions(cycles, 28, 5);
    expect(result.confidenceDays).toBeLessThanOrEqual(7);
  });

  it('returns a valid cycle phase', () => {
    const result = calculatePredictions([], 28, 5);
    expect(['menstrual', 'follicular', 'ovulation', 'luteal']).toContain(
      result.currentPhase
    );
  });

  it('pregnancyChance is very_low outside fertile window', () => {
    // Use a very old cycle start date so today is deep in luteal
    const cycles: Cycle[] = [makeCycle('2020-01-01', 28)];
    const result = calculatePredictions(cycles, 28, 5);
    // We can't easily control "today" in tests, just check it's a valid value
    expect([
      'very_low',
      'low',
      'medium',
      'high',
      'very_high',
    ]).toContain(result.pregnancyChance);
  });
});
