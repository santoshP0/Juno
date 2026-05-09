import { Colors } from './colors';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

export const lightTheme = {
  colors: Colors.light,
  brand: {
    rose: Colors.dustyRose,
    lavender: Colors.sage,
    blush: Colors.cream,
    deep: Colors.plum,
    fuchsia: Colors.gold,
  },
};

export const darkTheme = {
  colors: Colors.dark,
  brand: {
    rose: Colors.dustyRose,
    lavender: Colors.sage,
    blush: Colors.plumLight,
    deep: Colors.dustyRoseLight,
    fuchsia: Colors.gold,
  },
};

export type AppTheme = typeof lightTheme;
