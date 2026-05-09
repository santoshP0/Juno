export const Colors = {
  // Brand palette
  dustyRose: '#E8B4B8',
  dustyRoseLight: '#F2D5D8',
  dustyRoseDark: '#C9868B',

  sage: '#A8B5A0',
  sageLight: '#C5CFC2',
  sageDark: '#7A9070',

  cream: '#FAF6F1',
  creamDark: '#F0E8DF',

  plum: '#4A3B47',
  plumLight: '#6B5568',
  plumDark: '#2E2430',

  gold: '#D4A574',
  goldLight: '#E8C9A0',
  goldDark: '#B8885A',

  // Phase colors
  phases: {
    menstrual: '#E8B4B8',
    follicular: '#C5CFC2',
    ovulation: '#A8D5A2',
    luteal: '#D4A574',
  },

  // Calendar day colors
  calendar: {
    period: '#E8B4B8',
    periodPredicted: '#F2D5D8',
    fertile: '#C5E8C0',
    ovulation: '#7DC97A',
    pms: '#D4A574',
    today: '#4A3B47',
    logged: '#A8B5A0',
  },

  // Status / semantic
  success: '#7DC97A',
  warning: '#D4A574',
  error: '#C9686B',
  info: '#7AA8D4',

  // Light theme
  light: {
    background: '#FAF6F1',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F0EB',
    text: '#2E2430',
    textSecondary: '#6B5568',
    textTertiary: '#9E8BA0',
    border: '#E8E0E5',
    borderLight: '#F0EBF0',
    icon: '#4A3B47',
    tabBar: '#FFFFFF',
    tabBarActive: '#E8B4B8',
    tabBarInactive: '#9E8BA0',
  },

  // Dark theme
  dark: {
    background: '#1A1520',
    surface: '#241E2A',
    surfaceSecondary: '#2E2638',
    text: '#F2EDF5',
    textSecondary: '#C5B8CC',
    textTertiary: '#8A7A95',
    border: '#3A3045',
    borderLight: '#2E2638',
    icon: '#E8D5EC',
    tabBar: '#1A1520',
    tabBarActive: '#E8B4B8',
    tabBarInactive: '#8A7A95',
  },
} as const;

export type ColorKey = keyof typeof Colors;
