import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useUserStore } from '../../stores/userStore';
import { Spacing } from '../../constants/theme';

export default function InfoScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile, updateProfile } = useUserStore();

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Typography style={styles.emoji}>🌸</Typography>
          <Typography variant="h2" align="center">Tell us a bit about you</Typography>
          <Typography
            variant="body2"
            align="center"
            color={colors.textSecondary}
            style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}
          >
            This stays on your device and helps personalize your experience.
          </Typography>

          <Input
            label="First name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            autoCapitalize="words"
            returnKeyType="next"
            containerStyle={{ marginBottom: Spacing.md }}
          />

          <Input
            label="Birth year"
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder={`e.g. ${new Date().getFullYear() - 25}`}
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="done"
            containerStyle={{ marginBottom: Spacing.md }}
          />

          {error ? (
            <Typography variant="caption" color="#C9686B" style={{ marginBottom: Spacing.sm }}>
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
    padding: Spacing.xl,
    flexGrow: 1,
    alignItems: 'center',
  },
  emoji: { fontSize: 52, marginBottom: Spacing.md },
  footer: {
    padding: Spacing.xl,
    paddingTop: 0,
  },
});
