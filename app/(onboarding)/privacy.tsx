import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';

const PRIVACY_POINTS = [
  { emoji: '📵', text: 'No internet connection required — ever.' },
  { emoji: '🚫', text: 'No user accounts, no sign-up, no sign-in.' },
  { emoji: '🔒', text: 'All data stored locally on your device only.' },
  { emoji: '🚀', text: 'No analytics, no ads, no tracking SDKs.' },
  { emoji: '📦', text: 'Export your data to a file you control, anytime.' },
  { emoji: '🗑️', text: 'Delete all your data instantly from Settings.' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setOnboardingComplete } = useSettingsStore();

  const handleFinish = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  }, [setOnboardingComplete, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography style={styles.emoji}>🛡️</Typography>
        <Typography variant="h2" align="center">Your privacy promise</Typography>
        <Typography
          variant="body2"
          align="center"
          color={colors.textSecondary}
          style={{ marginTop: Spacing.sm, marginBottom: Spacing.xl }}
        >
          Juno was built with privacy at its core. Here's what that means for you:
        </Typography>

        <Card style={{ width: '100%' }} padding={20}>
          {PRIVACY_POINTS.map((p, i) => (
            <View key={i} style={styles.point}>
              <Typography style={styles.pointEmoji}>{p.emoji}</Typography>
              <Typography variant="body2" style={{ flex: 1 }}>
                {p.text}
              </Typography>
            </View>
          ))}
        </Card>

        <View style={[styles.pledge, { backgroundColor: Colors.dustyRose + '22' }]}>
          <Typography variant="label" align="center" color={Colors.dustyRoseDark}>
            "Your body data belongs to you, and only you."
          </Typography>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="I understand — let's go!"
          onPress={handleFinish}
          fullWidth
          size="lg"
        />
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
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pointEmoji: { fontSize: 20, width: 28 },
  pledge: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: 16,
    width: '100%',
  },
  footer: { padding: Spacing.xl, paddingTop: 0 },
});
