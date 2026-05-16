import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useCycleStore } from '../stores/cycleStore';
import { useUserStore } from '../stores/userStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  getCycles,
  getAllLogs,
  insertCycle,
  upsertLog,
  getBookmarks,
} from '../lib/db/queries';
import { calculatePredictions } from '../lib/predictions/algorithm';
import { scheduleAllNotifications, getNotificationPermissionStatus } from '../lib/notifications';
import { todayStr } from '../lib/utils/date';
import type { DailyLog } from '../types';

export function useCycle() {
  const db = useSQLiteContext();
  const {
    cycles, logs, prediction,
    setCycles, setLogs, setPrediction, setLoaded,
    addCycle, upsertLog: storeUpsertLog, setBookmarks,
  } = useCycleStore();
  const profile = useUserStore((s) => s.profile);
  const notifications = useSettingsStore((s) => s.notifications);
  const [error, setError] = useState<string | null>(null);

  // Full reload from DB — use only when cycle list changes (period logged, data imported)
  const reload = useCallback(async () => {
    try {
      setError(null);
      const [dbCycles, dbLogs, bookmarkIds] = await Promise.all([
        getCycles(db),
        getAllLogs(db),
        getBookmarks(db),
      ]);
      setCycles(dbCycles);
      setLogs(dbLogs);
      setBookmarks(bookmarkIds);

      const bbtReadings = dbLogs
        .filter((l) => l.bbt !== null)
        .map((l) => ({ date: l.date, value: l.bbt! }));

      const pred = calculatePredictions(
        dbCycles,
        profile?.avgCycleLength ?? 28,
        profile?.avgPeriodLength ?? 5,
        bbtReadings
      );
      if (pred) {
        setPrediction(pred);
        // Re-schedule notifications if permission is granted
        getNotificationPermissionStatus().then((status) => {
          if (status.status === 'granted') {
            scheduleAllNotifications(pred, notifications).catch(console.error);
          }
        });
      }
      setLoaded(true);
    } catch (e) {
      setError('Failed to load cycle data. Please restart the app.');
    }
  }, [db, profile, setCycles, setLogs, setBookmarks, setPrediction, setLoaded]);

  // Optimistic log save — writes to DB then updates store directly.
  // Skips full DB reload (very expensive on large datasets) and instead
  // recalculates predictions in-memory from the updated log list.
  const saveLog = useCallback(
    async (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => {
      await upsertLog(db, log);

      const fullLog: DailyLog = {
        ...log,
        id: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storeUpsertLog(fullLog);

      // Recalculate prediction in-memory — no DB round-trip
      const updatedLogs = [
        ...logs.filter((l) => l.date !== log.date),
        fullLog,
      ];
      const bbtReadings = updatedLogs
        .filter((l) => l.bbt !== null)
        .map((l) => ({ date: l.date, value: l.bbt! }));

      const pred = calculatePredictions(
        cycles,
        profile?.avgCycleLength ?? 28,
        profile?.avgPeriodLength ?? 5,
        bbtReadings
      );
      if (pred) setPrediction(pred);
    },
    [db, storeUpsertLog, cycles, logs, profile, setPrediction]
  );

  // Log a new period start — requires a full reload because it creates a new
  // cycle record that changes predictions, then re-schedules notifications.
  const logPeriodStart = useCallback(
    async (date = todayStr()) => {
      try {
        const id = await insertCycle(db, date);
        addCycle({
          id,
          startDate: date,
          endDate: null,
          length: null,
          periodLength: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await reload();

        // Re-schedule notifications now that we have new predictions
        const pred = useCycleStore.getState().prediction;
        if (pred) {
          scheduleAllNotifications(pred, notifications).catch(() => {});
        }
      } catch (e) {
        setError('Failed to log period start. Please try again.');
      }
    },
    [db, addCycle, reload, notifications]
  );

  return { cycles, logs, prediction, error, reload, logPeriodStart, saveLog };
}
