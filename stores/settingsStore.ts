import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, Theme, AppMode, NotificationSettings } from '../types';

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  periodSoonEnabled: true,
  periodSoonDays: 2,
  periodLateEnabled: true,
  fertileWindowEnabled: true,
  ovulationEnabled: true,
  pillReminderEnabled: false,
  pillReminderTime: '08:00',
  dailyLogEnabled: false,
  dailyLogTime: '20:00',
  waterReminderEnabled: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  weightUnit: 'kg',
  heightUnit: 'cm',
  tempUnit: 'celsius',
  notifications: DEFAULT_NOTIFICATIONS,
  pinEnabled: false,
  biometricEnabled: false,
  autoLockMinutes: 5,
  disguiseModeEnabled: false,
  onboardingComplete: false,
  mode: 'tracking',
};

interface SettingsState extends AppSettings {
  setTheme: (theme: Theme) => void;
  setMode: (mode: AppMode) => void;
  setOnboardingComplete: (v: boolean) => void;
  setPinEnabled: (v: boolean) => void;
  setBiometricEnabled: (v: boolean) => void;
  setAutoLockMinutes: (minutes: number) => void;
  setDisguiseModeEnabled: (v: boolean) => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setHeightUnit: (unit: 'cm' | 'in') => void;
  setTempUnit: (unit: 'celsius' | 'fahrenheit') => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setPinEnabled: (pinEnabled) => set({ pinEnabled }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
      setDisguiseModeEnabled: (disguiseModeEnabled) => set({ disguiseModeEnabled }),
      updateNotifications: (updates) =>
        set((state) => ({
          notifications: { ...state.notifications, ...updates },
        })),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setHeightUnit: (heightUnit) => set({ heightUnit }),
      setTempUnit: (tempUnit) => set({ tempUnit }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'juno-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
