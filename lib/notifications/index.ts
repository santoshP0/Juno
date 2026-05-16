import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  RepeatFrequency,
  type TimestampTrigger,
} from '@notifee/react-native';
import { Colors } from '../../constants/colors';
import type { CyclePrediction, NotificationSettings } from '../../types';
import { parseISO, addDays } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

/** AsyncStorage key used to queue killed-state actions for processing on app open. */
export const PENDING_ACTIONS_KEY = 'juno_pending_notif_actions';

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

export type NotifAction = typeof NOTIF_ACTION[keyof typeof NOTIF_ACTION];

// ─── Pill / water action button sets (reused per notification) ────────────────

const PILL_ACTIONS = [
  { title: '✓ Taken',      pressAction: { id: NOTIF_ACTION.PILL_TAKEN } },
  { title: '✕ Not today',  pressAction: { id: NOTIF_ACTION.PILL_SKIPPED } },
  { title: '⏰ 15 min',    pressAction: { id: NOTIF_ACTION.REMIND_15 } },
];

const WATER_ACTIONS = [
  { title: '💧 Done!',   pressAction: { id: NOTIF_ACTION.WATER_DONE } },
  { title: '⏰ 15 min',  pressAction: { id: NOTIF_ACTION.REMIND_15 } },
];

const DAILY_LOG_ACTIONS = [
  { title: '📝 Log now',  pressAction: { id: NOTIF_ACTION.LOG_NOW, launchActivity: 'default' } },
  { title: '⏰ 15 min',   pressAction: { id: NOTIF_ACTION.REMIND_15 } },
];

const PERIOD_OVERDUE_ACTIONS = [
  { title: '🩸 It started', pressAction: { id: NOTIF_ACTION.PERIOD_STARTED, launchActivity: 'default' } },
  { title: '⏳ Not yet',    pressAction: { id: NOTIF_ACTION.PERIOD_NOT_YET } },
];

// ─── Channel setup ────────────────────────────────────────────────────────────

export async function setupNotificationChannels(): Promise<void> {
  await notifee.createChannel({
    id: 'juno-cycle',
    name: 'Cycle alerts',
    description: 'Period, ovulation and fertile window reminders',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 250, 300, 250],
    lights: true,
    lightColor: Colors.dustyRose,
    sound: 'default',
    visibility: AndroidVisibility.PUBLIC,
  });

  await notifee.createChannel({
    id: 'juno-daily',
    name: 'Daily reminders',
    description: 'Log nudges and pill reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    visibility: AndroidVisibility.PUBLIC,
  });

  await notifee.createChannel({
    id: 'juno-water',
    name: 'Hydration reminders',
    description: 'Water intake reminders throughout the day',
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PUBLIC,
  });
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
}

export async function getNotificationPermissionStatus(): Promise<{
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}> {
  const settings = await notifee.getNotificationSettings();
  const auth = settings.authorizationStatus;
  // Notifee: NOT_DETERMINED = -1, DENIED = 0, AUTHORIZED = 1, PROVISIONAL = 2
  const status = auth >= 1 ? 'granted' : auth === -1 ? 'undetermined' : 'denied';
  return { status, canAskAgain: auth === -1 };
}

export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
  await notifee.cancelTriggerNotifications();
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

/** Next occurrence of HH:MM (today if still in future, otherwise tomorrow). */
function nextDailyOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const candidate = new Date();
  candidate.setHours(hour, minute, 0, 0);
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

/** One-time notification at specific date. Skips past dates silently. */
async function scheduleOnce(
  id: string,
  title: string,
  body: string,
  date: Date,
  channelId: string,
  actions?: { title: string; pressAction: { id: string; launchActivity?: string } }[],
  data?: Record<string, string>
): Promise<void> {
  if (date <= new Date()) return;

  await notifee.cancelTriggerNotification(id).catch(() => {});

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId,

        ...(actions && { actions }),
      },
      ...(data && { data }),
    },
    trigger
  );
}

/** Daily repeating notification at HH:MM. */
async function scheduleDaily(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  channelId: string,
  actions?: { title: string; pressAction: { id: string; launchActivity?: string } }[],
  data?: Record<string, string>
): Promise<void> {
  await notifee.cancelTriggerNotification(id).catch(() => {});

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextDailyOccurrence(hour, minute).getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId,

        ...(actions && { actions }),
      },
      ...(data && { data }),
    },
    trigger
  );
}

// ─── Main scheduler ───────────────────────────────────────────────────────────

export async function scheduleAllNotifications(
  prediction: CyclePrediction | null,
  settings: NotificationSettings
): Promise<void> {
  const permSettings = await notifee.getNotificationSettings();
  if (permSettings.authorizationStatus < 1) return;

  await setupNotificationChannels();
  await cancelAllNotifications();

  // ── Cycle-based ───────────────────────────────────────────────────────────

  if (prediction) {
    if (settings.periodSoonEnabled) {
      const d = addDays(parseISO(prediction.nextPeriodStart), -settings.periodSoonDays);
      d.setHours(9, 0, 0, 0);
      await scheduleOnce(
        'period-soon',
        '🌸 Period starting soon',
        `Your period is expected in ${settings.periodSoonDays} day${settings.periodSoonDays > 1 ? 's' : ''}. Stock up on supplies and be kind to yourself.`,
        d, 'juno-cycle'
      );
    }

    if (settings.periodLateEnabled) {
      await scheduleLatePeriodCheck(prediction.nextPeriodStart);
    }

    if (settings.fertileWindowEnabled) {
      const d = addDays(parseISO(prediction.fertileWindowStart), -1);
      d.setHours(9, 0, 0, 0);
      await scheduleOnce(
        'fertile-window',
        '💚 Fertile window starts tomorrow',
        'Your fertile window begins tomorrow. Track your discharge and temperature for the most accurate picture.',
        d, 'juno-cycle'
      );
    }

    if (settings.ovulationEnabled) {
      const d = parseISO(prediction.ovulationDay);
      d.setHours(8, 0, 0, 0);
      await scheduleOnce(
        'ovulation-day',
        '✨ Ovulation day',
        'Today is your estimated ovulation day — your peak fertility window. Log your BBT and cervical mucus for better predictions.',
        d, 'juno-cycle'
      );
    }
  }

  // ── Daily recurring ───────────────────────────────────────────────────────

  if (settings.dailyLogEnabled) {
    const [h, m] = parseTime(settings.dailyLogTime);
    await scheduleDaily(
      'daily-log',
      '📝 Daily check-in',
      'How are you feeling today? A quick log helps Juno make better predictions.',
      h, m, 'juno-daily', DAILY_LOG_ACTIONS
    );
  }

  if (settings.pillReminderEnabled) {
    const [h, m] = parseTime(settings.pillReminderTime);

    if (settings.pillReminderDates?.length) {
      for (const dateStr of settings.pillReminderDates.slice(0, 30)) {
        const d = parseISO(dateStr);
        d.setHours(h, m, 0, 0);
        await scheduleOnce(
          `pill-${dateStr}`,
          '💊 Pill reminder',
          "Time to take your scheduled pill. Stay on track — consistency matters.",
          d, 'juno-daily', PILL_ACTIONS
        );
      }
    } else {
      await scheduleDaily(
        'pill-reminder',
        '💊 Pill reminder',
        "Time to take your pill. Tap 'Taken' to log it — no need to open the app.",
        h, m, 'juno-daily', PILL_ACTIONS
      );
    }
  }

  if (settings.waterReminderEnabled && settings.waterReminderTimes?.length) {
    const slots = settings.waterReminderTimes.slice(0, 10);

    // Cancel removed slots
    for (let i = slots.length; i < 10; i++) {
      await notifee.cancelTriggerNotification(`water-${i}`).catch(() => {});
    }

    for (let i = 0; i < slots.length; i++) {
      const [h, m] = parseTime(slots[i]);
      await scheduleDaily(
        `water-${i}`,
        '💧 Stay hydrated',
        "Time for a glass of water! Tap 'Done' to log it.",
        h, m, 'juno-water', WATER_ACTIONS
      );
    }
  }
}

// ─── Late period check-in ─────────────────────────────────────────────────────

export async function scheduleLatePeriodCheck(expectedStart: string): Promise<void> {
  const d = addDays(parseISO(expectedStart), 3);
  d.setHours(9, 0, 0, 0);
  await scheduleOnce(
    'period-late',
    '🗓 Period check-in',
    'Your period was expected a few days ago. It can be normal — tap to log if it has started, or dismiss if you are still waiting.',
    d, 'juno-cycle', PERIOD_OVERDUE_ACTIONS,
    { expectedStart }
  );
}

// ─── Dev helpers ──────────────────────────────────────────────────────────────

export async function triggerTestNotification(
  type: 'period-soon' | 'period-late' | 'fertile' | 'ovulation' | 'daily-log' | 'pill' | 'water'
): Promise<void> {
  await setupNotificationChannels();

  const configs: Record<typeof type, { title: string; body: string; channelId: string; actions?: any[] }> = {
    'period-soon': { title: '🌸 Period starting soon', body: 'Your period is expected in 2 days. Stock up on supplies and be kind to yourself.', channelId: 'juno-cycle' },
    'period-late': { title: '🗓 Period check-in', body: 'Your period was expected a few days ago. Tap to log if it has started.', channelId: 'juno-cycle', actions: PERIOD_OVERDUE_ACTIONS as any },
    'fertile':     { title: '💚 Fertile window starts tomorrow', body: 'Your fertile window begins tomorrow. Track your discharge and temperature.', channelId: 'juno-cycle' },
    'ovulation':   { title: '✨ Ovulation day', body: 'Today is your estimated ovulation day — your peak fertility window.', channelId: 'juno-cycle' },
    'daily-log':   { title: '📝 Daily check-in', body: 'How are you feeling today? A quick log helps Juno make better predictions.', channelId: 'juno-daily', actions: DAILY_LOG_ACTIONS as any },
    'pill':        { title: '💊 Pill reminder', body: "Time to take your pill. Tap 'Taken' to log it.", channelId: 'juno-daily', actions: PILL_ACTIONS },
    'water':       { title: '💧 Stay hydrated', body: "Time for a glass of water! Tap 'Done' to log it.", channelId: 'juno-water', actions: WATER_ACTIONS },
  };

  const cfg = configs[type];
  const in3s = new Date(Date.now() + 3000);

  await notifee.createTriggerNotification(
    {
      title: cfg.title,
      body: cfg.body,
      android: {
        channelId: cfg.channelId,

        ...(cfg.actions && { actions: cfg.actions }),
      },
    },
    { type: TriggerType.TIMESTAMP, timestamp: in3s.getTime() }
  );
}

export async function getScheduledNotifications() {
  return notifee.getTriggerNotifications();
}
