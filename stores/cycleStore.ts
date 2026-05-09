import { create } from 'zustand';
import type { Cycle, DailyLog, CyclePrediction } from '../types';

interface CycleState {
  cycles: Cycle[];
  logs: DailyLog[];
  prediction: CyclePrediction | null;
  bookmarks: string[];
  isLoaded: boolean;

  setCycles: (cycles: Cycle[]) => void;
  addCycle: (cycle: Cycle) => void;
  updateCycle: (id: number, updates: Partial<Cycle>) => void;
  removeCycle: (id: number) => void;

  setLogs: (logs: DailyLog[]) => void;
  upsertLog: (log: DailyLog) => void;
  removeLog: (date: string) => void;
  getLogByDate: (date: string) => DailyLog | undefined;

  setPrediction: (p: CyclePrediction) => void;

  setBookmarks: (ids: string[]) => void;
  toggleBookmark: (id: string) => void;

  setLoaded: (v: boolean) => void;
  reset: () => void;
}

export const useCycleStore = create<CycleState>()((set, get) => ({
  cycles: [],
  logs: [],
  prediction: null,
  bookmarks: [],
  isLoaded: false,

  setCycles: (cycles) => set({ cycles }),
  addCycle: (cycle) => set((s) => ({ cycles: [cycle, ...s.cycles] })),
  updateCycle: (id, updates) =>
    set((s) => ({
      cycles: s.cycles.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCycle: (id) =>
    set((s) => ({ cycles: s.cycles.filter((c) => c.id !== id) })),

  setLogs: (logs) => set({ logs }),
  upsertLog: (log) =>
    set((s) => {
      const existing = s.logs.findIndex((l) => l.date === log.date);
      if (existing >= 0) {
        const next = [...s.logs];
        next[existing] = log;
        return { logs: next };
      }
      return { logs: [log, ...s.logs] };
    }),
  removeLog: (date) =>
    set((s) => ({ logs: s.logs.filter((l) => l.date !== date) })),
  getLogByDate: (date) => get().logs.find((l) => l.date === date),

  setPrediction: (prediction) => set({ prediction }),

  setBookmarks: (bookmarks) => set({ bookmarks }),
  toggleBookmark: (id) =>
    set((s) => ({
      bookmarks: s.bookmarks.includes(id)
        ? s.bookmarks.filter((b) => b !== id)
        : [id, ...s.bookmarks],
    })),

  setLoaded: (isLoaded) => set({ isLoaded }),
  reset: () =>
    set({
      cycles: [],
      logs: [],
      prediction: null,
      bookmarks: [],
      isLoaded: false,
    }),
}));
