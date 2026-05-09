import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { useSQLiteContext } from 'expo-sqlite';
import { insertCycle, upsertUser } from '../../lib/db/queries';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { format, subDays } from 'date-fns';

export default function CycleInfoScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { profile, updateProfile } = useUserStore();

  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [error, setError] = useState('');

  const quickDates = [
    { label: 'Today', days: 0 },
    { label: '3 days ago', days: 3 },
    { label: '1 week ago', days: 7 },
    { label: '2 weeks ago', days: 14 },
  ];

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

    // Persist to DB
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Typography style={styles.emoji}>📅</Typography>
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
        <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
          When did your last period start?
        </Typography>
        <View style={styles.quickDates}>
          {quickDates.map((q) => {
            const d = format(subDays(new Date(), q.days), 'yyyy-MM-dd');
            const selected = lastPeriod === d;
            return (
              <Button
                key={q.label}
                label={q.label}
                onPress={() => setLastPeriod(d)}
                variant={selected ? 'primary' : 'outline'}
                size="sm"
                style={{ marginBottom: 4 }}
              />
            );
          })}
        </View>
        <Input
          label="Or enter date (YYYY-MM-DD)"
          value={lastPeriod}
          onChangeText={setLastPeriod}
          placeholder="e.g. 2025-01-15"
          keyboardType="numeric"
          containerStyle={{ marginTop: Spacing.sm, marginBottom: Spacing.md }}
        />

        <Input
          label="Average cycle length (days)"
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="numeric"
          placeholder="28"
          containerStyle={{ marginBottom: Spacing.md }}
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
          containerStyle={{ marginTop: Spacing.md, marginBottom: Spacing.md }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    flexGrow: 1,
    alignItems: 'center',
  },
  emoji: { fontSize: 52, marginBottom: Spacing.md },
  quickDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  hint: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    width: '100%',
  },
  footer: { padding: Spacing.xl, paddingTop: 0 },
});
