import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Bell, BellOff } from 'lucide-react-native';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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
    console.log('[PrivacyScreen] Manual request triggered. Current status:', permStatus, 'canAskAgain:', canAskAgain);
    if (permStatus === 'denied' && !canAskAgain) {
      console.log('[PrivacyScreen] Permission permanently denied, opening settings');
      Linking.openSettings();
      return;
    }
    setRequesting(true);
    const granted = await requestNotificationPermission();
    console.log('[PrivacyScreen] Manual request result:', granted);
    // Refresh status after request
    const res = await getNotificationPermissionStatus();
    setPermStatus(res.status);
    setCanAskAgain(res.canAskAgain);
    setRequesting(false);
  }, [permStatus, canAskAgain]);

  const handleFinish = useCallback(async () => {
    console.log('[PrivacyScreen] Finish clicked. Current status:', permStatus, 'canAskAgain:', canAskAgain);
    // If they haven't made a choice yet, or we can still ask, try to request now
    let granted = permStatus === 'granted';
    if (permStatus !== 'granted' && canAskAgain) {
      console.log('[PrivacyScreen] Not granted and can ask, auto-requesting...');
      setRequesting(true);
      granted = await requestNotificationPermission();
      setRequesting(false);
      console.log('[PrivacyScreen] Auto-request result:', granted);
    }
    
    // If we have permission, schedule the initial alerts
    if (granted) {
      console.log('[PrivacyScreen] Permission granted, scheduling notifications...');
      let { prediction, cycles, logs } = useCycleStore.getState();
      const { notifications } = useSettingsStore.getState();
      const { profile } = useUserStore.getState();
      
      // If prediction is missing (which is true during first-time onboarding),
      // calculate it now from the data we just added in cycle-info.tsx
      if (!prediction && cycles.length > 0) {
        console.log('[PrivacyScreen] Prediction missing, calculating in-memory...');
        prediction = calculatePredictions(
          cycles,
          profile?.avgCycleLength ?? 28,
          profile?.avgPeriodLength ?? 5,
          []
        );
      }

      if (prediction) {
        console.log('[PrivacyScreen] Scheduling all notifications with prediction:', prediction.nextPeriodStart);
        scheduleAllNotifications(prediction, notifications).catch((err) => {
          console.error('[PrivacyScreen] Failed to schedule notifications:', err);
        });
      } else {
        console.log('[PrivacyScreen] Could not schedule: No prediction available');
      }
    } else {
      console.log('[PrivacyScreen] Permission not granted, skipping schedule');
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Typography style={styles.emoji}>🛡️</Typography>
        </View>
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

        {/* Notification permission */}
        <TouchableOpacity
          onPress={permStatus !== 'granted' ? handleRequestNotifications : undefined}
          activeOpacity={permStatus === 'granted' ? 1 : 0.8}
          style={[
            styles.notifCard,
            {
              backgroundColor:
                permStatus === 'granted'
                  ? Colors.success + '18'
                  : Colors.dustyRose + '14',
              borderColor:
                permStatus === 'granted'
                  ? Colors.success + '50'
                  : Colors.dustyRose + '50',
            },
          ]}
        >
          {permStatus === 'granted' ? (
            <Bell size={20} color={Colors.success} />
          ) : (
            <BellOff size={20} color={Colors.dustyRose} />
          )}
          <View style={{ flex: 1 }}>
            <Typography
              variant="label"
              color={permStatus === 'granted' ? Colors.success : Colors.dustyRose}
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
                ? 'You\'ll get reminders before your period and on fertile days.'
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  emoji: { fontSize: 52, textAlign: 'center', lineHeight: 64 },
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
  notifCard: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    width: '100%',
  },
  footer: { padding: Spacing.xl, paddingTop: 0, gap: 4 },
  skipNotif: { paddingVertical: 8, alignItems: 'center' },
});
