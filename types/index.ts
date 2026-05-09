// ─── User & Profile ───────────────────────────────────────────────────────────

export type TrackingGoal =
  | 'track'
  | 'ttc'
  | 'avoid_pregnancy'
  | 'understand';

export type AppMode =
  | 'tracking'
  | 'ttc'
  | 'pregnancy'
  | 'birth_control'
  | 'perimenopause';

export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'in';
export type TempUnit = 'celsius' | 'fahrenheit';

export interface UserProfile {
  id: number;
  name: string;
  birthYear: number;
  height: number | null;
  weight: number | null;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  tempUnit: TempUnit;
  avgCycleLength: number;
  avgPeriodLength: number;
  goal: TrackingGoal;
  mode: AppMode;
  createdAt: string;
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

export interface Cycle {
  id: number;
  startDate: string;
  endDate: string | null;
  length: number | null;
  periodLength: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Daily Log ────────────────────────────────────────────────────────────────

export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type Symptom =
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'acne'
  | 'breast_tenderness'
  | 'back_pain'
  | 'fatigue'
  | 'nausea'
  | 'dizziness'
  | 'constipation'
  | 'diarrhea'
  | 'hot_flashes'
  | 'insomnia'
  | 'mood_swings'
  | 'food_cravings'
  | 'pelvic_pain';

export type Mood =
  | 'happy'
  | 'calm'
  | 'sad'
  | 'anxious'
  | 'irritable'
  | 'energetic'
  | 'sensitive'
  | 'confident'
  | 'overwhelmed'
  | 'depressed'
  | 'excited';

export type EnergyLevel = 'low' | 'medium' | 'high';
export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export type SexActivity = 'none' | 'protected' | 'unprotected';

export type DischargeType =
  | 'none'
  | 'dry'
  | 'sticky'
  | 'creamy'
  | 'watery'
  | 'egg_white';

export type CervicalPosition = 'low' | 'medium' | 'high';

export interface DailyLog {
  id: number;
  date: string;
  flow: FlowLevel | null;
  symptoms: Symptom[];
  moods: Mood[];
  energyLevel: EnergyLevel | null;
  sleepHours: number | null;
  sleepQuality: SleepQuality | null;
  sex: SexActivity | null;
  discharge: DischargeType | null;
  cervicalPosition: CervicalPosition | null;
  bbt: number | null;
  weight: number | null;
  waterIntake: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PartialDailyLog = Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Predictions ──────────────────────────────────────────────────────────────

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
  pmsWindowStart: string;
  confidenceDays: number;
  currentPhase: CyclePhase;
  currentCycleDay: number;
  daysUntilNextPeriod: number;
  avgCycleLength: number;
  pregnancyChance: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationSettings {
  periodSoonEnabled: boolean;
  periodSoonDays: 1 | 2 | 3;
  periodLateEnabled: boolean;
  fertileWindowEnabled: boolean;
  ovulationEnabled: boolean;
  pillReminderEnabled: boolean;
  pillReminderTime: string;
  dailyLogEnabled: boolean;
  dailyLogTime: string;
  waterReminderEnabled: boolean;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'auto';

export interface AppSettings {
  theme: Theme;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  tempUnit: TempUnit;
  notifications: NotificationSettings;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  autoLockMinutes: number;
  disguiseModeEnabled: boolean;
  onboardingComplete: boolean;
  mode: AppMode;
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export type ArticleCategory =
  | 'cycle_basics'
  | 'health_conditions'
  | 'nutrition'
  | 'fitness'
  | 'mental_health'
  | 'sexual_health'
  | 'pregnancy'
  | 'perimenopause'
  | 'ttc';

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  readingTimeMinutes: number;
  content: string;
  tags: string[];
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export type DayStatus =
  | 'period'
  | 'period_predicted'
  | 'fertile'
  | 'ovulation'
  | 'pms'
  | 'logged'
  | 'today';

export interface CalendarDayData {
  date: string;
  statuses: DayStatus[];
  log?: DailyLog;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  regularityScore: number;
  longestCycle: number;
  shortestCycle: number;
  totalCyclesTracked: number;
  cycleLengthHistory: { date: string; length: number }[];
  periodLengthHistory: { date: string; length: number }[];
  symptomFrequency: { symptom: Symptom; count: number; percentage: number }[];
  moodByPhase: Record<CyclePhase, { mood: Mood; count: number }[]>;
  bbtHistory: { date: string; value: number }[];
  weightHistory: { date: string; value: number }[];
}

export type InsightTimeRange = '3m' | '6m' | '12m' | 'all';
