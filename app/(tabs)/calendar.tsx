import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { useColors } from '../../hooks/useTheme';
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

    if (hasPeriod) selectedColor = Colors.dustyRose;
    else if (hasPredicted) selectedColor = Colors.dustyRoseLight;
    else if (hasOvulation) selectedColor = Colors.success;
    else if (hasFertile) selectedColor = Colors.sageLight;

    if (hasLogged) dotColor = Colors.sage;
    if (isToday && !selectedColor) selectedColor = Colors.plum;

    marked[date] = {
      selected: !!selectedColor,
      selectedColor,
      marked: hasLogged,
      dotColor: dotColor ?? Colors.sage,
    };
  });

  return marked;
}

const LEGEND = [
  { color: Colors.dustyRose, label: 'Period' },
  { color: Colors.dustyRoseLight, label: 'Predicted period' },
  { color: Colors.success, label: 'Ovulation' },
  { color: Colors.sageLight, label: 'Fertile window' },
  { color: Colors.plum, label: 'Today' },
];

export default function CalendarScreen() {
  const router = useRouter();
  const colors = useColors();
  const { cycles, logs, prediction } = useCycleStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showLegend, setShowLegend] = useState(false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Typography variant="h3">{format(currentMonth, 'MMMM yyyy')}</Typography>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
              <Typography variant="label" color={Colors.dustyRose}>Today</Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={goPrev} style={styles.navBtn}>
              <ChevronLeft color={colors.text} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.navBtn}>
              <ChevronRight color={colors.text} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar */}
        <Card padding={8} style={styles.calCard}>
          <Calendar
            key={format(currentMonth, 'yyyy-MM')}
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
              dayTextColor: colors.text,
              todayTextColor: '#fff',
              selectedDayTextColor: '#fff',
              monthTextColor: colors.text,
              arrowColor: Colors.dustyRose,
              dotColor: Colors.sage,
              selectedDotColor: '#fff',
              'stylesheet.calendar.header': {
                header: { display: 'none' },
              } as any,
            }}
          />
        </Card>

        {/* Legend toggle */}
        <TouchableOpacity
          onPress={() => setShowLegend((v) => !v)}
          style={styles.legendToggle}
        >
          <Typography variant="label" color={Colors.dustyRose}>
            {showLegend ? 'Hide legend' : 'Show legend'}
          </Typography>
        </TouchableOpacity>

        {showLegend && (
          <Card padding={14} style={styles.legendCard}>
            {LEGEND.map((l) => (
              <View key={l.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Typography variant="body2" color={colors.textSecondary}>
                  {l.label}
                </Typography>
              </View>
            ))}
          </Card>
        )}

        {/* Today's summary */}
        <Card padding={16} style={styles.todayCard}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 8 }}>
            Today — {formatDate(new Date(), 'MMM d')}
          </Typography>
          {selectedDayLog ? (
            <View style={styles.logSummary}>
              {selectedDayLog.flow && (
                <Typography variant="body2">
                  Flow: <Typography variant="label">{selectedDayLog.flow}</Typography>
                </Typography>
              )}
              {selectedDayLog.moods.length > 0 && (
                <Typography variant="body2">
                  Mood: <Typography variant="label">{selectedDayLog.moods.join(', ')}</Typography>
                </Typography>
              )}
              {selectedDayLog.symptoms.length > 0 && (
                <Typography variant="body2">
                  Symptoms: <Typography variant="label">{selectedDayLog.symptoms.length} logged</Typography>
                </Typography>
              )}
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push(`/log/${today}`)}>
              <Typography variant="body2" color={Colors.dustyRose}>
                Tap to log today →
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
  todayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.dustyRose },
  navBtn: { padding: 6 },
  calCard: { borderRadius: Radius.xl },
  legendToggle: { alignSelf: 'flex-end', paddingVertical: 4 },
  legendCard: { borderRadius: Radius.xl },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  todayCard: { borderRadius: Radius.xl },
  logSummary: { gap: 4 },
});
