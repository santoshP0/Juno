import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import type { CyclePrediction, NotificationSettings } from '../../types';
import { parseISO, addDays } from 'date-fns';

// iOS allows max 64 scheduled notifications. Budget allocation:
// Cycle events: up to 4 (period-soon, period-late, fertile, ovulation)
// Daily log: 1
// Pill: up to 30 (specific dates) or 1 (daily)
// Water: up to 10 slots
const MAX_WATER_SLOTS = 10;
const MAX_PILL_DATES = 30;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Action identifiers ───────────────────────────────────────────────────────
export const NOTIF_ACTION = {
  PILL_TAKEN:     'pill-taken',
  PILL_SKIPPED:   'pill-skipped',
  WATER_DONE:     'water-done',
  LOG_NOW:        'log-now',
  PERIOD_NOT_YET: 'period-not-yet',
  PERIOD_STARTED: 'period-started',
  REMIND_15:      'remind-15',
} as const;

// ─── Channel / category setup ─────────────────────────────────────────────────

export async function setupNotificationChannels(): Promise<void> {
  // Action categories work on both iOS and Android
  await Notifications.setNotificationCategoryAsync('pill-reminder', [
    {
      identifier: NOTIF_ACTION.PILL_TAKEN,
      buttonTitle: '✓ Taken',
      // Must open app — killed-state actions not persisted by Android without foreground launch
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
    {
      identifier: NOTIF_ACTION.PILL_SKIPPED,
      buttonTitle: '✕ Not today',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
    {
      identifier: NOTIF_ACTION.REMIND_15,
      buttonTitle: '⏰ 15 min',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('water-reminder', [
    {
      identifier: NOTIF_ACTION.WATER_DONE,
      buttonTitle: '💧 Done!',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
    {
      identifier: NOTIF_ACTION.REMIND_15,
      buttonTitle: '⏰ 15 min',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('daily-log', [
    {
      identifier: NOTIF_ACTION.LOG_NOW,
      buttonTitle: '📝 Log now',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
    {
      identifier: NOTIF_ACTION.REMIND_15,
      buttonTitle: '⏰ 15 min',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('period-overdue', [
    {
      identifier: NOTIF_ACTION.PERIOD_STARTED,
      buttonTitle: '🩸 It started',
      options: { opensAppToForeground: true, isAuthenticationRequired: false },
    },
    {
      identifier: NOTIF_ACTION.PERIOD_NOT_YET,
      buttonTitle: '⏳ Not yet',
      options: { opensAppToForeground: false, isAuthenticationRequired: false },
    },
  ]);

  // Android channels (API 26+ requirement — silently dropped without these)
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
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('juno-water', {
    name: 'Hydration reminders',
    description: 'Water intake reminders throughout the day',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissionStatus() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { status, canAskAgain };
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(timeStr: string | undefined): [number, number] {
  const parts = (timeStr ?? '08:00').split(':');
  const h = parseInt(parts[0] ?? '8', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  return [
    isNaN(h) ? 8 : Math.max(0, Math.min(23, h)),
    isNaN(m) ? 0 : Math.max(0, Math.min(59, m)),
  ];
}

/** One-time notification at a specific date. Silently skips past dates. */
async function scheduleNotification(
  id: string,
  title: string,
  body: string,
  date: Date,
  categoryIdentifier?: string,
  data?: Record<string, unknown>,
  channelId = 'juno-cycle'
): Promise<void> {
  if (date <= new Date()) return; // Never schedule in the past

  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: 'default',
      ...(categoryIdentifier && { categoryIdentifier }),
      ...(data && { data }),
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

/** Recurring daily notification at a fixed hour:minute. */
async function scheduleDailyNotification(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  categoryIdentifier?: string,
  data?: Record<string, unknown>,
  channelId = 'juno-daily'
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: 'default',
      ...(categoryIdentifier && { categoryIdentifier }),
      ...(data && { data }),
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ─── Main scheduler ───────────────────────────────────────────────────────────

export async function scheduleAllNotifications(
  prediction: CyclePrediction | null,
  settings: NotificationSettings
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Categories must exist before scheduling (idempotent call)
  await setupNotificationChannels();

  // Full cancel → clean reschedule (prevents stale notifications)
  await cancelAllNotifications();

  // ── Cycle-based (require a valid prediction) ──────────────────────────────

  if (prediction) {
    // Period starting soon
    if (settings.periodSoonEnabled) {
      const triggerDate = addDays(parseISO(prediction.nextPeriodStart), -settings.periodSoonDays);
      triggerDate.setHours(9, 0, 0, 0);
      await scheduleNotification(
        'period-soon',
        '🌸 Period starting soon',
        `Your period is expected in ${settings.periodSoonDays} day${settings.periodSoonDays > 1 ? 's' : ''}. Stock up on supplies and be kind to yourself.`,
        triggerDate
      );
    }

    // Period late check-in (3 days overdue)
    if (settings.periodLateEnabled) {
      await scheduleLatePeriodCheck(prediction.nextPeriodStart);
    }

    // Fertile window (day before it starts)
    if (settings.fertileWindowEnabled) {
      const fertileStart = addDays(parseISO(prediction.fertileWindowStart), -1);
      fertileStart.setHours(9, 0, 0, 0);
      await scheduleNotification(
        'fertile-window',
        '💚 Fertile window starts tomorrow',
        'Your fertile window begins tomorrow. Track your discharge and temperature for the most accurate picture.',
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
        'Today is your estimated ovulation day — your peak fertility window. Log your BBT and cervical mucus for better predictions.',
        ovDate
      );
    }
  }

  // ── Daily recurring ───────────────────────────────────────────────────────

  // Daily log nudge (with quick-log actions)
  if (settings.dailyLogEnabled) {
    const [h, m] = parseTime(settings.dailyLogTime);
    await scheduleDailyNotification(
      'daily-log',
      '📝 Daily check-in',
      'How are you feeling today? A quick log helps Juno make better predictions.',
      h,
      m,
      'daily-log',
      undefined,
      'juno-daily'
    );
  }

  // Pill reminder (with taken/skipped/snooze actions)
  if (settings.pillReminderEnabled) {
    const [h, m] = parseTime(settings.pillReminderTime);

    if (settings.pillReminderDates && settings.pillReminderDates.length > 0) {
      // Specific scheduled dates — cap to stay within iOS 64-notification limit
      const dates = settings.pillReminderDates.slice(0, MAX_PILL_DATES);
      for (const dateStr of dates) {
        const date = parseISO(dateStr);
        date.setHours(h, m, 0, 0);
        await scheduleNotification(
          `pill-${dateStr}`,
          '💊 Pill reminder',
          "Time to take your scheduled pill. Stay on track — consistency matters.",
          date,
          'pill-reminder',
          undefined,
          'juno-daily'
        );
      }
    } else {
      // Daily recurring
      await scheduleDailyNotification(
        'pill-reminder',
        '💊 Pill reminder',
        "Time to take your pill. Tap 'Taken' to log it without opening the app.",
        h,
        m,
        'pill-reminder',
        undefined,
        'juno-daily'
      );
    }
  }

  // Water reminders (cap slots to prevent hitting OS limit)
  if (settings.waterReminderEnabled && settings.waterReminderTimes?.length) {
    const slots = settings.waterReminderTimes.slice(0, MAX_WATER_SLOTS);

    // Cancel any slots beyond the current count (user may have removed some)
    for (let i = slots.length; i < MAX_WATER_SLOTS; i++) {
      await Notifications.cancelScheduledNotificationAsync(`water-${i}`).catch(() => {});
    }

    for (let i = 0; i < slots.length; i++) {
      const [h, m] = parseTime(slots[i]);
      await scheduleDailyNotification(
        `water-${i}`,
        '💧 Stay hydrated',
        "Time for a glass of water! Tap 'Done' to log it.",
        h,
        m,
        'water-reminder',
        undefined,
        'juno-water'
      );
    }
  }
}

// ─── Late period check-in (also called from useCycle on logPeriodStart) ───────

export async function scheduleLatePeriodCheck(expectedStart: string): Promise<void> {
  const triggerDate = addDays(parseISO(expectedStart), 3);
  triggerDate.setHours(9, 0, 0, 0);
  await scheduleNotification(
    'period-late',
    '🗓 Period check-in',
    'Your period was expected a few days ago. It can be normal — tap to log if it has started, or dismiss if you are still waiting.',
    triggerDate,
    'period-overdue',
    { expectedStart }
  );
}

// ─── Dev / test helpers ───────────────────────────────────────────────────────

export async function triggerTestNotification(
  type: 'period-soon' | 'period-late' | 'fertile' | 'ovulation' | 'daily-log' | 'pill' | 'water'
): Promise<void> {
  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 3,
    repeats: false,
  } as const;

  const TESTS: Record<typeof type, Notifications.NotificationContentInput> = {
    'period-soon': {
      title: '🌸 Period starting soon',
      body: 'Your period is expected in 2 days. Stock up on supplies and be kind to yourself.',
      sound: 'default',
    },
    'period-late': {
      title: '🗓 Period check-in',
      body: 'Your period was expected a few days ago. Tap to log if it has started.',
      sound: 'default',
      categoryIdentifier: 'period-overdue',
      data: { expectedStart: new Date().toISOString() },
    },
    'fertile': {
      title: '💚 Fertile window starts tomorrow',
      body: 'Your fertile window begins tomorrow. Track your discharge and temperature.',
      sound: 'default',
    },
    'ovulation': {
      title: '✨ Ovulation day',
      body: 'Today is your estimated ovulation day — your peak fertility window.',
      sound: 'default',
    },
    'daily-log': {
      title: '📝 Daily check-in',
      body: 'How are you feeling today? A quick log helps Juno make better predictions.',
      sound: 'default',
      categoryIdentifier: 'daily-log',
    },
    'pill': {
      title: '💊 Pill reminder',
      body: "Time to take your pill. Tap 'Taken' to log it without opening the app.",
      sound: 'default',
      categoryIdentifier: 'pill-reminder',
    },
    'water': {
      title: '💧 Stay hydrated',
      body: "Time for a glass of water! Tap 'Done' to log it.",
      sound: 'default',
      categoryIdentifier: 'water-reminder',
    },
  };

  await Notifications.scheduleNotificationAsync({
    content: TESTS[type],
    trigger,
  });
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
