import * as Notifications from 'expo-notifications';
import type { CyclePrediction, NotificationSettings } from '../../types';
import { parseISO, addDays } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function scheduleNotification(
  id: string,
  title: string,
  body: string,
  date: Date,
  channelId = 'juno-default'
): Promise<void> {
  if (date <= new Date()) return;

  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: false },
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
  minute: number
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleAllNotifications(
  prediction: CyclePrediction,
  settings: NotificationSettings
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Period soon
  if (settings.periodSoonEnabled) {
    const triggerDate = addDays(
      parseISO(prediction.nextPeriodStart),
      -settings.periodSoonDays
    );
    await scheduleNotification(
      'period-soon',
      '🌸 Period starting soon',
      `Your period is expected in ${settings.periodSoonDays} day${settings.periodSoonDays > 1 ? 's' : ''}. Be prepared and be kind to yourself.`,
      triggerDate
    );
  }

  // Fertile window
  if (settings.fertileWindowEnabled) {
    const fertileStart = addDays(parseISO(prediction.fertileWindowStart), -1);
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
    const [h, m] = settings.dailyLogTime.split(':').map(Number);
    await scheduleDailyNotification(
      'daily-log',
      '📝 How are you feeling today?',
      'Take a moment to log your symptoms and mood in Juno.',
      h,
      m
    );
  }

  // Pill reminder
  if (settings.pillReminderEnabled) {
    const [h, m] = settings.pillReminderTime.split(':').map(Number);
    await scheduleDailyNotification(
      'pill-reminder',
      '💊 Pill reminder',
      "Don't forget to take your pill today.",
      h,
      m
    );
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
