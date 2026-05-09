import type { Symptom, Mood, CyclePhase, ArticleCategory } from '../types';

export const SYMPTOMS: { key: Symptom; label: string; icon: string }[] = [
  { key: 'cramps', label: 'Cramps', icon: 'zap' },
  { key: 'headache', label: 'Headache', icon: 'activity' },
  { key: 'bloating', label: 'Bloating', icon: 'wind' },
  { key: 'acne', label: 'Acne', icon: 'circle' },
  { key: 'breast_tenderness', label: 'Breast Tenderness', icon: 'heart' },
  { key: 'back_pain', label: 'Back Pain', icon: 'minus' },
  { key: 'fatigue', label: 'Fatigue', icon: 'battery-low' },
  { key: 'nausea', label: 'Nausea', icon: 'frown' },
  { key: 'dizziness', label: 'Dizziness', icon: 'rotate-cw' },
  { key: 'constipation', label: 'Constipation', icon: 'alert-circle' },
  { key: 'diarrhea', label: 'Diarrhea', icon: 'alert-triangle' },
  { key: 'hot_flashes', label: 'Hot Flashes', icon: 'flame' },
  { key: 'insomnia', label: 'Insomnia', icon: 'moon' },
  { key: 'mood_swings', label: 'Mood Swings', icon: 'trending-up' },
  { key: 'food_cravings', label: 'Food Cravings', icon: 'coffee' },
  { key: 'pelvic_pain', label: 'Pelvic Pain', icon: 'target' },
];

export const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'energetic', label: 'Energetic', emoji: '⚡' },
  { key: 'confident', label: 'Confident', emoji: '💪' },
  { key: 'excited', label: 'Excited', emoji: '🌟' },
  { key: 'sensitive', label: 'Sensitive', emoji: '🌸' },
  { key: 'sad', label: 'Sad', emoji: '😢' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'irritable', label: 'Irritable', emoji: '😤' },
  { key: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
  { key: 'depressed', label: 'Depressed', emoji: '😔' },
];

export const PHASE_INFO: Record<CyclePhase, {
  name: string;
  description: string;
  color: string;
  tips: string[];
}> = {
  menstrual: {
    name: 'Menstrual Phase',
    description: 'Your body is shedding the uterine lining. Rest and gentle self-care are your allies.',
    color: '#FF2D78',
    tips: [
      'Stay warm and rest as needed',
      'Try gentle yoga or walking',
      'Eat iron-rich foods like leafy greens',
      'Stay hydrated with warm herbal teas',
    ],
  },
  follicular: {
    name: 'Follicular Phase',
    description: 'Energy is rising as your body prepares to release an egg. This is a great time for new beginnings.',
    color: '#A78BFA',
    tips: [
      'Great time to start new projects',
      'Energy supports higher-intensity workouts',
      'Eat lighter, fresh foods',
      'Social activities feel more natural now',
    ],
  },
  ovulation: {
    name: 'Ovulation Phase',
    description: 'You\'re at peak fertility and energy. Communication and confidence are at their highest.',
    color: '#34D399',
    tips: [
      'Peak time for important conversations',
      'High energy — try HIIT or strength training',
      'Your skin may be glowing',
      'Great time for social events',
    ],
  },
  luteal: {
    name: 'Luteal Phase',
    description: 'Your body prepares for either pregnancy or the next cycle. Tune inward and practice extra self-care.',
    color: '#F472B6',
    tips: [
      'Reduce caffeine and sugar',
      'Prioritize sleep and stress management',
      'Nourish with complex carbs and magnesium',
      'Gentle movement feels best now',
    ],
  },
};

export const ARTICLE_CATEGORIES: { key: ArticleCategory; label: string; icon: string }[] = [
  { key: 'cycle_basics', label: 'Cycle Basics', icon: 'refresh-cw' },
  { key: 'health_conditions', label: 'Health Conditions', icon: 'heart' },
  { key: 'nutrition', label: 'Nutrition', icon: 'apple' },
  { key: 'fitness', label: 'Fitness', icon: 'activity' },
  { key: 'mental_health', label: 'Mental Health', icon: 'brain' },
  { key: 'sexual_health', label: 'Sexual Health', icon: 'shield' },
  { key: 'pregnancy', label: 'Pregnancy', icon: 'star' },
  { key: 'perimenopause', label: 'Perimenopause', icon: 'sunrise' },
  { key: 'ttc', label: 'Trying to Conceive', icon: 'target' },
];

export const DAILY_INSIGHTS_BY_PHASE: Record<CyclePhase, string[]> = {
  menstrual: [
    'Be kind to yourself today — you\'re doing great.',
    'Rest is productive. Your body is working hard.',
    'A warm bath or heating pad can ease cramps naturally.',
    'Dark chocolate contains magnesium, which may help with cramps.',
    'Iron-rich foods like spinach can help replenish what you\'re losing.',
  ],
  follicular: [
    'Your energy is building — this is your fresh start.',
    'Great time to brainstorm new ideas and make plans.',
    'Your immune system is stronger during this phase.',
    'Estrogen rising often means better verbal skills today.',
    'Your mood tends to lift as follicular phase progresses.',
  ],
  ovulation: [
    'You\'re at your most vibrant — own it.',
    'Peak estrogen = peak confidence and communication.',
    'Great day for important conversations or presentations.',
    'Your sense of smell is sharper during ovulation.',
    'Social connections feel especially meaningful now.',
  ],
  luteal: [
    'Slowing down is not giving up — it\'s being wise.',
    'Magnesium-rich foods can reduce PMS symptoms.',
    'Extra sleep is self-care, not laziness.',
    'Journaling can help process emotions during luteal phase.',
    'Your body is working hard behind the scenes.',
  ],
};

export const APP_MODES = [
  { key: 'tracking', label: 'Period Tracking', description: 'Track your cycle and understand your body' },
  { key: 'ttc', label: 'Trying to Conceive', description: 'Maximize your fertile window insights' },
  { key: 'pregnancy', label: 'Pregnancy', description: 'Week-by-week pregnancy tracking' },
  { key: 'birth_control', label: 'Birth Control', description: 'Pill pack tracking and reminders' },
  { key: 'perimenopause', label: 'Perimenopause', description: 'Support for irregular cycles and hormonal changes' },
] as const;

export const PREGNANCY_WEEK_INFO: Record<number, { size: string; description: string }> = {
  4: { size: 'Poppy seed', description: 'The embryo is implanting in your uterus.' },
  8: { size: 'Raspberry', description: 'Tiny fingers and toes are forming.' },
  12: { size: 'Lime', description: 'Your baby can now make a fist.' },
  16: { size: 'Avocado', description: 'You may start to feel movement soon.' },
  20: { size: 'Banana', description: 'Halfway there! Baby can hear your voice.' },
  24: { size: 'Corn cob', description: 'Baby\'s face is fully formed.' },
  28: { size: 'Eggplant', description: 'Third trimester begins. Baby can open their eyes.' },
  32: { size: 'Squash', description: 'Baby is practicing breathing movements.' },
  36: { size: 'Head of lettuce', description: 'Baby is considered early term.' },
  40: { size: 'Pumpkin', description: 'Full term! Baby could arrive any day.' },
};
