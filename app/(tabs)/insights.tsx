import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { subMonths, parseISO, isAfter, format } from 'date-fns';

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
  { key: '3m', label: '3 mo' },
  { key: '6m', label: '6 mo' },
  { key: '12m', label: '12 mo' },
  { key: 'all', label: 'All' },
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

function rangeCutoff(range: InsightTimeRange): Date | null {
  const now = new Date();
  if (range === '3m') return subMonths(now, 3);
  if (range === '6m') return subMonths(now, 6);
  if (range === '12m') return subMonths(now, 12);
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionDot, { backgroundColor: colors.accent }]} />
      <Typography variant="label" color={colors.textSecondary} style={{ fontWeight: '700', letterSpacing: 0.5 }}>
        {title.toUpperCase()}
      </Typography>
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
          <View key={label} style={[s.triBlock, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Typography variant="h4" color={color} style={{ fontWeight: '800' }}>
              {count}
            </Typography>
            <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
              {label}
            </Typography>
            <View style={[s.triBar, { backgroundColor: color + '30' }]}>
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const colors = useColors();
  const { cycles, logs } = useCycleStore();
  const [range, setRange] = useState<InsightTimeRange>('6m');
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;

  const cutoff = useMemo(() => rangeCutoff(range), [range]);

  const filteredCycles = useMemo(
    () => cycles.filter((c) => c.length && (!cutoff || isAfter(parseISO(c.startDate), cutoff))),
    [cycles, cutoff]
  );

  const filteredLogs = useMemo(
    () => logs.filter((l) => !cutoff || isAfter(parseISO(l.date), cutoff)),
    [logs, cutoff]
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
    filteredLogs.forEach((l) => l.symptoms.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; }));
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
    const logsWithEnergy = filteredLogs.filter((l) => l.energyLevel);
    return {
      low: logsWithEnergy.filter((l) => l.energyLevel === 'low').length,
      medium: logsWithEnergy.filter((l) => l.energyLevel === 'medium').length,
      high: logsWithEnergy.filter((l) => l.energyLevel === 'high').length,
      total: logsWithEnergy.length,
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
    () => sleepLogs
      .slice(-14)
      .reverse()
      .map((l) => ({
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
      { value: taken, color: Colors.success, text: `${taken}` },
      { value: skipped, color: Colors.error + '80', text: `${skipped}` },
    ];
  }, [pillLogs]);

  // ── Water intake ───────────────────────────────────────────────────────────

  const waterLogs = useMemo(
    () => filteredLogs.filter((l) => (l.waterIntake ?? 0) > 0),
    [filteredLogs]
  );

  const avgWater = useMemo(
    () => filteredLogs.length
      ? parseFloat(
          (filteredLogs.reduce((a, l) => a + (l.waterIntake ?? 0), 0) / filteredLogs.length).toFixed(1)
        )
      : null,
    [filteredLogs]
  );

  const waterData = useMemo(
    () => filteredLogs
      .slice(-14)
      .reverse()
      .map((l) => ({
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
    () => filteredLogs
      .filter((l) => l.bbt)
      .slice(-30)
      .reverse()
      .map((l) => ({
        value: l.bbt!,
        label: format(parseISO(l.date), 'dd'),
        dataPointColor: Colors.gold,
      })),
    [filteredLogs]
  );

  // ── Weight ────────────────────────────────────────────────────────────────

  const weightLogs = useMemo(
    () => filteredLogs.filter((l) => l.weight),
    [filteredLogs]
  );

  const weightData = useMemo(
    () => weightLogs
      .slice(-20)
      .reverse()
      .map((l) => ({
        value: l.weight!,
        label: format(parseISO(l.date), 'MMM d'),
        dataPointColor: Colors.plum,
      })),
    [weightLogs]
  );

  // ── Insight text ──────────────────────────────────────────────────────────

  const insightText = useMemo(() => {
    if (!avgCycleLength) return null;
    if (cycleLengths.length >= 3 && regularityScore && regularityScore >= 80) {
      return `Your cycles have been very consistent — averaging ${avgCycleLength} days over the last ${filteredCycles.length} cycles. Great for prediction accuracy!`;
    }
    if (cycleLengths.length >= 3 && regularityScore && regularityScore < 60) {
      return `Your cycles vary by a few days, which is completely normal. Logging more cycles will help Juno improve its predictions over time.`;
    }
    if (pillCompliance !== null && pillCompliance >= 90) {
      return `Excellent pill compliance at ${pillCompliance}%! Consistent tracking helps Juno give you the most accurate health picture.`;
    }
    if (avgSleepHours !== null && avgSleepHours < 7) {
      return `You're averaging ${avgSleepHours}h of sleep — a little below the recommended 7–9h. Sleep quality often affects cycle regularity and mood.`;
    }
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

        {/* Header */}
        <View style={s.header}>
          <Typography variant="h3" style={{ fontWeight: '800' }}>Insights</Typography>
          <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {filteredLogs.length} logs · {filteredCycles.length} cycles
          </Typography>
        </View>

        {/* Time range */}
        <View style={[s.rangeRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRange(r.key)}
              style={[s.rangeBtn, { backgroundColor: range === r.key ? colors.accent : 'transparent' }]}
            >
              <Typography
                variant="caption"
                color={range === r.key ? Colors.white : colors.textSecondary}
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
            description="Log your symptoms, pills, water intake, and more to see your personal health trends here."
          />
        ) : (
          <>
            {/* ── CYCLE OVERVIEW ──────────────────────────────────────────── */}
            {filteredCycles.length > 0 && (
              <>
                <SectionHeader title="Cycle overview" />

                <View style={s.statsRow}>
                  <StatCard label="Avg cycle" value={avgCycleLength ?? '—'} unit="days" color={colors.accent} />
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
                        { color: Colors.error, label: '< 6h' },
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
                        { color: Colors.info, label: '≥ 6 glasses' },
                        { color: Colors.info + 'AA', label: '3–5' },
                        { color: Colors.info + '44', label: '< 3' },
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
                style={{ borderLeftWidth: 4, borderLeftColor: colors.accent }}
              >
                <Typography variant="label" color={colors.accent} style={{ marginBottom: 6, fontWeight: '700' }}>
                  ✨ Juno insight
                </Typography>
                <Typography variant="body2" color={colors.textSecondary} style={{ lineHeight: 20 }}>
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
  container: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  header: { paddingTop: Spacing.sm, paddingBottom: 4 },
  rangeRow: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  rangeBtn: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: -4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
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
});
