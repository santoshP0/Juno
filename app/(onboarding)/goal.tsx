import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/theme';
import type { TrackingGoal } from '../../types';

interface GoalOption {
  key: TrackingGoal;
  emoji: string;
  title: string;
  description: string;
}

const GOALS: GoalOption[] = [
  {
    key: 'track',
    emoji: '📅',
    title: 'Track my period',
    description: 'Know when to expect your next cycle and understand your symptoms.',
  },
  {
    key: 'ttc',
    emoji: '🌱',
    title: 'Trying to conceive',
    description: 'Maximize your fertile window with precise ovulation tracking.',
  },
  {
    key: 'avoid_pregnancy',
    emoji: '🛡️',
    title: 'Avoiding pregnancy',
    description: 'Stay aware of fertile days and plan accordingly.',
  },
  {
    key: 'understand',
    emoji: '🔬',
    title: 'Understand my body',
    description: 'Deep dive into how your hormones and cycle affect everything.',
  },
];

export default function GoalScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setGoal } = useUserStore();
  const [selected, setSelected] = useState<TrackingGoal | null>(null);

  const handleSelect = useCallback((key: TrackingGoal) => {
    setSelected(key);
  }, []);

  const handleNext = useCallback(() => {
    if (!selected) return;
    setGoal(selected);
    router.push('/(onboarding)/pin');
  }, [selected, setGoal, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography style={styles.emoji}>🎯</Typography>
        <Typography variant="h2" align="center">What brings you here?</Typography>
        <Typography
          variant="body2"
          align="center"
          color={colors.textSecondary}
          style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}
        >
          This helps us tailor your experience. You can change this any time.
        </Typography>

        <View style={styles.options}>
          {GOALS.map((g) => {
            const isSelected = selected === g.key;
            return (
              <TouchableOpacity
                key={g.key}
                onPress={() => handleSelect(g.key)}
                activeOpacity={0.8}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? Colors.dustyRose : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  isSelected && Shadow.sm,
                ]}
              >
                <Typography style={styles.optionEmoji}>{g.emoji}</Typography>
                <View style={styles.optionText}>
                  <Typography variant="label" style={{ marginBottom: 2 }}>
                    {g.title}
                  </Typography>
                  <Typography variant="caption" color={colors.textSecondary}>
                    {g.description}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? Colors.dustyRose : colors.border,
                      backgroundColor: isSelected ? Colors.dustyRose : 'transparent',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          onPress={handleNext}
          fullWidth
          size="lg"
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.xl, flexGrow: 1, alignItems: 'center' },
  emoji: { fontSize: 52, marginBottom: Spacing.md },
  options: { width: '100%', gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    gap: Spacing.md,
  },
  optionEmoji: { fontSize: 28 },
  optionText: { flex: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  footer: { padding: Spacing.xl, paddingTop: 0 },
});
