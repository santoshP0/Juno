import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Smile, FileText, Settings, Sparkles, Egg, ChevronRight } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

import { CycleRing } from '../../components/widgets/CycleRing';
import { PhaseCard } from '../../components/widgets/PhaseCard';
import { Card } from '../../components/ui/Card';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/widgets/EmptyState';

import { useColors } from '../../hooks/useTheme';
import { useCycle } from '../../hooks/useCycle';
import { useUserStore } from '../../stores/userStore';

import { Colors } from '../../constants/colors';
import { Spacing, Shadow, Radius } from '../../constants/theme';
import { useWidgetSync } from '../../hooks/useWidgetSync';
import { DAILY_INSIGHTS_BY_PHASE } from '../../constants/content';
import { formatDate, todayStr } from '../../lib/utils/date';
import { format, subDays } from 'date-fns';
import { insertCycle } from '../../lib/db/queries';
import { useCycleStore } from '../../stores/cycleStore';
import type { CyclePhase } from '../../types';


const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

const PREGNANCY_CHANCE_COLOR: Record<string, string> = {
  very_low: Colors.sage,
  low: Colors.sage,
  medium: Colors.gold,
  high: Colors.success,
  very_high: Colors.success,
};

const PREGNANCY_CHANCE_SEGMENTS: Record<string, number> = {
  very_low: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5,
};

const PREGNANCY_CHANCE_LABELS = ['Very low', 'Low', 'Med', 'High', 'V. high'];

// Dummy sparkline data per stat
const SPARKLINE_CYCLE_DAY = [8, 12, 16, 19, 14, 19, 19];
const SPARKLINE_AVG_LENGTH = [28, 29, 27, 28, 28, 29, 28];
const SPARKLINE_PERIOD_IN  = [14, 10, 12, 9, 11, 10, 9];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 56;
  const H = 12;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <Svg width={W} height={H} style={{ marginTop: 6 }}>
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MiniStat({
  label,
  value,
  color,
  sparklineData,
}: {
  label: string;
  value: string;
  color: string;
  sparklineData: number[];
}) {
  const colors = useColors();
  return (
    <View style={[styles.miniStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Typography
        variant="caption"
        color={colors.textTertiary}
        align="center"
        style={{ marginBottom: 2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="label"
        color={color}
        align="center"
        style={{ fontWeight: '700' }}
      >
        {value}
      </Typography>
      <Sparkline data={sparklineData} color={color} />
    </View>
  );
}

function QuickLogButton({
  icon: Icon,
  label,
  color,
  onPress,
  primary,
}: {
  icon: typeof Droplets;
  label: string;
  color: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const colors = useColors();

  if (primary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.quickBtn, { backgroundColor: colors.text, borderColor: 'transparent' }]}
      >
        <View style={[styles.quickBtnIcon, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Icon color={colors.background} size={22} strokeWidth={2} />
        </View>
        <Typography
          variant="caption"
          color={colors.background}
          align="center"
          style={{ marginTop: 6, fontWeight: '600' }}
        >
          {label}
        </Typography>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.quickBtn, { backgroundColor: color + '18', borderColor: color + '55' }]}
    >
      <View style={[styles.quickBtnIcon, { backgroundColor: color + '22' }]}>
        <Icon color={color} size={22} strokeWidth={2} />
      </View>
      <Typography
        variant="caption"
        color={color}
        align="center"
        style={{ marginTop: 6, fontWeight: '600' }}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

function UpcomingCard({
  Icon,
  label,
  dateStr,
  color,
}: {
  Icon: typeof Droplets;
  label: string;
  dateStr: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.upcomingCard, { backgroundColor: color + '12', borderColor: color + '30' }]}>
      <View style={[styles.upcomingIconBox, { backgroundColor: color + '28' }]}>
        <Icon color={color} size={16} strokeWidth={2} />
      </View>
      <Typography
        variant="caption"
        color={colors.textTertiary}
        align="center"
        style={{ marginTop: 6, marginBottom: 2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="label"
        color={color}
        align="center"
        style={{ fontWeight: '700' }}
      >
        {dateStr}
      </Typography>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { prediction, reload, cycles, error: cycleError } = useCycle();
  const { addCycle, isLoaded } = useCycleStore();
  const profile = useUserStore((s) => s.profile);
  const [refreshing, setRefreshing] = React.useState(false);

  // Load cycle data from DB on mount (store is not persisted)
  useEffect(() => {
    if (!isLoaded) reload();
  }, []);

  // Keep Android home screen widget in sync
  useWidgetSync(prediction ?? null);

  const dailyInsight = useMemo(() => {
    if (!prediction) return '';
    const insights = DAILY_INSIGHTS_BY_PHASE[prediction.currentPhase];
    return insights[new Date().getDate() % insights.length];
  }, [prediction]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const handleLogPeriod = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const today = todayStr();
    const id = await insertCycle(db, today);
    addCycle({
      id,
      startDate: today,
      endDate: null,
      length: null,
      periodLength: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await reload();
    router.push(`/log/${today}`);
  }, [db, addCycle, reload, router]);

  const handleQuickLog = useCallback(() => {
    router.push(`/log/${todayStr()}`);
  }, [router]);

  const greeting = useMemo(() => {
    const name = profile?.name;
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return name ? `${timeGreeting}, ${name} ✨` : `${timeGreeting} ✨`;
  }, [profile?.name]);

  const phaseColor = colors.accent;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── DB error banner ─────────────────────────────── */}
        {cycleError && (
          <View style={[styles.errorBanner, { backgroundColor: Colors.error + '18', borderColor: Colors.error + '40' }]}>
            <Typography variant="caption" color={Colors.error}>{cycleError}</Typography>
          </View>
        )}

        {/* ── Header ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <View>
            <Typography variant="h4" style={{ fontWeight: '700' }}>
              {greeting}
            </Typography>
            <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
              {formatDate(new Date(), 'EEEE, MMMM d')}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Settings size={18} color={colors.textSecondary} strokeWidth={1.8} />
          </TouchableOpacity>
        </Animated.View>

        {prediction ? (
          <>
            {/* ── Cycle Ring Hero ─────────────────────────── */}
            <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.heroSection}>
              <CycleRing
                currentDay={prediction.currentCycleDay}
                cycleLength={prediction.avgCycleLength}
                phase={prediction.currentPhase}
                daysUntilPeriod={prediction.daysUntilNextPeriod}
                size={240}
              />
            </Animated.View>

            {/* ── Mini stats strip ────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.miniStatsRow}>
              <MiniStat
                label="Cycle day"
                value={`${prediction.currentCycleDay}`}
                color={phaseColor}
                sparklineData={SPARKLINE_CYCLE_DAY}
              />
              <MiniStat
                label="Avg length"
                value={`${prediction.avgCycleLength}d`}
                color={Colors.sage}
                sparklineData={SPARKLINE_AVG_LENGTH}
              />
              <MiniStat
                label="Period in"
                value={
                  prediction.daysUntilNextPeriod > 0
                    ? `${prediction.daysUntilNextPeriod}d`
                    : prediction.daysUntilNextPeriod === 0
                    ? 'Today'
                    : 'Overdue'
                }
                color={prediction.daysUntilNextPeriod < 0 ? Colors.error : Colors.gold}
                sparklineData={SPARKLINE_PERIOD_IN}
              />
            </Animated.View>

            {/* ── Overdue period banner ───────────────────── */}
            {prediction.daysUntilNextPeriod < -1 && (
              <Animated.View entering={FadeInDown.delay(240).duration(500)}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    const expectedStart = format(
                      subDays(new Date(), Math.abs(prediction.daysUntilNextPeriod)),
                      'yyyy-MM-dd'
                    );
                    router.push(`/log/${expectedStart}`);
                  }}
                  style={[styles.overdueBanner, {
                    backgroundColor: '#E8A598' + '15',
                    borderColor: '#E8A598' + '50',
                    borderRadius: 20,
                    borderWidth: 1,
                  }]}
                >
                  {/* Droplet icon box */}
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8A598' + '30', alignItems: 'center', justifyContent: 'center' }}>
                    <Droplets size={20} color='#E8A598' />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Typography style={{ fontSize: 15, fontWeight: '700', color: '#C2847A' }}>
                      Period {Math.abs(prediction.daysUntilNextPeriod)} days late
                    </Typography>
                    <Typography style={{ fontSize: 12, lineHeight: 17 }} color={colors.textSecondary}>
                      Did it start? Tap to log — completely normal.
                    </Typography>
                  </View>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8A598' + '30', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={16} color='#C2847A' />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── Phase card ──────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(250).duration(500)}>
              <PhaseCard phase={prediction.currentPhase} compact />
            </Animated.View>

            {/* ── Pregnancy chance ────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Card style={styles.chanceCard} padding={14}>
                <View style={styles.chanceRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Typography variant="body2" color={colors.textSecondary}>
                      Pregnancy chance today
                    </Typography>
                    {/* 5-segment pill strip */}
                    <View style={styles.chanceSegmentsRow}>
                      {Array.from({ length: 5 }, (_, i) => {
                        const activeCount = PREGNANCY_CHANCE_SEGMENTS[prediction.pregnancyChance] ?? 1;
                        const segColor = PREGNANCY_CHANCE_COLOR[prediction.pregnancyChance] ?? Colors.sage;
                        const isActive = i < activeCount;
                        return (
                          <View
                            key={i}
                            style={[
                              styles.chanceSegment,
                              { backgroundColor: isActive ? segColor : colors.surfaceSecondary },
                            ]}
                          />
                        );
                      })}
                    </View>
                    {/* Labels below segments */}
                    <View style={styles.chanceSegmentLabelsRow}>
                      {PREGNANCY_CHANCE_LABELS.map((lbl) => (
                        <Typography
                          key={lbl}
                          style={[styles.chanceSegmentLabel, { color: colors.textTertiary }]}
                        >
                          {lbl}
                        </Typography>
                      ))}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.chanceBadge,
                      {
                        backgroundColor:
                          (PREGNANCY_CHANCE_COLOR[prediction.pregnancyChance] ?? Colors.sage) + '20',
                      },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      color={PREGNANCY_CHANCE_COLOR[prediction.pregnancyChance] ?? Colors.sage}
                      style={{ fontWeight: '700', textTransform: 'capitalize' }}
                    >
                      {prediction.pregnancyChance.replace('_', ' ')}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 8, fontSize: 10, fontStyle: 'italic' }}>
                  This estimate is based on your data and is not a substitute for medical advice or contraception.
                </Typography>
              </Card>
            </Animated.View>

            {/* ── Upcoming events ─────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <Card padding={16} style={styles.sectionCard}>
                <Typography variant="label" color={colors.textSecondary} style={{ fontWeight: '600', marginBottom: 12 }}>
                  Upcoming
                </Typography>
                <View style={styles.upcomingRow}>
                  <UpcomingCard
                    Icon={Droplets}
                    label="Period"
                    dateStr={formatDate(prediction.nextPeriodStart, 'MMM d')}
                    color={colors.accent}
                  />
                  <UpcomingCard
                    Icon={Sparkles}
                    label="Fertile"
                    dateStr={formatDate(prediction.fertileWindowStart, 'MMM d')}
                    color={Colors.success}
                  />
                  <UpcomingCard
                    Icon={Egg}
                    label="Ovulation"
                    dateStr={formatDate(prediction.ovulationDay, 'MMM d')}
                    color={Colors.sage}
                  />
                </View>
              </Card>
            </Animated.View>
          </>
        ) : isLoaded ? (
          <EmptyState
            emoji="🌱"
            title="Getting started"
            description="Log your first period to unlock cycle predictions and insights."
            actionLabel="Log period start"
            onAction={handleLogPeriod}
          />
        ) : null}

        {/* ── Quick log ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Card padding={16} style={styles.sectionCard}>
            <Typography
              variant="caption"
              color={colors.textTertiary}
              style={styles.quickLogSectionLabel}
            >
              QUICK LOG · TODAY
            </Typography>
            <View style={styles.quickButtons}>
              <QuickLogButton
                icon={Droplets}
                label="Period"
                color={colors.accent}
                onPress={handleLogPeriod}
              />
              <QuickLogButton
                icon={Smile}
                label="Mood"
                color={Colors.sage}
                onPress={handleQuickLog}
              />
              <QuickLogButton
                icon={FileText}
                label="Log day"
                color={Colors.gold}
                onPress={handleQuickLog}
                primary
              />
            </View>
          </Card>
        </Animated.View>

        {/* ── Daily insight ────────────────────────────────── */}
        {dailyInsight ? (
          <Animated.View entering={FadeInDown.delay(450).duration(500)}>
            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderLeftColor: Colors.gold,
                },
              ]}
            >
              <Typography
                variant="label"
                color={Colors.gold}
                style={{ marginBottom: 8, fontWeight: '700' }}
              >
                ✨ Daily insight
              </Typography>
              <Typography variant="body2" color={colors.textSecondary} style={{ lineHeight: 22 }}>
                {dailyInsight}
              </Typography>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.sm + 4,
    paddingBottom: Spacing['2xl'] + 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: 4,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    position: 'relative',
  },
  ringGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  ringGlowOuter: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  miniStat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadow.sm,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  overdueLogBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chanceCard: {
    borderRadius: Radius.xl,
  },
  chanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chanceSegmentsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  chanceSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  chanceSegmentLabelsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chanceSegmentLabel: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center',
  },
  chanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sectionCard: {
    borderRadius: Radius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  upcomingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  upcomingCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  upcomingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLogSectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
  },
  insightCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: Spacing.md,
    ...Shadow.sm,
  },
});
