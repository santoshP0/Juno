import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { lightTheme, darkTheme, type AppTheme } from '../constants/theme';
import { Colors } from '../constants/colors';
import { ACCENT_THEMES } from '../constants/themes';

export function useTheme(): AppTheme & { isDark: boolean } {
  const themePreference = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'auto' && systemScheme === 'dark');

  return {
    ...(isDark ? darkTheme : lightTheme),
    isDark,
  };
}

export function useColors() {
  const { isDark } = useTheme();
  const accentKey = useSettingsStore((s) => s.accentTheme ?? 'rose');
  const accent = ACCENT_THEMES[accentKey];
  const base = isDark ? Colors.dark : Colors.light;

  if (isDark) {
    return {
      ...base,
      // Accent-tinted surface/border
      surface: accent.surfaceDark,
      surfaceSecondary: accent.surfaceSecondaryDark,
      border: accent.borderDark,
      tabBarInactive: accent.tabBarInactiveDark,
      // Text tinted to theme
      textSecondary: accent.textSecondaryDark,
      textTertiary: accent.textTertiaryDark,
      // Accent tokens
      tabBarActive: accent.primary,
      accent: accent.primary,
      accentLight: accent.primaryLight,
      accentDark: accent.primaryDark,
    };
  }

  return {
    ...base,
    // Accent-tinted backgrounds/borders
    background: accent.bgLight,
    surfaceSecondary: accent.surfaceSecondaryLight,
    border: accent.borderLight,
    tabBarInactive: accent.tabBarInactiveLight,
    // Text tinted to theme
    textSecondary: accent.textSecondaryLight,
    textTertiary: accent.textTertiaryLight,
    // Accent tokens
    tabBarActive: accent.primary,
    accent: accent.primary,
    accentLight: accent.primaryLight,
    accentDark: accent.primaryDark,
  };
}
