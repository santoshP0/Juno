export const Colors = {
  // Brand palette (static, non-themed)
  dustyRose: '#FF2D78',
  dustyRoseLight: '#FF80AB',
  dustyRoseDark: '#C2185B',

  sage: '#A78BFA',
  sageLight: '#D8B4FE',
  sageDark: '#7C3AED',

  cream: '#FFF5F8',
  creamDark: '#FFE4F0',

  plum: '#1A0614',
  plumLight: '#3D1535',
  plumDark: '#0A0208',

  teal: '#4ECDC4',
  tealLight: '#A8EDEA',
  tealDark: '#2BA8A0',

  gold: '#F472B6',
  goldLight: '#FBCFE8',
  goldDark: '#DB2777',

  // Semantic / status
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F43F5E',
  info: '#60A5FA',

  // Pure whites
  white: '#FFFFFF',

  // Transparent overlays
  overlay: 'rgba(0,0,0,0.4)',
  dividerLight: 'rgba(0,0,0,0.06)',
  dividerDark: 'rgba(0,0,0,0.08)',

  // Phase colors (semantic — always fixed, represent biology not theme)
  phases: {
    menstrual: '#FF5C8D',
    follicular: '#9D7AF5',
    ovulation: '#2CC98B',
    luteal: '#E879A0',
  },

  // Phase gradient pairs [start, end]
  phaseGradients: {
    menstrual:  ['#FF5C8D', '#FF8FB3'] as [string, string],
    follicular: ['#9D7AF5', '#C4B5FD'] as [string, string],
    ovulation:  ['#2CC98B', '#6EE7B7'] as [string, string],
    luteal:     ['#E879A0', '#F9A8D4'] as [string, string],
  },

  // Mood colors
  moods: {
    happy:       '#FBBF24',
    calm:        '#60A5FA',
    energetic:   '#F97316',
    confident:   '#A78BFA',
    excited:     '#EC4899',
    sensitive:   '#FF2D78',
    sad:         '#6B7280',
    anxious:     '#FB923C',
    irritable:   '#EF4444',
    overwhelmed: '#7C3AED',
    depressed:   '#374151',
  },

  // Article category colors (semantic — fixed per category)
  articleCategories: {
    cycle_basics:      '#FF2D78',
    health_conditions: '#F43F5E',
    nutrition:         '#34D399',
    fitness:           '#A78BFA',
    mental_health:     '#F472B6',
    sexual_health:     '#F97316',
    pregnancy:         '#EC4899',
    perimenopause:     '#7C3AED',
    ttc:               '#C2185B',
  },

  // Calendar day colors (semantic — fixed)
  calendar: {
    period: '#FF2D78',
    periodPredicted: '#FF80AB',
    fertile: '#86EFAC',
    ovulation: '#34D399',
    pms: '#F472B6',
    today: '#4ECDC4',
    logged: '#A78BFA',
  },

  // Light theme base — neutral, overridden by accent theme in useColors()
  light: {
    background: '#FBF7F4',
    surface: '#FFFFFF',
    surfaceSecondary: '#F4EEE9',
    text: '#231D1A',
    textSecondary: '#7A6E68',
    textTertiary: '#A89C95',
    border: '#EDE3DC',
    borderLight: '#F4EEE9',
    icon: '#231D1A',
    tabBar: '#FFFFFF',
    tabBarActive: '#C2847A',
    tabBarInactive: '#A89C95',
  },

  // Dark theme base — neutral, overridden by accent theme in useColors()
  dark: {
    background: '#0A0A0F',
    surface: '#141420',
    surfaceSecondary: '#1C1C2A',
    text: '#F0F0F8',
    textSecondary: '#9898B0',
    textTertiary: '#5A5A72',
    border: '#252535',
    borderLight: '#1A1A28',
    icon: '#F0F0F8',
    tabBar: '#0A0A0F',
    tabBarActive: '#FF2D78',
    tabBarInactive: '#505068',
  },
} as const;

export type ColorKey = keyof typeof Colors;
