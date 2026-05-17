import notifee, { TriggerType, type AndroidAction, type Notification as NotifeeNotification } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteDatabase } from 'expo-sqlite';
import { getLogByDate, upsertLog } from '../db/queries';
import { todayStr } from '../utils/date';
import { NOTIF_ACTION, PENDING_ACTIONS_KEY } from './index';
import { useCycleStore } from '../../stores/cycleStore';
import type { DailyLog } from '../../types';

// ─── Pending action type (written by background handler in index.js) ──────────

export interface PendingNotifAction {
  actionId: string;
  notificationId?: string;
  channelId?: string;
  data?: Record<string, string>;
  timestamp: number;
}

// ─── Merge helper — preserves all existing log fields, applies patch ──────────

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

// ─── Write log to DB + sync Zustand store ─────────────────────────────────────

async function writeLog(
  db: SQLiteDatabase,
  patch: Partial<Omit<DailyLog, 'id' | 'date' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const existing = await getLogByDate(db, todayStr());
  const logData = mergeLog(existing, patch);
  await upsertLog(db, logData);
  const saved = await getLogByDate(db, todayStr());
  if (saved) useCycleStore.getState().upsertLog(saved);
}

// ─── Foreground / background action handler (app is running) ──────────────────

export async function handleNotifeeAction(
  db: SQLiteDatabase,
  actionId: string,
  notification: NotifeeNotification | undefined
): Promise<void> {
  console.log('[Notif][FG] handleNotifeeAction:', actionId);

  // Dismiss source notification
  if (notification?.id) {
    await notifee.cancelNotification(notification.id).catch(() => {});
  }

  try {
    switch (actionId) {
      case NOTIF_ACTION.PILL_TAKEN:
        await writeLog(db, { pillTaken: true });
        console.log('[Notif][FG] pill-taken: logged ✓');
        break;

      case NOTIF_ACTION.PILL_SKIPPED:
        await writeLog(db, { pillTaken: false });
        console.log('[Notif][FG] pill-skipped: logged ✓');
        break;

      case NOTIF_ACTION.WATER_DONE: {
        const existing = await getLogByDate(db, todayStr());
        const prev = existing?.waterIntake ?? 0;
        await writeLog(db, { waterIntake: prev + 1 });
        console.log('[Notif][FG] water-done: intake', prev, '→', prev + 1, '✓');
        break;
      }

      case NOTIF_ACTION.REMIND_15: {
        const in15 = new Date(Date.now() + 15 * 60 * 1000);
        const actions = notification?.android?.actions as AndroidAction[] | undefined;
        await notifee.createTriggerNotification(
          {
            title: notification?.title ?? 'Reminder',
            body: notification?.body ?? '',
            android: {
              channelId: notification?.android?.channelId ?? 'juno-daily',

              ...(actions && { actions }),
            },
            data: notification?.data,
          },
          { type: TriggerType.TIMESTAMP, timestamp: in15.getTime() }
        );
        console.log('[Notif][FG] remind-15: rescheduled for', in15.toISOString());
        break;
      }

      case NOTIF_ACTION.PERIOD_NOT_YET: {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const actions = notification?.android?.actions as AndroidAction[] | undefined;
        await notifee.createTriggerNotification(
          {
            id: 'period-late',
            title: '🗓 Period check-in',
            body: "Still no period? That's often normal — tap to log once it starts, or dismiss to keep waiting.",
            android: {
              channelId: 'juno-cycle',

              ...(actions && { actions }),
            },
            data: notification?.data,
          },
          { type: TriggerType.TIMESTAMP, timestamp: tomorrow.getTime() }
        );
        console.log('[Notif][FG] period-not-yet: check-in rescheduled for', tomorrow.toISOString());
        break;
      }

      // LOG_NOW and PERIOD_STARTED: navigation only, handled in _layout.tsx
      case NOTIF_ACTION.LOG_NOW:
        console.log('[Notif][FG] log-now: navigation handled by _layout ✓');
        break;

      case NOTIF_ACTION.PERIOD_STARTED:
        console.log('[Notif][FG] period-started: navigation handled by _layout ✓');
        break;

      default:
        console.log('[Notif][FG] Unhandled action (no-op):', actionId);
        break;
    }
  } catch (error) {
    console.error('[NotifHandler] Failed to handle action:', actionId, error);
  }
}

// ─── Drain killed-state queue (AsyncStorage → SQLite) ────────────────────────

export async function processPendingNotifActions(db: SQLiteDatabase): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
    if (!raw) {
      console.log('[Notif][Queue] No pending actions.');
      return;
    }

    // Clear immediately before processing — prevents double-processing if app crashes mid-way
    await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);

    const queue: PendingNotifAction[] = JSON.parse(raw);
    console.log('[Notif][Queue] Draining', queue.length, 'pending action(s) from killed state...');

    for (const action of queue) {
      const age = Math.round((Date.now() - action.timestamp) / 1000);
      console.log('[Notif][Queue] Processing:', action.actionId, `(queued ${age}s ago)`);
      await handleNotifeeAction(db, action.actionId, undefined);
    }

    console.log('[Notif][Queue] Done draining queue ✓');
  } catch (err) {
    console.error('[NotifHandler] Failed to process pending actions:', err);
  }
}
