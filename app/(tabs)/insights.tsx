import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import {
  subDays,
  subMonths,
  parseISO,
  isAfter,
  isSameDay,
  format,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/widgets/StatCard';
import { EmptyState } from '../../components/widgets/EmptyState';
import { useColors } from '../../hooks/useTheme';
import { useCycleStore } from '../../stores/cycleStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import {
  calculateRegularityScore,
  formatRegularityScore,
} from '../../lib/utils/formatting';
import type { InsightTimeRange, Symptom, Mood } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const RANGES: { key: InsightTimeRange; label: string }[] = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d',        label: '7 days' },
  { key: '30d',       label: '30 days' },
  { key: '3m',        label: '3 months' },
  { key: 'all',       label: 'All time' },
];

const MOOD_LABELS: Record<Mood, string> = {
  happy: 'Happy', calm: 'Calm', sad: 'Sad', anxious: 'Anxious',
  irritable: 'Irritable', energetic: 'Energetic', sensitive: 'Sensitive',
  confident: 'Confident', overwhelmed: 'Overwhelmed', depressed: 'Depressed',
  excited: 'Excited',
};

const SYMPTOM_LABELS: Record<Symptom, string> = {
  cramps: 'Cramps', headache: 'Headache', bloating: 'Bloating', acne: 'Acne',
  breast_tenderness: 'Breast tenderness', back_pain: 'Back pain',
  fatigue: 'Fatigue', nausea: 'Nausea', dizziness: 'Dizziness',
  constipation: 'Constipation', diarrhea: 'Diarrhea', hot_flashes: 'Hot flashes',
  insomnia: 'Insomnia', mood_swings: 'Mood swings', food_cravings: 'Cravings',
  pelvic_pain: 'Pelvic pain',
};

function rangeCutoff(range: InsightTimeRange): { from: Date; to: Date } {
  const now = new Date();
  switch (range) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case '7d':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case '30d':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case '3m':
      return { from: subMonths(now, 3), to: endOfDay(now) };
    case 'all':
    default:
      return { from: new Date(0), to: endOfDay(now) };
  }
}

function rangeLabel(range: InsightTimeRange): string {
  switch (range) {
    case 'today':     return 'Today';
    case 'yesterday': return 'Yesterday';
    case '7d':        return 'Last 7 days';
    case '30d':       return 'Last 30 days';
    case '3m':        return 'Last 3 months';
    case 'all':       return 'All time';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionPill, { backgroundColor: colors.accent + '18' }]}>
        <View style={[s.sectionDot, { backgroundColor: colors.accent }]} />
        <Typography
          variant="label"
          color={colors.accent}
          style={{ fontWeight: '700', letterSpacing: 0.8, fontSize: 11 }}
        >
          {title.toUpperCase()}
        </Typography>
      </View>
    </View>
  );
}

function MiniTriStat({
  low, mid, high, lowLabel, midLabel, highLabel,
  lowColor, midColor, highColor,
}: {
  low: number; mid: number; high: number;
  lowLabel: string; midLabel: string; highLabel: string;
  lowColor: string; midColor: string; highColor: string;
}) {
  const colors = useColors();
  const total = low + mid + high;
  if (total === 0) return null;

  return (
    <Card padding={16}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { count: low, label: lowLabel, color: lowColor },
          { count: mid, label: midLabel, color: midColor },
          { count: high, label: highLabel, color: highColor },
        ].map(({ count, label, color }) => (
          <View
            key={label}
            style={[s.triBlock, { backgroundColor: color + '12', borderColor: color + '25' }]}
          >
            <Typography variant="h4" color={color} style={{ fontWeight: '800' }}>
              {count}
            </Typography>
            <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2, textAlign: 'center' }}>
              {label}
            </Typography>
            <View style={[s.triBar, { backgroundColor: color + '20' }]}>
              <View
                style={[
                  s.triBarFill,
                  { backgroundColor: color, width: `${Math.round((count / total) * 100)}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

/** Horizontal scrollable day-by-day activity cards (inspired by reference image) */
function DayTimeline({ logs, range }: {
  logs: ReturnType<typeof useCycleStore>['logs'];
  range: InsightTimeRange;
}) {
  const colors = useColors();
  // Only meaningful for 7d / 30d views
  if (range === 'today' || range === 'yesterday' || range === 'all' || range === '3m') return null;

  const days = range === '7d' ? 7 : 14;
  const daySlots = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const log = logs.find((l) => isSameDay(parseISO(l.date), date));
    const hasFlow = log?.flow != null;
    const hasPill = log?.pillTaken != null;
    const hasWater = (log?.waterIntake ?? 0) > 0;
    const hasSymptomsOrMood = (log?.symptoms?.length ?? 0) > 0 || (log?.moods?.length ?? 0) > 0;
    const isToday = isSameDay(date, new Date());

    return { date, log, hasFlow, hasPill, hasWater, hasSymptomsOrMood, isToday };
  });

  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <Typography variant="label" color={colors.textSecondary} style={{ fontWeight: '700' }}>
          Daily activity — {range === '7d' ? 'last 7 days' : 'last 14 days'}
        </Typography>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 14, gap: 8, flexDirection: 'row' }}
      >
        {daySlots.map(({ date, hasFlow, hasPill, hasWater, hasSymptomsOrMood, isToday, log }) => {
          const logged = !!(log);
          return (
            <View
              key={date.toISOString()}
              style={[
                s.dayCard,
                {
                  backgroundColor: isToday
                    ? colors.accent + '14'
                    : logged
                    ? colors.surface
                    : colors.surfaceSecondary,
                  borderColor: isToday ? colors.accent + '50' : colors.border,
                  borderWidth: isToday ? 1.5 : 1,
                },
              ]}
            >
              <Typography
                variant="caption"
                color={isToday ? colors.accent : colors.textTertiary}
                style={{ fontWeight: '700', fontSize: 10 }}
              >
                {format(date, 'EEE').toUpperCase()}
              </Typography>
              <Typography
                variant="label"
                color={isToday ? colors.accent : colors.textSecondary}
                style={{ fontWeight: '800', fontSize: 16, marginTop: 2 }}
              >
                {format(date, 'd')}
              </Typography>

              {/* Activity dots */}
              <View style={s.dayDots}>
                <View style={[s.actDot, { backgroundColor: hasFlow ? Colors.phases.menstrual : colors.border }]} />
                <View style={[s.actDot, { backgroundColor: hasPill ? Colors.success : colors.border }]} />
                <View style={[s.actDot, { backgroundColor: hasWater ? Colors.info : colors.border }]} />
                <View style={[s.actDot, { backgroundColor: hasSymptomsOrMood ? Colors.phases.luteal : colors.border }]} />
              </View>

              {!logged && (
                <Typography variant="caption" color={colors.textTertiary} style={{ fontSize: 9, marginTop: 4 }}>
                  No log
                </Typography>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={[s.timelineLegend, { borderTopColor: colors.border }]}>
        {[
          { color: Colors.phases.menstrual, label: 'Flow' },
          { color: Colors.success,          label: 'Pill' },
          { color: Colors.info,             label: 'Water' },
          { color: Colors.phases.luteal,    label: 'Symptoms' },
        ].map(({ color, label }) => (
          <View key={label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: color }]} />
            <Typography variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>
              {label}
            </Typography>
          </View>
        ))}
      </View>
    </Card>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const colors = useColors();
  const { cycles, logs } = useCycleStore();
  const [range, setRange] = useState<InsightTimeRange>('today');
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;
  const filterRef = useRef<ScrollView>(null);

  const { from, to } = useMemo(() => rangeCutoff(range), [range]);

  const filteredCycles = useMemo(
    () => cycles.filter((c) => {
      if (!c.length) return false;
      const d = parseISO(c.startDate);
      return isWithinInterval(d, { start: from, end: to });
    }),
    [cycles, from, to]
  );

  const filteredLogs = useMemo(
    () => logs.filter((l) => {
      const d = parseISO(l.date);
      return isWithinInterval(d, { start: from, end: to });
    }),
    [logs, from, to]
  );

  // ── Cycle stats ────────────────────────────────────────────────────────────

  const cycleLengths = useMemo(
    () => filteredCycles.map((c) => c.length!).filter(Boolean),
    [filteredCycles]
  );

  const avgCycleLength = useMemo(
    () => cycleLengths.length
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : null,
    [cycleLengths]
  );

  const periodLengths = useMemo(
    () => filteredCycles.map((c) => c.periodLength).filter(Boolean) as number[],
    [filteredCycles]
  );

  const avgPeriodLength = useMemo(
    () => periodLengths.length
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : null,
    [periodLengths]
  );

  const regularityScore = useMemo(
    () => (cycleLengths.length >= 2 ? calculateRegularityScore(cycleLengths) : null),
    [cycleLengths]
  );

  const cycleLengthData = useMemo(
    () => filteredCycles
      .filter((c) => c.length)
      .slice(0, 12)
      .reverse()
      .map((c) => ({
        value: c.length!,
        label: format(parseISO(c.startDate), 'MMM'),
        frontColor: colors.accent,
        topLabelComponent: () => (
          <Typography variant="caption" style={{ fontSize: 9, marginBottom: 2, color: colors.textTertiary }}>
            {c.length}
          </Typography>
        ),
      })),
    [filteredCycles, colors.accent]
  );

  // ── Symptom frequency ─────────────────────────────────────────────────────

  const symptomFreq = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => l.symptoms.forEach((sym) => { counts[sym] = (counts[sym] ?? 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({
        value: count,
        label: SYMPTOM_LABELS[key as Symptom] ?? key,
        frontColor: Colors.phases.luteal,
      }));
  }, [filteredLogs]);

  // ── Mood frequency ─────────────────────────────────────────────────────────

  const moodFreq = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => l.moods.forEach((m) => { counts[m] = (counts[m] ?? 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([key, count]) => ({
        value: count,
        label: MOOD_LABELS[key as Mood] ?? key,
        frontColor: Colors.moods[key as Mood] ?? colors.accent,
      }));
  }, [filteredLogs, colors.accent]);

  // ── Energy distribution ───────────────────────────────────────────────────

  const energyCounts = useMemo(() => {
    const withEnergy = filteredLogs.filter((l) => l.energyLevel);
    return {
      low:    withEnergy.filter((l) => l.energyLevel === 'low').length,
      medium: withEnergy.filter((l) => l.energyLevel === 'medium').length,
      high:   withEnergy.filter((l) => l.energyLevel === 'high').length,
      total:  withEnergy.length,
    };
  }, [filteredLogs]);

  // ── Sleep ─────────────────────────────────────────────────────────────────

  const sleepLogs = useMemo(
    () => filteredLogs.filter((l) => l.sleepHours != null),
    [filteredLogs]
  );

  const avgSleepHours = useMemo(
    () => sleepLogs.length
      ? parseFloat((sleepLogs.reduce((a, l) => a + (l.sleepHours ?? 0), 0) / sleepLogs.length).toFixed(1))
      : null,
    [sleepLogs]
  );

  const avgSleepQuality = useMemo(() => {
    const qualityLogs = filteredLogs.filter((l) => l.sleepQuality != null);
    if (!qualityLogs.length) return null;
    return parseFloat(
      (qualityLogs.reduce((a, l) => a + (l.sleepQuality ?? 0), 0) / qualityLogs.length).toFixed(1)
    );
  }, [filteredLogs]);

  const sleepData = useMemo(
    () => sleepLogs.slice(-14).reverse().map((l) => ({
      value: l.sleepHours ?? 0,
      label: format(parseISO(l.date), 'EE').charAt(0),
      frontColor: l.sleepHours != null && l.sleepHours >= 7
        ? Colors.success
        : l.sleepHours != null && l.sleepHours >= 6
        ? Colors.warning
        : Colors.error,
    })),
    [sleepLogs]
  );

  // ── Pill compliance ────────────────────────────────────────────────────────

  const pillLogs = useMemo(
    () => filteredLogs.filter((l) => l.pillTaken !== null),
    [filteredLogs]
  );

  const pillCompliance = useMemo(() => {
    if (!pillLogs.length) return null;
    const taken = pillLogs.filter((l) => l.pillTaken === true).length;
    return Math.round((taken / pillLogs.length) * 100);
  }, [pillLogs]);

  const pillPieData = useMemo(() => {
    if (!pillLogs.length) return [];
    const taken = pillLogs.filter((l) => l.pillTaken === true).length;
    const skipped = pillLogs.length - taken;
    return [
      { value: taken,   color: Colors.success,        text: `${taken}` },
      { value: skipped, color: Colors.error + '80',   text: `${skipped}` },
    ];
  }, [pillLogs]);

  // ── Water intake ───────────────────────────────────────────────────────────

  const avgWater = useMemo(
    () => filteredLogs.length
      ? parseFloat(
          (filteredLogs.reduce((a, l) => a + (l.waterIntake ?? 0), 0) / filteredLogs.length).toFixed(1)
        )
      : null,
    [filteredLogs]
  );

  const waterData = useMemo(
    () => filteredLogs.slice(-14).reverse().map((l) => ({
      value: l.waterIntake ?? 0,
      label: format(parseISO(l.date), 'EE').charAt(0),
      frontColor: (l.waterIntake ?? 0) >= 6
        ? Colors.info
        : (l.waterIntake ?? 0) >= 3
        ? Colors.info + 'AA'
        : Colors.info + '44',
    })),
    [filteredLogs]
  );

  // ── BBT ───────────────────────────────────────────────────────────────────

  const bbtData = useMemo(
    () => filteredLogs.filter((l) => l.bbt).slice(-30).reverse().map((l) => ({
      value: l.bbt!,
      label: format(parseISO(l.date), 'dd'),
      dataPointColor: Colors.gold,
    })),
    [filteredLogs]
  );

  // ── Weight ────────────────────────────────────────────────────────────────

  const weightData = useMemo(
    () => filteredLogs.filter((l) => l.weight).slice(-20).reverse().map((l) => ({
      value: l.weight!,
      label: format(parseISO(l.date), 'MMM d'),
      dataPointColor: Colors.plum,
    })),
    [filteredLogs]
  );

  // ── Insight text ──────────────────────────────────────────────────────────

  const insightText = useMemo(() => {
    if (!avgCycleLength) {
      if (pillCompliance !== null && pillCompliance >= 90)
        return `Excellent pill compliance at ${pillCompliance}%! Consistent tracking helps Juno give you the most accurate health picture.`;
      if (avgSleepHours !== null && avgSleepHours < 7)
        return `You're averaging ${avgSleepHours}h of sleep — a little below the recommended 7–9h. Sleep quality often affects cycle regularity and mood.`;
      return `Keep logging to unlock personalized insights about your cycle patterns, sleep, energy, and more.`;
    }
    if (cycleLengths.length >= 3 && regularityScore && regularityScore >= 80)
      return `Your cycles have been very consistent — averaging ${avgCycleLength} days over the last ${filteredCycles.length} cycles. Great for prediction accuracy!`;
    if (cycleLengths.length >= 3 && regularityScore && regularityScore < 60)
      return `Your cycles vary by a few days, which is completely normal. Logging more cycles will help Juno improve its predictions over time.`;
    return `Keep logging to unlock personalized insights about your cycle patterns, sleep, energy, and more.`;
  }, [avgCycleLength, cycleLengths, regularityScore, filteredCycles, pillCompliance, avgSleepHours]);

  const hasData = filteredCycles.length > 0 || filteredLogs.length > 0;
  const chartCommonProps = {
    yAxisTextStyle: { color: colors.textTertiary, fontSize: 11 },
    xAxisLabelTextStyle: { color: colors.textTertiary, fontSize: 10 },
    rulesColor: colors.border,
    backgroundColor: 'transparent' as const,
    isAnimated: true,
    width: chartWidth,
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Typography variant="h3" style={{ fontWeight: '800' }}>Insights</Typography>
            <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
              {rangeLabel(range)} · {filteredLogs.length} logs · {filteredCycles.length} cycles
            </Typography>
          </View>
        </View>

        {/* ── Time range filter (horizontal scroll chips) ─────────────────── */}
        <ScrollView
          ref={filterRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {RANGES.map((r) => {
            const active = range === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                onPress={() => setRange(r.key)}
                activeOpacity={0.75}
                style={[
                  s.filterChip,
                  active
                    ? { backgroundColor: colors.accent, borderColor: colors.accent }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Typography
                  variant="caption"
                  color={active ? Colors.white : colors.textSecondary}
                  style={{ fontWeight: active ? '700' : '500' }}
                >
                  {r.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!hasData ? (
          <EmptyState
            emoji="📊"
            title="No data yet"
            description={
              range === 'today' || range === 'yesterday'
                ? `No logs found for ${rangeLabel(range).toLowerCase()}. Start logging to see your daily snapshot.`
                : 'Log your symptoms, pills, water intake, and more to see your personal health trends here.'
            }
          />
        ) : (
          <>
            {/* ── DAY TIMELINE (7d / 30d) ─────────────────────────────────── */}
            <DayTimeline logs={logs} range={range} />

            {/* ── CYCLE OVERVIEW ──────────────────────────────────────────── */}
            {filteredCycles.length > 0 && (
              <>
                <SectionHeader title="Cycle overview" />

                <View style={s.statsRow}>
                  <StatCard label="Avg cycle"  value={avgCycleLength ?? '—'}  unit="days" color={colors.accent} />
                  <StatCard label="Avg period" value={avgPeriodLength ?? '—'} unit="days" color={Colors.phases.menstrual} />
                </View>
                <View style={s.statsRow}>
                  <StatCard
                    label="Regularity"
                    value={regularityScore != null ? `${regularityScore}%` : '—'}
                    subtitle={regularityScore != null ? formatRegularityScore(regularityScore) : undefined}
                    color={Colors.success}
                  />
                  <StatCard label="Cycles tracked" value={filteredCycles.length} color={Colors.phases.follicular} />
                </View>

                {cycleLengthData.length > 1 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Cycle length over time
                    </Typography>
                    <BarChart
                      data={cycleLengthData}
                      barWidth={28}
                      spacing={10}
                      noOfSections={4}
                      barBorderRadius={6}
                      hideRules={false}
                      {...chartCommonProps}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ── SYMPTOMS & MOODS ────────────────────────────────────────── */}
            {(symptomFreq.length > 0 || moodFreq.length > 0) && (
              <>
                <SectionHeader title="Symptoms & moods" />

                {symptomFreq.length > 0 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Most frequent symptoms
                    </Typography>
                    <BarChart
                      data={symptomFreq}
                      barWidth={16}
                      spacing={8}
                      noOfSections={4}
                      barBorderRadius={4}
                      horizontal
                      {...chartCommonProps}
                    />
                  </Card>
                )}

                {moodFreq.length > 0 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Mood patterns
                    </Typography>
                    <BarChart
                      data={moodFreq}
                      barWidth={16}
                      spacing={8}
                      noOfSections={4}
                      barBorderRadius={4}
                      horizontal
                      {...chartCommonProps}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ── ENERGY ──────────────────────────────────────────────────── */}
            {energyCounts.total > 0 && (
              <>
                <SectionHeader title="Energy levels" />
                <MiniTriStat
                  low={energyCounts.low}
                  mid={energyCounts.medium}
                  high={energyCounts.high}
                  lowLabel="Low"
                  midLabel="Medium"
                  highLabel="High"
                  lowColor={Colors.error}
                  midColor={Colors.warning}
                  highColor={Colors.success}
                />
              </>
            )}

            {/* ── SLEEP ───────────────────────────────────────────────────── */}
            {sleepLogs.length > 0 && (
              <>
                <SectionHeader title="Sleep" />
                <View style={s.statsRow}>
                  <StatCard
                    label="Avg sleep"
                    value={avgSleepHours ?? '—'}
                    unit="hrs"
                    color={avgSleepHours != null && avgSleepHours >= 7 ? Colors.success : Colors.warning}
                    subtitle={avgSleepHours != null ? (avgSleepHours >= 7 ? 'On target' : 'Below 7h') : undefined}
                  />
                  <StatCard
                    label="Sleep quality"
                    value={avgSleepQuality ?? '—'}
                    unit="/ 5"
                    color={Colors.phases.ovulation}
                    subtitle={avgSleepQuality != null
                      ? avgSleepQuality >= 4 ? 'Good' : avgSleepQuality >= 3 ? 'Fair' : 'Poor'
                      : undefined}
                  />
                </View>

                {sleepData.length > 2 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Sleep hours (last 14 logs)
                    </Typography>
                    <View style={s.legendRow}>
                      {[
                        { color: Colors.success, label: '≥ 7h' },
                        { color: Colors.warning, label: '6–7h' },
                        { color: Colors.error,   label: '< 6h' },
                      ].map(({ color, label }) => (
                        <View key={label} style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: color }]} />
                          <Typography variant="caption" color={colors.textTertiary}>{label}</Typography>
                        </View>
                      ))}
                    </View>
                    <BarChart
                      data={sleepData}
                      barWidth={20}
                      spacing={10}
                      noOfSections={4}
                      barBorderRadius={4}
                      hideRules={false}
                      {...chartCommonProps}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ── HEALTH HABITS ───────────────────────────────────────────── */}
            {(pillLogs.length > 0 || filteredLogs.length > 0) && (
              <>
                <SectionHeader title="Health habits" />

                <View style={s.statsRow}>
                  <StatCard
                    label="Pill compliance"
                    value={pillCompliance != null ? `${pillCompliance}%` : '—'}
                    subtitle={pillCompliance != null
                      ? pillCompliance >= 90 ? 'Excellent' : pillCompliance >= 70 ? 'Good' : 'Needs work'
                      : 'No logs'}
                    color={Colors.success}
                  />
                  <StatCard
                    label="Avg water"
                    value={avgWater ?? '—'}
                    unit="glasses"
                    color={Colors.info}
                    subtitle={avgWater != null
                      ? avgWater >= 6 ? 'Well hydrated' : avgWater >= 3 ? 'Moderate' : 'Low'
                      : undefined}
                  />
                </View>

                {pillPieData.length > 0 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Pill compliance breakdown
                    </Typography>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 8 }}>
                      <PieChart
                        data={pillPieData}
                        donut
                        radius={52}
                        innerRadius={36}
                        centerLabelComponent={() => (
                          <View style={{ alignItems: 'center' }}>
                            <Typography variant="h4" style={{ fontWeight: '800' }}>{pillCompliance}%</Typography>
                            <Typography variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>taken</Typography>
                          </View>
                        )}
                      />
                      <View style={{ gap: 10 }}>
                        <View style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: Colors.success }]} />
                          <View>
                            <Typography variant="label" style={{ fontWeight: '700' }}>
                              Taken — {pillPieData[0]?.value ?? 0}
                            </Typography>
                            <Typography variant="caption" color={colors.textTertiary}>days logged</Typography>
                          </View>
                        </View>
                        <View style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: Colors.error + '80' }]} />
                          <View>
                            <Typography variant="label" style={{ fontWeight: '700' }}>
                              Skipped — {pillPieData[1]?.value ?? 0}
                            </Typography>
                            <Typography variant="caption" color={colors.textTertiary}>days logged</Typography>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                )}

                {waterData.length > 0 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Water intake (last 14 logs)
                    </Typography>
                    <View style={s.legendRow}>
                      {[
                        { color: Colors.info,          label: '≥ 6 glasses' },
                        { color: Colors.info + 'AA',   label: '3–5' },
                        { color: Colors.info + '44',   label: '< 3' },
                      ].map(({ color, label }) => (
                        <View key={label} style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: color }]} />
                          <Typography variant="caption" color={colors.textTertiary}>{label}</Typography>
                        </View>
                      ))}
                    </View>
                    <BarChart
                      data={waterData}
                      barWidth={20}
                      spacing={10}
                      noOfSections={4}
                      barBorderRadius={4}
                      hideRules={false}
                      {...chartCommonProps}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ── PHYSICAL TRACKING ───────────────────────────────────────── */}
            {(bbtData.length > 3 || weightData.length > 2) && (
              <>
                <SectionHeader title="Physical tracking" />

                {bbtData.length > 3 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Basal body temperature
                    </Typography>
                    <Typography variant="caption" color={colors.textTertiary} style={{ marginBottom: 12 }}>
                      A rise of ~0.2°C typically indicates ovulation
                    </Typography>
                    <LineChart
                      data={bbtData}
                      color={Colors.gold}
                      thickness={2}
                      dataPointsColor={Colors.gold}
                      dataPointsRadius={3}
                      noOfSections={4}
                      hideRules={false}
                      curved
                      {...chartCommonProps}
                    />
                  </Card>
                )}

                {weightData.length > 2 && (
                  <Card padding={16}>
                    <Typography variant="label" color={colors.textSecondary} style={s.chartTitle}>
                      Weight trend
                    </Typography>
                    <LineChart
                      data={weightData}
                      color={Colors.plum}
                      thickness={2}
                      dataPointsColor={Colors.plum}
                      dataPointsRadius={3}
                      noOfSections={4}
                      hideRules={false}
                      curved
                      {...chartCommonProps}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ── JUNO INSIGHT ────────────────────────────────────────────── */}
            {insightText && (
              <Card
                padding={16}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: colors.accent,
                  backgroundColor: colors.accent + '08',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={[s.insightBadge, { backgroundColor: colors.accent + '18' }]}>
                    <Typography variant="caption" color={colors.accent} style={{ fontWeight: '700', fontSize: 10 }}>
                      JUNO INSIGHT
                    </Typography>
                  </View>
                </View>
                <Typography variant="body2" color={colors.textSecondary} style={{ lineHeight: 21 }}>
                  {insightText}
                </Typography>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1 },
  scroll:      { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  header:      { paddingTop: Spacing.sm, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },

  // Section header pill
  sectionHeader: { marginTop: 4, marginBottom: -4 },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  sectionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  // Day timeline
  dayCard: {
    width: 58,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Radius.lg,
  },
  dayDots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 32,
  },
  actDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  timelineLegend: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },

  // Charts
  chartTitle: { marginBottom: 12, fontWeight: '700' },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Energy tri-stat
  triBlock: {
    flex: 1,
    padding: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  triBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  triBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Insight card
  insightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
});
