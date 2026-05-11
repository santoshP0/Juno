import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { subMonths, parseISO, isAfter, format } from 'date-fns';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/widgets/StatCard';
import { EmptyState } from '../../components/widgets/EmptyState';
import { useColors } from '../../hooks/useTheme';
import { useCycleStore } from '../../stores/cycleStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { calculateRegularityScore, formatRegularityScore } from '../../lib/utils/formatting';
import type { InsightTimeRange, Symptom } from '../../types';

const RANGES: { key: InsightTimeRange; label: string }[] = [
  { key: '3m', label: '3 months' },
  { key: '6m', label: '6 months' },
  { key: '12m', label: '12 months' },
  { key: 'all', label: 'All time' },
];

function rangeCutoff(range: InsightTimeRange): Date | null {
  const now = new Date();
  if (range === '3m') return subMonths(now, 3);
  if (range === '6m') return subMonths(now, 6);
  if (range === '12m') return subMonths(now, 12);
  return null;
}

export default function InsightsScreen() {
  const colors = useColors();
  const { cycles, logs } = useCycleStore();
  const [range, setRange] = useState<InsightTimeRange>('6m');
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;

  const cutoff = useMemo(() => rangeCutoff(range), [range]);

  const filteredCycles = useMemo(
    () =>
      cycles.filter(
        (c) => c.length && (!cutoff || isAfter(parseISO(c.startDate), cutoff))
      ),
    [cycles, cutoff]
  );

  const filteredLogs = useMemo(
    () =>
      logs.filter((l) => !cutoff || isAfter(parseISO(l.date), cutoff)),
    [logs, cutoff]
  );

  const cycleLengths = useMemo(
    () => filteredCycles.map((c) => c.length!).filter(Boolean),
    [filteredCycles]
  );

  const avgCycleLength = useMemo(
    () =>
      cycleLengths.length
        ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
        : null,
    [cycleLengths]
  );

  const periodLengths = useMemo(
    () => filteredCycles.map((c) => c.periodLength).filter(Boolean) as number[],
    [filteredCycles]
  );

  const avgPeriodLength = useMemo(
    () =>
      periodLengths.length
        ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
        : null,
    [periodLengths]
  );

  const regularityScore = useMemo(
    () => (cycleLengths.length >= 2 ? calculateRegularityScore(cycleLengths) : null),
    [cycleLengths]
  );

  // Chart data: cycle lengths over time
  const cycleLengthData = useMemo(
    () =>
      filteredCycles
        .filter((c) => c.length)
        .slice(0, 12)
        .reverse()
        .map((c) => ({
          value: c.length!,
          label: format(parseISO(c.startDate), 'MMM'),
          frontColor: Colors.dustyRose,
        })),
    [filteredCycles]
  );

  // Symptom frequency
  const symptomFreq = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      l.symptoms.forEach((sym) => {
        counts[sym] = (counts[sym] ?? 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({
        key: key as Symptom,
        count,
        label: key.replace('_', ' '),
        value: count,
        frontColor: Colors.sage,
      }));
  }, [filteredLogs]);

  // BBT data
  const bbtData = useMemo(
    () =>
      filteredLogs
        .filter((l) => l.bbt)
        .slice(-30)
        .reverse()
        .map((l) => ({
          value: l.bbt!,
          label: format(parseISO(l.date), 'dd'),
          frontColor: Colors.gold,
          dataPointColor: Colors.gold,
        })),
    [filteredLogs]
  );

  // Weight trend
  const weightData = useMemo(
    () =>
      filteredLogs
        .filter((l) => l.weight)
        .slice(-20)
        .reverse()
        .map((l) => ({
          value: l.weight!,
          dataPointColor: Colors.plum,
        })),
    [filteredLogs]
  );

  const hasData = filteredCycles.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h3" style={{ fontWeight: '800' }}>Insights</Typography>
        </View>

        {/* Time range selector */}
        <View style={[styles.rangeRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRange(r.key)}
              style={[
                styles.rangeBtn,
                {
                  backgroundColor: range === r.key ? Colors.dustyRose : 'transparent',
                },
              ]}
            >
              <Typography
                variant="caption"
                color={range === r.key ? '#fff' : colors.textSecondary}
                style={{ fontWeight: '700' }}
              >
                {r.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {!hasData ? (
          <EmptyState
            emoji="📊"
            title="No data yet"
            description="Log your cycles over time to see insights and trends here."
          />
        ) : (
          <>
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <StatCard
                label="Avg cycle"
                value={avgCycleLength ?? '—'}
                unit="days"
                color={Colors.dustyRose}
              />
              <StatCard
                label="Avg period"
                value={avgPeriodLength ?? '—'}
                unit="days"
                color={Colors.sage}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Regularity"
                value={regularityScore ?? '—'}
                unit="%"
                subtitle={regularityScore ? formatRegularityScore(regularityScore) : undefined}
                color={Colors.gold}
              />
              <StatCard
                label="Cycles tracked"
                value={filteredCycles.length}
                color={Colors.plum}
              />
            </View>

            {/* Cycle length chart */}
            {cycleLengthData.length > 1 && (
              <Card padding={16}>
                <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
                  Cycle length over time
                </Typography>
                <BarChart
                  data={cycleLengthData}
                  barWidth={24}
                  spacing={8}
                  noOfSections={4}
                  barBorderRadius={4}
                  yAxisTextStyle={{ color: colors.textTertiary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  hideRules={false}
                  rulesColor={colors.border}
                  backgroundColor="transparent"
                  isAnimated
                  width={chartWidth}
                />
              </Card>
            )}

            {/* Top symptoms */}
            {symptomFreq.length > 0 && (
              <Card padding={16}>
                <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
                  Most frequent symptoms
                </Typography>
                <BarChart
                  data={symptomFreq.map((s) => ({
                    value: s.count,
                    label: s.label,
                    frontColor: Colors.sage,
                  }))}
                  barWidth={24}
                  spacing={8}
                  noOfSections={4}
                  barBorderRadius={4}
                  horizontal
                  yAxisTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  backgroundColor="transparent"
                  isAnimated
                  width={chartWidth}
                />
              </Card>
            )}

            {/* BBT chart */}
            {bbtData.length > 3 && (
              <Card padding={16}>
                <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
                  Basal body temperature
                </Typography>
                <LineChart
                  data={bbtData}
                  color={Colors.gold}
                  thickness={2}
                  dataPointsColor={Colors.gold}
                  noOfSections={4}
                  yAxisTextStyle={{ color: colors.textTertiary, fontSize: 11 }}
                  xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10 }}
                  hideRules={false}
                  rulesColor={colors.border}
                  backgroundColor="transparent"
                  isAnimated
                  curved
                  width={chartWidth}
                />
              </Card>
            )}

            {/* Weight trend */}
            {weightData.length > 2 && (
              <Card padding={16}>
                <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
                  Weight trend
                </Typography>
                <LineChart
                  data={weightData}
                  color={Colors.plum}
                  thickness={2}
                  dataPointsColor={Colors.plum}
                  noOfSections={4}
                  yAxisTextStyle={{ color: colors.textTertiary, fontSize: 11 }}
                  hideRules={false}
                  rulesColor={colors.border}
                  backgroundColor="transparent"
                  isAnimated
                  curved
                  width={chartWidth}
                />
              </Card>
            )}

            {/* Auto-generated insight */}
            {avgCycleLength && (
              <Card
                padding={16}
                style={{ borderLeftWidth: 4, borderLeftColor: Colors.dustyRose }}
              >
                <Typography variant="label" color={Colors.dustyRose} style={{ marginBottom: 6 }}>
                  ✨ Juno insight
                </Typography>
                <Typography variant="body2" color={colors.textSecondary}>
                  {cycleLengths.length >= 3 && regularityScore && regularityScore >= 80
                    ? `Your cycles have been very consistent! Average ${avgCycleLength} days over the last ${filteredCycles.length} cycles.`
                    : cycleLengths.length >= 3 && regularityScore && regularityScore < 60
                    ? `Your cycles vary by a few days, which is normal. Tracking more cycles will improve prediction accuracy.`
                    : `Keep logging to unlock personalized insights about your cycle patterns.`}
                </Typography>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['2xl'] },
  header: { paddingVertical: Spacing.sm },
  rangeRow: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  rangeBtn: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
});
