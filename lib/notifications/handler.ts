import * as Notifications from 'expo-notifications';
import { SQLiteDatabase } from 'expo-sqlite';
import { getLogByDate, upsertLog } from '../db/queries';
import { todayStr } from '../utils/date';
import { NOTIF_ACTION } from './index';
import { addMinutes, addDays } from 'date-fns';

export async function handleNotificationAction(
  db: SQLiteDatabase,
  response: Notifications.NotificationResponse
) {
  const actionId = response.actionIdentifier;
  const content = response.notification.request.content;
  const categoryId = content.categoryIdentifier ?? undefined;

  if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return; // Normal tap, handled by caller
  }

  const today = todayStr();

  try {
    switch (actionId) {
      case NOTIF_ACTION.PILL_TAKEN:
      case NOTIF_ACTION.PILL_SKIPPED: {
        const existing = await getLogByDate(db, today);
        await upsertLog(db, {
          date: today,
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
          notes: existing?.notes ?? null,
          pillTaken: actionId === NOTIF_ACTION.PILL_TAKEN,
        });
        break;
      }

      case NOTIF_ACTION.WATER_DONE: {
        const existing = await getLogByDate(db, today);
        await upsertLog(db, {
          date: today,
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
          waterIntake: (existing?.waterIntake ?? 0) + 1,
          notes: existing?.notes ?? null,
          pillTaken: existing?.pillTaken ?? null,
        });
        break;
      }

      case NOTIF_ACTION.REMIND_15: {
        const triggerDate = addMinutes(new Date(), 15);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: content.title ?? 'Reminder',
            body: content.body ?? '',
            categoryIdentifier: categoryId,
            data: content.data,
          },
          trigger: {
            date: triggerDate,
          },
        });
        break;
      }

      case NOTIF_ACTION.PERIOD_NOT_YET: {
        // Reschedule the check-in for tomorrow
        const triggerDate = addDays(new Date(), 1);
        triggerDate.setHours(9, 0, 0, 0);
        await Notifications.scheduleNotificationAsync({
          identifier: 'period-late',
          content: {
            title: '🗓 Period check-in',
            body: 'Still waiting? It can be normal. We will check in again tomorrow.',
            categoryIdentifier: 'period-overdue',
            data: content.data,
          },
          trigger: {
            date: triggerDate,
          },
        });
        break;
      }
    }
  } catch (error) {
    console.error('[NotificationHandler] Error processing action:', actionId, error);
  }
}
