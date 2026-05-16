import 'expo-router/entry';
import notifee, { EventType, TriggerType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Must match PENDING_ACTIONS_KEY in lib/notifications/index.ts
const PENDING_ACTIONS_KEY = 'juno_pending_notif_actions';

/**
 * Notifee background event handler — runs as a Headless JS task on Android
 * even when the app is fully killed. No React, no SQLite. AsyncStorage only.
 *
 * Data-capture actions (pill, water) are queued in AsyncStorage.
 * On next app open, tabs/_layout.tsx drains the queue and writes to SQLite.
 *
 * Scheduling actions (remind-15, period-not-yet) are handled directly here
 * since notifee.createTriggerNotification works in headless mode.
 */
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.ACTION_PRESS) return;

  const actionId = detail.pressAction?.id;
  const notification = detail.notification;

  // Always dismiss the source notification
  if (notification?.id) {
    await notifee.cancelNotification(notification.id).catch(() => {});
  }

  switch (actionId) {
    // ── Snooze 15 min — schedule directly, no app needed ──────────────────
    case 'remind-15': {
      const in15 = new Date(Date.now() + 15 * 60 * 1000);
      await notifee.createTriggerNotification(
        {
          title: notification?.title ?? 'Reminder',
          body: notification?.body ?? '',
          android: {
            channelId: notification?.android?.channelId ?? 'juno-daily',
            actions: notification?.android?.actions ?? [],
    
          },
          data: notification?.data ?? {},
        },
        { type: TriggerType.TIMESTAMP, timestamp: in15.getTime() }
      );
      break;
    }

    // ── Period not yet — reschedule check-in for tomorrow ─────────────────
    case 'period-not-yet': {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      await notifee.createTriggerNotification(
        {
          id: 'period-late',
          title: '🗓 Period check-in',
          body: "Still no period? That's often normal — tap to log once it starts.",
          android: {
            channelId: 'juno-cycle',
            actions: notification?.android?.actions ?? [],
    
          },
          data: notification?.data ?? {},
        },
        { type: TriggerType.TIMESTAMP, timestamp: tomorrow.getTime() }
      );
      break;
    }

    // ── Data actions — queue for DB write on next app open ─────────────────
    case 'pill-taken':
    case 'pill-skipped':
    case 'water-done': {
      const raw = await AsyncStorage.getItem(PENDING_ACTIONS_KEY).catch(() => null);
      let queue = [];
      if (raw) {
        try { queue = JSON.parse(raw); } catch { queue = []; }
      }
      queue.push({
        actionId,
        notificationId: notification?.id,
        channelId: notification?.android?.channelId,
        data: notification?.data ?? {},
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(queue));
      break;
    }

    default:
      break;
  }
});
