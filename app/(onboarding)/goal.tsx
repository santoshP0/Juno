import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Droplets,
  Heart,
  Moon,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { Spacing } from '../../constants/theme';
import type { TrackingGoal } from '../../types';

interface GoalOption {
  key: TrackingGoal;
  icon: React.ComponentType<{ size: number; color: string }>;
  phaseColor: string;
  title: string;
  description: string;
}

const GOALS: GoalOption[] = [
  {
    key: 'track',
    icon: Droplets,
    phaseColor: '#E8A598',
    title: 'Track my period',
    description: 'Know when to expect your next cycle',
  },
  {
    key: 'understand',
    icon: Heart,
    phaseColor: '#C2847A',
    title: 'Understand my body',
    description: 'Track patterns, learn about cycles',
  },
  {
    key: 'avoid_pregnancy',
    icon: Moon,
    phaseColor: '#B8A5C8',
    title: 'Avoid pregnancy',
    description: 'Identify fertile and safe windows',
  },
  {
    key: 'ttc',
    icon: Sparkles,
    phaseColor: '#F5C37A',
    title: 'Trying to conceive',
    description: 'Maximize chances around ovulation',
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
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
        >
          <ChevronLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.stepCounter}>
          <Typography
            style={[styles.stepText, { color: colors.textSecondary }]}
          >
            3 of 5
          </Typography>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.accent, width: `${(3 / 5) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Typography style={[styles.eyebrow, { color: colors.accent }]}>
          Your goal
        </Typography>
        <Typography style={[styles.title, { color: colors.text }]}>
          Why are you here?
        </Typography>
        <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
          We'll tailor the app to what matters to you. You can change this later.
        </Typography>

        <View style={styles.cards}>
          {GOALS.map((g) => {
            const isSelected = selected === g.key;
            const IconComponent = g.icon;
            return (
              <TouchableOpacity
                key={g.key}
                onPress={() => handleSelect(g.key)}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.text : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {/* Icon box */}
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: g.phaseColor + '47' },
                  ]}
                >
                  <IconComponent size={18} color={g.phaseColor} />
                </View>

                {/* Text */}
                <View style={styles.cardText}>
                  <Typography style={styles.cardTitle}>
                    {g.title}
                  </Typography>
                  <Typography
                    style={[styles.cardDesc, { color: colors.textSecondary }]}
                  >
                    {g.description}
                  </Typography>
                </View>

                {/* Radio */}
                <View
                  style={[
                    styles.radio,
                    isSelected
                      ? {
                          backgroundColor: colors.text,
                          borderColor: colors.text,
                          borderWidth: 0,
                        }
                      : {
                          backgroundColor: 'transparent',
                          borderColor: colors.border,
                          borderWidth: 1.5,
                        },
                  ]}
                >
                  {isSelected && (
                    <Check size={12} color={colors.background} />
                  )}
                </View>
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

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    alignItems: 'flex-end',
  },
  stepText: {
    fontSize: 10.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Progress bar
  progressTrack: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Cards
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
