import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { useCycleStore } from '../../stores/cycleStore';
import { useSQLiteContext } from 'expo-sqlite';
import { insertCycle, upsertUser } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import { format, subDays } from 'date-fns';

export default function CycleInfoScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { profile, updateProfile } = useUserStore();
  const { addCycle } = useCycleStore();

  const [lastPeriod, setLastPeriod] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [error, setError] = useState('');

  const quickDates = [
    { label: 'Today', days: 0 },
    { label: '3 days', days: 3 },
    { label: '1 week', days: 7 },
    { label: '2 weeks', days: 14 },
  ];

  const handleQuickDate = (days: number) => {
    const d = subDays(new Date(), days);
    setSelectedDate(d);
    setLastPeriod(format(d, 'yyyy-MM-dd'));
  };

  const handleDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setLastPeriod(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleNext = async () => {
    const cycleNum = parseInt(cycleLength, 10);
    const periodNum = parseInt(periodLength, 10);

    if (!lastPeriod) {
      setError('Please enter or select your last period start date.');
      return;
    }
    if (isNaN(cycleNum) || cycleNum < 15 || cycleNum > 60) {
      setError('Cycle length should be between 15 and 60 days.');
      return;
    }
    if (isNaN(periodNum) || periodNum < 1 || periodNum > 14) {
      setError('Period length should be between 1 and 14 days.');
      return;
    }

    updateProfile({ avgCycleLength: cycleNum, avgPeriodLength: periodNum });

    const updatedProfile = {
      ...profile,
      avgCycleLength: cycleNum,
      avgPeriodLength: periodNum,
    };
    await upsertUser(db, updatedProfile as any);
    const id = await insertCycle(db, lastPeriod);

    // Update store so predictions can be calculated
    addCycle({
      id,
      startDate: lastPeriod,
      endDate: null,
      length: null,
      periodLength: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setError('');
    router.push('/(onboarding)/goal');
  };

  const displayDate = lastPeriod
    ? format(selectedDate, 'MMMM d, yyyy')
    : 'Tap to select date';

  const cycleLengthNum = parseInt(cycleLength, 10) || 28;
  const periodLengthNum = parseInt(periodLength, 10) || 5;

  const handleCycleDecrement = () => {
    const next = Math.max(21, cycleLengthNum - 1);
    setCycleLength(String(next));
  };
  const handleCycleIncrement = () => {
    const next = Math.min(40, cycleLengthNum + 1);
    setCycleLength(String(next));
  };
  const handlePeriodDecrement = () => {
    const next = Math.max(2, periodLengthNum - 1);
    setPeriodLength(String(next));
  };
  const handlePeriodIncrement = () => {
    const next = Math.min(10, periodLengthNum + 1);
    setPeriodLength(String(next));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* OnbHeader */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            />
            <View
              style={[
                styles.progressBarFillActive,
                { backgroundColor: colors.accent, width: `${(2 / 5) * 100}%` },
              ]}
            />
          </View>
          <Typography style={[styles.stepCounter, { color: colors.textSecondary }]}>
            2 of 5
          </Typography>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Eyebrow + Title + Subtitle */}
          <Typography
            style={[styles.eyebrow, { color: colors.accent }]}
          >
            YOUR CYCLE
          </Typography>
          <Typography style={[styles.title, { color: colors.text }]}>
            A bit about your cycle.
          </Typography>
          <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
            A rough estimate is fine — we fine-tune as you log.
          </Typography>

          {/* Last period section */}
          <Typography style={[styles.sectionLabel, { color: colors.text }]}>
            When did your last period start?
          </Typography>

          {/* Quick date chip row */}
          <View style={styles.quickDates}>
            {quickDates.map((q) => {
              const d = format(subDays(new Date(), q.days), 'yyyy-MM-dd');
              const isSelected = lastPeriod === d;
              return (
                <TouchableOpacity
                  key={q.label}
                  onPress={() => handleQuickDate(q.days)}
                  activeOpacity={0.7}
                  style={[
                    styles.chipButton,
                    {
                      backgroundColor: isSelected ? colors.text : colors.surfaceSecondary,
                    },
                  ]}
                >
                  <Typography
                    style={[
                      styles.chipText,
                      { color: isSelected ? colors.background : colors.textSecondary },
                    ]}
                  >
                    {q.label}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Specific date picker tap target */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={[styles.dateCard, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Typography style={[styles.dateCardLabel, { color: colors.textSecondary }]}>
              Or pick a specific date
            </Typography>
            <Typography
              style={[
                styles.dateCardValue,
                { color: lastPeriod ? colors.text : colors.textTertiary },
              ]}
            >
              {displayDate}
            </Typography>
          </TouchableOpacity>

          {/* iOS date picker in modal */}
          {Platform.OS === 'ios' && (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Typography variant="label" color={colors.accent}>Done</Typography>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={subDays(new Date(), 365)}
                    textColor={colors.text}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Android inline picker */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={subDays(new Date(), 365)}
            />
          )}

          {/* Cycle length stepper */}
          <View
            style={[
              styles.stepperCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Typography style={[styles.stepperLabel, { color: colors.textSecondary }]}>
              CYCLE LENGTH
            </Typography>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={handleCycleDecrement}
                activeOpacity={0.7}
                style={[styles.stepperButtonMinus, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Typography style={styles.stepperButtonTextMinus}>−</Typography>
              </TouchableOpacity>
              <View style={styles.stepperCenter}>
                <Typography style={[styles.stepperNumber, { color: colors.text }]}>
                  {cycleLengthNum}
                </Typography>
                <Typography style={[styles.stepperUnit, { color: colors.textSecondary }]}>
                  DAYS
                </Typography>
              </View>
              <TouchableOpacity
                onPress={handleCycleIncrement}
                activeOpacity={0.7}
                style={[styles.stepperButtonPlus, { backgroundColor: colors.text }]}
              >
                <Typography style={[styles.stepperButtonTextPlus, { color: colors.background }]}>
                  +
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Period length stepper */}
          <View
            style={[
              styles.stepperCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Typography style={[styles.stepperLabel, { color: colors.textSecondary }]}>
              PERIOD LENGTH
            </Typography>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={handlePeriodDecrement}
                activeOpacity={0.7}
                style={[styles.stepperButtonMinus, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Typography style={styles.stepperButtonTextMinus}>−</Typography>
              </TouchableOpacity>
              <View style={styles.stepperCenter}>
                <Typography style={[styles.stepperNumber, { color: colors.text }]}>
                  {periodLengthNum}
                </Typography>
                <Typography style={[styles.stepperUnit, { color: colors.textSecondary }]}>
                  DAYS
                </Typography>
              </View>
              <TouchableOpacity
                onPress={handlePeriodIncrement}
                activeOpacity={0.7}
                style={[styles.stepperButtonPlus, { backgroundColor: colors.text }]}
              >
                <Typography style={[styles.stepperButtonTextPlus, { color: colors.background }]}>
                  +
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info box */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.accent + '18' },
            ]}
          >
            <Sparkles size={14} color={colors.accent} style={{ marginTop: 1 }} />
            <Typography
              style={[styles.infoText, { color: colors.textSecondary }]}
            >
              Most cycles are 21–35 days. We'll refine predictions as you log more.
            </Typography>
          </View>

          {error ? (
            <Typography variant="caption" color={Colors.error} style={{ marginBottom: Spacing.sm }}>
              {error}
            </Typography>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Continue" onPress={handleNext} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // OnbHeader
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 3,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  progressBarFillActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 10.5,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },

  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  quickDates: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  dateCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: Spacing.md,
  },
  dateCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateCardValue: {
    fontSize: 15,
  },

  stepperCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButtonMinus: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonTextMinus: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
    textAlign: 'center',
  },
  stepperCenter: {
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 54,
  },
  stepperUnit: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  stepperButtonPlus: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonTextPlus: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
    textAlign: 'center',
  },

  infoBox: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 17,
    flex: 1,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    padding: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerDark,
  },
});
