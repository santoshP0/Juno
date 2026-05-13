import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, BellOff, Bell, CheckCircle } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCycleStore } from '../../stores/cycleStore';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleAllNotifications,
  cancelAllNotifications,
} from '../../lib/notifications';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/theme';
import type { NotificationSettings } from '../../types';

function Divider() {
  const colors = useColors();
  return <View style={[s.divider, { backgroundColor: colors.border }]} />;
}

function SettingSwitch({
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[s.switchRow, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Typography variant="body">{label}</Typography>
        {subtitle && (
          <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {subtitle}
          </Typography>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        trackColor={{ false: colors.border, true: disabled ? colors.border : Colors.dustyRose }}
        thumbColor={Colors.white}
        disabled={disabled}
      />
    </View>
  );
}

function TimeDisplay({ label, time, disabled }: { label: string; time: string; disabled?: boolean }) {
  const colors = useColors();
  return (
    <View style={[s.timeRow, disabled && { opacity: 0.5 }]}>
      <Typography variant="caption" color={colors.textTertiary}>{label}</Typography>
      <View style={[s.timeBadge, { backgroundColor: disabled ? colors.border + '22' : Colors.dustyRose + '18', borderColor: disabled ? colors.border : Colors.dustyRose + '40' }]}>
        <Typography variant="caption" color={disabled ? colors.textTertiary : Colors.dustyRose} style={{ fontWeight: '700' }}>
          {time}
        </Typography>
      </View>
    </View>
  );
}

function PermissionBanner({ onRequest }: { onRequest: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onRequest}
      style={[s.permBanner, { backgroundColor: Colors.warning + '18', borderColor: Colors.warning + '50' }]}
    >
      <BellOff size={20} color={Colors.warning} />
      <View style={{ flex: 1 }}>
        <Typography variant="label" color={Colors.warning} style={{ fontWeight: '700' }}>
          Notifications are off
        </Typography>
        <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          Tap to grant permission in Settings
        </Typography>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { notifications, updateNotifications } = useSettingsStore();
  const { prediction } = useCycleStore();

  const [settings, setSettings] = useState<NotificationSettings>(notifications);
  const [permStatus, setPermStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getNotificationPermissionStatus().then((res) => {
      setPermStatus(res.status);
      setCanAskAgain(res.canAskAgain);
    });
    // Re-check when user returns from device Settings after granting permission
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        getNotificationPermissionStatus().then((res) => {
          setPermStatus(res.status);
          setCanAskAgain(res.canAskAgain);
        });
      }
    });
    return () => sub.remove();
  }, []);

  const update = useCallback(
    (updates: Partial<NotificationSettings>) =>
      setSettings((prev) => ({ ...prev, ...updates })),
    []
  );

  const handleRequestPermission = useCallback(async () => {
    if (permStatus === 'denied' && !canAskAgain) {
      Linking.openSettings();
    } else {
      const granted = await requestNotificationPermission();
      const res = await getNotificationPermissionStatus();
      setPermStatus(res.status);
      setCanAskAgain(res.canAskAgain);
    }
  }, [permStatus, canAskAgain]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      updateNotifications(settings);
      await cancelAllNotifications();
      if (prediction && permStatus === 'granted') {
        await scheduleAllNotifications(prediction, settings);
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.back();
      }, 800);
    } finally {
      setSaving(false);
    }
  }, [settings, prediction, permStatus, updateNotifications, router]);

  const notifDisabled = permStatus !== 'granted';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4" style={{ fontWeight: '700' }}>Notifications</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Permission banner */}
        {permStatus !== null && permStatus !== 'granted' && (
          <PermissionBanner onRequest={handleRequestPermission} />
        )}

        {/* Info */}
        <View style={[s.infoBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Bell size={14} color={colors.textTertiary} />
          <Typography variant="caption" color={colors.textTertiary} style={{ flex: 1 }}>
            All notifications are local — nothing is sent over the internet.
          </Typography>
        </View>

        {/* Cycle reminders */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={s.cardTitle}>
            Cycle reminders
          </Typography>

          <SettingSwitch
            label="Period starting soon"
            subtitle="Remind me before my predicted period"
            value={settings.periodSoonEnabled}
            onValueChange={(v) => update({ periodSoonEnabled: v })}
            disabled={notifDisabled}
          />

          {settings.periodSoonEnabled && (
            <View style={[s.subOption, notifDisabled && { opacity: 0.5 }]}>
              <Typography variant="caption" color={colors.textSecondary}>Days before: </Typography>
              {([1, 2, 3] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={notifDisabled ? undefined : () => update({ periodSoonDays: d })}
                  activeOpacity={notifDisabled ? 1 : 0.7}
                  style={[
                    s.dayBtn,
                    {
                      backgroundColor: settings.periodSoonDays === d ? (notifDisabled ? colors.border : Colors.dustyRose) : colors.surfaceSecondary,
                      borderColor: settings.periodSoonDays === d ? (notifDisabled ? colors.border : Colors.dustyRose) : colors.border,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    color={settings.periodSoonDays === d ? Colors.white : colors.textSecondary}
                    style={{ fontWeight: '600' }}
                  >
                    {d}d
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Divider />
          <SettingSwitch
            label="Period is late"
            subtitle="Alert if period is 3+ days overdue"
            value={settings.periodLateEnabled}
            onValueChange={(v) => update({ periodLateEnabled: v })}
            disabled={notifDisabled}
          />

          <Divider />
          <SettingSwitch
            label="Fertile window"
            subtitle="Remind me when my fertile window starts"
            value={settings.fertileWindowEnabled}
            onValueChange={(v) => update({ fertileWindowEnabled: v })}
            disabled={notifDisabled}
          />

          <Divider />
          <SettingSwitch
            label="Ovulation day"
            subtitle="Alert on my estimated ovulation day"
            value={settings.ovulationEnabled}
            onValueChange={(v) => update({ ovulationEnabled: v })}
            disabled={notifDisabled}
          />
        </Card>

        {/* Daily reminders */}
        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={s.cardTitle}>
            Daily reminders
          </Typography>

          <SettingSwitch
            label="Daily log nudge"
            subtitle="Remind me to log my symptoms each day"
            value={settings.dailyLogEnabled}
            onValueChange={(v) => update({ dailyLogEnabled: v })}
            disabled={notifDisabled}
          />
          {settings.dailyLogEnabled && (
            <TimeDisplay label="Reminder time" time={settings.dailyLogTime} disabled={notifDisabled} />
          )}

          <Divider />
          <SettingSwitch
            label="Pill reminder"
            subtitle="Daily reminder to take your pill"
            value={settings.pillReminderEnabled}
            onValueChange={(v) => update({ pillReminderEnabled: v })}
            disabled={notifDisabled}
          />
          {settings.pillReminderEnabled && (
            <TimeDisplay label="Reminder time" time={settings.pillReminderTime} disabled={notifDisabled} />
          )}

          <Divider />
          <SettingSwitch
            label="Water intake reminders"
            subtitle="3× daily nudges at 10 am, 2 pm, 6 pm"
            value={settings.waterReminderEnabled}
            onValueChange={(v) => update({ waterReminderEnabled: v })}
            disabled={notifDisabled}
          />
        </Card>

        {/* No prediction warning */}
        {!prediction && permStatus === 'granted' && (
          <View style={[s.infoBanner, { backgroundColor: Colors.warning + '12', borderColor: Colors.warning + '30' }]}>
            <Typography variant="caption" color={Colors.warning}>
              Log your first period to enable cycle-based notifications.
            </Typography>
          </View>
        )}

        {/* Save */}
        <Button
          label={saved ? '✓ Saved!' : 'Save preferences'}
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  cardTitle: { marginBottom: 14, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  subOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 4,
    marginBottom: 4,
  },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  divider: { height: 1, marginVertical: 4 },
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginLeft: 4,
    marginBottom: 4,
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
