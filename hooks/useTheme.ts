import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { lightTheme, darkTheme, type AppTheme } from '../constants/theme';
import { Colors } from '../constants/colors';

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
  return isDark ? Colors.dark : Colors.light;
}
