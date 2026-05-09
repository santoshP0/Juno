import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, TrackingGoal, AppMode } from '../types';

interface UserState {
  profile: UserProfile | null;
  isLoaded: boolean;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setName: (name: string) => void;
  setBirthYear: (year: number) => void;
  setGoal: (goal: TrackingGoal) => void;
  setMode: (mode: AppMode) => void;
  setCycleDefaults: (avgCycleLength: number, avgPeriodLength: number) => void;
  setLoaded: (v: boolean) => void;
  clearProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 1,
  name: '',
  birthYear: 0,
  height: null,
  weight: null,
  heightUnit: 'cm',
  weightUnit: 'kg',
  tempUnit: 'celsius',
  avgCycleLength: 28,
  avgPeriodLength: 5,
  goal: 'track',
  mode: 'tracking',
  createdAt: new Date().toISOString(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isLoaded: false,

      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : { ...DEFAULT_PROFILE, ...updates },
        })),
      setName: (name) =>
        set((state) => ({ profile: state.profile ? { ...state.profile, name } : { ...DEFAULT_PROFILE, name } })),
      setBirthYear: (birthYear) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, birthYear } : { ...DEFAULT_PROFILE, birthYear },
        })),
      setGoal: (goal) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, goal } : { ...DEFAULT_PROFILE, goal },
        })),
      setMode: (mode) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, mode } : { ...DEFAULT_PROFILE, mode },
        })),
      setCycleDefaults: (avgCycleLength, avgPeriodLength) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, avgCycleLength, avgPeriodLength }
            : { ...DEFAULT_PROFILE, avgCycleLength, avgPeriodLength },
        })),
      setLoaded: (isLoaded) => set({ isLoaded }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'juno-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
