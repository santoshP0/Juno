import * as Notifications from 'expo-notifications';
import { SQLiteDatabase } from 'expo-sqlite';
import { getLogByDate, upsertLog } from '../db/queries';
import { todayStr } from '../utils/date';
import { NOTIF_ACTION } from './index';
import { addMinutes, addDays } from 'date-fns';
import { useCycleStore } from '../../stores/cycleStore';
import type { DailyLog } from '../../types';

/** Merge notification-captured data into today's log, preserving all existing fields. */
function mergeLog(
  existing: DailyLog | null,
  patch: Partial<Omit<DailyLog, 'id' | 'date' | 'createdAt' | 'updatedAt'>>
): Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    date: todayStr(),
    flow: existing?.flow ?? null,
    symptoms: existing?.symptoms ?? [],
    moods: existing?.moods ?? [],
    energyLevel: existing?.energyLevel ?? null,
    sleepHours: existing?.sleepHours ?? null,
    sleepQuality: existing?.sleepQuality ?? null,
    sex: existing?.sex ?? null,
    discharge: existing?.discharge ?? null,
    cervicalPosition: existing?.cervicalPosition ?? null,
    bbt: existing?.bbt ?? null,
    weight: existing?.weight ?? null,
    waterIntake: existing?.waterIntake ?? 0,
    pillTaken: existing?.pillTaken ?? null,
    notes: existing?.notes ?? null,
    ...patch,
  };
}

export async function handleNotificationAction(
  db: SQLiteDatabase,
  response: Notifications.NotificationResponse
): Promise<void> {
  const actionId = response.actionIdentifier;
  const content = response.notification.request.content;
  const categoryId = (content as any).categoryIdentifier as string | undefined;

  // Default tap is handled by the caller (_layout.tsx) via navigation
  if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) return;

  // Dismiss the notification from the system tray
  await Notifications.dismissNotificationAsync(
    response.notification.request.identifier
  ).catch(() => {});

  try {
    switch (actionId) {
      // ── Pill ─────────────────────────────────────────────────────────────
      case NOTIF_ACTION.PILL_TAKEN:
      case NOTIF_ACTION.PILL_SKIPPED: {
        const existing = await getLogByDate(db, todayStr());
        const logData = mergeLog(existing, {
          pillTaken: actionId === NOTIF_ACTION.PILL_TAKEN,
        });
        await upsertLog(db, logData);

        const saved = await getLogByDate(db, todayStr());
        if (saved) useCycleStore.getState().upsertLog(saved);
        break;
      }

      // ── Water ─────────────────────────────────────────────────────────────
      case NOTIF_ACTION.WATER_DONE: {
        const existing = await getLogByDate(db, todayStr());
        const logData = mergeLog(existing, {
          waterIntake: (existing?.waterIntake ?? 0) + 1,
        });
        await upsertLog(db, logData);

        const saved = await getLogByDate(db, todayStr());
        if (saved) useCycleStore.getState().upsertLog(saved);
        break;
      }

      // ── Snooze 15 min ─────────────────────────────────────────────────────
      case NOTIF_ACTION.REMIND_15: {
        const triggerDate = addMinutes(new Date(), 15);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: content.title ?? 'Reminder',
            body: content.body ?? '',
            sound: 'default',
            ...(categoryId && { categoryIdentifier: categoryId }),
            ...(content.data && { data: content.data }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        break;
      }

      // ── Period not yet — reschedule check-in for tomorrow ─────────────────
      case NOTIF_ACTION.PERIOD_NOT_YET: {
        const triggerDate = addDays(new Date(), 1);
        triggerDate.setHours(9, 0, 0, 0);
        await Notifications.scheduleNotificationAsync({
          identifier: 'period-late',
          content: {
            title: '🗓 Period check-in',
            body: "Still no period? That's often normal — tap to log once it starts, or dismiss to keep waiting.",
            sound: 'default',
            categoryIdentifier: 'period-overdue',
            ...(content.data && { data: content.data }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        break;
      }

      // ── LOG_NOW: navigation handled in _layout.tsx ─────────────────────────
      case NOTIF_ACTION.LOG_NOW:
        // No data action needed — _layout.tsx routes to home where user can log
        break;

      // ── PERIOD_STARTED: navigation handled in _layout.tsx ─────────────────
      case NOTIF_ACTION.PERIOD_STARTED:
        // No data action needed — _layout.tsx routes to log/[date]
        break;

      default:
        break;
    }
  } catch (error) {
    console.error('[NotificationHandler] Failed to handle action:', actionId, error);
  }
}
