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
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
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

  const [lastPeriod, setLastPeriod] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [error, setError] = useState('');

  const quickDates = [
    { label: 'Today', days: 0 },
    { label: '3 days ago', days: 3 },
    { label: '1 week ago', days: 7 },
    { label: '2 weeks ago', days: 14 },
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
    await insertCycle(db, lastPeriod);

    setError('');
    router.push('/(onboarding)/goal');
  };

  const displayDate = lastPeriod
    ? format(selectedDate, 'MMMM d, yyyy')
    : 'Tap to select date';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Typography style={styles.emoji}>📅</Typography>
          </View>
          <Typography variant="h2" align="center">Your cycle details</Typography>
          <Typography
            variant="body2"
            align="center"
            color={colors.textSecondary}
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}
          >
            These help us make accurate predictions from day one.
          </Typography>

          {/* Quick date pickers */}
          <Typography variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
            When did your last period start?
          </Typography>
          <View style={styles.quickDates}>
            {quickDates.map((q) => {
              const d = format(subDays(new Date(), q.days), 'yyyy-MM-dd');
              const isSelected = lastPeriod === d;
              return (
                <Button
                  key={q.label}
                  label={q.label}
                  onPress={() => handleQuickDate(q.days)}
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  style={{ flex: 1 }}
                />
              );
            })}
          </View>

          {/* Date picker tap target */}
          <View style={styles.datePickerContainer}>
            <Typography variant="label" color={colors.textSecondary} style={styles.dateLabel}>
              Or pick a date
            </Typography>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.datePicker,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: lastPeriod ? Colors.dustyRose : colors.border,
                  borderWidth: lastPeriod ? 1.5 : 1.5,
                },
              ]}
              activeOpacity={0.7}
            >
              <Typography
                style={[
                  styles.dateText,
                  { color: lastPeriod ? colors.text : colors.textTertiary, fontSize: FontSize.base },
                ]}
              >
                {displayDate}
              </Typography>
              <Typography style={styles.calendarIcon}>📆</Typography>
            </TouchableOpacity>
          </View>

          {/* iOS date picker in modal */}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Typography variant="label" color={Colors.dustyRose}>Done</Typography>
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

          <Input
            label="Average cycle length (days)"
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="numeric"
            placeholder="28"
            containerStyle={{ marginBottom: Spacing.sm, width: '100%' }}
          />
          <View style={[styles.hint, { backgroundColor: colors.surfaceSecondary }]}>
            <Typography variant="caption" color={colors.textTertiary}>
              The number of days from the first day of your period to the day before your next period. Most cycles are 21–35 days.
            </Typography>
          </View>

          <Input
            label="Average period length (days)"
            value={periodLength}
            onChangeText={setPeriodLength}
            keyboardType="numeric"
            placeholder="5"
            containerStyle={{ marginTop: Spacing.md, marginBottom: Spacing.md, width: '100%' }}
          />

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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  emoji: {
    fontSize: 52,
    textAlign: 'center',
    lineHeight: 64,
  },
  sectionLabel: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  quickDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: Spacing.md,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  dateLabel: {
    marginBottom: 6,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    height: 50,
    paddingHorizontal: Spacing.md,
  },
  dateText: {
    flex: 1,
  },
  calendarIcon: {
    fontSize: 18,
  },
  hint: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
});
