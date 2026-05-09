import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCycleStore } from '../../stores/cycleStore';
import {
  requestNotificationPermission,
  scheduleAllNotifications,
  cancelAllNotifications,
} from '../../lib/notifications';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
import type { NotificationSettings } from '../../types';

function SettingSwitch({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={s.switchRow}>
      <View style={{ flex: 1 }}>
        <Typography variant="body">{label}</Typography>
        {subtitle && (
          <Typography variant="caption" color={colors.textTertiary}>
            {subtitle}
          </Typography>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: Colors.dustyRose }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { notifications, updateNotifications } = useSettingsStore();
  const { prediction } = useCycleStore();

  const [settings, setSettings] = useState<NotificationSettings>(notifications);

  const update = useCallback(
    (updates: Partial<NotificationSettings>) =>
      setSettings((prev) => ({ ...prev, ...updates })),
    []
  );

  const handleSave = useCallback(async () => {
    updateNotifications(settings);
    await cancelAllNotifications();
    if (prediction) {
      await requestNotificationPermission();
      await scheduleAllNotifications(prediction, settings);
    }
    router.back();
  }, [settings, prediction, updateNotifications, router]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4">Notifications</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Typography variant="body2" color={colors.textSecondary} style={{ marginBottom: 4 }}>
          All notifications are local — nothing is sent over the internet.
        </Typography>

        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Cycle reminders
          </Typography>
          <SettingSwitch
            label="Period starting soon"
            subtitle="Remind me before my predicted period"
            value={settings.periodSoonEnabled}
            onValueChange={(v) => update({ periodSoonEnabled: v })}
          />
          {settings.periodSoonEnabled && (
            <View style={s.subOption}>
              <Typography variant="caption" color={colors.textSecondary}>Days before: </Typography>
              {([1, 2, 3] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => update({ periodSoonDays: d })}
                  style={[
                    s.dayBtn,
                    {
                      backgroundColor: settings.periodSoonDays === d ? Colors.dustyRose : colors.surfaceSecondary,
                      borderColor: settings.periodSoonDays === d ? Colors.dustyRose : colors.border,
                    },
                  ]}
                >
                  <Typography variant="caption" color={settings.periodSoonDays === d ? '#fff' : colors.textSecondary}>
                    {d}d
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.divider} />
          <SettingSwitch
            label="Period is late"
            subtitle="Alert if period is 3+ days overdue"
            value={settings.periodLateEnabled}
            onValueChange={(v) => update({ periodLateEnabled: v })}
          />
          <View style={s.divider} />
          <SettingSwitch
            label="Fertile window"
            subtitle="Remind me when my fertile window starts"
            value={settings.fertileWindowEnabled}
            onValueChange={(v) => update({ fertileWindowEnabled: v })}
          />
          <View style={s.divider} />
          <SettingSwitch
            label="Ovulation day"
            subtitle="Alert on my estimated ovulation day"
            value={settings.ovulationEnabled}
            onValueChange={(v) => update({ ovulationEnabled: v })}
          />
        </Card>

        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Daily reminders
          </Typography>
          <SettingSwitch
            label="Daily log nudge"
            subtitle="Remind me to log my symptoms each day"
            value={settings.dailyLogEnabled}
            onValueChange={(v) => update({ dailyLogEnabled: v })}
          />
          <View style={s.divider} />
          <SettingSwitch
            label="Pill reminder"
            subtitle="Daily reminder to take your pill"
            value={settings.pillReminderEnabled}
            onValueChange={(v) => update({ pillReminderEnabled: v })}
          />
          <View style={s.divider} />
          <SettingSwitch
            label="Water intake reminders"
            subtitle="Stay hydrated throughout the day"
            value={settings.waterReminderEnabled}
            onValueChange={(v) => update({ waterReminderEnabled: v })}
          />
        </Card>

        <Button label="Save preferences" onPress={handleSave} fullWidth size="lg" />
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
  },
  subOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  divider: { height: 1, backgroundColor: '#00000008', marginVertical: 4 },
});
