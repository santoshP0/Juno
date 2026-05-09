import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useCycleStore } from '../stores/cycleStore';
import { useUserStore } from '../stores/userStore';
import {
  getCycles,
  getAllLogs,
  insertCycle,
  updateCycle,
  upsertLog,
  getBookmarks,
} from '../lib/db/queries';
import { calculatePredictions } from '../lib/predictions/algorithm';
import { todayStr } from '../lib/utils/date';
import type { DailyLog } from '../types';

export function useCycle() {
  const db = useSQLiteContext();
  const { cycles, logs, prediction, setCycles, setLogs, setPrediction, setLoaded, addCycle, upsertLog: storeUpsertLog, setBookmarks } = useCycleStore();
  const profile = useUserStore((s) => s.profile);

  const reload = useCallback(async () => {
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
    setPrediction(pred);
    setLoaded(true);
  }, [db, profile, setCycles, setLogs, setBookmarks, setPrediction, setLoaded]);

  const logPeriodStart = useCallback(
    async (date = todayStr()) => {
      const id = await insertCycle(db, date);
      const newCycle = {
        id,
        startDate: date,
        endDate: null,
        length: null,
        periodLength: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addCycle(newCycle);
      await reload();
    },
    [db, addCycle, reload]
  );

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
      await reload();
    },
    [db, storeUpsertLog, reload]
  );

  return { cycles, logs, prediction, reload, logPeriodStart, saveLog };
}
