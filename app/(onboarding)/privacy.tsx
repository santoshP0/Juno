import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Sparkles, Bell, BellOff, ShieldOff } from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '../../lib/notifications';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import { scheduleAllNotifications } from '../../lib/notifications';
import { useCycleStore } from '../../stores/cycleStore';
import { useUserStore } from '../../stores/userStore';
import { calculatePredictions } from '../../lib/predictions/algorithm';

const FEATURE_ROWS = [
  {
    icon: Sparkles,
    title: 'On-device by default',
    desc: 'Your cycle data is stored locally on this phone. Never uploaded.',
  },
  {
    icon: Bell,
    title: 'Encrypted local backup',
    desc: 'Export a passphrase-protected file you control, anytime.',
  },
  {
    icon: ShieldOff,
    title: 'No accounts, no ads',
    desc: 'Nothing to sign up for. No trackers. No data brokers. Ever.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setOnboardingComplete } = useSettingsStore();
  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    getNotificationPermissionStatus().then((res) => {
      setPermStatus(res.status);
      setCanAskAgain(res.canAskAgain);
    });
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        getNotificationPermissionStatus().then((res) => {
          setPermStatus(res.status);
          setCanAskAgain(res.canAskAgain);
        });
      }
    });
    return () => sub.remove();
  }, []);

  const handleRequestNotifications = useCallback(async () => {
    if (permStatus === 'denied' && !canAskAgain) {
      Linking.openSettings();
      return;
    }
    setRequesting(true);
    const granted = await requestNotificationPermission();
    // Refresh status after request
    const res = await getNotificationPermissionStatus();
    setPermStatus(res.status);
    setCanAskAgain(res.canAskAgain);
    setRequesting(false);
  }, [permStatus, canAskAgain]);

  const handleFinish = useCallback(async () => {
    // If they haven't made a choice yet, or we can still ask, try to request now
    let granted = permStatus === 'granted';
    if (permStatus !== 'granted' && canAskAgain) {
      setRequesting(true);
      granted = await requestNotificationPermission();
      setRequesting(false);
    }

    // If we have permission, schedule the initial alerts
    if (granted) {
      let { prediction, cycles } = useCycleStore.getState();
      const { notifications } = useSettingsStore.getState();
      const { profile } = useUserStore.getState();

      // If prediction is missing (which is true during first-time onboarding),
      // calculate it now from the data we just added in cycle-info.tsx
      if (!prediction && cycles.length > 0) {
        prediction = calculatePredictions(
          cycles,
          profile?.avgCycleLength ?? 28,
          profile?.avgPeriodLength ?? 5,
          []
        );
      }

      if (prediction) {
        scheduleAllNotifications(prediction, notifications).catch(console.error);
      }
    } else {
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  }, [permStatus, setOnboardingComplete, router]);

  const handleSkip = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Medium);
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  }, [setOnboardingComplete, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            style={[styles.progressBarFill, { backgroundColor: colors.surfaceSecondary }]}
          />
          <View
            style={[
              styles.progressBarFillActive,
              { backgroundColor: colors.accent, width: `${(5 / 5) * 100}%` },
            ]}
          />
        </View>
        <Typography style={[styles.stepCounter, { color: colors.textSecondary }]}>
          5 of 5
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Eyebrow + Title + Subtitle */}
        <Typography style={[styles.eyebrow, { color: colors.accent }]}>
          OUR PROMISE
        </Typography>
        <Typography style={[styles.title, { color: colors.text }]}>
          Your data stays yours.
        </Typography>
        <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
          Cycle tracking shouldn't come with a privacy cost.
        </Typography>

        {/* Feature rows */}
        <View style={styles.featureRows}>
          {FEATURE_ROWS.map((row, i) => {
            const IconComponent = row.icon;
            return (
              <View key={i} style={styles.featureRow}>
                <View
                  style={[
                    styles.featureIconBox,
                    { backgroundColor: colors.accent + '18' },
                  ]}
                >
                  <IconComponent size={17} color={colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Typography style={[styles.featureTitle, { color: colors.text }]}>
                    {row.title}
                  </Typography>
                  <Typography style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    {row.desc}
                  </Typography>
                </View>
              </View>
            );
          })}
        </View>

        {/* Notification permission card */}
        <TouchableOpacity
          onPress={permStatus !== 'granted' ? handleRequestNotifications : undefined}
          activeOpacity={permStatus === 'granted' ? 1 : 0.8}
          style={[
            styles.notifCard,
            {
              backgroundColor:
                permStatus === 'granted'
                  ? Colors.success + '18'
                  : colors.accent + '14',
              borderColor:
                permStatus === 'granted'
                  ? Colors.success + '50'
                  : colors.accent + '40',
            },
          ]}
        >
          {permStatus === 'granted' ? (
            <Bell size={20} color={Colors.success} />
          ) : (
            <BellOff size={20} color={colors.accent} />
          )}
          <View style={{ flex: 1 }}>
            <Typography
              variant="label"
              color={permStatus === 'granted' ? Colors.success : colors.accent}
              style={{ fontWeight: '700' }}
            >
              {permStatus === 'granted'
                ? 'Notifications enabled ✓'
                : 'Enable period reminders'}
            </Typography>
            <Typography
              variant="caption"
              color={colors.textSecondary}
              style={{ marginTop: 2 }}
            >
              {permStatus === 'granted'
                ? "You'll get reminders before your period and on fertile days."
                : 'Tap to allow — get alerts before your period and during your fertile window.'}
            </Typography>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="I understand — let's go!"
          onPress={handleFinish}
          loading={requesting}
          fullWidth
          size="lg"
        />
        {permStatus !== 'granted' && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipNotif}>
            <Typography variant="caption" color={colors.textTertiary} align="center">
              Skip notifications
            </Typography>
          </TouchableOpacity>
        )}
      </View>
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

  featureRows: {
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },

  footer: {
    padding: Spacing.xl,
    paddingTop: 0,
    gap: 4,
  },
  skipNotif: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});
