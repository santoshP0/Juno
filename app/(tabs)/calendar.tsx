import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getDaysInMonth, getDate } from 'date-fns';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { useColors, useTheme } from '../../hooks/useTheme';
import { useCycleStore } from '../../stores/cycleStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { buildCalendarMap } from '../../lib/predictions/algorithm';
import { formatDate } from '../../lib/utils/date';

type MarkedDates = Record<string, {
  selected?: boolean;
  marked?: boolean;
  dotColor?: string;
  selectedColor?: string;
  customStyles?: object;
}>;

function buildMarkedDates(calMap: Record<string, string[]>, today: string): MarkedDates {
  const marked: MarkedDates = {};

  Object.entries(calMap).forEach(([date, statuses]) => {
    const isToday = date === today;
    const hasPeriod = statuses.includes('period');
    const hasPredicted = statuses.includes('period_predicted');
    const hasOvulation = statuses.includes('ovulation');
    const hasFertile = statuses.includes('fertile');
    const hasLogged = statuses.includes('logged');

    let selectedColor: string | undefined;
    let dotColor: string | undefined;

    if (hasPeriod) selectedColor = Colors.calendar.period;
    else if (hasPredicted) selectedColor = Colors.calendar.periodPredicted;
    else if (hasOvulation) selectedColor = Colors.calendar.ovulation;
    else if (hasFertile) selectedColor = Colors.calendar.fertile;

    if (hasLogged) dotColor = Colors.calendar.logged;
    if (isToday && !selectedColor) selectedColor = Colors.calendar.today;

    marked[date] = {
      selected: !!selectedColor,
      selectedColor,
      marked: hasLogged,
      dotColor: dotColor ?? Colors.calendar.logged,
    };
  });

  return marked;
}

const LEGEND = [
  { color: Colors.calendar.period, label: 'Period' },
  { color: Colors.calendar.periodPredicted, label: 'Predicted period' },
  { color: Colors.calendar.ovulation, label: 'Ovulation' },
  { color: Colors.calendar.fertile, label: 'Fertile window' },
  { color: Colors.calendar.today, label: 'Today' },
];

const PHASE_SEGMENTS = [
  { color: Colors.phases.menstrual, name: 'Menstrual', flex: 1 },
  { color: Colors.phases.follicular, name: 'Follicular', flex: 1 },
  { color: Colors.phases.ovulation, name: 'Ovulation', flex: 1 },
  { color: Colors.phases.luteal, name: 'Luteal', flex: 1 },
];

export default function CalendarScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useColors();
  const { cycles, logs, prediction } = useCycleStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [today, setToday] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        setToday(format(new Date(), 'yyyy-MM-dd'));
      }
    });
    return () => sub.remove();
  }, []);

  const calMap = useMemo(() => {
    if (!prediction) return {};
    return buildCalendarMap(
      cycles,
      logs,
      prediction,
      startOfMonth(currentMonth),
      endOfMonth(currentMonth)
    );
  }, [cycles, logs, prediction, currentMonth]);

  const markedDates = useMemo(
    () => buildMarkedDates(calMap, today),
    [calMap, today]
  );

  const handleDayPress = useCallback(
    (day: { dateString: string }) => {
      router.push(`/log/${day.dateString}`);
    },
    [router]
  );

  const goPrev = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const goNext = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const goToday = useCallback(() => setCurrentMonth(new Date()), []);

  const selectedDayLog = useMemo(
    () => logs.find((l) => l.date === today),
    [logs, today]
  );

  // Phase ribbon: today marker position
  const todayMarkerPercent = useMemo(() => {
    const todayDate = new Date();
    const dayOfMonth = getDate(todayDate);
    const daysInMonth = getDaysInMonth(todayDate);
    return (dayOfMonth / daysInMonth) * 100;
  }, []);

  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      currentMonth.getFullYear() === now.getFullYear() &&
      currentMonth.getMonth() === now.getMonth()
    );
  }, [currentMonth]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Typography
              variant="label"
              style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}
              color={colors.textTertiary}
            >
              CALENDAR
            </Typography>
            <Typography variant="h3">{format(currentMonth, 'MMMM yyyy')}</Typography>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={goToday} style={[styles.todayBtn, { borderColor: colors.accent }]}>
              <Typography variant="label" color={colors.accent}>Today</Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goPrev}
              style={[styles.navBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <ChevronLeft color={colors.text} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              style={[styles.navBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <ChevronRight color={colors.text} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <Card padding={8} style={styles.calCard}>
          <Calendar
            key={`${format(currentMonth, 'yyyy-MM')}-${isDark ? 'dark' : 'light'}`}
            current={format(currentMonth, 'yyyy-MM-dd')}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            hideArrows
            hideExtraDays
            disableMonthChange
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.textSecondary,
              textSectionTitleDisabledColor: colors.textTertiary,
              dayTextColor: colors.text,
              todayTextColor: Colors.white,
              selectedDayTextColor: Colors.white,
              monthTextColor: colors.text,
              indicatorColor: colors.text,
              textDisabledColor: colors.textTertiary,
              dotColor: Colors.sage,
              selectedDotColor: Colors.white,
              arrowColor: colors.accent,
              disabledArrowColor: colors.textTertiary,
              'stylesheet.calendar.header': {
                header: { display: 'none' },
                dayHeader: {
                  color: colors.textSecondary,
                }
              } as any,
            }}
          />
        </Card>

        {/* Phase ribbon */}
        {prediction && (
          <View style={styles.phaseRibbonContainer}>
            <View style={styles.phaseRibbon}>
              {PHASE_SEGMENTS.map((seg, i) => (
                <View
                  key={seg.name}
                  style={[
                    styles.phaseSegment,
                    {
                      backgroundColor: seg.color + 'B3', // ~70% opacity
                      flex: seg.flex,
                      borderTopLeftRadius: i === 0 ? 3 : 0,
                      borderBottomLeftRadius: i === 0 ? 3 : 0,
                      borderTopRightRadius: i === PHASE_SEGMENTS.length - 1 ? 3 : 0,
                      borderBottomRightRadius: i === PHASE_SEGMENTS.length - 1 ? 3 : 0,
                    },
                  ]}
                />
              ))}
              {/* Today marker */}
              {isViewingCurrentMonth && (
                <View
                  style={[
                    styles.todayMarker,
                    {
                      left: `${todayMarkerPercent}%` as any,
                      backgroundColor: isDark ? Colors.white : '#1a1a1a',
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.phaseLabels}>
              {PHASE_SEGMENTS.map((seg) => (
                <Typography
                  key={seg.name}
                  style={styles.phaseLabel}
                  color={colors.textTertiary}
                >
                  {seg.name}
                </Typography>
              ))}
            </View>
          </View>
        )}

        {/* Legend — always visible horizontal strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legendStrip}
        >
          {LEGEND.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Typography style={styles.legendLabel} color={colors.textSecondary}>
                {l.label}
              </Typography>
            </View>
          ))}
        </ScrollView>

        {/* Today's summary */}
        <Card padding={16} style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Typography variant="label" color={colors.textSecondary}>
              Today — {formatDate(new Date(), 'MMM d')}
            </Typography>
          </View>

          {selectedDayLog ? (
            <View style={styles.statGrid}>
              {/* Flow tile */}
              <View style={[styles.statTile, { backgroundColor: colors.surfaceSecondary }]}>
                <Typography style={styles.statTileLabel} color={colors.textTertiary}>
                  FLOW
                </Typography>
                <Typography style={styles.statTileValue} color={colors.text}>
                  {selectedDayLog.flow ?? '—'}
                </Typography>
              </View>
              {/* Moods tile */}
              <View style={[styles.statTile, { backgroundColor: colors.surfaceSecondary }]}>
                <Typography style={styles.statTileLabel} color={colors.textTertiary}>
                  MOODS
                </Typography>
                <Typography style={styles.statTileValue} color={colors.text}>
                  {selectedDayLog.moods.length > 0 ? `${selectedDayLog.moods.length} moods` : '—'}
                </Typography>
              </View>
              {/* Symptoms tile */}
              <View style={[styles.statTile, { backgroundColor: colors.surfaceSecondary }]}>
                <Typography style={styles.statTileLabel} color={colors.textTertiary}>
                  SYMPTOMS
                </Typography>
                <Typography style={styles.statTileValue} color={colors.text}>
                  {selectedDayLog.symptoms.length > 0 ? `${selectedDayLog.symptoms.length} sympt.` : '—'}
                </Typography>
              </View>
              {/* Energy tile */}
              <View style={[styles.statTile, { backgroundColor: colors.surfaceSecondary }]}>
                <Typography style={styles.statTileLabel} color={colors.textTertiary}>
                  ENERGY
                </Typography>
                <Typography style={styles.statTileValue} color={colors.text}>
                  {selectedDayLog.energyLevel ?? '—'}
                </Typography>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push(`/log/${today}`)}
              style={[styles.logCtaBtn, { backgroundColor: colors.accent + '1F' }]}
            >
              <Typography
                variant="label"
                color={colors.accent}
                style={{ fontSize: 15, textAlign: 'center' }}
              >
                Log today →
              </Typography>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['2xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  headerLeft: {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCard: { borderRadius: Radius.xl },
  // Phase ribbon
  phaseRibbonContainer: { marginHorizontal: 16, marginTop: -4 },
  phaseRibbon: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  phaseSegment: { height: 6 },
  todayMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
  },
  phaseLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  phaseLabel: { fontSize: 9, flex: 1, textAlign: 'center' },
  // Legend strip
  legendStrip: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11 },
  // Today card
  todayCard: { borderRadius: Radius.xl },
  todayHeader: { marginBottom: 12 },
  statGrid: { flexDirection: 'row', gap: 8 },
  statTile: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  statTileLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statTileValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  logCtaBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
