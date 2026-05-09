export const Colors = {
  // Brand palette — hot pink + deep black
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

  gold: '#F472B6',
  goldLight: '#FBCFE8',
  goldDark: '#DB2777',

  // Phase colors
  phases: {
    menstrual: '#FF2D78',
    follicular: '#A78BFA',
    ovulation: '#34D399',
    luteal: '#F472B6',
  },

  // Calendar day colors
  calendar: {
    period: '#FF2D78',
    periodPredicted: '#FF80AB',
    fertile: '#86EFAC',
    ovulation: '#34D399',
    pms: '#F472B6',
    today: '#FF2D78',
    logged: '#A78BFA',
  },

  // Status / semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F43F5E',
  info: '#60A5FA',

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
