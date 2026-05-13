export const Colors = {
  // Brand palette
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

  // Pure whites used for selected-state text/icons
  white: '#FFFFFF',

  // Transparent overlays (semantic names > raw rgba)
  overlay: 'rgba(0,0,0,0.4)',
  dividerLight: 'rgba(0,0,0,0.06)',
  dividerDark: 'rgba(0,0,0,0.08)',

  // Phase colors
  phases: {
    menstrual: '#FF2D78',
    follicular: '#A78BFA',
    ovulation: '#34D399',
    luteal: '#F472B6',
  },

  // Phase gradient pairs  [start, end]
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

  // Article / content category colors
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

  // Calendar day colors
  calendar: {
    period: '#FF2D78',
    periodPredicted: '#FF80AB',
    fertile: '#86EFAC',
    ovulation: '#34D399',
    pms: '#F472B6',
    today: '#4ECDC4',
    logged: '#A78BFA',
  },

  // Light theme
  light: {
    background: '#FFF5F8',
    surface: '#FFFFFF',
    surfaceSecondary: '#FFEEF4',
    text: '#1A0614',
    textSecondary: '#6B2B4D',
    textTertiary: '#B06080',
    border: '#FFD6E8',
    borderLight: '#FFE8F2',
    icon: '#1A0614',
    tabBar: '#FFFFFF',
    tabBarActive: '#FF2D78',
    tabBarInactive: '#C48BAA',
  },

  // Dark theme
  dark: {
    background: '#0A0A0F',
    surface: '#15101E',
    surfaceSecondary: '#1F1630',
    text: '#F8E8F0',
    textSecondary: '#D4A0BB',
    textTertiary: '#8B5A73',
    border: '#2D1A2A',
    borderLight: '#1A0F18',
    icon: '#F8E8F0',
    tabBar: '#0A0A0F',
    tabBarActive: '#FF2D78',
    tabBarInactive: '#5A3D50',
  },
} as const;

export type ColorKey = keyof typeof Colors;
