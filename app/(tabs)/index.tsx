import React, { useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Droplets, Smile, FileText } from 'lucide-react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';

import { CycleRing } from '../../components/widgets/CycleRing';
import { PhaseCard } from '../../components/widgets/PhaseCard';
import { Card } from '../../components/ui/Card';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/widgets/EmptyState';

import { useColors } from '../../hooks/useTheme';
import { useCycle } from '../../hooks/useCycle';
import { useUserStore } from '../../stores/userStore';

import { Colors } from '../../constants/colors';
import { Spacing, Shadow } from '../../constants/theme';
import { DAILY_INSIGHTS_BY_PHASE } from '../../constants/content';
import { formatDate, todayStr } from '../../lib/utils/date';
import { formatDaysUntil } from '../../lib/utils/formatting';
import { insertCycle } from '../../lib/db/queries';
import { useCycleStore } from '../../stores/cycleStore';

function QuickLogButton({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: typeof Plus;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.quickBtn,
        { backgroundColor: color + '22', borderColor: color },
      ]}
    >
      <Icon color={color} size={20} strokeWidth={2} />
      <Typography variant="caption" color={color} style={{ marginTop: 4, textAlign: 'center' }}>
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

function UpcomingStrip({ prediction }: { prediction: NonNullable<ReturnType<typeof useCycle>['prediction']> }) {
  const colors = useColors();

  const events = useMemo(() => [
    { label: 'Period', date: prediction.nextPeriodStart, color: Colors.dustyRose, emoji: '🔴' },
    { label: 'Fertile window', date: prediction.fertileWindowStart, color: Colors.success, emoji: '💚' },
    { label: 'Ovulation', date: prediction.ovulationDay, color: Colors.sageDark, emoji: '✨' },
  ], [prediction]);

  return (
    <Card style={styles.strip} padding={14}>
      <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 10 }}>
        Upcoming
      </Typography>
      {events.map((e) => (
        <View key={e.label} style={styles.eventRow}>
          <Typography style={{ fontSize: 16 }}>{e.emoji}</Typography>
          <Typography variant="body2" style={{ flex: 1 }}>
            {e.label}
          </Typography>
          <Typography variant="body2" color={e.color} style={{ fontWeight: '600' }}>
            {formatDate(e.date, 'MMM d')}
          </Typography>
        </View>
      ))}
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { prediction, reload, cycles } = useCycle();
  const { addCycle } = useCycleStore();
  const profile = useUserStore((s) => s.profile);
  const [refreshing, setRefreshing] = React.useState(false);

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
    return name ? `${timeGreeting}, ${name}` : timeGreeting;
  }, [profile?.name]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dustyRose} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h4">{greeting}</Typography>
          <Typography variant="caption" color={colors.textTertiary}>
            {formatDate(new Date(), 'EEEE, MMMM d')}
          </Typography>
        </View>

        {/* Cycle Ring */}
        {prediction ? (
          <>
            <View style={styles.ringWrap}>
              <CycleRing
                currentDay={prediction.currentCycleDay}
                cycleLength={prediction.avgCycleLength}
                phase={prediction.currentPhase}
                daysUntilPeriod={prediction.daysUntilNextPeriod}
                size={240}
              />
            </View>

            {/* Pregnancy chance card */}
            <Card style={styles.chanceCard} padding={14}>
              <View style={styles.chanceRow}>
                <Typography variant="label" color={colors.textSecondary}>
                  Pregnancy chance today
                </Typography>
                <Typography
                  variant="label"
                  color={
                    prediction.pregnancyChance === 'high' || prediction.pregnancyChance === 'very_high'
                      ? Colors.success
                      : Colors.dustyRose
                  }
                  style={{ textTransform: 'capitalize' }}
                >
                  {prediction.pregnancyChance.replace('_', ' ')}
                </Typography>
              </View>
            </Card>

            {/* Phase Card */}
            <PhaseCard phase={prediction.currentPhase} compact />

            {/* Upcoming events */}
            <UpcomingStrip prediction={prediction} />
          </>
        ) : (
          <EmptyState
            emoji="🌱"
            title="Getting started"
            description="Log your first period to unlock cycle predictions."
            actionLabel="Log period start"
            onAction={handleLogPeriod}
          />
        )}

        {/* Quick log buttons */}
        <Card style={styles.quickRow} padding={14}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Quick log
          </Typography>
          <View style={styles.quickButtons}>
            <QuickLogButton
              icon={Droplets}
              label="Period"
              color={Colors.dustyRose}
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
            />
          </View>
        </Card>

        {/* Daily insight */}
        {dailyInsight ? (
          <Card style={styles.insightCard} padding={16}>
            <Typography variant="label" color={Colors.gold} style={{ marginBottom: 6 }}>
              ✨ Daily insight
            </Typography>
            <Typography variant="body2" color={colors.textSecondary}>
              {dailyInsight}
            </Typography>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['2xl'] },
  header: { paddingVertical: Spacing.sm },
  ringWrap: { alignItems: 'center', paddingVertical: Spacing.md },
  chanceCard: { borderRadius: 14 },
  chanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strip: { borderRadius: 14 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  quickRow: { borderRadius: 16 },
  quickButtons: { flexDirection: 'row', gap: 12, justifyContent: 'space-around' },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  insightCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
});
