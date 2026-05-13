import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import type { CyclePrediction, NotificationSettings } from '../../types';
import { parseISO, addDays } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Android channels ────────────────────────────────────────────────────────
// Required on Android 8+ (API 26+). Without a channel, notifications are
// silently dropped — the OS never shows them.

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('juno-cycle', {
    name: 'Cycle alerts',
    description: 'Period, ovulation and fertile window reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: Colors.dustyRose,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('juno-daily', {
    name: 'Daily reminders',
    description: 'Log nudges and pill reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('juno-water', {
    name: 'Hydration reminders',
    description: 'Water intake reminders throughout the day',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
  });
}

// ─── Permission ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTime(timeStr: string | undefined): [number, number] {
  const parts = (timeStr ?? '08:00').split(':');
  const h = parseInt(parts[0] ?? '8', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  return [isNaN(h) ? 8 : Math.max(0, Math.min(23, h)),
          isNaN(m) ? 0 : Math.max(0, Math.min(59, m))];
}

async function scheduleNotification(
  id: string,
  title: string,
  body: string,
  date: Date,
  channelId = 'juno-cycle'
): Promise<void> {
  // Skip dates already in the past — don't clutter the scheduler
  if (date <= new Date()) return;

  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

async function scheduleDailyNotification(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  channelId = 'juno-daily'
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ─── Main scheduling ─────────────────────────────────────────────────────────

export async function scheduleAllNotifications(
  prediction: CyclePrediction,
  settings: NotificationSettings
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Ensure Android channels exist before scheduling anything
  await setupNotificationChannels();

  // Cancel everything first for a clean slate
  await cancelAllNotifications();

  // Period soon
  if (settings.periodSoonEnabled) {
    const triggerDate = addDays(
      parseISO(prediction.nextPeriodStart),
      -settings.periodSoonDays
    );
    triggerDate.setHours(9, 0, 0, 0);
    await scheduleNotification(
      'period-soon',
      '🌸 Period starting soon',
      `Your period is expected in ${settings.periodSoonDays} day${settings.periodSoonDays > 1 ? 's' : ''}. Be prepared and be kind to yourself.`,
      triggerDate
    );
  }

  // Period late (3 days overdue check-in)
  if (settings.periodLateEnabled) {
    await scheduleLatePeriodCheck(prediction.nextPeriodStart);
  }

  // Fertile window
  if (settings.fertileWindowEnabled) {
    const fertileStart = addDays(parseISO(prediction.fertileWindowStart), -1);
    fertileStart.setHours(9, 0, 0, 0);
    await scheduleNotification(
      'fertile-window',
      '💚 Fertile window starts tomorrow',
      'Your fertile window begins tomorrow. Plan accordingly.',
      fertileStart
    );
  }

  // Ovulation day
  if (settings.ovulationEnabled) {
    const ovDate = parseISO(prediction.ovulationDay);
    ovDate.setHours(8, 0, 0, 0);
    await scheduleNotification(
      'ovulation-day',
      '✨ Ovulation day',
      'Today is your estimated ovulation day — your peak fertility window.',
      ovDate
    );
  }

  // Daily log reminder
  if (settings.dailyLogEnabled) {
    const [h, m] = parseTime(settings.dailyLogTime);
    await scheduleDailyNotification(
      'daily-log',
      '📝 How are you feeling today?',
      'Take a moment to log your symptoms and mood in Juno.',
      h,
      m,
      'juno-daily'
    );
  }

  // Pill reminder
  if (settings.pillReminderEnabled) {
    const [h, m] = parseTime(settings.pillReminderTime);
    await scheduleDailyNotification(
      'pill-reminder',
      '💊 Pill reminder',
      "Don't forget to take your pill today.",
      h,
      m,
      'juno-daily'
    );
  }

  // Water reminders (morning, afternoon, evening)
  if (settings.waterReminderEnabled) {
    await scheduleDailyNotification('water-1', '💧 Stay hydrated', 'Morning water check — start your day right!', 10, 0, 'juno-water');
    await scheduleDailyNotification('water-2', '💧 Stay hydrated', 'Afternoon reminder — grab a glass of water!', 14, 0, 'juno-water');
    await scheduleDailyNotification('water-3', '💧 Stay hydrated', 'Evening hydration check!', 18, 0, 'juno-water');
  }
}

export async function scheduleLatePeriodCheck(
  expectedStart: string
): Promise<void> {
  const triggerDate = addDays(parseISO(expectedStart), 3);
  triggerDate.setHours(9, 0, 0, 0);
  await scheduleNotification(
    'period-late',
    '🗓 Period check-in',
    'Your period was expected a few days ago. This can be normal — log in Juno if it has started.',
    triggerDate
  );
}
