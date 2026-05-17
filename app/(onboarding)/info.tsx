import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ThemePicker } from '../../components/ui/ThemePicker';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
import type { AccentThemeKey } from '../../types';

export default function InfoScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile, updateProfile } = useUserStore();
  const { accentTheme, setAccentTheme } = useSettingsStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [birthYear, setBirthYear] = useState(
    profile?.birthYear ? String(profile.birthYear) : ''
  );
  const [error, setError] = useState('');

  const handleNext = () => {
    const yearNum = parseInt(birthYear, 10);
    const thisYear = new Date().getFullYear();

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!birthYear || isNaN(yearNum) || yearNum < 1920 || yearNum > thisYear - 8) {
      setError('Please enter a valid birth year.');
      return;
    }

    updateProfile({ name: name.trim(), birthYear: yearNum });
    setError('');
    router.push('/(onboarding)/cycle-info');
  };

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
            1 of 5
          </Typography>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.accent, width: `${(1 / 5) * 100}%` },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Typography style={[styles.eyebrow, { color: colors.accent }]}>
            About you
          </Typography>
          <Typography style={[styles.title, { color: colors.text }]}>
            Tell us about you
          </Typography>
          <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
            This stays on your device and helps personalize your experience.
          </Typography>

          <Input
            label="First name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            autoCapitalize="words"
            returnKeyType="next"
            containerStyle={styles.input}
          />

          <Input
            label="Birth year"
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder={`e.g. ${new Date().getFullYear() - 25}`}
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="done"
            containerStyle={styles.input}
          />

          {error ? (
            <Typography variant="caption" color={Colors.error} style={styles.error}>
              {error}
            </Typography>
          ) : null}

          <ThemePicker
            value={accentTheme ?? 'rose'}
            onChange={(key: AccentThemeKey) => setAccentTheme(key)}
          />
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
  input: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  error: {
    marginTop: 4,
    marginBottom: Spacing.sm,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
